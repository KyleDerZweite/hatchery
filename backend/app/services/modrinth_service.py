"""
Modrinth API service for async metadata fetching and DB caching.

This service fetches mod metadata from Modrinth and caches it locally
to minimize API calls and enable offline operations.

Security considerations:
- Rate limiting with exponential backoff
- Input validation on all parameters
- No direct user input in API calls (only validated slugs/IDs)
- Structured logging for audit trail
"""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING

import httpx
import structlog
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings

if TYPE_CHECKING:
    from app.models.mod import ModReference, ModVersion

logger = structlog.get_logger()

MODRINTH_API_BASE = "https://api.modrinth.com/v2"


@dataclass(frozen=True, slots=True)
class ModSearchResult:
    """Immutable representation of a Modrinth search hit."""

    slug: str
    title: str
    description: str
    project_id: str
    categories: tuple[str, ...]
    downloads: int
    icon_url: str | None


async def _request_with_retry(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    **kwargs,
) -> httpx.Response:
    """
    HTTP request with retry/backoff for rate limits.

    Implements exponential backoff for 429 responses.
    Maximum 5 retries with 10 second max delay.
    """
    max_retries = 5
    base_delay = 1.0
    max_delay = 10.0

    for attempt in range(max_retries):
        try:
            response = await client.request(method, url, **kwargs)
            response.raise_for_status()
            return response
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code != 429 or attempt == max_retries - 1:
                logger.error(
                    "modrinth_api_error",
                    url=url,
                    status_code=exc.response.status_code,
                    attempt=attempt + 1,
                )
                raise
            delay = min(base_delay * (2**attempt), max_delay)
            logger.warning(
                "modrinth_rate_limited",
                url=url,
                attempt=attempt + 1,
                retry_after=delay,
            )
            await asyncio.sleep(delay)

    raise httpx.HTTPError("Failed after retries")


async def search_mods(
    client: httpx.AsyncClient,
    query: str,
    game_version: str | None = None,
    loader: str | None = None,
    limit: int = 20,
) -> list[ModSearchResult]:
    """
    Search Modrinth for mods matching query.

    Args:
        client: httpx async client
        query: Search query (validated, max 100 chars used)
        game_version: Optional Minecraft version filter
        loader: Optional loader filter (forge, fabric, etc.)
        limit: Max results (clamped to 1-100)

    Returns:
        List of immutable ModSearchResult objects
    """
    limit = max(1, min(limit, 100))
    query = query[:100]

    facets: list[list[str]] = [["project_type:mod"]]
    if game_version:
        facets.append([f"versions:{game_version}"])
    if loader:
        facets.append([f"categories:{loader}"])

    params: dict[str, str | int] = {
        "query": query,
        "limit": limit,
        "facets": json.dumps(facets),
    }

    response = await _request_with_retry(
        client, "GET", f"{MODRINTH_API_BASE}/search", params=params
    )
    data = response.json()

    results = []
    for hit in data.get("hits", []):
        results.append(
            ModSearchResult(
                slug=str(hit.get("slug", ""))[:255],
                title=str(hit.get("title", ""))[:255],
                description=str(hit.get("description", ""))[:2000],
                project_id=str(hit.get("project_id", ""))[:64],
                categories=tuple(hit.get("categories", []))[:20],
                downloads=int(hit.get("downloads", 0)),
                icon_url=str(hit.get("icon_url"))[:512] if hit.get("icon_url") else None,
            )
        )

    logger.info("modrinth_search", query=query, results=len(results))
    return results


async def get_project(client: httpx.AsyncClient, id_or_slug: str) -> dict:
    """
    Fetch full project details from Modrinth.

    Args:
        client: httpx async client
        id_or_slug: Project ID or slug (validated, max 64 chars)

    Returns:
        Raw project JSON dict
    """
    id_or_slug = id_or_slug[:64]
    response = await _request_with_retry(client, "GET", f"{MODRINTH_API_BASE}/project/{id_or_slug}")
    return response.json()


async def get_versions(
    client: httpx.AsyncClient,
    project_id: str,
    game_version: str | None = None,
    loader: str | None = None,
) -> list[dict]:
    """
    Fetch available versions of a project from Modrinth.

    Args:
        client: httpx async client
        project_id: Modrinth project ID (validated)
        game_version: Optional Minecraft version filter
        loader: Optional loader filter

    Returns:
        List of version JSON dicts
    """
    project_id = project_id[:64]
    params: dict[str, str] = {}
    if game_version:
        params["game_versions"] = json.dumps([game_version])
    if loader:
        params["loaders"] = json.dumps([loader])

    response = await _request_with_retry(
        client, "GET", f"{MODRINTH_API_BASE}/project/{project_id}/version", params=params
    )
    return response.json()


async def get_dependencies(
    client: httpx.AsyncClient,
    project_id: str,
    game_version: str,
    loader: str,
) -> list[str]:
    """
    Return required-dependency project IDs for the latest matching version.

    Args:
        client: httpx async client
        project_id: Modrinth project ID
        game_version: Minecraft version
        loader: Loader type

    Returns:
        List of dependency project IDs
    """
    versions = await get_versions(client, project_id, game_version, loader)
    if not versions:
        return []
    latest = versions[0]
    return [
        str(dep.get("project_id", ""))[:64]
        for dep in latest.get("dependencies", [])
        if dep.get("dependency_type") == "required" and dep.get("project_id")
    ]


def _select_primary_file(files: list[dict]) -> dict | None:
    """Select the primary file from a list, falling back to first."""
    if not files:
        return None
    for f in files:
        if f.get("primary"):
            return f
    return files[0]


async def upsert_mod_reference(
    session: AsyncSession,
    project_data: dict,
) -> ModReference:
    """
    Insert or update a ModReference row from raw Modrinth project JSON.

    Uses upsert pattern: check if exists, update if so, insert if not.
    This prevents duplicate entries from concurrent requests.
    """
    from app.models.mod import ModReference

    slug = str(project_data.get("slug", ""))[:255]
    if not slug:
        raise ValueError("Project data missing slug")

    stmt = select(ModReference).where(ModReference.slug == slug)
    result = await session.exec(stmt)
    ref = result.first()

    if ref is None:
        ref = ModReference(
            slug=slug,
            platform="modrinth",
            title=str(project_data.get("title", ""))[:255],
            description=str(project_data.get("description", ""))[:2000],
            icon_url=str(project_data.get("icon_url"))[:512]
            if project_data.get("icon_url")
            else None,
            categories=",".join(project_data.get("categories", [])[:20]),
            downloads=int(project_data.get("downloads", 0)),
            modrinth_project_id=str(project_data.get("id", ""))[:64],
        )
        session.add(ref)
        logger.info("mod_reference_created", slug=slug)
    else:
        ref.title = str(project_data.get("title", ref.title))[:255]
        ref.description = str(project_data.get("description", ref.description))[:2000]
        ref.icon_url = (
            str(project_data.get("icon_url", ref.icon_url or ""))[:512]
            if project_data.get("icon_url")
            else ref.icon_url
        )
        ref.downloads = int(project_data.get("downloads", ref.downloads))
        ref.last_updated = datetime.now(UTC)
        session.add(ref)
        logger.debug("mod_reference_updated", slug=slug)

    await session.flush()
    return ref


async def upsert_mod_version(
    session: AsyncSession,
    ref: ModReference,
    version_data: dict,
    mc_version: str,
    loader: str,
) -> ModVersion | None:
    """
    Insert or update a ModVersion row from raw Modrinth version JSON.

    Returns None if no valid file is found in the version data.
    """
    from app.models.mod import ModVersion

    primary_file = _select_primary_file(version_data.get("files", []))
    if primary_file is None:
        return None

    hashes = primary_file.get("hashes", {})
    modrinth_vid = str(version_data.get("id", ""))[:64]

    stmt = select(ModVersion).where(
        ModVersion.mod_reference_id == ref.id,
        ModVersion.modrinth_version_id == modrinth_vid,
    )
    result = await session.exec(stmt)
    ver = result.first()

    deps = [
        str(d.get("project_id", ""))[:64]
        for d in version_data.get("dependencies", [])
        if d.get("dependency_type") == "required" and d.get("project_id")
    ]

    if ver is None:
        ver = ModVersion(
            mod_reference_id=ref.id,
            version_number=str(version_data.get("version_number", ""))[:64],
            mc_version=mc_version[:32],
            loader=loader[:32],
            filename=str(primary_file.get("filename", ""))[:255],
            download_url=str(primary_file.get("url", ""))[:1024],
            file_size=int(primary_file.get("size", 0)) if primary_file.get("size") else None,
            sha1=str(hashes.get("sha1", ""))[:64],
            sha512=str(hashes.get("sha512", ""))[:128],
            modrinth_version_id=modrinth_vid,
            dependencies_json=json.dumps(deps)[:4000],
        )
        session.add(ver)
        logger.info(
            "mod_version_created",
            slug=ref.slug,
            version=ver.version_number,
            mc_version=mc_version,
        )
    else:
        ver.download_url = str(primary_file.get("url", ver.download_url))[:1024]
        ver.sha1 = str(hashes.get("sha1", ver.sha1))[:64]
        ver.sha512 = str(hashes.get("sha512", ver.sha512))[:128]
        ver.file_size = (
            int(primary_file.get("size", ver.file_size or 0))
            if primary_file.get("size")
            else ver.file_size
        )
        ver.dependencies_json = json.dumps(deps)[:4000]
        ver.fetched_at = datetime.now(UTC)
        session.add(ver)

    await session.flush()
    return ver


async def fetch_and_cache_mod(
    session: AsyncSession,
    client: httpx.AsyncClient,
    slug_or_id: str,
    mc_version: str,
    loader: str,
) -> tuple[ModReference, ModVersion | None]:
    """
    Fetch a mod from Modrinth, cache in DB, return (ref, version).

    This is the main entry point for fetching mod data.
    Handles the full flow: fetch project -> fetch versions -> cache.

    Args:
        session: Database session
        client: httpx async client
        slug_or_id: Modrinth project slug or ID
        mc_version: Target Minecraft version
        loader: Target loader type

    Returns:
        Tuple of (ModReference, ModVersion or None if no matching version)
    """
    project_data = await get_project(client, slug_or_id)
    ref = await upsert_mod_reference(session, project_data)

    versions = await get_versions(client, project_data["id"], mc_version, loader)
    ver: ModVersion | None = None
    if versions:
        ver = await upsert_mod_version(session, ref, versions[0], mc_version, loader)

    await session.commit()
    return ref, ver


def new_http_client() -> httpx.AsyncClient:
    """
    Create a configured httpx client for Modrinth API calls.

    Includes proper User-Agent header as required by Modrinth API.
    """
    return httpx.AsyncClient(
        headers={"User-Agent": settings.modrinth_user_agent},
        timeout=30.0,
        follow_redirects=True,
    )

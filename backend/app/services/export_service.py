"""
Export service for generating .mrpack files from project data.

Builds a Modrinth-compatible .mrpack zip entirely from database metadata.
This allows users to download their AI-generated modpacks.

Security considerations:
- No user input in file paths (controlled structure)
- Memory-bounded zip generation
- Proper Content-Disposition headers on download
"""

from __future__ import annotations

import io
import json
import uuid
import zipfile
from typing import TYPE_CHECKING

import structlog
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.mod import ModReference, ModVersion

if TYPE_CHECKING:
    from app.models.project import Project

logger = structlog.get_logger()


_LOADER_KEYS: dict[str, str] = {
    "fabric": "fabric-loader",
    "forge": "forge",
    "neoforge": "neoforge",
    "quilt": "quilt-loader",
}


async def generate_mrpack(
    session: AsyncSession,
    project_id: uuid.UUID,
) -> bytes:
    """
    Build a .mrpack zip from DB data and return raw bytes.

    Steps:
    1. Query all ModVersion entries linked to the project.
    2. Build modrinth.index.json from stored sha512 / download_url.
    3. Inject SNBT quest overrides into config/ftbquests/quests/.
    4. Zip everything and return byte stream.

    Args:
        session: Database session
        project_id: UUID of the project to export

    Returns:
        Raw bytes of the .mrpack zip file

    Raises:
        ValueError: If project not found or has no mods
    """
    from app.models.project import Project, ProjectMods, ProjectQuests

    project = await session.get(Project, project_id)
    if project is None:
        raise ValueError(f"Project {project_id} not found")

    stmt = (
        select(ModVersion, ModReference)
        .join(ProjectMods, ProjectMods.mod_version_id == ModVersion.id)
        .join(ModReference, ModReference.id == ModVersion.mod_reference_id)
        .where(ProjectMods.project_id == project_id)
    )
    results = await session.exec(stmt)
    mod_entries: list[tuple[ModVersion, ModReference]] = list(results.all())

    if not mod_entries:
        logger.warning("mrpack_empty_project", project_id=str(project_id))
        raise ValueError(f"Project {project_id} has no mods")

    files_list: list[dict] = []
    for ver, ref in mod_entries:
        entry: dict = {
            "path": f"mods/{ver.filename or ref.slug + '.jar'}",
            "hashes": {},
            "downloads": [ver.download_url],
            "env": {"client": "required", "server": "required"},
        }
        if ver.sha1:
            entry["hashes"]["sha1"] = ver.sha1
        if ver.sha512:
            entry["hashes"]["sha512"] = ver.sha512
        if ver.file_size:
            entry["fileSize"] = ver.file_size
        files_list.append(entry)

    loader_dep_key = _LOADER_KEYS.get(project.loader, project.loader)

    index: dict = {
        "formatVersion": 1,
        "game": "minecraft",
        "versionId": f"{project.name.replace(' ', '-').lower()}-1.0.0",
        "name": project.name,
        "summary": project.user_prompt[:200],
        "files": files_list,
        "dependencies": {
            "minecraft": project.mc_version,
            loader_dep_key: "latest",
        },
    }

    q_stmt = select(ProjectQuests).where(ProjectQuests.project_id == project_id)
    q_result = await session.exec(q_stmt)
    quest_record = q_result.first()
    quest_files: dict[str, str] = {}

    if quest_record and quest_record.quest_files_json:
        try:
            quest_files = json.loads(quest_record.quest_files_json)
        except json.JSONDecodeError:
            logger.warning(
                "mrpack_invalid_quests_json",
                project_id=str(project_id),
            )

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("modrinth.index.json", json.dumps(index, indent=2))

        for filename, content in quest_files.items():
            safe_filename = filename.replace("..", "").lstrip("/\\")
            if not safe_filename:
                continue
            zf.writestr(
                f"overrides/config/ftbquests/quests/{safe_filename}",
                str(content),
            )

    result = buf.getvalue()

    logger.info(
        "mrpack_generated",
        project_id=str(project_id),
        project_name=project.name,
        mod_count=len(files_list),
        size_bytes=len(result),
    )

    return result


async def generate_mrpack_filename(project: Project) -> str:
    """
    Generate a safe filename for the .mrpack export.

    Sanitizes the project name to prevent path traversal and
    ensure valid filename characters.
    """
    import re

    safe_name = re.sub(r"[^\w\s-]", "", project.name)
    safe_name = re.sub(r"[-\s]+", "_", safe_name)
    safe_name = safe_name.strip("_")[:100]

    if not safe_name:
        safe_name = f"modpack_{str(project.id)[:8]}"

    return f"{safe_name}.mrpack"

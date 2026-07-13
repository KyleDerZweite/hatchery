from __future__ import annotations

import logging
from urllib.parse import urljoin, urlparse

import httpx
from cryptography.fernet import Fernet, InvalidToken

from app.core.config import PANEL_API_TIMEOUT_SECONDS, settings
from app.models.panel import PanelConnectionTestResult

logger = logging.getLogger(__name__)

PANEL_ACCEPT_HEADER = "Application/vnd.pterodactyl.v1+json"
PANEL_CHECK_PATHS = (
    "/api/application/nodes?per_page=1",
    "/api/application/locations?per_page=1",
)


def _fernet() -> Fernet:
    return Fernet(settings.panel_encryption_key)


def encrypt_panel_api_key(raw_api_key: str) -> str:
    return _fernet().encrypt(raw_api_key.encode("utf-8")).decode("utf-8")


def decrypt_panel_api_key(encrypted_api_key: str) -> str:
    try:
        return _fernet().decrypt(encrypted_api_key.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError(
            "Stored panel API key cannot be decrypted with the current secret."
        ) from exc


async def test_panel_connection(base_url: str, api_key: str) -> PanelConnectionTestResult:
    parsed = urlparse(base_url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return PanelConnectionTestResult(
            success=False,
            status="failed",
            message="The panel URL must be a valid http:// or https:// URL.",
            checked_endpoint=base_url,
        )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": PANEL_ACCEPT_HEADER,
        "Content-Type": "application/json",
    }
    normalized_url = base_url.rstrip("/")

    # Redirects are not followed so the bearer token cannot be replayed to
    # an attacker-chosen host via a 3xx response.
    async with httpx.AsyncClient(
        headers=headers,
        timeout=PANEL_API_TIMEOUT_SECONDS,
        follow_redirects=False,
    ) as client:
        for path in PANEL_CHECK_PATHS:
            endpoint = urljoin(f"{normalized_url}/", path.lstrip("/"))
            try:
                response = await client.get(endpoint)
            except httpx.HTTPError as exc:
                logger.warning("Panel %s is unreachable: %s", normalized_url, exc)
                return PanelConnectionTestResult(
                    success=False,
                    status="failed",
                    message="The panel is unreachable.",
                    checked_endpoint=endpoint,
                )

            if response.status_code == 200:
                logger.info("Panel %s reachable at %s", normalized_url, endpoint)
                return PanelConnectionTestResult(
                    success=True,
                    status="ok",
                    message="The panel application API is reachable with the provided key.",
                    panel_type=_detect_panel_type(response),
                    checked_endpoint=endpoint,
                )
            if response.is_redirect:
                logger.info("Panel %s redirected %s away from the API", normalized_url, endpoint)
                return PanelConnectionTestResult(
                    success=False,
                    status="failed",
                    message="The panel URL redirected. Use the panel's canonical URL "
                    "(for example, https:// instead of http://).",
                    checked_endpoint=endpoint,
                )
            if response.status_code in {401, 403}:
                logger.info(
                    "Panel %s rejected the API key (%s)", normalized_url, response.status_code
                )
                return PanelConnectionTestResult(
                    success=False,
                    status="failed",
                    message="The panel rejected the API key.",
                    checked_endpoint=endpoint,
                )

    logger.info("Panel %s exposes no compatible application API", normalized_url)
    return PanelConnectionTestResult(
        success=False,
        status="failed",
        message="The panel does not expose a compatible application API.",
        checked_endpoint=urljoin(f"{normalized_url}/", PANEL_CHECK_PATHS[0].lstrip("/")),
    )


def _detect_panel_type(response: httpx.Response) -> str:
    server_header = response.headers.get("server", "").lower()
    powered_by = response.headers.get("x-powered-by", "").lower()
    combined = f"{server_header} {powered_by}"
    if "pelican" in combined:
        return "pelican"
    if "pterodactyl" in combined:
        return "pterodactyl"
    return "pterodactyl-compatible"

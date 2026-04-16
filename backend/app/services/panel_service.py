from __future__ import annotations

from urllib.parse import urljoin

import httpx
import structlog
from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings
from app.models.panel import PanelConnectionTestResult

logger = structlog.get_logger()

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
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": PANEL_ACCEPT_HEADER,
        "Content-Type": "application/json",
    }
    normalized_url = base_url.rstrip("/")

    async with httpx.AsyncClient(
        headers=headers,
        timeout=settings.panel_api_timeout_seconds,
        follow_redirects=True,
    ) as client:
        for path in PANEL_CHECK_PATHS:
            endpoint = urljoin(f"{normalized_url}/", path.lstrip("/"))
            try:
                response = await client.get(endpoint)
            except httpx.HTTPError as exc:
                logger.warning("panel_connection_http_error", url=normalized_url, error=str(exc))
                return PanelConnectionTestResult(
                    success=False,
                    status="failed",
                    message="The panel is unreachable.",
                    checked_endpoint=endpoint,
                )

            if response.status_code == 200:
                logger.info("panel_connection_success", url=normalized_url, endpoint=endpoint)
                return PanelConnectionTestResult(
                    success=True,
                    status="ok",
                    message="The panel application API is reachable with the provided key.",
                    panel_type=_detect_panel_type(response),
                    checked_endpoint=endpoint,
                )
            if response.status_code in {401, 403}:
                logger.info(
                    "panel_connection_auth_failed",
                    url=normalized_url,
                    endpoint=endpoint,
                    status_code=response.status_code,
                )
                return PanelConnectionTestResult(
                    success=False,
                    status="failed",
                    message="The panel rejected the API key.",
                    checked_endpoint=endpoint,
                )

    logger.info("panel_connection_incompatible", url=normalized_url)
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

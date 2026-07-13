from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import AuthMode, settings

router = APIRouter(prefix="/auth", tags=["Auth"])


class AuthConfig(BaseModel):
    """Auth settings the browser app needs before it can sign anyone in."""

    mode: AuthMode
    authority: str = ""
    client_id: str = ""


@router.get("/config", response_model=AuthConfig)
async def get_auth_config():
    """Public: served before login so the frontend knows which mode to run in.

    Serving this at runtime keeps the OIDC settings out of the frontend build, so
    the same image works against any Zitadel instance.
    """
    if settings.auth_mode is AuthMode.DEV:
        return AuthConfig(mode=AuthMode.DEV)
    return AuthConfig(
        mode=AuthMode.ZITADEL,
        authority=settings.zitadel_issuer,
        client_id=settings.zitadel_client_id,
    )

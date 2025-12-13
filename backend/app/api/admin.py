"""
Admin API endpoints for system administration.

Only users with the ADMIN role can access these endpoints.
User management is now handled in Zitadel.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.core import CurrentAdmin, settings

router = APIRouter(prefix="/admin", tags=["Administration"])


class SystemSettings(BaseModel):
    """Public system settings."""

    app_name: str
    app_version: str
    zitadel_domain: str


@router.get("/settings", response_model=SystemSettings)
async def get_system_settings(_: CurrentAdmin = None):
    """
    Get current system settings.

    Requires admin privileges.
    """
    return SystemSettings(
        app_name=settings.app_name,
        app_version=settings.app_version,
        zitadel_domain=settings.zitadel_domain,
    )


@router.get("/zitadel-console")
async def get_zitadel_console_url(_: CurrentAdmin = None):
    """
    Get the URL to the Zitadel console for user management.

    Requires admin privileges.
    """
    return {
        "url": f"https://{settings.zitadel_domain}/ui/console",
        "description": "Manage users, roles, and authentication settings in Zitadel"
    }

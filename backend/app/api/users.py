from fastapi import APIRouter
from pydantic import BaseModel

from app.core import CurrentUser, User, settings

router = APIRouter(prefix="/users", tags=["Users"])


class UserInfo(BaseModel):
    """Current user information from JWT token."""
    id: str
    email: str
    name: str
    roles: list[str]
    is_admin: bool


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(current_user: CurrentUser):
    """
    Get current authenticated user's information from JWT token.
    
    User management is handled in Zitadel. To manage your account,
    visit the Zitadel console.
    """
    return UserInfo(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        roles=current_user.roles,
        is_admin=current_user.is_admin,
    )


@router.get("/me/account-url")
async def get_account_management_url():
    """
    Get the URL to manage your account in Zitadel.
    """
    return {
        "url": f"https://{settings.zitadel_domain}/ui/console/users/me",
        "description": "Manage your account settings in Zitadel"
    }

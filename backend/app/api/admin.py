"""
Admin API endpoints for user management and system administration.

Only users with the ADMIN role can access these endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import select, func

from app.core import SessionDep, get_password_hash, settings
from app.core.security import get_current_user
from app.models import User, UserRead, UserRole, UserUpdate

router = APIRouter(prefix="/admin", tags=["Administration"])


class AdminUserCreate(BaseModel):
    """Schema for admin to create a new user."""
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.USER
    is_active: bool = True


class SystemSettings(BaseModel):
    """Public system settings."""
    registration_enabled: bool
    app_name: str
    app_version: str


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure the current user is an admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


@router.get("/settings", response_model=SystemSettings)
async def get_system_settings(_: User = Depends(require_admin)):
    """
    Get current system settings.
    
    Requires admin privileges.
    """
    return SystemSettings(
        registration_enabled=settings.registration_enabled,
        app_name=settings.app_name,
        app_version=settings.app_version,
    )


@router.get("/users", response_model=list[UserRead])
async def list_users(
    session: SessionDep,
    _: User = Depends(require_admin),
    skip: int = 0,
    limit: int = 100,
):
    """
    List all users in the system.
    
    Requires admin privileges.
    """
    result = await session.execute(
        select(User).offset(skip).limit(limit).order_by(User.created_at.desc())
    )
    return result.scalars().all()


@router.get("/users/count")
async def get_user_count(
    session: SessionDep,
    _: User = Depends(require_admin),
):
    """
    Get total number of users.
    
    Requires admin privileges.
    """
    result = await session.execute(select(func.count(User.id)))
    return {"count": result.scalar()}


@router.get("/users/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    session: SessionDep,
    _: User = Depends(require_admin),
):
    """
    Get a specific user by ID.
    
    Requires admin privileges.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: AdminUserCreate,
    session: SessionDep,
    _: User = Depends(require_admin),
):
    """
    Create a new user (admin only).
    
    This endpoint works even when public registration is disabled.
    Useful for invite-only setups.
    
    Requires admin privileges.
    """
    # Check if username already exists
    result = await session.execute(
        select(User).where(User.username == user_data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    result = await session.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        is_active=user_data.is_active,
    )
    
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    return user


@router.patch("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    session: SessionDep,
    current_admin: User = Depends(require_admin),
):
    """
    Update a user's details (admin only).
    
    Can update username, email, role, and active status.
    
    Requires admin privileges.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from demoting themselves
    if user.id == current_admin.id and user_update.role == UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote yourself from admin"
        )
    
    # Prevent admin from deactivating themselves
    if user.id == current_admin.id and user_update.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    # Check for username uniqueness if changing
    if user_update.username and user_update.username != user.username:
        result = await session.execute(
            select(User).where(User.username == user_update.username)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Check for email uniqueness if changing
    if user_update.email and user_update.email != user.email:
        result = await session.execute(
            select(User).where(User.email == user_update.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already taken"
            )
    
    # Apply updates
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    return user


class PasswordResetRequest(BaseModel):
    """Schema for admin to reset a user's password."""
    new_password: str


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    password_data: PasswordResetRequest,
    session: SessionDep,
    _: User = Depends(require_admin),
):
    """
    Reset a user's password (admin only).
    
    Requires admin privileges.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    
    user.hashed_password = get_password_hash(password_data.new_password)
    session.add(user)
    await session.commit()
    
    return {"message": "Password reset successfully"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    session: SessionDep,
    current_admin: User = Depends(require_admin),
):
    """
    Delete a user (admin only).
    
    Admins cannot delete their own account.
    
    Requires admin privileges.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    await session.delete(user)
    await session.commit()
    
    return {"message": "User deleted successfully"}

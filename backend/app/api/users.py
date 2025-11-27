from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.core import CurrentAdmin, CurrentUser, SessionDep
from app.models import User, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
async def get_current_user_info(current_user: CurrentUser):
    """
    Get current authenticated user's information.
    """
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_current_user(
    user_update: UserUpdate,
    current_user: CurrentUser,
    session: SessionDep,
):
    """
    Update current authenticated user's information.
    Users cannot change their own role.
    """
    update_data = user_update.model_dump(exclude_unset=True)

    # Users cannot change their own role
    update_data.pop("role", None)
    update_data.pop("is_active", None)

    for key, value in update_data.items():
        setattr(current_user, key, value)

    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)

    return current_user


@router.get("", response_model=list[UserRead])
async def list_users(
    current_user: CurrentAdmin,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
):
    """
    List all users. Admin only.
    """
    result = await session.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    current_user: CurrentAdmin,
    session: SessionDep,
):
    """
    Get a specific user by ID. Admin only.
    """
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: CurrentAdmin,
    session: SessionDep,
):
    """
    Update a user. Admin only.
    """
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: CurrentAdmin,
    session: SessionDep,
):
    """
    Delete a user. Admin only.
    Cannot delete yourself.
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete yourself"
        )

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await session.delete(user)
    await session.commit()

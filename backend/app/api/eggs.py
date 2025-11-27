from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select, or_

from app.core import CurrentAdmin, CurrentUser, SessionDep
from app.models import (
    EggConfig,
    EggConfigCreate,
    EggConfigRead,
    EggConfigReadFull,
    EggConfigUpdate,
    UserRole,
    Visibility,
)
from app.services import ModpackService, get_modpack_service

router = APIRouter(prefix="/eggs", tags=["Egg Configurations"])


@router.post("", response_model=EggConfigReadFull, status_code=status.HTTP_201_CREATED)
async def create_egg_from_url(
    egg_data: EggConfigCreate,
    current_user: CurrentUser,
    session: SessionDep,
    modpack_service: Annotated[ModpackService, Depends(get_modpack_service)],
):
    """
    Create a new egg configuration from a modpack URL.
    
    This endpoint:
    1. Parses the modpack URL (CurseForge/Modrinth)
    2. Fetches modpack metadata
    3. Generates Pterodactyl egg JSON
    4. Saves the configuration
    """
    # Fetch modpack info from URL
    modpack_info = await modpack_service.fetch_modpack_info(egg_data.source_url)
    
    # Determine Java version
    java_version = egg_data.java_version or modpack_info.java_version
    
    # Generate egg JSON
    egg_json = modpack_service.generate_egg_json(modpack_info, java_version)
    
    # Create egg config
    egg = EggConfig(
        name=modpack_info.name,
        source_url=egg_data.source_url,
        source=modpack_info.source,
        description=modpack_info.description,
        java_version=java_version,
        visibility=egg_data.visibility,
        minecraft_version=modpack_info.minecraft_version,
        modloader=modpack_info.modloader,
        modloader_version=modpack_info.modloader_version,
        json_data=egg_json,
        owner_id=current_user.id,
    )
    
    session.add(egg)
    await session.commit()
    await session.refresh(egg)
    
    return egg


@router.get("", response_model=list[EggConfigRead])
async def list_eggs(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    visibility: Visibility | None = None,
):
    """
    List egg configurations.
    
    - Admins see all eggs
    - Users see their own eggs + public eggs
    """
    query = select(EggConfig)
    
    if current_user.role != UserRole.ADMIN:
        # Users see their own eggs or public eggs
        query = query.where(
            or_(
                EggConfig.owner_id == current_user.id,
                EggConfig.visibility == Visibility.PUBLIC
            )
        )
    
    if visibility:
        query = query.where(EggConfig.visibility == visibility)
    
    query = query.offset(skip).limit(limit)
    result = await session.execute(query)
    
    return result.scalars().all()


@router.get("/{egg_id}", response_model=EggConfigReadFull)
async def get_egg(
    egg_id: int,
    current_user: CurrentUser,
    session: SessionDep,
):
    """
    Get a specific egg configuration by ID.
    
    Returns the full egg JSON data.
    """
    result = await session.execute(
        select(EggConfig).where(EggConfig.id == egg_id)
    )
    egg = result.scalar_one_or_none()
    
    if not egg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Egg not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN:
        if egg.owner_id != current_user.id and egg.visibility != Visibility.PUBLIC:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this egg"
            )
    
    return egg


@router.patch("/{egg_id}", response_model=EggConfigRead)
async def update_egg(
    egg_id: int,
    egg_update: EggConfigUpdate,
    current_user: CurrentUser,
    session: SessionDep,
):
    """
    Update an egg configuration.
    
    Only the owner or admin can update.
    """
    result = await session.execute(
        select(EggConfig).where(EggConfig.id == egg_id)
    )
    egg = result.scalar_one_or_none()
    
    if not egg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Egg not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and egg.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this egg"
        )
    
    update_data = egg_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(egg, key, value)
    
    egg.updated_at = datetime.now(timezone.utc)
    
    session.add(egg)
    await session.commit()
    await session.refresh(egg)
    
    return egg


@router.delete("/{egg_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_egg(
    egg_id: int,
    current_user: CurrentUser,
    session: SessionDep,
):
    """
    Delete an egg configuration.
    
    Only the owner or admin can delete.
    """
    result = await session.execute(
        select(EggConfig).where(EggConfig.id == egg_id)
    )
    egg = result.scalar_one_or_none()
    
    if not egg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Egg not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and egg.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this egg"
        )
    
    await session.delete(egg)
    await session.commit()


@router.get("/{egg_id}/export", response_model=dict)
async def export_egg_json(
    egg_id: int,
    current_user: CurrentUser,
    session: SessionDep,
):
    """
    Export the raw Pterodactyl egg JSON for download/import.
    """
    result = await session.execute(
        select(EggConfig).where(EggConfig.id == egg_id)
    )
    egg = result.scalar_one_or_none()
    
    if not egg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Egg not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN:
        if egg.owner_id != current_user.id and egg.visibility != Visibility.PUBLIC:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to export this egg"
            )
    
    return egg.json_data


@router.post("/{egg_id}/regenerate", response_model=EggConfigReadFull)
async def regenerate_egg(
    egg_id: int,
    current_user: CurrentUser,
    session: SessionDep,
    modpack_service: Annotated[ModpackService, Depends(get_modpack_service)],
):
    """
    Regenerate the egg JSON from the source URL.
    
    Useful if the modpack has been updated or the egg generation logic has changed.
    """
    result = await session.execute(
        select(EggConfig).where(EggConfig.id == egg_id)
    )
    egg = result.scalar_one_or_none()
    
    if not egg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Egg not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and egg.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to regenerate this egg"
        )
    
    # Re-fetch modpack info
    modpack_info = await modpack_service.fetch_modpack_info(egg.source_url)
    
    # Regenerate egg JSON
    egg_json = modpack_service.generate_egg_json(modpack_info, egg.java_version)
    
    # Update egg
    egg.json_data = egg_json
    egg.updated_at = datetime.now(timezone.utc)
    
    session.add(egg)
    await session.commit()
    await session.refresh(egg)
    
    return egg

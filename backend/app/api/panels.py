from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select, or_

from app.core import CurrentAdmin, CurrentUser, SessionDep
from app.models import (
    PanelInstance,
    PanelInstanceCreate,
    PanelInstanceRead,
    PanelInstanceReadWithKey,
    PanelInstanceUpdate,
    UserRole,
)

router = APIRouter(prefix="/panels", tags=["Panel Instances"])


@router.post("", response_model=PanelInstanceRead, status_code=status.HTTP_201_CREATED)
async def create_panel(
    panel_data: PanelInstanceCreate,
    current_user: CurrentUser,
    session: SessionDep,
):
    """
    Create a new panel instance.
    """
    panel = PanelInstance(
        **panel_data.model_dump(),
        owner_id=current_user.id,
    )
    
    session.add(panel)
    await session.commit()
    await session.refresh(panel)
    
    return panel


@router.get("", response_model=list[PanelInstanceRead])
async def list_panels(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
):
    """
    List panel instances.
    Admins see all panels; users see only their own.
    """
    if current_user.role == UserRole.ADMIN:
        result = await session.execute(
            select(PanelInstance).offset(skip).limit(limit)
        )
    else:
        result = await session.execute(
            select(PanelInstance)
            .where(PanelInstance.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
    
    return result.scalars().all()


@router.get("/{panel_id}", response_model=PanelInstanceReadWithKey)
async def get_panel(
    panel_id: int,
    current_user: CurrentUser,
    session: SessionDep,
):
    """
    Get a specific panel instance by ID.
    Only the owner or admin can view.
    Returns the API key for the owner.
    """
    result = await session.execute(
        select(PanelInstance).where(PanelInstance.id == panel_id)
    )
    panel = result.scalar_one_or_none()
    
    if not panel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Panel not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and panel.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this panel"
        )
    
    return panel


@router.patch("/{panel_id}", response_model=PanelInstanceRead)
async def update_panel(
    panel_id: int,
    panel_update: PanelInstanceUpdate,
    current_user: CurrentUser,
    session: SessionDep,
):
    """
    Update a panel instance.
    Only the owner or admin can update.
    """
    result = await session.execute(
        select(PanelInstance).where(PanelInstance.id == panel_id)
    )
    panel = result.scalar_one_or_none()
    
    if not panel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Panel not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and panel.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this panel"
        )
    
    update_data = panel_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(panel, key, value)
    
    panel.updated_at = datetime.now(timezone.utc)
    
    session.add(panel)
    await session.commit()
    await session.refresh(panel)
    
    return panel


@router.delete("/{panel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_panel(
    panel_id: int,
    current_user: CurrentUser,
    session: SessionDep,
):
    """
    Delete a panel instance.
    Only the owner or admin can delete.
    """
    result = await session.execute(
        select(PanelInstance).where(PanelInstance.id == panel_id)
    )
    panel = result.scalar_one_or_none()
    
    if not panel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Panel not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and panel.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this panel"
        )
    
    await session.delete(panel)
    await session.commit()


@router.post("/{panel_id}/test", status_code=status.HTTP_200_OK)
async def test_panel_connection(
    panel_id: int,
    current_user: CurrentUser,
    session: SessionDep,
):
    """
    Test connection to a panel instance.
    Only the owner or admin can test.
    
    TODO: Implement actual panel API connection test.
    """
    result = await session.execute(
        select(PanelInstance).where(PanelInstance.id == panel_id)
    )
    panel = result.scalar_one_or_none()
    
    if not panel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Panel not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and panel.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to test this panel"
        )
    
    # TODO: Implement actual connection test
    return {
        "success": True,
        "message": "Connection test placeholder - implement actual API check"
    }

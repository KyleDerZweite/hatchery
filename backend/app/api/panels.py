from datetime import UTC, datetime

from fastapi import APIRouter, Depends, status
from sqlmodel import select

from app.api.dependencies import get_panel_or_404
from app.core import CurrentUser, SessionDep
from app.models import (
    PanelInstance,
    PanelInstanceCreate,
    PanelInstanceRead,
    PanelInstanceReadWithKey,
    PanelInstanceUpdate,
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
    if current_user.is_admin:
        result = await session.execute(select(PanelInstance).offset(skip).limit(limit))
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
    panel: PanelInstance = Depends(get_panel_or_404),
):
    """
    Get a specific panel instance by ID.
    Only the owner or admin can view.
    Returns the API key for the owner.
    """
    return panel


@router.patch("/{panel_id}", response_model=PanelInstanceRead)
async def update_panel(
    panel_update: PanelInstanceUpdate,
    session: SessionDep,
    panel: PanelInstance = Depends(get_panel_or_404),
):
    """
    Update a panel instance.
    Only the owner or admin can update.
    """

    update_data = panel_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(panel, key, value)

    panel.updated_at = datetime.now(UTC)

    session.add(panel)
    await session.commit()
    await session.refresh(panel)

    return panel


@router.delete("/{panel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_panel(
    session: SessionDep,
    panel: PanelInstance = Depends(get_panel_or_404),
):
    """
    Delete a panel instance.
    Only the owner or admin can delete.
    """
    await session.delete(panel)
    await session.commit()


@router.post("/{panel_id}/test", status_code=status.HTTP_200_OK)
async def test_panel_connection(
    panel: PanelInstance = Depends(get_panel_or_404),
):
    """
    Test connection to a panel instance.
    Only the owner or admin can test.

    TODO: Implement actual panel API connection test.
    """

    # TODO: Implement actual connection test
    return {"success": True, "message": "Connection test placeholder - implement actual API check"}

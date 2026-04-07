from datetime import UTC, datetime

from fastapi import APIRouter, Depends, status
from sqlmodel import select

from app.api.dependencies import get_panel_or_404
from app.core import CurrentUser, SessionDep
from app.models import (
    PanelConnectionTestResult,
    PanelInstance,
    PanelInstanceCreate,
    PanelInstanceRead,
    PanelInstanceUpdate,
)
from app.services.panel_service import (
    decrypt_panel_api_key,
    encrypt_panel_api_key,
)
from app.services.panel_service import (
    test_panel_connection as run_panel_connection_test,
)

router = APIRouter(prefix="/panels", tags=["Panel Instances"])


@router.post("", response_model=PanelInstanceRead, status_code=status.HTTP_201_CREATED)
async def create_panel(
    panel_data: PanelInstanceCreate,
    current_user: CurrentUser,
    session: SessionDep,
):
    panel = PanelInstance(
        name=panel_data.name,
        url=panel_data.url,
        description=panel_data.description,
        api_key_encrypted=encrypt_panel_api_key(panel_data.api_key),
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


@router.get("/{panel_id}", response_model=PanelInstanceRead)
async def get_panel(
    panel: PanelInstance = Depends(get_panel_or_404),
):
    return panel


@router.patch("/{panel_id}", response_model=PanelInstanceRead)
async def update_panel(
    panel_update: PanelInstanceUpdate,
    session: SessionDep,
    panel: PanelInstance = Depends(get_panel_or_404),
):
    update_data = panel_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "api_key" and value is not None:
            panel.api_key_encrypted = encrypt_panel_api_key(value)
            continue
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
    await session.delete(panel)
    await session.commit()


@router.post("/{panel_id}/test", response_model=PanelConnectionTestResult)
async def test_panel_connection(
    session: SessionDep,
    panel: PanelInstance = Depends(get_panel_or_404),
):
    result = await run_panel_connection_test(
        base_url=panel.url,
        api_key=decrypt_panel_api_key(panel.api_key_encrypted),
    )
    panel.last_tested_at = datetime.now(UTC)
    panel.last_test_status = result.status
    panel.last_test_message = result.message
    session.add(panel)
    await session.commit()
    await session.refresh(panel)
    return result

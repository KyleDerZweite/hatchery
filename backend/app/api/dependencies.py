from fastapi import HTTPException, status

from app.core.db import SessionDep
from app.core.security import CurrentUser, User
from app.models.egg import EggConfig, Visibility
from app.models.panel import PanelInstance


async def _owned_or_404[ModelT: (PanelInstance, EggConfig)](
    model: type[ModelT],
    item_id: int,
    session: SessionDep,
    user: User,
    allow_public: bool = False,
) -> ModelT:
    item = await session.get(model, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"{model.__name__} not found"
        )

    if user.is_admin:
        return item

    is_owner = item.owner_id == user.id
    is_public = allow_public and getattr(item, "visibility", None) == Visibility.PUBLIC
    if not is_owner and not is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Not authorized to access this {model.__name__}",
        )
    return item


async def get_panel_or_404(
    panel_id: int, session: SessionDep, current_user: CurrentUser
) -> PanelInstance:
    return await _owned_or_404(PanelInstance, panel_id, session, current_user)


async def get_egg_or_404_read(
    egg_id: int, session: SessionDep, current_user: CurrentUser
) -> EggConfig:
    return await _owned_or_404(EggConfig, egg_id, session, current_user, allow_public=True)


async def get_egg_or_404_write(
    egg_id: int, session: SessionDep, current_user: CurrentUser
) -> EggConfig:
    return await _owned_or_404(EggConfig, egg_id, session, current_user)

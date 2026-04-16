from typing import TypeVar

from fastapi import HTTPException, status

from app.core import CurrentUser, SessionDep
from app.models.egg import EggConfig, Visibility
from app.models.panel import PanelInstance

ModelT = TypeVar("ModelT", PanelInstance, EggConfig)


class GenericFetcher:
    """Helper to fetch and validate ownership of database records."""

    @staticmethod
    async def _fetch_and_validate_owner(
        model: type[ModelT],
        item_id: int,
        session: SessionDep,
        current_user: CurrentUser,
        allow_public: bool = False,
    ) -> ModelT:
        item = await session.get(model, item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"{model.__name__} not found"
            )

        if not current_user.is_admin:
            is_owner = getattr(item, "owner_id", None) == current_user.id
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
    return await GenericFetcher._fetch_and_validate_owner(
        PanelInstance, panel_id, session, current_user
    )


async def get_egg_or_404_read(
    egg_id: int, session: SessionDep, current_user: CurrentUser
) -> EggConfig:
    return await GenericFetcher._fetch_and_validate_owner(
        EggConfig, egg_id, session, current_user, allow_public=True
    )


async def get_egg_or_404_write(
    egg_id: int, session: SessionDep, current_user: CurrentUser
) -> EggConfig:
    return await GenericFetcher._fetch_and_validate_owner(
        EggConfig, egg_id, session, current_user, allow_public=False
    )

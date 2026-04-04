from fastapi import APIRouter

from app.api.eggs import router as eggs_router
from app.api.panels import router as panels_router
from app.api.users import router as users_router

api_router = APIRouter(prefix="/api")

api_router.include_router(users_router)
api_router.include_router(panels_router)
api_router.include_router(eggs_router)

__all__ = ["api_router"]

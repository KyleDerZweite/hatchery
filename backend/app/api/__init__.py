from fastapi import APIRouter

from app.api.admin import router as admin_router
from app.api.ai import router as ai_router
from app.api.auth import router as auth_router
from app.api.eggs import router as eggs_router
from app.api.panels import router as panels_router
from app.api.users import router as users_router

# Main API router
api_router = APIRouter(prefix="/api")

# Include all sub-routers
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(users_router)
api_router.include_router(panels_router)
api_router.include_router(eggs_router)
api_router.include_router(ai_router)

__all__ = ["api_router"]

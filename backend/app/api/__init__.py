from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.eggs import router as eggs_router
from app.api.panels import router as panels_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(panels_router)
api_router.include_router(eggs_router)

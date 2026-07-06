from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import api_router
from app.core import SessionDep, settings
from app.core.db import init_db
from app.services import modpack_service

logger = structlog.get_logger()

_PLACEHOLDER_SECRETS = {"", "change-me", "change-me-in-production"}


def _warn_insecure_settings() -> None:
    if settings.debug:
        return
    if settings.secret_key in _PLACEHOLDER_SECRETS:
        logger.warning("insecure_default_secret", setting="SECRET_KEY")
    if settings.panel_api_key_encryption_secret in _PLACEHOLDER_SECRETS:
        logger.warning(
            "insecure_default_secret",
            setting="PANEL_API_KEY_ENCRYPTION_SECRET",
            detail="Stored panel API keys are encrypted with a publicly known key.",
        )
    if not settings.zitadel_project_id:
        logger.warning(
            "zitadel_project_id_unset",
            detail="Token audience validation will reject every login until "
            "ZITADEL_PROJECT_ID is configured.",
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    _warn_insecure_settings()
    await init_db()
    yield
    await modpack_service.close()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Modpack-to-Server Automation Platform",
    license_info={
        "name": "GNU Affero General Public License v3.0 or later",
        "identifier": "AGPL-3.0-or-later",
    },
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health", tags=["Health"])
async def health_check(session: SessionDep):
    await session.execute(text("SELECT 1"))
    return {
        "status": "healthy",
        "version": settings.app_version,
        "database": "reachable",
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
        "license": "AGPL-3.0-or-later",
    }

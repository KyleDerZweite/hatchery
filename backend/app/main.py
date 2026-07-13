import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import api_router
from app.core.config import APP_NAME, APP_VERSION, settings
from app.core.db import SessionDep, init_db
from app.services.modpack_service import modpack_service

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await modpack_service.close()


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Modpack-to-Server Automation Platform",
    license_info={
        "name": "GNU Affero General Public License v3.0 or later",
        "identifier": "AGPL-3.0-or-later",
    },
    lifespan=lifespan,
)

if settings.cors_origins:
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
    return {"status": "healthy", "version": APP_VERSION, "database": "reachable"}

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlmodel import SQLModel

# Set before app import: Settings is built at import time. Assigned rather than
# defaulted so a developer's local .env cannot change what the suite exercises.
test_db_path = Path(__file__).parent / "test.db"
os.environ["AUTH_MODE"] = "zitadel"
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"
os.environ["PANEL_API_KEY_ENCRYPTION_SECRET"] = "test-panel-secret"
os.environ["ZITADEL_DOMAIN"] = "auth.test.local"
os.environ["ZITADEL_PROJECT_ID"] = "test-project"
os.environ["ZITADEL_CLIENT_ID"] = "test-client"

from app.core.db import engine  # noqa: E402
from app.core.rate_limit import external_operation_limiter  # noqa: E402
from app.core.security import User, get_current_user  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
async def reset_db() -> AsyncIterator[None]:
    await external_operation_limiter.reset()
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)
    yield


@pytest.fixture(autouse=True)
def override_auth() -> AsyncIterator[None]:
    async def fake_current_user() -> User:
        return User(
            id="user-123",
            email="operator@example.com",
            name="Operator",
            roles=["ADMIN"],
        )

    app.dependency_overrides[get_current_user] = fake_current_user
    yield
    app.dependency_overrides.clear()


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client

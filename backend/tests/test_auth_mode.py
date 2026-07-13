"""AUTH_MODE=dev must stay local, and the Zitadel path must fail closed."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import AuthMode, Settings

PROD_ZITADEL = {
    "zitadel_domain": "auth.example.com",
    "zitadel_project_id": "project-1",
    "zitadel_client_id": "client-1",
    "panel_api_key_encryption_secret": "a-real-secret",
}


def settings(**overrides) -> Settings:
    # _env_file=None keeps a developer's local .env out of these assertions.
    return Settings(_env_file=None, **overrides)


def test_dev_auth_is_rejected_against_a_production_database():
    with pytest.raises(ValidationError, match="AUTH_MODE=dev is only allowed"):
        settings(
            auth_mode=AuthMode.DEV,
            database_url="postgresql://hatchery:secret@db.internal:5432/hatchery",
        )


def test_dev_auth_is_allowed_against_local_sqlite():
    assert settings(auth_mode=AuthMode.DEV, database_url="sqlite:///hatchery.db").auth_mode is (
        AuthMode.DEV
    )


def test_auth_mode_defaults_to_zitadel_when_unset():
    assert settings(**PROD_ZITADEL).auth_mode is AuthMode.ZITADEL


@pytest.mark.parametrize("missing", sorted(PROD_ZITADEL))
def test_zitadel_mode_fails_closed_on_missing_configuration(missing: str):
    config = PROD_ZITADEL | {missing: ""}

    with pytest.raises(ValidationError, match=missing.upper()):
        settings(**config)


async def test_dev_mode_authenticates_without_a_token(monkeypatch):
    from httpx import ASGITransport, AsyncClient

    from app.core import security
    from app.main import app

    monkeypatch.setattr(security.settings, "auth_mode", AuthMode.DEV)
    app.dependency_overrides.clear()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/eggs")

    assert response.status_code == 200


async def test_zitadel_mode_rejects_a_missing_token():
    from httpx import ASGITransport, AsyncClient

    from app.main import app

    app.dependency_overrides.clear()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/eggs")

    assert response.status_code == 401

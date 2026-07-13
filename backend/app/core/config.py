import base64
from enum import StrEnum
from hashlib import sha256
from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_NAME = "Hatchery"
APP_VERSION = "0.2.0"
USER_AGENT = f"{APP_NAME}/{APP_VERSION}"
PANEL_API_TIMEOUT_SECONDS = 10.0

# Fixed key for AUTH_MODE=dev, whose database is a throwaway local SQLite file.
# Production is rejected below unless a real secret is configured.
_DEV_ENCRYPTION_SECRET = "hatchery-local-dev-only"

_repo_root = Path(__file__).resolve().parents[3]


class AuthMode(StrEnum):
    ZITADEL = "zitadel"
    DEV = "dev"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_repo_root / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Defaults to the Zitadel path, so a missing or misspelled AUTH_MODE can never
    # enable the local bypass. See _validate_auth_configuration.
    auth_mode: AuthMode = AuthMode.ZITADEL
    zitadel_domain: str = ""
    zitadel_project_id: str = ""
    zitadel_client_id: str = ""

    database_url: str = "sqlite:///hatchery.db"
    panel_api_key_encryption_secret: str = ""
    curseforge_api_key: str = ""

    # Only needed when the browser app is served from a different origin than the
    # API. Both the dev server and the production nginx proxy serve /api same-origin.
    cors_origins: list[str] = []

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def async_database_url(self) -> str:
        if self.is_sqlite:
            return self.database_url.replace("sqlite:///", "sqlite+aiosqlite:///")
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://")
        return self.database_url

    @property
    def zitadel_issuer(self) -> str:
        return f"https://{self.zitadel_domain}"

    @property
    def zitadel_jwks_url(self) -> str:
        return f"https://{self.zitadel_domain}/oauth/v2/keys"

    @property
    def panel_encryption_key(self) -> bytes:
        secret = self.panel_api_key_encryption_secret or _DEV_ENCRYPTION_SECRET
        return base64.urlsafe_b64encode(sha256(secret.encode("utf-8")).digest())

    @model_validator(mode="after")
    def _validate_auth_configuration(self) -> "Settings":
        if self.auth_mode is AuthMode.DEV:
            # SQLite is the local-only database. Refusing to pair the auth bypass
            # with a real database stops a stray AUTH_MODE=dev in a production .env
            # from silently accepting every request.
            if not self.is_sqlite:
                raise ValueError(
                    "AUTH_MODE=dev is only allowed with the local SQLite DATABASE_URL. "
                    "Use AUTH_MODE=zitadel for any PostgreSQL deployment."
                )
            return self

        missing = [
            name
            for name, value in (
                ("ZITADEL_DOMAIN", self.zitadel_domain),
                ("ZITADEL_PROJECT_ID", self.zitadel_project_id),
                ("ZITADEL_CLIENT_ID", self.zitadel_client_id),
                ("PANEL_API_KEY_ENCRYPTION_SECRET", self.panel_api_key_encryption_secret),
            )
            if not value
        ]
        if missing:
            raise ValueError(f"AUTH_MODE=zitadel requires: {', '.join(missing)}")
        return self


settings = Settings()

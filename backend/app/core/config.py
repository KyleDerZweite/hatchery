import base64
from functools import lru_cache
from hashlib import sha256
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_backend_dir = Path(__file__).resolve().parent.parent.parent
_env_file = _backend_dir / ".env"
if not _env_file.exists():
    _env_file = _backend_dir.parent / ".env"


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=str(_env_file),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Hatchery"
    app_version: str = "0.2.0"
    debug: bool = False

    database_url: str = "sqlite:///hatchery.db"
    secret_key: str = "change-me"
    panel_api_key_encryption_secret: str = "change-me"
    panel_api_timeout_seconds: float = 10.0

    zitadel_domain: str = "auth.kylehub.dev"
    zitadel_project_id: str = ""

    @property
    def zitadel_issuer(self) -> str:
        return f"https://{self.zitadel_domain}"

    @property
    def zitadel_jwks_url(self) -> str:
        return f"https://{self.zitadel_domain}/oauth/v2/keys"

    curseforge_api_key: str = ""

    modrinth_user_agent: str = "Hatchery/0.2.0"

    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def async_database_url(self) -> str:
        if self.is_sqlite:
            return self.database_url.replace("sqlite:///", "sqlite+aiosqlite:///")
        elif self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://")
        return self.database_url

    @property
    def panel_encryption_key(self) -> bytes:
        secret = self.panel_api_key_encryption_secret or self.secret_key
        return base64.urlsafe_b64encode(sha256(secret.encode("utf-8")).digest())


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

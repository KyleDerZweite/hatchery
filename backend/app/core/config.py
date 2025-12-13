from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Find .env file - check backend dir first, then parent (project root)
_backend_dir = Path(__file__).resolve().parent.parent.parent
_env_file = _backend_dir / ".env"
if not _env_file.exists():
    _env_file = _backend_dir.parent / ".env"  # Project root


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=str(_env_file),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Hatchery"
    app_version: str = "0.1.0"
    debug: bool = False

    # Database
    database_url: str = "sqlite:///hatchery.db"

    # Zitadel Auth
    zitadel_domain: str = "auth.kylehub.dev"

    @property
    def zitadel_issuer(self) -> str:
        return f"https://{self.zitadel_domain}"

    @property
    def zitadel_jwks_url(self) -> str:
        return f"https://{self.zitadel_domain}/oauth/v2/keys"

    # External APIs
    curseforge_api_key: str = ""

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    @property
    def is_sqlite(self) -> bool:
        """Check if using SQLite database."""
        return self.database_url.startswith("sqlite")

    @property
    def async_database_url(self) -> str:
        """Get async-compatible database URL."""
        if self.is_sqlite:
            # Convert sqlite:/// to sqlite+aiosqlite:///
            return self.database_url.replace("sqlite:///", "sqlite+aiosqlite:///")
        elif self.database_url.startswith("postgresql://"):
            # Convert postgresql:// to postgresql+asyncpg://
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://")
        return self.database_url


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()

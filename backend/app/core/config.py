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

    # Security
    secret_key: str = "change-me-in-production-use-a-secure-random-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Registration settings
    registration_enabled: bool = True  # Set to False for invite-only mode

    # Default admin account (created on first startup if no users exist)
    default_admin_username: str = "admin"
    default_admin_email: str = "admin@hatchery.local"
    default_admin_password: str = "changeme123"  # CHANGE THIS IN PRODUCTION!

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

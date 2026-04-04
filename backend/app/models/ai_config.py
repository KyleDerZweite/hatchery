import uuid
from datetime import UTC, datetime
from sqlmodel import Field, SQLModel

class UserAIConfig(SQLModel, table=True):
    """User-specific AI Configuration."""
    __tablename__ = "user_ai_configs"

    owner_id: str = Field(primary_key=True, max_length=255)
    enabled: bool = Field(default=False)
    api_endpoint: str = Field(default="", max_length=1000)
    api_key: str = Field(default="", max_length=1000)
    model: str = Field(default="", max_length=255)
    max_tokens: int = Field(default=150)
    temperature: float = Field(default=0.3)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class PanelInstanceBase(SQLModel):
    """Base panel instance model with shared fields."""

    name: str = Field(min_length=1, max_length=100)
    url: str = Field(min_length=1, max_length=500)  # e.g., https://panel.example.com
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = Field(default=True)


class PanelInstance(PanelInstanceBase, table=True):
    """Panel instance database model."""

    __tablename__ = "panel_instances"

    id: int | None = Field(default=None, primary_key=True)
    api_key: str  # Stored encrypted or plain text for MVP
    owner_id: str = Field(index=True)  # Zitadel subject (unique user ID)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class PanelInstanceCreate(SQLModel):
    """Schema for creating a new panel instance."""

    name: str = Field(min_length=1, max_length=100)
    url: str = Field(min_length=1, max_length=500)
    api_key: str = Field(min_length=1)
    description: str | None = Field(default=None, max_length=500)


class PanelInstanceRead(PanelInstanceBase):
    """Schema for reading panel instance data (public)."""

    id: int
    owner_id: str
    created_at: datetime
    # Note: api_key is intentionally excluded for security


class PanelInstanceReadWithKey(PanelInstanceRead):
    """Schema for reading panel instance with API key (owner only)."""

    api_key: str


class PanelInstanceUpdate(SQLModel):
    """Schema for updating panel instance data."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    url: str | None = Field(default=None, min_length=1, max_length=500)
    api_key: str | None = Field(default=None, min_length=1)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None

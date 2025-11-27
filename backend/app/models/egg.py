from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, Any

from sqlmodel import Column, Field, Relationship, SQLModel
from sqlalchemy import JSON

if TYPE_CHECKING:
    from app.models.user import User


class Visibility(str, Enum):
    """Egg visibility enumeration."""
    PUBLIC = "public"
    PRIVATE = "private"


class ModpackSource(str, Enum):
    """Modpack source platform enumeration."""
    CURSEFORGE = "curseforge"
    MODRINTH = "modrinth"
    UNKNOWN = "unknown"


class EggConfigBase(SQLModel):
    """Base egg config model with shared fields."""
    name: str = Field(min_length=1, max_length=200)
    source_url: str = Field(min_length=1, max_length=1000)
    source: ModpackSource = Field(default=ModpackSource.UNKNOWN)
    description: str | None = Field(default=None, max_length=2000)
    java_version: int = Field(default=17, ge=8, le=25)
    visibility: Visibility = Field(default=Visibility.PRIVATE)
    minecraft_version: str | None = Field(default=None, max_length=20)
    modloader: str | None = Field(default=None, max_length=50)  # forge, fabric, neoforge, etc.
    modloader_version: str | None = Field(default=None, max_length=50)


class EggConfig(EggConfigBase, table=True):
    """Egg configuration database model."""
    __tablename__ = "egg_configs"
    
    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="users.id")
    
    # The actual Pterodactyl egg JSON structure
    json_data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    owner: "User" = Relationship(back_populates="eggs")


class EggConfigCreate(SQLModel):
    """Schema for creating a new egg config from URL."""
    source_url: str = Field(min_length=1, max_length=1000)
    visibility: Visibility = Field(default=Visibility.PRIVATE)
    java_version: int | None = Field(default=None, ge=8, le=25)


class EggConfigRead(EggConfigBase):
    """Schema for reading egg config data (public)."""
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime


class EggConfigReadFull(EggConfigRead):
    """Schema for reading egg config with full JSON data."""
    json_data: dict[str, Any]


class EggConfigUpdate(SQLModel):
    """Schema for updating egg config data."""
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    java_version: int | None = Field(default=None, ge=8, le=25)
    visibility: Visibility | None = None
    json_data: dict[str, Any] | None = None

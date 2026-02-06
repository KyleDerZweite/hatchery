"""
Mod reference models for caching Modrinth metadata.

These tables store mod metadata fetched from Modrinth so repeated lookups
are free and we never store actual JAR files (only URLs and hashes).

Security considerations:
- All fields have max lengths to prevent DoS
- JSON stored as TEXT for SQLite compatibility
- No user input directly stored without validation
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlmodel import Field, Relationship, SQLModel


class ModReference(SQLModel, table=True):
    """
    A unique mod entry in the reference library.

    One row per Modrinth project (identified by slug + platform).
    This caches metadata to minimize API calls to Modrinth.
    """

    __tablename__ = "mod_references"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    slug: str = Field(index=True, unique=True, max_length=255)
    platform: str = Field(default="modrinth", max_length=50)
    title: str = Field(default="", max_length=255)
    description: str = Field(default="", max_length=2000)
    icon_url: str | None = Field(default=None, max_length=512)
    categories: str = Field(default="", max_length=1000)
    downloads: int = Field(default=0, ge=0)
    modrinth_project_id: str = Field(default="", index=True, max_length=64)
    last_updated: datetime = Field(default_factory=lambda: datetime.now(UTC))

    versions: list[ModVersion] = Relationship(back_populates="mod_reference")


class ModVersion(SQLModel, table=True):
    """
    A specific version of a mod tied to a Minecraft version + loader.

    Stores download URL and hashes for integrity verification.
    The sha512 hash is used for .mrpack manifest integrity.
    """

    __tablename__ = "mod_versions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    mod_reference_id: uuid.UUID = Field(
        foreign_key="mod_references.id", index=True, ondelete="CASCADE"
    )
    version_number: str = Field(max_length=64)
    mc_version: str = Field(max_length=32, index=True)
    loader: str = Field(max_length=32, index=True)
    filename: str = Field(default="", max_length=255)
    download_url: str = Field(default="", max_length=1024)
    file_size: int | None = Field(default=None, ge=0)
    sha1: str = Field(default="", max_length=64)
    sha512: str = Field(default="", max_length=128)
    modrinth_version_id: str = Field(default="", max_length=64)
    dependencies_json: str = Field(default="[]", max_length=4000)
    fetched_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    mod_reference: ModReference = Relationship(back_populates="versions")


class ModReferenceRead(SQLModel):
    """Public read schema for mod references."""

    slug: str
    title: str
    description: str
    icon_url: str | None
    categories: list[str]
    downloads: int

    @staticmethod
    def from_model(mod: ModReference) -> ModReferenceRead:
        return ModReferenceRead(
            slug=mod.slug,
            title=mod.title or mod.slug,
            description=mod.description[:200] if mod.description else "",
            icon_url=mod.icon_url,
            categories=mod.categories.split(",") if mod.categories else [],
            downloads=mod.downloads,
        )


class ModVersionRead(SQLModel):
    """Public read schema for mod versions."""

    version_number: str
    mc_version: str
    loader: str
    filename: str
    download_url: str
    file_size: int | None
    sha1: str
    sha512: str

    @staticmethod
    def from_model(ver: ModVersion) -> ModVersionRead:
        return ModVersionRead(
            version_number=ver.version_number,
            mc_version=ver.mc_version,
            loader=ver.loader,
            filename=ver.filename,
            download_url=ver.download_url,
            file_size=ver.file_size,
            sha1=ver.sha1,
            sha512=ver.sha512,
        )

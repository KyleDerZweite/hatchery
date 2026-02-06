"""
Project models for AI-generated modpack projects.

These models support the ModMorphic-style AI-powered modpack creation:
1. User provides natural language prompt
2. AI selects mods based on prompt
3. System resolves dependencies
4. AI generates quest storyline
5. User exports as .mrpack

Security considerations:
- owner_id links to Zitadel subject for access control
- All text fields have max lengths to prevent DoS
- JSON stored as TEXT for SQLite compatibility
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import Column, Text
from sqlmodel import Field, SQLModel


class ProjectStatus(StrEnum):
    """Lifecycle status of a project."""

    QUEUED = "queued"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class ProjectVisibility(StrEnum):
    """Visibility level for projects."""

    PRIVATE = "private"
    PUBLIC = "public"


class Project(SQLModel, table=True):
    """
    A user's AI-generated modpack project.

    owner_id: Zitadel subject (unique, permanent user ID from JWT)
    This ensures proper access control and ownership.
    """

    __tablename__ = "projects"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: str = Field(index=True, max_length=255)
    name: str = Field(max_length=255, min_length=1)
    mc_version: str = Field(max_length=32)
    loader: str = Field(default="fabric", max_length=32)
    user_prompt: str = Field(default="", sa_column=Column(Text))
    templates_json: str = Field(default='["tech"]', max_length=500)
    status: ProjectStatus = Field(default=ProjectStatus.QUEUED)
    ai_reasoning: str = Field(default="", sa_column=Column(Text))
    error_message: str = Field(default="", max_length=1000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    @property
    def templates(self) -> list[str]:
        import json

        try:
            return json.loads(self.templates_json)
        except json.JSONDecodeError:
            return ["tech"]

    @templates.setter
    def templates(self, value: list[str]) -> None:
        import json

        self.templates_json = json.dumps(value)


class ProjectMods(SQLModel, table=True):
    """
    Link table between Project and ModVersion.

    Tracks which mod versions are included in a project,
    distinguishing between directly selected mods and dependencies.
    """

    __tablename__ = "project_mods"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id", index=True, ondelete="CASCADE")
    mod_version_id: uuid.UUID = Field(foreign_key="mod_versions.id", index=True, ondelete="CASCADE")
    is_dependency: bool = Field(default=False)
    added_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ProjectQuests(SQLModel, table=True):
    """
    Stores generated SNBT quest data for a project.

    quest_files_json: Maps filename -> SNBT content
    Example: {"chapters/getting_started.snbt": "...", "index.snbt": "..."}
    """

    __tablename__ = "project_quests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(
        foreign_key="projects.id", index=True, unique=True, ondelete="CASCADE"
    )
    story_title: str = Field(default="", max_length=255)
    story_description: str = Field(default="", sa_column=Column(Text))
    quest_files_json: str = Field(default="{}", sa_column=Column(Text))
    total_quests: int = Field(default=0, ge=0)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    @property
    def quest_files(self) -> dict[str, str]:
        import json

        try:
            return json.loads(self.quest_files_json)
        except json.JSONDecodeError:
            return {}

    @quest_files.setter
    def quest_files(self, value: dict[str, str]) -> None:
        import json

        self.quest_files_json = json.dumps(value)


class ProjectCreate(SQLModel):
    """Schema for creating a new AI-generated project."""

    name: str = Field(min_length=1, max_length=255)
    mc_version: str = Field(default="1.20.1", max_length=32)
    loader: str = Field(default="fabric", max_length=32)
    user_prompt: str = Field(min_length=10, max_length=2000)
    templates: list[str] = Field(default=["tech"])


class ProjectRead(SQLModel):
    """Public read schema for projects."""

    id: uuid.UUID
    owner_id: str
    name: str
    mc_version: str
    loader: str
    user_prompt: str
    templates: list[str]
    status: ProjectStatus
    ai_reasoning: str
    error_message: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @staticmethod
    def from_model(project: Project) -> ProjectRead:
        return ProjectRead(
            id=project.id,
            owner_id=project.owner_id,
            name=project.name,
            mc_version=project.mc_version,
            loader=project.loader,
            user_prompt=project.user_prompt,
            templates=project.templates,
            status=project.status,
            ai_reasoning=project.ai_reasoning,
            error_message=project.error_message,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )


class ProjectListRead(SQLModel):
    """Schema for listing projects."""

    projects: list[ProjectRead]
    total: int


class ModInProject(SQLModel):
    """Schema for a mod within a project."""

    slug: str
    title: str
    description: str
    icon_url: str | None
    version_number: str
    filename: str
    download_url: str
    is_dependency: bool


class ProjectModsRead(SQLModel):
    """Schema for project mods list."""

    mods: list[ModInProject]
    count: int


class ProjectQuestsRead(SQLModel):
    """Schema for project quests."""

    story_title: str
    story_description: str
    total_quests: int
    quest_files: dict[str, str]

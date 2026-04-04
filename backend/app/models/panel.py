from datetime import UTC, datetime
from typing import Literal

from sqlmodel import Field, SQLModel


class PanelInstanceBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    url: str = Field(min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = Field(default=True)


class PanelInstance(PanelInstanceBase, table=True):
    __tablename__ = "panel_instances"

    id: int | None = Field(default=None, primary_key=True)
    api_key_encrypted: str = Field(max_length=4096)
    owner_id: str = Field(index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    last_tested_at: datetime | None = Field(default=None)
    last_test_status: str = Field(default="untested", max_length=32)
    last_test_message: str = Field(default="", max_length=500)


class PanelInstanceCreate(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    url: str = Field(min_length=1, max_length=500)
    api_key: str = Field(min_length=1)
    description: str | None = Field(default=None, max_length=500)


class PanelInstanceRead(PanelInstanceBase):
    id: int
    owner_id: str
    created_at: datetime
    updated_at: datetime
    last_tested_at: datetime | None = None
    last_test_status: str
    last_test_message: str
    has_api_key: bool = True


class PanelInstanceUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    url: str | None = Field(default=None, min_length=1, max_length=500)
    api_key: str | None = Field(default=None, min_length=1)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None


class PanelConnectionTestResult(SQLModel):
    success: bool
    status: Literal["ok", "failed"]
    message: str
    panel_type: str | None = None
    checked_endpoint: str | None = None

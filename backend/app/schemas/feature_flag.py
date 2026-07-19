import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.targeting_rule import TargetingRuleRead


class FeatureFlagCreate(BaseModel):
    key: str = Field(min_length=1, max_length=255, pattern=r"^[a-z0-9]+(?:[._-][a-z0-9]+)*$")
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2048)
    is_active: bool = True
    default_enabled: bool = False


class FeatureFlagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2048)
    is_active: bool | None = None
    default_enabled: bool | None = None


class FeatureFlagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    key: str
    name: str
    description: str | None
    is_active: bool
    default_enabled: bool
    created_at: datetime
    updated_at: datetime
    rules: list[TargetingRuleRead] = []

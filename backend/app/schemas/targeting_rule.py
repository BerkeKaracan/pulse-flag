import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TargetingRuleCreate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    priority: int = Field(default=100, ge=0, le=10_000)
    enabled: bool = True
    allowed_tenant_ids: list[uuid.UUID] = Field(default_factory=list)
    allowed_tiers: list[str] = Field(default_factory=list)


class TargetingRuleUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    priority: int | None = Field(default=None, ge=0, le=10_000)
    enabled: bool | None = None
    allowed_tenant_ids: list[uuid.UUID] | None = None
    allowed_tiers: list[str] | None = None


class TargetingRuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    feature_flag_id: uuid.UUID
    name: str | None
    priority: int
    enabled: bool
    allowed_tenant_ids: list[uuid.UUID]
    allowed_tiers: list[str]
    created_at: datetime
    updated_at: datetime

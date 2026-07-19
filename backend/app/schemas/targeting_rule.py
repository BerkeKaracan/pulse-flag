import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def _normalize_tier_value(raw: str) -> str | None:
    tier = raw.strip().lower()
    if not tier:
        return None
    if tier == "free":
        return "basic"
    return tier


class TargetingRuleCreate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    priority: int = Field(default=100, ge=0, le=10_000)
    enabled: bool = True
    allowed_tenant_ids: list[uuid.UUID] = Field(default_factory=list)
    allowed_tiers: list[str] = Field(default_factory=list)

    @field_validator("allowed_tiers")
    @classmethod
    def normalize_tiers(cls, value: list[str]) -> list[str]:
        out: list[str] = []
        for item in value:
            normalized = _normalize_tier_value(item)
            if normalized and normalized not in out:
                out.append(normalized)
        return out

    @model_validator(mode="after")
    def require_at_least_one_constraint(self) -> "TargetingRuleCreate":
        if not self.allowed_tenant_ids and not self.allowed_tiers:
            raise ValueError(
                "At least one of allowed_tenant_ids or allowed_tiers is required"
            )
        return self


class TargetingRuleUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    priority: int | None = Field(default=None, ge=0, le=10_000)
    enabled: bool | None = None
    allowed_tenant_ids: list[uuid.UUID] | None = None
    allowed_tiers: list[str] | None = None

    @field_validator("allowed_tiers")
    @classmethod
    def normalize_tiers(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        out: list[str] = []
        for item in value:
            normalized = _normalize_tier_value(item)
            if normalized and normalized not in out:
                out.append(normalized)
        return out


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

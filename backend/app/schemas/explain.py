from __future__ import annotations

import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict


class ExplainResponse(BaseModel):
    """Admin-only evaluation breakdown (project-scoped)."""

    model_config = ConfigDict(extra="forbid")

    enabled: bool
    reason: Literal[
        "flag_missing",
        "flag_inactive",
        "rule_match",
        "default",
    ]
    project_id: uuid.UUID
    flag_id: uuid.UUID | None = None
    flag_key: str | None = None
    matched_rule_id: uuid.UUID | None = None
    rules_considered: int = 0
    normalized_tier: str | None = None


class EnsurePaidTiersResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    flag_id: uuid.UUID
    project_id: uuid.UUID
    created_rule: bool
    updated_rule: bool
    rule_id: uuid.UUID
    is_active: bool

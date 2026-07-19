from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import FeatureFlag, Project, TargetingRule


def resolve_project_from_api_key(db: Session, api_key: str | None) -> Project | None:
    if not api_key:
        return None
    return db.scalar(select(Project).where(Project.api_key == api_key))


def normalize_tier(raw: str | None) -> str | None:
    if raw is None:
        return None
    tier = raw.strip().lower()
    if not tier:
        return None
    if tier == "free":
        return "basic"
    return tier


def normalize_tiers(raw: list[str] | None) -> list[str]:
    out: list[str] = []
    for item in raw or []:
        normalized = normalize_tier(item)
        if normalized and normalized not in out:
            out.append(normalized)
    return out


def rule_matches(rule: TargetingRule, tenant_id: uuid.UUID, tier: str | None) -> bool:
    """
    Matching semantics:
    - Both allowlists empty → match nothing (no silent "all")
    - Empty tenant list + non-empty tiers → any tenant with those tiers
    - Non-empty tenants + empty tiers → listed tenants, any tier
    - Both set → intersection
    Tiers are compared case-insensitively (free → basic).
    """
    tenants = list(rule.allowed_tenant_ids or [])
    tiers = normalize_tiers(rule.allowed_tiers)

    if not tenants and not tiers:
        return False

    if tenants and tenant_id not in tenants:
        return False

    if tiers:
        normalized = normalize_tier(tier)
        if normalized is None:
            return False
        return normalized in tiers

    # Tenant-only rule: any tier for those tenants.
    return True


def evaluate_flag(
    db: Session,
    *,
    key: str,
    tenant_id: uuid.UUID,
    tier: str | None = None,
    project: Project | None = None,
) -> bool:
    """
    Hot path for GET /evaluate.

    Single round-trip: load flag + rules via joinedload, then evaluate in-process.
    Unknown / inactive flags fail closed (enabled=false).
    """
    stmt = (
        select(FeatureFlag)
        .options(joinedload(FeatureFlag.rules))
        .where(FeatureFlag.key == key)
    )
    if project is not None:
        stmt = stmt.where(FeatureFlag.project_id == project.id)

    flag = db.scalars(stmt).unique().first()
    if flag is None or not flag.is_active:
        return False

    for rule in sorted(flag.rules, key=lambda r: r.priority):
        if rule_matches(rule, tenant_id, tier):
            return rule.enabled

    return flag.default_enabled

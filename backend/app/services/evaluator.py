from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import FeatureFlag, Project, TargetingRule


def resolve_project_from_api_key(db: Session, api_key: str | None) -> Project | None:
    if not api_key:
        return None
    return db.scalar(select(Project).where(Project.api_key == api_key))


def rule_matches(rule: TargetingRule, tenant_id: uuid.UUID, tier: str | None) -> bool:
    tenants = rule.allowed_tenant_ids or []
    tiers = rule.allowed_tiers or []

    tenant_ok = (not tenants) or (tenant_id in tenants)
    if not tenant_ok:
        return False

    if not tiers:
        return True
    if tier is None:
        return False
    return tier in tiers


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

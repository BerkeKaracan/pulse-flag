from __future__ import annotations

import uuid
from typing import Any, Literal

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import FeatureFlag, Project, TargetingRule

ExplainReason = Literal[
    "flag_missing",
    "flag_inactive",
    "rule_match",
    "default",
]

PAID_TIERS_RULE_NAME = "Paid tiers"
PAID_TIERS = ("advanced", "pro")


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


def _load_flag(
    db: Session,
    *,
    key: str | None = None,
    flag_id: uuid.UUID | None = None,
    project: Project | None = None,
) -> FeatureFlag | None:
    stmt = select(FeatureFlag).options(joinedload(FeatureFlag.rules))
    if flag_id is not None:
        stmt = stmt.where(FeatureFlag.id == flag_id)
    if key is not None:
        stmt = stmt.where(FeatureFlag.key == key)
    if project is not None:
        stmt = stmt.where(FeatureFlag.project_id == project.id)
    return db.scalars(stmt).unique().first()


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
    Project scope is required for multi-tenant isolation in production callers.
    """
    flag = _load_flag(db, key=key, project=project)
    if flag is None or not flag.is_active:
        return False

    for rule in sorted(flag.rules, key=lambda r: r.priority):
        if rule_matches(rule, tenant_id, tier):
            return rule.enabled

    return flag.default_enabled


def explain_flag(
    db: Session,
    *,
    project: Project,
    flag_id: uuid.UUID,
    tenant_id: uuid.UUID,
    tier: str | None = None,
) -> dict[str, Any]:
    """Project-scoped evaluation breakdown for admin UI (never crosses projects)."""
    normalized = normalize_tier(tier)
    flag = _load_flag(db, flag_id=flag_id, project=project)
    if flag is None:
        return {
            "enabled": False,
            "reason": "flag_missing",
            "project_id": project.id,
            "flag_id": None,
            "flag_key": None,
            "matched_rule_id": None,
            "rules_considered": 0,
            "normalized_tier": normalized,
        }

    if not flag.is_active:
        return {
            "enabled": False,
            "reason": "flag_inactive",
            "project_id": project.id,
            "flag_id": flag.id,
            "flag_key": flag.key,
            "matched_rule_id": None,
            "rules_considered": len(flag.rules or []),
            "normalized_tier": normalized,
        }

    rules = sorted(flag.rules or [], key=lambda r: r.priority)
    for rule in rules:
        if rule_matches(rule, tenant_id, tier):
            return {
                "enabled": bool(rule.enabled),
                "reason": "rule_match",
                "project_id": project.id,
                "flag_id": flag.id,
                "flag_key": flag.key,
                "matched_rule_id": rule.id,
                "rules_considered": len(rules),
                "normalized_tier": normalized,
            }

    return {
        "enabled": bool(flag.default_enabled),
        "reason": "default",
        "project_id": project.id,
        "flag_id": flag.id,
        "flag_key": flag.key,
        "matched_rule_id": None,
        "rules_considered": len(rules),
        "normalized_tier": normalized,
    }


def _is_paid_tiers_rule(rule: TargetingRule) -> bool:
    tenants = list(rule.allowed_tenant_ids or [])
    tiers = set(normalize_tiers(rule.allowed_tiers))
    if tenants:
        return False
    return tiers == set(PAID_TIERS)


def ensure_paid_tiers_rule(
    db: Session,
    *,
    project: Project,
    flag_id: uuid.UUID,
) -> dict[str, Any]:
    """
    Idempotently activate flag and ensure a project-local paid-tier rule.
    Never touches other projects even if they share the same flag key string.
    """
    flag = _load_flag(db, flag_id=flag_id, project=project)
    if flag is None:
        raise ValueError("flag_not_found")

    flag.is_active = True

    existing = next(
        (
            rule
            for rule in sorted(flag.rules or [], key=lambda r: r.priority)
            if (rule.name or "") == PAID_TIERS_RULE_NAME or _is_paid_tiers_rule(rule)
        ),
        None,
    )

    created = False
    updated = False

    if existing is None:
        existing = TargetingRule(
            feature_flag_id=flag.id,
            name=PAID_TIERS_RULE_NAME,
            priority=100,
            enabled=True,
            allowed_tenant_ids=[],
            allowed_tiers=list(PAID_TIERS),
        )
        db.add(existing)
        created = True
    else:
        before = (
            existing.name,
            existing.enabled,
            list(existing.allowed_tenant_ids or []),
            normalize_tiers(existing.allowed_tiers),
        )
        existing.name = existing.name or PAID_TIERS_RULE_NAME
        existing.enabled = True
        existing.allowed_tenant_ids = []
        existing.allowed_tiers = list(PAID_TIERS)
        after = (
            existing.name,
            existing.enabled,
            list(existing.allowed_tenant_ids or []),
            normalize_tiers(existing.allowed_tiers),
        )
        updated = before != after

    db.commit()
    db.refresh(flag)
    db.refresh(existing)

    return {
        "flag_id": flag.id,
        "project_id": project.id,
        "created_rule": created,
        "updated_rule": updated,
        "rule_id": existing.id,
        "is_active": flag.is_active,
    }

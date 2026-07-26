import uuid

from app.models.targeting_rule import TargetingRule
from app.services.evaluator import (
    _is_paid_tiers_rule,
    normalize_tier,
    rule_matches,
)


def test_empty_constraints_match_nothing():
    rule = TargetingRule(allowed_tenant_ids=[], allowed_tiers=[], enabled=True)
    assert rule_matches(rule, uuid.uuid4(), None) is False
    assert rule_matches(rule, uuid.uuid4(), "pro") is False


def test_tenant_allowlist_any_tier():
    tenant = uuid.uuid4()
    rule = TargetingRule(allowed_tenant_ids=[tenant], allowed_tiers=[], enabled=True)
    assert rule_matches(rule, tenant, None) is True
    assert rule_matches(rule, tenant, "basic") is True
    assert rule_matches(rule, uuid.uuid4(), None) is False


def test_tier_allowlist_any_tenant():
    rule = TargetingRule(
        allowed_tenant_ids=[],
        allowed_tiers=["advanced", "pro"],
        enabled=True,
    )
    assert rule_matches(rule, uuid.uuid4(), None) is False
    assert rule_matches(rule, uuid.uuid4(), "pro") is True
    assert rule_matches(rule, uuid.uuid4(), "advanced") is True
    assert rule_matches(rule, uuid.uuid4(), "basic") is False


def test_tier_matching_is_case_insensitive():
    rule = TargetingRule(
        allowed_tenant_ids=[],
        allowed_tiers=["Advanced", "PRO"],
        enabled=True,
    )
    assert rule_matches(rule, uuid.uuid4(), "pro") is True
    assert rule_matches(rule, uuid.uuid4(), "ADVANCED") is True


def test_free_normalizes_to_basic():
    assert normalize_tier("free") == "basic"
    rule = TargetingRule(
        allowed_tenant_ids=[],
        allowed_tiers=["basic"],
        enabled=True,
    )
    assert rule_matches(rule, uuid.uuid4(), "free") is True


def test_intersection_of_tenant_and_tier():
    tenant = uuid.uuid4()
    rule = TargetingRule(
        allowed_tenant_ids=[tenant],
        allowed_tiers=["advanced"],
        enabled=True,
    )
    assert rule_matches(rule, tenant, "advanced") is True
    assert rule_matches(rule, tenant, "pro") is False
    assert rule_matches(rule, uuid.uuid4(), "advanced") is False


def test_paid_tiers_rule_shape():
    paid = TargetingRule(
        allowed_tenant_ids=[],
        allowed_tiers=["advanced", "pro"],
        enabled=True,
    )
    assert _is_paid_tiers_rule(paid) is True

    # Tenant-scoped must not count as the shared paid-tiers template
    tenant = uuid.uuid4()
    mixed = TargetingRule(
        allowed_tenant_ids=[tenant],
        allowed_tiers=["advanced", "pro"],
        enabled=True,
    )
    assert _is_paid_tiers_rule(mixed) is False

    basic_only = TargetingRule(
        allowed_tenant_ids=[],
        allowed_tiers=["basic"],
        enabled=True,
    )
    assert _is_paid_tiers_rule(basic_only) is False

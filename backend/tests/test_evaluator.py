import uuid

from app.models.targeting_rule import TargetingRule
from app.services.evaluator import rule_matches


def test_empty_constraints_match_any_tenant():
    rule = TargetingRule(allowed_tenant_ids=[], allowed_tiers=[], enabled=True)
    assert rule_matches(rule, uuid.uuid4(), None) is True


def test_tenant_allowlist():
    tenant = uuid.uuid4()
    rule = TargetingRule(allowed_tenant_ids=[tenant], allowed_tiers=[], enabled=True)
    assert rule_matches(rule, tenant, None) is True
    assert rule_matches(rule, uuid.uuid4(), None) is False


def test_tier_allowlist_requires_tier():
    rule = TargetingRule(
        allowed_tenant_ids=[],
        allowed_tiers=["advanced", "pro"],
        enabled=True,
    )
    assert rule_matches(rule, uuid.uuid4(), None) is False
    assert rule_matches(rule, uuid.uuid4(), "pro") is True
    assert rule_matches(rule, uuid.uuid4(), "free") is False

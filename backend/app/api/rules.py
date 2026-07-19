from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin_api_key
from app.database import get_db
from app.models import FeatureFlag, TargetingRule
from app.schemas.targeting_rule import TargetingRuleCreate, TargetingRuleRead, TargetingRuleUpdate

router = APIRouter(
    prefix="/admin/projects/{project_id}/flags/{flag_id}/rules",
    tags=["admin-rules"],
    dependencies=[Depends(require_admin_api_key)],
)


def _get_flag(db: Session, project_id: uuid.UUID, flag_id: uuid.UUID) -> FeatureFlag:
    flag = db.scalar(
        select(FeatureFlag).where(
            FeatureFlag.id == flag_id,
            FeatureFlag.project_id == project_id,
        )
    )
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    return flag


@router.get("", response_model=list[TargetingRuleRead])
def list_rules(
    project_id: uuid.UUID,
    flag_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> list[TargetingRule]:
    _get_flag(db, project_id, flag_id)
    stmt = (
        select(TargetingRule)
        .where(TargetingRule.feature_flag_id == flag_id)
        .order_by(TargetingRule.priority.asc())
    )
    return list(db.scalars(stmt).all())


@router.post("", response_model=TargetingRuleRead, status_code=status.HTTP_201_CREATED)
def create_rule(
    project_id: uuid.UUID,
    flag_id: uuid.UUID,
    payload: TargetingRuleCreate,
    db: Session = Depends(get_db),
) -> TargetingRule:
    _get_flag(db, project_id, flag_id)
    rule = TargetingRule(feature_flag_id=flag_id, **payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.patch("/{rule_id}", response_model=TargetingRuleRead)
def update_rule(
    project_id: uuid.UUID,
    flag_id: uuid.UUID,
    rule_id: uuid.UUID,
    payload: TargetingRuleUpdate,
    db: Session = Depends(get_db),
) -> TargetingRule:
    _get_flag(db, project_id, flag_id)
    rule = db.scalar(
        select(TargetingRule).where(
            TargetingRule.id == rule_id,
            TargetingRule.feature_flag_id == flag_id,
        )
    )
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(
    project_id: uuid.UUID,
    flag_id: uuid.UUID,
    rule_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> None:
    _get_flag(db, project_id, flag_id)
    rule = db.scalar(
        select(TargetingRule).where(
            TargetingRule.id == rule_id,
            TargetingRule.feature_flag_id == flag_id,
        )
    )
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()

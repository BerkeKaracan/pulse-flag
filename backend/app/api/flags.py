from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_owned_project, require_admin_api_key
from app.database import get_db
from app.models import FeatureFlag, Project
from app.schemas.explain import EnsurePaidTiersResponse, ExplainResponse
from app.schemas.feature_flag import FeatureFlagCreate, FeatureFlagRead, FeatureFlagUpdate
from app.services.evaluator import ensure_paid_tiers_rule, explain_flag

router = APIRouter(
    prefix="/admin/projects/{project_id}/flags",
    tags=["admin-flags"],
    dependencies=[Depends(require_admin_api_key)],
)


@router.get("", response_model=list[FeatureFlagRead])
def list_flags(
    project: Project = Depends(get_owned_project),
    db: Session = Depends(get_db),
) -> list[FeatureFlag]:
    stmt = (
        select(FeatureFlag)
        .options(joinedload(FeatureFlag.rules))
        .where(FeatureFlag.project_id == project.id)
        .order_by(FeatureFlag.key)
    )
    return list(db.scalars(stmt).unique().all())


@router.post("", response_model=FeatureFlagRead, status_code=status.HTTP_201_CREATED)
def create_flag(
    payload: FeatureFlagCreate,
    project: Project = Depends(get_owned_project),
    db: Session = Depends(get_db),
) -> FeatureFlag:
    existing = db.scalar(
        select(FeatureFlag).where(
            FeatureFlag.project_id == project.id,
            FeatureFlag.key == payload.key,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Flag key already exists in this project")

    flag = FeatureFlag(project_id=project.id, **payload.model_dump())
    db.add(flag)
    db.commit()
    db.refresh(flag)
    return flag


@router.get("/{flag_id}", response_model=FeatureFlagRead)
def get_flag(
    flag_id: uuid.UUID,
    project: Project = Depends(get_owned_project),
    db: Session = Depends(get_db),
) -> FeatureFlag:
    flag = db.scalars(
        select(FeatureFlag)
        .options(joinedload(FeatureFlag.rules))
        .where(FeatureFlag.id == flag_id, FeatureFlag.project_id == project.id)
    ).unique().first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    return flag


@router.patch("/{flag_id}", response_model=FeatureFlagRead)
def update_flag(
    flag_id: uuid.UUID,
    payload: FeatureFlagUpdate,
    project: Project = Depends(get_owned_project),
    db: Session = Depends(get_db),
) -> FeatureFlag:
    flag = get_flag(flag_id=flag_id, project=project, db=db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(flag, field, value)
    db.commit()
    db.refresh(flag)
    return flag


@router.get("/{flag_id}/explain", response_model=ExplainResponse)
def explain_flag_evaluation(
    flag_id: uuid.UUID,
    tenant_id: uuid.UUID = Query(..., description="Workspace / tenant UUID"),
    tier: str | None = Query(
        default=None,
        max_length=64,
        description="Optional plan tier (e.g. advanced, pro)",
    ),
    project: Project = Depends(get_owned_project),
    db: Session = Depends(get_db),
) -> ExplainResponse:
    """Owner-only breakdown of why evaluate would return true/false for this flag."""
    payload = explain_flag(
        db,
        project=project,
        flag_id=flag_id,
        tenant_id=tenant_id,
        tier=tier,
    )
    return ExplainResponse(**payload)


@router.post(
    "/{flag_id}/ensure-paid-tiers",
    response_model=EnsurePaidTiersResponse,
)
def ensure_paid_tiers(
    flag_id: uuid.UUID,
    project: Project = Depends(get_owned_project),
    db: Session = Depends(get_db),
) -> EnsurePaidTiersResponse:
    """
    Project-scoped: activate flag + ensure advanced/pro targeting rule.
    Does not affect other projects that may share the same flag key string.
    """
    try:
        payload = ensure_paid_tiers_rule(db, project=project, flag_id=flag_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Feature flag not found") from None
    return EnsurePaidTiersResponse(**payload)

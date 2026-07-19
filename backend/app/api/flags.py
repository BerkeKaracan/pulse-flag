from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_owned_project, require_admin_api_key
from app.database import get_db
from app.models import FeatureFlag, Project
from app.schemas.feature_flag import FeatureFlagCreate, FeatureFlagRead, FeatureFlagUpdate

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

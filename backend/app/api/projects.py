from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_owned_project, require_admin_api_key, require_user_id
from app.database import get_db
from app.models import Project
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate

router = APIRouter(
    prefix="/admin/projects",
    tags=["admin-projects"],
    dependencies=[Depends(require_admin_api_key)],
)


@router.get("", response_model=list[ProjectRead])
def list_projects(
    user_id: str = Depends(require_user_id),
    db: Session = Depends(get_db),
) -> list[Project]:
    stmt = (
        select(Project)
        .where(Project.user_id == user_id)
        .order_by(Project.created_at.desc())
    )
    return list(db.scalars(stmt).all())


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    user_id: str = Depends(require_user_id),
    db: Session = Depends(get_db),
) -> Project:
    existing = db.scalar(select(Project).where(Project.slug == payload.slug))
    if existing:
        raise HTTPException(status_code=409, detail="Project slug already exists")

    project = Project(user_id=user_id, **payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project: Project = Depends(get_owned_project)) -> Project:
    return project


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    payload: ProjectUpdate,
    project: Project = Depends(get_owned_project),
    db: Session = Depends(get_db),
) -> Project:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project

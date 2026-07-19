from __future__ import annotations

import uuid

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Project


def optional_bearer_api_key(
    authorization: str | None = Header(default=None),
) -> str | None:
    """
    Authorization is optional. When present, it must be a valid Bearer token.
    Validation against project/global keys happens in the evaluate handler.
    """
    if authorization is None or authorization.strip() == "":
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header. Expected: Bearer <FEATURE_FLAGS_API_KEY>",
        )
    return token.strip()


def require_admin_api_key(
    authorization: str | None = Header(default=None),
) -> None:
    """Protect admin CRUD with the platform FEATURE_FLAGS_API_KEY when configured."""
    settings = get_settings()
    if not settings.feature_flags_api_key:
        return

    provided = optional_bearer_api_key(authorization)
    if provided != settings.feature_flags_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin API key",
        )


def require_user_id(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
) -> str:
    """Supabase user id forwarded by the Next.js BFF (never trust body for ownership)."""
    user_id = (x_user_id or "").strip()
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Id header",
        )
    return user_id


def get_owned_project(
    project_id: uuid.UUID,
    user_id: str = Depends(require_user_id),
    db: Session = Depends(get_db),
) -> Project:
    """Load a project only if it belongs to the caller; otherwise 404."""
    project = db.get(Project, project_id)
    if not project or project.user_id != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

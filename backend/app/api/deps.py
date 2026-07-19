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
    Authorization is optional at the dependency layer.
    Callers that require a key must reject None themselves.
    """
    if authorization is None or authorization.strip() == "":
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header. Expected: Bearer <api_key>",
        )
    return token.strip()


def require_admin_api_key(
    authorization: str | None = Header(default=None),
) -> None:
    """
    Protect /admin/* with the platform FEATURE_FLAGS_API_KEY.

    Fail closed: if the key is not configured, admin routes are unavailable.
    """
    settings = get_settings()
    if not settings.feature_flags_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="FEATURE_FLAGS_API_KEY is not configured",
        )

    provided = optional_bearer_api_key(authorization)
    if provided != settings.feature_flags_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin API key",
        )


def require_user_id(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
) -> str:
    """
    Owner id forwarded by the trusted Next.js BFF after a Supabase session check.

    FastAPI does not verify Supabase JWTs itself — keep the admin API private
    (BFF-only / network-restricted) so clients cannot spoof X-User-Id with the
    platform admin key.
    """
    user_id = (x_user_id or "").strip()
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Id header",
        )
    if len(user_id) > 64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid X-User-Id header",
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

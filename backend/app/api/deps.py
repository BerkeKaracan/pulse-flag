from __future__ import annotations

import uuid

import jwt
from fastapi import Depends, Header, HTTPException, status
from jwt import InvalidTokenError
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


def _extract_bearer(raw: str | None) -> str | None:
    if raw is None or not raw.strip():
        return None
    value = raw.strip()
    scheme, _, token = value.partition(" ")
    if scheme.lower() == "bearer" and token.strip():
        return token.strip()
    # Allow raw JWT without Bearer prefix.
    if value.count(".") >= 2:
        return value
    return None


def require_supabase_user(
    x_supabase_access_token: str | None = Header(
        default=None,
        alias="X-Supabase-Access-Token",
    ),
) -> str:
    """
    Verify the caller's Supabase access token and return auth.users.id (JWT sub).

    Identity is never taken from X-User-Id — that header is ignored.
    """
    settings = get_settings()
    secret = (settings.supabase_jwt_secret or "").strip()
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SUPABASE_JWT_SECRET is not configured",
        )

    token = _extract_bearer(x_supabase_access_token)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Supabase-Access-Token",
        )

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Supabase access token",
        ) from exc

    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase token missing subject",
        )
    return user_id.strip()


def get_owned_project(
    project_id: uuid.UUID,
    user_id: str = Depends(require_supabase_user),
    db: Session = Depends(get_db),
) -> Project:
    """Load a project only if it belongs to the caller; otherwise 404."""
    project = db.get(Project, project_id)
    if not project or project.user_id != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

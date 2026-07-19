from __future__ import annotations

from fastapi import Header, HTTPException, status

from app.config import get_settings


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

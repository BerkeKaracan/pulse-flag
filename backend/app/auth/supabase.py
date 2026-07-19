from __future__ import annotations

import json
import logging
from functools import lru_cache
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import jwt
from jwt import InvalidTokenError, PyJWKClient

from app.config import Settings

logger = logging.getLogger("pulse_flag.supabase_auth")


def _verify_via_auth_api(token: str, settings: Settings) -> str | None:
    """Ask Supabase Auth who this access token belongs to (algorithm-agnostic)."""
    base = (settings.supabase_url or "").rstrip("/")
    anon = (settings.supabase_anon_key or "").strip()
    if not base or not anon:
        return None

    req = Request(
        f"{base}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": anon,
            "User-Agent": "pulse-flag-api",
        },
        method="GET",
    )
    try:
        with urlopen(req, timeout=5.0) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except HTTPError as exc:
        if exc.code in {401, 403}:
            return None
        logger.warning("Supabase Auth /user HTTP %s", exc.code)
        return None
    except (URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        logger.warning("Supabase Auth /user failed: %s", exc)
        return None

    user_id = payload.get("id")
    if isinstance(user_id, str) and user_id.strip():
        return user_id.strip()
    return None


def _verify_via_jwt_secret(token: str, secret: str) -> str | None:
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except InvalidTokenError:
        try:
            # Some projects omit / change aud; still require a valid signature + sub.
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        except InvalidTokenError:
            return None

    user_id = payload.get("sub")
    if isinstance(user_id, str) and user_id.strip():
        return user_id.strip()
    return None


@lru_cache(maxsize=4)
def _jwks_client(supabase_url: str) -> PyJWKClient:
    base = supabase_url.rstrip("/")
    return PyJWKClient(f"{base}/auth/v1/.well-known/jwks.json", cache_keys=True)


def _verify_via_jwks(token: str, supabase_url: str) -> str | None:
    try:
        client = _jwks_client(supabase_url)
        key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except Exception:
        try:
            client = _jwks_client(supabase_url)
            key = client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                key.key,
                algorithms=["ES256", "RS256"],
                options={"verify_aud": False},
            )
        except Exception as exc:
            logger.warning("JWKS verify failed: %s", exc)
            return None

    user_id = payload.get("sub")
    if isinstance(user_id, str) and user_id.strip():
        return user_id.strip()
    return None


def resolve_supabase_user_id(token: str, settings: Settings) -> str | None:
    """
    Resolve auth.users.id from an access token.

    Order:
    1. Supabase Auth /user (works for legacy + new signing keys)
    2. Local HS256 with SUPABASE_JWT_SECRET
    3. JWKS (ES256/RS256) when SUPABASE_URL is set
    """
    user_id = _verify_via_auth_api(token, settings)
    if user_id:
        return user_id

    secret = (settings.supabase_jwt_secret or "").strip()
    if secret:
        user_id = _verify_via_jwt_secret(token, secret)
        if user_id:
            return user_id

    if (settings.supabase_url or "").strip():
        user_id = _verify_via_jwks(token, settings.supabase_url.strip())
        if user_id:
            return user_id

    return None


def auth_configured(settings: Settings) -> bool:
    return bool(
        ((settings.supabase_url or "").strip() and (settings.supabase_anon_key or "").strip())
        or (settings.supabase_jwt_secret or "").strip()
    )

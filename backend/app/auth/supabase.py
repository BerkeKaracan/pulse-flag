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


def _clean(value: str | None) -> str:
    return (value or "").strip().strip('"').strip("'")


def _verify_via_auth_api(token: str, settings: Settings) -> tuple[str | None, str]:
    """Ask Supabase Auth who this access token belongs to (algorithm-agnostic)."""
    base = _clean(settings.supabase_url).rstrip("/")
    anon = _clean(settings.supabase_anon_key)
    if not base or not anon:
        return None, "auth_api_skipped_no_url_or_anon"

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
        body = ""
        try:
            body = exc.read().decode("utf-8", errors="replace")[:160]
        except Exception:
            pass
        logger.warning("Supabase Auth /user HTTP %s: %s", exc.code, body)
        return None, f"auth_api_http_{exc.code}"
    except (URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        logger.warning("Supabase Auth /user failed: %s", exc)
        return None, "auth_api_unreachable"

    user_id = payload.get("id")
    if isinstance(user_id, str) and user_id.strip():
        return user_id.strip(), "auth_api_ok"
    return None, "auth_api_no_id"


def _verify_via_jwt_secret(token: str, secret: str) -> tuple[str | None, str]:
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except InvalidTokenError:
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        except InvalidTokenError as exc:
            logger.warning("HS256 JWT verify failed: %s", exc)
            return None, "jwt_secret_invalid"

    user_id = payload.get("sub")
    if isinstance(user_id, str) and user_id.strip():
        return user_id.strip(), "jwt_secret_ok"
    return None, "jwt_secret_no_sub"


@lru_cache(maxsize=4)
def _jwks_client(supabase_url: str) -> PyJWKClient:
    base = supabase_url.rstrip("/")
    return PyJWKClient(f"{base}/auth/v1/.well-known/jwks.json", cache_keys=True)


def _verify_via_jwks(token: str, supabase_url: str) -> tuple[str | None, str]:
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
            return None, "jwks_invalid"

    user_id = payload.get("sub")
    if isinstance(user_id, str) and user_id.strip():
        return user_id.strip(), "jwks_ok"
    return None, "jwks_no_sub"


def resolve_supabase_user_id(token: str, settings: Settings) -> tuple[str | None, list[str]]:
    """
    Resolve auth.users.id from an access token.

    Returns (user_id_or_none, attempt_notes).
    """
    notes: list[str] = []

    user_id, note = _verify_via_auth_api(token, settings)
    notes.append(note)
    if user_id:
        return user_id, notes

    secret = _clean(settings.supabase_jwt_secret)
    if secret:
        user_id, note = _verify_via_jwt_secret(token, secret)
        notes.append(note)
        if user_id:
            return user_id, notes
    else:
        notes.append("jwt_secret_skipped")

    url = _clean(settings.supabase_url)
    if url:
        user_id, note = _verify_via_jwks(token, url)
        notes.append(note)
        if user_id:
            return user_id, notes
    else:
        notes.append("jwks_skipped")

    return None, notes


def auth_configured(settings: Settings) -> bool:
    has_auth_api = bool(_clean(settings.supabase_url) and _clean(settings.supabase_anon_key))
    has_jwt = bool(_clean(settings.supabase_jwt_secret))
    return has_auth_api or has_jwt

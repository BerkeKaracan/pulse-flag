import time

import jwt
import pytest
from fastapi import HTTPException

from app.api.deps import require_supabase_user
from app.auth.supabase import resolve_supabase_user_id
from app.config import Settings, get_settings


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_resolve_via_jwt_secret(monkeypatch: pytest.MonkeyPatch):
    secret = "x" * 32
    monkeypatch.setenv("SUPABASE_JWT_SECRET", secret)
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_ANON_KEY", raising=False)
    get_settings.cache_clear()
    settings = get_settings()

    token = jwt.encode(
        {
            "sub": "user-abc-123",
            "aud": "authenticated",
            "role": "authenticated",
            "exp": int(time.time()) + 3600,
        },
        secret,
        algorithm="HS256",
    )

    user_id, notes = resolve_supabase_user_id(token, settings)
    assert user_id == "user-abc-123"
    assert "jwt_secret_ok" in notes
    # Local verify succeeds — Auth /user must not run.
    assert not any(n.startswith("auth_api_") for n in notes)


def test_auth_api_is_last_resort(monkeypatch: pytest.MonkeyPatch):
    """JWKS / JWT secret fail → only then Auth /user."""
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "anon")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "x" * 32)
    get_settings.cache_clear()
    settings = get_settings()

    calls: list[str] = []

    def fake_jwks(token: str, url: str):
        calls.append("jwks")
        return None, "jwks_invalid"

    def fake_secret(token: str, secret: str):
        calls.append("jwt_secret")
        return None, "jwt_secret_invalid"

    def fake_auth_api(token: str, s: Settings):
        calls.append("auth_api")
        return "user-from-auth-api", "auth_api_ok"

    monkeypatch.setattr("app.auth.supabase._verify_via_jwks", fake_jwks)
    monkeypatch.setattr("app.auth.supabase._verify_via_jwt_secret", fake_secret)
    monkeypatch.setattr("app.auth.supabase._verify_via_auth_api", fake_auth_api)

    user_id, notes = resolve_supabase_user_id("any-token", settings)
    assert user_id == "user-from-auth-api"
    assert calls == ["jwks", "jwt_secret", "auth_api"]
    assert notes == ["jwks_invalid", "jwt_secret_invalid", "auth_api_ok"]


def test_require_supabase_user_rejects_bad_token(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "x" * 32)
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_ANON_KEY", raising=False)
    get_settings.cache_clear()

    token = jwt.encode(
        {
            "sub": "user-abc-123",
            "aud": "authenticated",
            "exp": int(time.time()) + 3600,
        },
        "y" * 32,
        algorithm="HS256",
    )

    with pytest.raises(HTTPException) as exc:
        require_supabase_user(x_supabase_access_token=token)
    assert exc.value.status_code == 401


def test_settings_reads_supabase_fields(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "anon")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "secret")
    get_settings.cache_clear()
    s = Settings()
    assert s.resolved_supabase_url == "https://example.supabase.co"
    assert s.resolved_supabase_anon_key == "anon"
    assert s.supabase_jwt_secret == "secret"


def test_settings_accepts_next_public_aliases(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_ANON_KEY", raising=False)
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_URL", "https://alias.supabase.co")
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-alias")
    get_settings.cache_clear()
    s = Settings()
    assert s.resolved_supabase_url == "https://alias.supabase.co"
    assert s.resolved_supabase_anon_key == "anon-alias"

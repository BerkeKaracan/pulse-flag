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

    assert resolve_supabase_user_id(token, settings) == "user-abc-123"


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
    assert s.supabase_url == "https://example.supabase.co"
    assert s.supabase_anon_key == "anon"
    assert s.supabase_jwt_secret == "secret"

import time

import jwt
import pytest
from fastapi import HTTPException

from app.api.deps import require_supabase_user
from app.config import Settings, get_settings


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_require_supabase_user_accepts_valid_token(monkeypatch: pytest.MonkeyPatch):
    secret = "test-supabase-jwt-secret-value"
    monkeypatch.setenv("SUPABASE_JWT_SECRET", secret)
    monkeypatch.setenv("FEATURE_FLAGS_API_KEY", "dev-key")
    get_settings.cache_clear()

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

    user_id = require_supabase_user(x_supabase_access_token=f"Bearer {token}")
    assert user_id == "user-abc-123"


def test_require_supabase_user_rejects_bad_token(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "correct-secret")
    monkeypatch.setenv("FEATURE_FLAGS_API_KEY", "dev-key")
    get_settings.cache_clear()

    token = jwt.encode(
        {
            "sub": "user-abc-123",
            "aud": "authenticated",
            "exp": int(time.time()) + 3600,
        },
        "wrong-secret",
        algorithm="HS256",
    )

    with pytest.raises(HTTPException) as exc:
        require_supabase_user(x_supabase_access_token=token)
    assert exc.value.status_code == 401


def test_settings_reads_supabase_jwt_secret(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "from-env")
    get_settings.cache_clear()
    assert Settings().supabase_jwt_secret == "from-env"

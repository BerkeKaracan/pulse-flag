from __future__ import annotations

import socket
from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(url: str) -> str:
    """Railway/Supabase often provide postgres:// — SQLAlchemy needs postgresql+psycopg://."""
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url.removeprefix("postgres://")
    elif url.startswith("postgresql://") and "+psycopg" not in url:
        url = "postgresql+psycopg://" + url.removeprefix("postgresql://")
    return prefer_ipv4_and_ssl(url)


def prefer_ipv4_and_ssl(url: str) -> str:
    """
    Render (and many PaaS) cannot reach Supabase direct DB over IPv6.
    Prefer an A-record hostaddr when available, and require SSL for Supabase.
    If the host is IPv6-only, use Supabase Session pooler URI in DATABASE_URL instead.
    """
    parsed = urlparse(url)
    host = parsed.hostname
    if not host:
        return url

    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    is_supabase = "supabase.co" in host or "pooler.supabase.com" in host

    if is_supabase and "sslmode" not in query:
        query["sslmode"] = "require"

    if host not in {"localhost", "127.0.0.1"} and "hostaddr" not in query:
        try:
            infos = socket.getaddrinfo(
                host,
                parsed.port or 5432,
                family=socket.AF_INET,
                type=socket.SOCK_STREAM,
            )
            if infos:
                query["hostaddr"] = infos[0][4][0]
        except OSError:
            # IPv6-only DNS — caller must switch to the Supabase pooler URL.
            pass

    return urlunparse(parsed._replace(query=urlencode(query)))


def is_supabase_transaction_pooler(url: str) -> bool:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    port = parsed.port
    return "pooler.supabase.com" in host and port == 6543


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5433/pulse_flag"
    feature_flags_api_key: str | None = None
    # Exact origins; localhost + *.vercel.app also allowed via regex in main.py
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    @field_validator("database_url")
    @classmethod
    def _normalize_db_url(cls, value: str) -> str:
        return normalize_database_url(value)

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

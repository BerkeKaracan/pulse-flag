from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app.api import evaluate, flags, projects, rules
from app.config import get_settings
from app.database import Base, engine

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Bootstrap tables. Prefer Alembic once the schema stabilizes.
    try:
        Base.metadata.create_all(bind=engine)
    except OperationalError as exc:
        message = str(exc.orig if getattr(exc, "orig", None) else exc)
        hint = ""
        if "Network is unreachable" in message or "IPv6" in message or "2a05:" in message:
            hint = (
                " Host cannot reach Supabase over IPv6. Use the Session pooler URI "
                "(pooler.supabase.com) as DATABASE_URL and redeploy."
            )
        raise RuntimeError(f"Database connection failed during startup.{hint}") from exc
    yield


app = FastAPI(
    title="Pulse Flag API",
    description="Feature Flag Management Platform — delivery + admin API",
    version="0.1.0",
    lifespan=lifespan,
    # Hide interactive docs in production — they are a recon surface.
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

# Prefer calling admin routes through the Next.js BFF (never expose the admin key).
cors_kwargs: dict = {
    "allow_origins": settings.cors_origin_list,
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": [
        "Authorization",
        "Content-Type",
        "X-Supabase-Access-Token",
    ],
}
# Localhost convenience only — not in production.
if not settings.is_production:
    cors_kwargs["allow_origin_regex"] = (
        r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app"
    )

app.add_middleware(CORSMiddleware, **cors_kwargs)

app.include_router(evaluate.router)
app.include_router(projects.router)
app.include_router(flags.router)
app.include_router(rules.router)


@app.get("/health")
def health() -> dict[str, str]:
    """Load balancer healthcheck target."""
    return {"status": "ok", "service": "pulse-flag-api"}

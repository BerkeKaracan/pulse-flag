from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app.api import evaluate, flags, projects, rules
from app.config import get_settings
from app.database import Base, engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Initial bootstrap: create tables. Swap to Alembic before hardening production.
    try:
        Base.metadata.create_all(bind=engine)
    except OperationalError as exc:
        message = str(exc.orig if getattr(exc, "orig", None) else exc)
        hint = ""
        if "Network is unreachable" in message or "IPv6" in message or "2a05:" in message:
            hint = (
                " Render cannot reach Supabase over IPv6. In Supabase → Project Settings → "
                "Database → Connection string, copy the Session pooler URI (IPv4 / "
                "pooler.supabase.com), set it as DATABASE_URL (postgresql+psycopg://...), "
                "and redeploy."
            )
        raise RuntimeError(f"Database connection failed during startup.{hint}") from exc
    yield


settings = get_settings()

app = FastAPI(
    title="Pulse Flag API",
    description="Feature Flag Management Platform — delivery + admin API",
    version="0.1.0",
    lifespan=lifespan,
)

# Admin UI should prefer the Next.js BFF; CORS still covers direct browser calls
# (local + Vercel previews) and Swagger try-outs.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evaluate.router)
app.include_router(projects.router)
app.include_router(flags.router)
app.include_router(rules.router)


@app.get("/health")
def health() -> dict[str, str]:
    """Render / load balancer healthcheck target."""
    return {"status": "ok", "service": "pulse-flag-api"}

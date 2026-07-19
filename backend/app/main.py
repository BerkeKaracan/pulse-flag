from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import evaluate, flags, projects, rules
from app.config import get_settings
from app.database import Base, engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Initial bootstrap: create tables. Swap to Alembic before hardening production.
    Base.metadata.create_all(bind=engine)
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
    """Railway / load balancer healthcheck target."""
    return {"status": "ok", "service": "pulse-flag-api"}

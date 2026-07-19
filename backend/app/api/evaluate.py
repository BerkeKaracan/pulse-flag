from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import optional_bearer_api_key
from app.config import get_settings
from app.database import get_db
from app.schemas.evaluate import EvaluateResponse
from app.services.evaluator import evaluate_flag, resolve_project_from_api_key

router = APIRouter(tags=["delivery"])


@router.get(
    "/evaluate",
    response_model=EvaluateResponse,
    response_model_exclude_unset=True,
    summary="Evaluate a feature flag for a tenant",
)
def evaluate(
    key: str = Query(..., min_length=1, max_length=255, examples=["ai.canvas_generator"]),
    tenant_id: uuid.UUID = Query(..., description="Workspace / tenant UUID from Supabase"),
    tier: str | None = Query(
        default=None,
        max_length=64,
        description="Optional plan tier used by targeting rules (e.g. advanced, pro)",
    ),
    api_key: str | None = Depends(optional_bearer_api_key),
    db: Session = Depends(get_db),
) -> EvaluateResponse:
    """
    Delivery contract for the SaaS Engine.

    Response shape is ALWAYS exactly: {"enabled": true|false}
    """
    settings = get_settings()
    project = None

    if api_key is not None:
        project = resolve_project_from_api_key(db, api_key)
        global_ok = (
            settings.feature_flags_api_key is not None
            and api_key == settings.feature_flags_api_key
        )
        if project is None and not global_ok:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid FEATURE_FLAGS_API_KEY",
            )

    enabled = evaluate_flag(
        db,
        key=key,
        tenant_id=tenant_id,
        tier=tier,
        project=project,
    )
    return EvaluateResponse(enabled=enabled)

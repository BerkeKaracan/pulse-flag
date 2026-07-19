from pydantic import BaseModel, ConfigDict


class EvaluateResponse(BaseModel):
    """Strict delivery contract for the SaaS Engine."""

    model_config = ConfigDict(extra="forbid")

    enabled: bool

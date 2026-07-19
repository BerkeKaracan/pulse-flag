from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.targeting_rule import TargetingRule


class FeatureFlag(Base):
    """A named flag key evaluated by the SaaS Engine delivery endpoint."""

    __tablename__ = "feature_flags"
    __table_args__ = (
        UniqueConstraint("project_id", "key", name="uq_feature_flags_project_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    key: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    # Global kill-switch: when False, evaluate always returns enabled=false
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Fallback when no targeting rule matches
    default_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    project: Mapped[Project] = relationship(back_populates="feature_flags")
    rules: Mapped[list[TargetingRule]] = relationship(
        back_populates="feature_flag",
        cascade="all, delete-orphan",
        order_by="TargetingRule.priority",
    )

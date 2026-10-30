"""Explicit retention policy helpers; deletion remains a human-approved action."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass(frozen=True)
class RetentionPolicy:
    event_days: int = 30
    audit_days: int = 365

    def __post_init__(self) -> None:
        if self.event_days <= 0 or self.audit_days <= 0:
            raise ValueError("retention windows must be positive")

    def expires_at(self, created_at: datetime, *, kind: str) -> datetime:
        days = self.event_days if kind == "student_event" else self.audit_days if kind == "audit" else None
        if days is None:
            raise ValueError(f"unknown retention kind: {kind}")
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        return created_at + timedelta(days=days)

    def deletion_due(self, created_at: datetime, *, kind: str, now: datetime | None = None) -> bool:
        current = now or datetime.now(timezone.utc)
        return current >= self.expires_at(created_at, kind=kind)

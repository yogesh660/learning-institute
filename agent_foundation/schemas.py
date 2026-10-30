"""Validated task, approval, and report records used by Phase 1 workflows."""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(frozen=True)
class Task:
    objective: str
    requested_by: str
    repository: str = "yogesh660/learning-institute"
    task_id: UUID = field(default_factory=uuid4)
    created_at: str = field(default_factory=_now)
    approval_required: bool = True

    def __post_init__(self) -> None:
        if not self.objective.strip():
            raise ValueError("objective must not be empty")
        if not self.requested_by.strip():
            raise ValueError("requested_by must not be empty")
        if "/" not in self.repository:
            raise ValueError("repository must use owner/name form")


@dataclass(frozen=True)
class Approval:
    task_id: UUID
    principal: str
    decision: str
    reason: str
    decided_at: str = field(default_factory=_now)

    def __post_init__(self) -> None:
        if self.decision not in {"approved", "rejected"}:
            raise ValueError("decision must be approved or rejected")
        if not self.principal.strip() or not self.reason.strip():
            raise ValueError("principal and reason are required")


@dataclass(frozen=True)
class Report:
    task_id: UUID
    agent: str
    status: str
    summary: str
    evidence: tuple[str, ...] = ()
    findings: tuple[dict[str, Any], ...] = ()
    created_at: str = field(default_factory=_now)

    def __post_init__(self) -> None:
        if self.status not in {"complete", "failed", "blocked"}:
            raise ValueError("status must be complete, failed, or blocked")
        if not self.agent.strip() or not self.summary.strip():
            raise ValueError("agent and summary are required")


"""Durable task state and explicit approval transitions."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import StrEnum
from typing import Any
from uuid import uuid4


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class TaskStatus(StrEnum):
    CREATED = "created"
    RUNNING = "running"
    REVIEW_REQUIRED = "review_required"
    APPROVED = "approved"
    COMPLETED = "completed"
    FAILED = "failed"


_TRANSITIONS: dict[TaskStatus, set[TaskStatus]] = {
    TaskStatus.CREATED: {TaskStatus.RUNNING, TaskStatus.FAILED},
    TaskStatus.RUNNING: {TaskStatus.REVIEW_REQUIRED, TaskStatus.FAILED},
    TaskStatus.REVIEW_REQUIRED: {TaskStatus.APPROVED, TaskStatus.FAILED},
    TaskStatus.APPROVED: {TaskStatus.COMPLETED, TaskStatus.FAILED},
    TaskStatus.COMPLETED: set(),
    TaskStatus.FAILED: set(),
}


@dataclass
class Task:
    kind: str
    payload: dict[str, Any] = field(default_factory=dict)
    id: str = field(default_factory=lambda: f"task-{uuid4().hex[:12]}")
    status: TaskStatus = TaskStatus.CREATED
    result: dict[str, Any] | None = None
    approved_by: str | None = None
    completed_by: str | None = None
    history: list[dict[str, str]] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.history:
            self.history.append({"status": self.status.value, "at": utc_now()})

    def transition(self, target: TaskStatus) -> None:
        if target not in _TRANSITIONS[self.status]:
            raise ValueError(f"invalid task transition: {self.status} -> {target}")
        self.status = target
        self.history.append({"status": target.value, "at": utc_now()})

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["status"] = self.status.value
        return data

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Task":
        return cls(
            kind=data["kind"],
            payload=data.get("payload", {}),
            id=data["id"],
            status=TaskStatus(data.get("status", TaskStatus.CREATED)),
            result=data.get("result"),
            approved_by=data.get("approved_by"),
            completed_by=data.get("completed_by"),
            history=data.get("history", []),
        )


"""Durable task state and explicit approval transitions."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import StrEnum
from typing import Any
from uuid import uuid4


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class TaskStatus(StrEnum):
    CREATED = "created"
    QUEUED = "queued"
    RUNNING = "running"
    REVIEW_REQUIRED = "review_required"
    WAITING_FOR_PRINCIPAL = "waiting_for_principal"
    BLOCKED = "blocked"
    APPROVED = "approved"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


_TRANSITIONS: dict[TaskStatus, set[TaskStatus]] = {
    TaskStatus.CREATED: {TaskStatus.QUEUED, TaskStatus.RUNNING, TaskStatus.FAILED, TaskStatus.CANCELLED},
    TaskStatus.QUEUED: {TaskStatus.RUNNING, TaskStatus.BLOCKED, TaskStatus.CANCELLED, TaskStatus.FAILED},
    TaskStatus.RUNNING: {TaskStatus.REVIEW_REQUIRED, TaskStatus.FAILED, TaskStatus.BLOCKED},
    TaskStatus.REVIEW_REQUIRED: {TaskStatus.WAITING_FOR_PRINCIPAL, TaskStatus.APPROVED, TaskStatus.FAILED},
    TaskStatus.WAITING_FOR_PRINCIPAL: {TaskStatus.APPROVED, TaskStatus.BLOCKED, TaskStatus.CANCELLED},
    TaskStatus.BLOCKED: {TaskStatus.QUEUED, TaskStatus.FAILED, TaskStatus.CANCELLED},
    TaskStatus.APPROVED: {TaskStatus.COMPLETED, TaskStatus.FAILED},
    TaskStatus.COMPLETED: set(),
    TaskStatus.FAILED: set(),
    TaskStatus.CANCELLED: set(),
}


@dataclass
class Task:
    kind: str
    payload: dict[str, Any] = field(default_factory=dict)
    dedupe_key: str | None = None
    requested_by: str | None = None
    priority: int = 0
    acceptance_criteria: list[str] = field(default_factory=list)
    revision: int = 0
    id: str = field(default_factory=lambda: f"task-{uuid4().hex[:12]}")
    status: TaskStatus = TaskStatus.CREATED
    result: dict[str, Any] | None = None
    approved_by: str | None = None
    approval_reason: str | None = None
    approved_fingerprint: str | None = None
    completed_by: str | None = None
    history: list[dict[str, str]] = field(default_factory=list)

    def __post_init__(self) -> None:
        if self.dedupe_key is not None and not self.dedupe_key.strip():
            raise ValueError("dedupe_key must not be blank")
        if self.requested_by is not None and (not isinstance(self.requested_by, str) or not self.requested_by.strip()):
            raise ValueError("requested_by must not be blank")
        if not isinstance(self.priority, int) or not 0 <= self.priority <= 100:
            raise ValueError("priority must be an integer from 0 to 100")
        if not isinstance(self.acceptance_criteria, list) or any(
            not isinstance(item, str) or not item.strip() for item in self.acceptance_criteria
        ):
            raise ValueError("acceptance_criteria must contain non-blank strings")
        if not self.history:
            self.history.append({"status": self.status.value, "at": utc_now()})

    def transition(self, target: TaskStatus) -> None:
        if target is TaskStatus.APPROVED:
            raise ValueError("use approve() to record Principal approval")
        if target not in _TRANSITIONS[self.status]:
            raise ValueError(f"invalid task transition: {self.status} -> {target}")
        self.status = target
        self.history.append({"status": target.value, "at": utc_now()})

    def approve(self, approved_by: str, reason: str) -> None:
        """Record an explicit Principal approval and bind it to task content."""
        if not approved_by.strip():
            raise ValueError("approved_by is required")
        if not reason.strip():
            raise ValueError("approval reason is required")
        if TaskStatus.APPROVED not in _TRANSITIONS[self.status]:
            raise ValueError(f"invalid task transition: {self.status} -> {TaskStatus.APPROVED}")
        self.approved_by = approved_by.strip()
        self.approval_reason = reason.strip()
        self.approved_fingerprint = self.content_fingerprint()
        self.status = TaskStatus.APPROVED
        self.history.append({"status": TaskStatus.APPROVED.value, "at": utc_now()})

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["status"] = self.status.value
        return data

    def content_fingerprint(self) -> str:
        """Stable digest of the task content that Principal approval covers."""
        content = {
            "kind": self.kind,
            "payload": self.payload,
            "dedupe_key": self.dedupe_key,
            "requested_by": self.requested_by,
            "priority": self.priority,
            "acceptance_criteria": self.acceptance_criteria,
            "result": self.result,
        }
        encoded = json.dumps(content, sort_keys=True, separators=(",", ":")).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()

    def summary(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "kind": self.kind,
            "dedupe_key": self.dedupe_key,
            "status": self.status.value,
            "history_count": len(self.history),
            "approved_by": self.approved_by,
            "completed_by": self.completed_by,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Task":
        return cls(
            kind=data["kind"],
            payload=data.get("payload", {}),
            dedupe_key=data.get("dedupe_key"),
            requested_by=data.get("requested_by"),
            priority=data.get("priority", 0),
            acceptance_criteria=data.get("acceptance_criteria", []),
            revision=data.get("revision", 0),
            id=data["id"],
            status=TaskStatus(data.get("status", TaskStatus.CREATED)),
            result=data.get("result"),
            approved_by=data.get("approved_by"),
            approval_reason=data.get("approval_reason"),
            approved_fingerprint=data.get("approved_fingerprint"),
            completed_by=data.get("completed_by"),
            history=data.get("history", []),
        )


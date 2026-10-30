"""A small JSON task store suitable for the first local prototype."""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path

from agent_foundation.audit import AuditLog
from .state import Task, TaskStatus


class ConcurrentTaskUpdate(RuntimeError):
    """Raised when a stale task tries to overwrite a newer revision."""


class TaskStore:
    def __init__(self, path: str | Path, audit_log: AuditLog | None = None) -> None:
        self.path = Path(path)
        self.audit_log = audit_log

    def _read(self) -> dict[str, dict]:
        if not self.path.exists():
            return {}
        return json.loads(self.path.read_text(encoding="utf-8"))

    def _write(self, tasks: dict[str, dict]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        fd, temp_name = tempfile.mkstemp(prefix="academy-tasks-", suffix=".json", dir=self.path.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(tasks, handle, indent=2)
                handle.write("\n")
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temp_name, self.path)
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)

    def save(self, task: Task) -> Task:
        tasks = self._read()
        existing = tasks.get(task.id)
        if existing is not None:
            current_revision = int(existing.get("revision", 0))
            if task.revision != current_revision:
                raise ConcurrentTaskUpdate(
                    f"task {task.id} is stale (expected revision {current_revision}, got {task.revision})"
                )
            task.revision = current_revision + 1
        else:
            if task.revision != 0:
                raise ConcurrentTaskUpdate(f"new task {task.id} has invalid revision {task.revision}")
            task.revision = 1
        tasks[task.id] = task.to_dict()
        self._write(tasks)
        if self.audit_log:
            self.audit_log.append(
                {
                    "event": "task_saved",
                    "task_id": task.id,
                    "kind": task.kind,
                    "status": task.status.value,
                    "revision": task.revision,
                }
            )
        return task

    def get(self, task_id: str) -> Task:
        data = self._read().get(task_id)
        if data is None:
            raise KeyError(f"unknown task: {task_id}")
        return Task.from_dict(data)

    def find_by_dedupe_key(self, dedupe_key: str) -> Task | None:
        """Return the existing task for an idempotency key, if present."""
        key = dedupe_key.strip()
        if not key:
            raise ValueError("dedupe_key must not be blank")
        for data in self._read().values():
            if data.get("dedupe_key") == key:
                return Task.from_dict(data)
        return None

    def list(self, status: TaskStatus | None = None) -> list[Task]:
        """Return tasks ordered by their first recorded state transition."""
        tasks = [Task.from_dict(data) for data in self._read().values()]
        if status is not None:
            tasks = [task for task in tasks if task.status is status]
        return sorted(tasks, key=lambda task: task.history[0]["at"] if task.history else "")


"""A small JSON task store suitable for the first local prototype."""

from __future__ import annotations

import json
import os
import tempfile
from threading import RLock
from pathlib import Path

from agent_foundation.audit import AuditLog, redact
from .state import Task, TaskStatus


class ConcurrentTaskUpdate(RuntimeError):
    """Raised when a stale task tries to overwrite a newer revision."""


class SensitiveTaskData(ValueError):
    """Raised when a task contains credential-like data."""


class DuplicateTaskKey(ValueError):
    """Raised when a different task already owns an idempotency key."""


class TaskStoreCorrupt(RuntimeError):
    """Raised when the persisted task store is unreadable or malformed."""


class TaskStore:
    _save_lock = RLock()
    def __init__(self, path: str | Path, audit_log: AuditLog | None = None) -> None:
        self.path = Path(path)
        self.audit_log = audit_log

    def _read(self) -> dict[str, dict]:
        if not self.path.exists():
            return {}
        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            raise TaskStoreCorrupt("task store could not be decoded") from exc
        if not isinstance(data, dict) or any(not isinstance(key, str) or not isinstance(value, dict) for key, value in data.items()):
            raise TaskStoreCorrupt("task store has an invalid structure")
        return data

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

    @staticmethod
    def _decode(data: dict) -> Task:
        try:
            return Task.from_dict(data)
        except (KeyError, TypeError, ValueError) as exc:
            raise TaskStoreCorrupt("task store contains an invalid task record") from exc

    def save(self, task: Task) -> Task:
        with self._save_lock:
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
                if task.dedupe_key and any(
                    data.get("dedupe_key") == task.dedupe_key for data in tasks.values()
                ):
                    raise DuplicateTaskKey(f"dedupe key is already in use: {task.dedupe_key}")
                task.revision = 1
            serialised = task.to_dict()
            if redact(serialised) != serialised:
                raise SensitiveTaskData("task contains secret-like data")
            tasks[task.id] = serialised
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
        return self._decode(data)

    def find_by_dedupe_key(self, dedupe_key: str) -> Task | None:
        """Return the existing task for an idempotency key, if present."""
        key = dedupe_key.strip()
        if not key:
            raise ValueError("dedupe_key must not be blank")
        for data in self._read().values():
            if data.get("dedupe_key") == key:
                return self._decode(data)
        return None

    def list(self, status: TaskStatus | None = None) -> list[Task]:
        """Return tasks ordered by their first recorded state transition."""
        tasks = [self._decode(data) for data in self._read().values()]
        if status is not None:
            tasks = [task for task in tasks if task.status is status]
        return sorted(tasks, key=lambda task: task.history[0]["at"] if task.history else "")


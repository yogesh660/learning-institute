"""A small JSON task store suitable for the first local prototype."""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path

from agent_foundation.audit import AuditLog
from .state import Task


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
        tasks[task.id] = task.to_dict()
        self._write(tasks)
        if self.audit_log:
            self.audit_log.append(
                {
                    "event": "task_saved",
                    "task_id": task.id,
                    "kind": task.kind,
                    "status": task.status.value,
                }
            )
        return task

    def get(self, task_id: str) -> Task:
        data = self._read().get(task_id)
        if data is None:
            raise KeyError(f"unknown task: {task_id}")
        return Task.from_dict(data)


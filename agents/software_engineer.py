"""Software Engineer Agent: source-only change planning."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any


@dataclass(frozen=True)
class ChangePlan:
    task_id: str
    source_paths: tuple[str, ...]
    generated_paths: tuple[str, ...]
    checks: tuple[str, ...]
    production_changes: bool = False

    def to_dict(self) -> dict[str, Any]:
        result = asdict(self)
        result["source_paths"] = list(self.source_paths)
        result["generated_paths"] = list(self.generated_paths)
        result["checks"] = list(self.checks)
        return result


class SoftwareEngineerAgent:
    name = "software_engineer"

    def plan_change(self, task_id: str, source_paths: list[str], checks: list[str]) -> ChangePlan:
        if not task_id.strip() or not source_paths:
            raise ValueError("task_id and source_paths are required")
        if any(path.startswith("/" ) or ".." in path.split("/") for path in source_paths):
            raise ValueError("source paths must remain within the repository")
        return ChangePlan(task_id, tuple(source_paths), (), tuple(checks))

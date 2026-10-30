"""Repository-aware workflows with no provider or GitHub side effects."""

from __future__ import annotations

import json
from pathlib import Path

from .state import Task, TaskStatus


class CurriculumReviewWorkflow:
    """Load existing audit evidence and pause for Principal approval."""

    kind = "curriculum-review"

    def run(self, task: Task, repo_root: str | Path) -> Task:
        if task.kind != self.kind:
            raise ValueError(f"unsupported workflow kind: {task.kind}")
        root = Path(repo_root)
        task.transition(TaskStatus.RUNNING)
        report_path = root / "reports" / "phase-2-curriculum-audit.json"
        if not report_path.exists():
            task.transition(TaskStatus.FAILED)
            task.result = {"error": f"missing audit evidence: {report_path}"}
            return task
        evidence = json.loads(report_path.read_text(encoding="utf-8"))
        totals = evidence.get("totals", {})
        task.result = {
            "evidence_file": str(report_path),
            "summary": {
                "lessons": totals.get("sourceLessons"),
                "planned": totals.get("planned"),
                "status": evidence.get("checks", {}).get("structuralStatus"),
            },
            "side_effects": [],
            "approval_required": True,
        }
        task.transition(TaskStatus.REVIEW_REQUIRED)
        return task


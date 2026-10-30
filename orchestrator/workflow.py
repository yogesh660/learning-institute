"""Repository-aware workflows with no provider or GitHub side effects."""

from __future__ import annotations

import json
import hashlib
from pathlib import Path

from agents.curriculum_designer import CurriculumDesignerAgent
from agents.analytics import AcademicAnalyticsAgent
from agents.qa import QAEngineerAgent
from agents.teacher import TeacherAgent
from .state import Task, TaskStatus


class CurriculumReviewWorkflow:
    """Load existing audit evidence and pause for Principal approval."""

    kind = "curriculum-review"

    @staticmethod
    def _sha256(path: Path) -> str:
        return hashlib.sha256(path.read_bytes()).hexdigest()

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
        teacher_review = TeacherAgent().review_report(report_path).to_dict()
        curriculum_proposal = CurriculumDesignerAgent().propose_from_report(report_path).to_dict()
        qa_path = root / "reports" / "phase-3-qa-report.json"
        qa_result = QAEngineerAgent().inspect_report(qa_path).to_dict() if qa_path.exists() else None
        analytics = AcademicAnalyticsAgent().aggregate(report_path, qa_path).to_dict() if qa_path.exists() else None
        task.result = {
            "evidence_file": str(report_path),
            "evidence_sha256": {"curriculum": self._sha256(report_path)},
            "summary": {
                "lessons": totals.get("sourceLessons"),
                "planned": totals.get("planned"),
                "status": evidence.get("checks", {}).get("structuralStatus"),
            },
            "side_effects": [],
            "approval_required": True,
            "teacher_review": teacher_review,
            "curriculum_proposal": curriculum_proposal,
            "qa_result": qa_result,
            "analytics": analytics,
        }
        if qa_path.exists():
            task.result["evidence_sha256"]["qa"] = self._sha256(qa_path)
        task.transition(TaskStatus.REVIEW_REQUIRED)
        return task


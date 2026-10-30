"""Examiner Agent: creates objective assessment drafts without grading records."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any


@dataclass(frozen=True)
class AssessmentDraft:
    lesson_id: str
    questions: tuple[dict[str, Any], ...]
    rubric: tuple[str, ...]
    persisted_student_data: bool = False

    def to_dict(self) -> dict[str, Any]:
        result = asdict(self)
        result["questions"] = list(self.questions)
        result["rubric"] = list(self.rubric)
        return result


class ExaminerAgent:
    name = "examiner"

    def draft(self, lesson_id: str, objectives: list[str]) -> AssessmentDraft:
        if not lesson_id.strip() or not objectives:
            raise ValueError("lesson_id and objectives are required")
        questions = tuple(
            {"type": "short-answer", "objective": objective, "human_review_required": True}
            for objective in objectives
        )
        return AssessmentDraft(lesson_id, questions, ("Correctness", "Reasoning", "Evidence"))

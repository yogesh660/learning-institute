"""Academic Analytics Agent: aggregate repository evidence only."""

from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class AnalyticsSnapshot:
    curriculum_lessons: int
    planned_lessons: int
    curriculum_status: str
    qa_status: str
    student_data_read: bool = False
    personal_data_read: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class AcademicAnalyticsAgent:
    name = "academic_analytics"

    def aggregate(self, curriculum_report: str | Path, qa_report: str | Path) -> AnalyticsSnapshot:
        curriculum = json.loads(Path(curriculum_report).read_text(encoding="utf-8"))
        qa = json.loads(Path(qa_report).read_text(encoding="utf-8"))
        totals = curriculum.get("totals", {})
        checks = curriculum.get("checks", {})
        return AnalyticsSnapshot(
            curriculum_lessons=totals.get("sourceLessons", 0),
            planned_lessons=totals.get("planned", 0),
            curriculum_status=checks.get("structuralStatus", "unknown"),
            qa_status=qa.get("status", "unknown"),
        )

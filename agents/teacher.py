"""Teacher Agent: deterministic first-pass lesson quality review."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class TeacherReview:
    source_report: str
    status: str
    lessons_reviewed: int
    candidates: tuple[dict[str, Any], ...]
    recommendations: tuple[str, ...]
    production_changes: bool = False

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["candidates"] = list(self.candidates)
        data["recommendations"] = list(self.recommendations)
        return data


class TeacherAgent:
    """Review existing audit evidence; never writes curriculum source files."""

    name = "teacher"

    def review_report(self, report_path: str | Path) -> TeacherReview:
        path = Path(report_path)
        evidence = json.loads(path.read_text(encoding="utf-8"))
        totals = evidence.get("totals", {})
        summary = evidence.get("summary", {})
        checks = evidence.get("checks", {})
        candidates = tuple(checks.get("teacherReviewCandidates", ()))
        recommendations: list[str] = []
        if candidates:
            recommendations.append("Review flagged lessons for clarity, objectives, and complete examples.")
        if totals.get("planned", 0):
            recommendations.append("Prioritise planned lessons only after prerequisite and learning-objective review.")
        if checks.get("structuralStatus") != "pass":
            recommendations.append("Resolve curriculum structural errors before adding new content.")
        return TeacherReview(
            source_report=str(path),
            status=checks.get("structuralStatus", "unknown"),
            lessons_reviewed=totals.get("sourceLessons", summary.get("lessons", 0)),
            candidates=candidates,
            recommendations=tuple(recommendations),
        )

"""Academic Analytics Agent: aggregate repository evidence only."""

from __future__ import annotations

import json
import os
import tempfile
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Any

from security.student_data import validate_student_event


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


@dataclass(frozen=True)
class StudentAnalyticsSummary:
    """Aggregated event counts with small-cohort suppression."""

    total_events: int
    unique_students: int
    suppressed: bool
    by_event_type: dict[str, int]
    by_lesson: dict[str, int]
    recommendations: tuple[str, ...] = ()
    completion_rates: dict[str, float] = field(default_factory=dict)

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

    def aggregate_student_events(
        self, events: list[dict[str, Any]], *, minimum_cohort: int = 5
    ) -> StudentAnalyticsSummary:
        """Aggregate validated pseudonymous events without exposing subjects."""
        if minimum_cohort <= 0:
            raise ValueError("minimum_cohort must be positive")
        for event in events:
            validate_student_event(event)
        unique_students = len({event["student_subject"] for event in events})
        if unique_students < minimum_cohort:
            return StudentAnalyticsSummary(len(events), unique_students, True, {}, {}, completion_rates={})
        by_event_type: dict[str, int] = {}
        by_lesson: dict[str, int] = {}
        started: dict[str, int] = {}
        completed: dict[str, int] = {}
        for event in events:
            by_event_type[event["event_type"]] = by_event_type.get(event["event_type"], 0) + 1
            by_lesson[event["lesson_id"]] = by_lesson.get(event["lesson_id"], 0) + 1
            if event["event_type"] == "lesson_started":
                started[event["lesson_id"]] = started.get(event["lesson_id"], 0) + 1
            elif event["event_type"] == "lesson_completed":
                completed[event["lesson_id"]] = completed.get(event["lesson_id"], 0) + 1
        recommendations = tuple(
            f"Review cohort completion for lesson: {lesson}"
            for lesson in sorted(started)
            if started[lesson] > completed.get(lesson, 0)
        )
        completion_rates = {
            lesson: round(min(completed.get(lesson, 0) / count, 1.0), 4)
            for lesson, count in sorted(started.items())
        }
        return StudentAnalyticsSummary(
            len(events), unique_students, False, by_event_type, by_lesson, recommendations, completion_rates
        )

    def write_snapshot(self, output_path: str | Path, curriculum_report: str | Path, qa_report: str | Path) -> AnalyticsSnapshot:
        snapshot = self.aggregate(curriculum_report, qa_report)
        target = Path(output_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(prefix="analytics-snapshot-", suffix=".json", dir=target.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(snapshot.to_dict(), handle, indent=2)
                handle.write("\n")
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, target)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)
        return snapshot

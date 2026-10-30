"""Deterministic task classification and least-privilege agent routing."""

from __future__ import annotations


class UnknownTaskKind(ValueError):
    """Raised when no governed workflow is registered for a task kind."""


class TaskRouter:
    """Select a fixed, reviewable agent sequence for supported task kinds."""

    _ROUTES: dict[str, tuple[str, ...]] = {
        "curriculum-review": ("teacher", "curriculum_designer", "qa_engineer", "academic_analytics"),
        "lesson-change": ("teacher", "curriculum_designer", "software_engineer", "qa_engineer", "academic_reviewer"),
        "assessment-review": ("examiner", "academic_reviewer"),
        "student-support": ("student_support",),
        "academic-analytics": ("academic_analytics",),
    }

    def agents_for(self, kind: str) -> tuple[str, ...]:
        if not isinstance(kind, str) or not kind.strip():
            raise UnknownTaskKind("task kind must not be blank")
        try:
            return self._ROUTES[kind.strip()]
        except KeyError as exc:
            raise UnknownTaskKind(f"unsupported task kind: {kind}") from exc


"""Student Support Agent: stateless, lesson-context-only assistance."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any


@dataclass(frozen=True)
class SupportResponse:
    lesson_id: str
    answer: str
    related_lessons: tuple[str, ...]
    escalation: str | None = None
    stored_student_data: bool = False

    def to_dict(self) -> dict[str, Any]:
        result = asdict(self)
        result["related_lessons"] = list(self.related_lessons)
        return result


class StudentSupportAgent:
    name = "student_support"

    def respond(self, lesson_id: str, lesson_context: str, question: str, related_lessons: list[str] | None = None) -> SupportResponse:
        if not lesson_id.strip() or not lesson_context.strip() or not question.strip():
            raise ValueError("lesson_id, lesson_context, and question are required")
        return SupportResponse(
            lesson_id=lesson_id,
            answer="This stateless prototype can answer only from the supplied lesson context.",
            related_lessons=tuple(related_lessons or ()),
            escalation="teacher" if "grade" in question.lower() else None,
        )

"""Offline lifecycle helpers for synthetic or pseudonymous learning events.

These helpers intentionally operate on caller-supplied collections only. They
are not a student database and do not write files or infer identity.
"""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from re import fullmatch
from uuid import UUID
from typing import Any

from .retention import RetentionPolicy


_EVENT_TYPES = {"lesson_started", "lesson_completed", "quiz_submitted", "lab_opened"}
_LESSON_ID = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
_SUBJECT = r"^anon_[A-Za-z0-9_-]{8,64}$"
_FIELDS = {"event_id", "student_subject", "event_type", "lesson_id", "occurred_at"}


class StudentEventViolation(ValueError):
    """Raised when an event is not safe for the pseudonymous lifecycle API."""


def validate_student_event(event: dict[str, Any]) -> None:
    if not isinstance(event, dict) or set(event) != _FIELDS:
        raise StudentEventViolation("event fields do not match the safe event contract")
    try:
        UUID(event["event_id"])
    except (ValueError, TypeError, AttributeError) as exc:
        raise StudentEventViolation("event_id must be a UUID") from exc
    if not isinstance(event["student_subject"], str) or not fullmatch(_SUBJECT, event["student_subject"]):
        raise StudentEventViolation("student_subject must be pseudonymous")
    if event["event_type"] not in _EVENT_TYPES:
        raise StudentEventViolation("unsupported event_type")
    if not isinstance(event["lesson_id"], str) or not fullmatch(_LESSON_ID, event["lesson_id"]):
        raise StudentEventViolation("lesson_id is invalid")
    try:
        datetime.fromisoformat(event["occurred_at"].replace("Z", "+00:00"))
    except (AttributeError, TypeError, ValueError) as exc:
        raise StudentEventViolation("occurred_at must be ISO-8601") from exc


def export_events(events: list[dict[str, Any]], student_subject: str) -> list[dict[str, Any]]:
    """Return a validated, detached export for one pseudonymous subject."""
    if not isinstance(student_subject, str) or not fullmatch(_SUBJECT, student_subject):
        raise StudentEventViolation("student_subject must be pseudonymous")
    for event in events:
        validate_student_event(event)
    return deepcopy([event for event in events if event["student_subject"] == student_subject])


def delete_events(events: list[dict[str, Any]], student_subject: str) -> tuple[list[dict[str, Any]], int]:
    """Return a detached collection with one pseudonymous subject removed."""
    exported = export_events(events, student_subject)
    remaining = [event for event in events if event["student_subject"] != student_subject]
    return deepcopy(remaining), len(exported)


def purge_expired_events(
    events: list[dict[str, Any]], policy: RetentionPolicy, *, now: datetime | None = None
) -> tuple[list[dict[str, Any]], int]:
    """Remove only events whose occurred timestamp exceeds event retention."""
    current = now or datetime.now(timezone.utc)
    for event in events:
        validate_student_event(event)
    retained: list[dict[str, Any]] = []
    deleted = 0
    for event in events:
        occurred = datetime.fromisoformat(event["occurred_at"].replace("Z", "+00:00"))
        if policy.deletion_due(occurred, kind="student_event", now=current):
            deleted += 1
        else:
            retained.append(deepcopy(event))
    return retained, deleted

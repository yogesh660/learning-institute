"""Privacy-safe validation for pseudonymous learning events."""

from __future__ import annotations

import re
from typing import Any


class PrivacyViolation(ValueError):
    """Raised when an event contains disallowed personal data."""


_FORBIDDEN_KEYS = {
    "name", "full_name", "email", "phone", "address", "date_of_birth",
    "student_name", "student_email", "ip_address", "password", "token",
    "free_text", "raw_answer",
}
_ALLOWED_KEYS = {"student_key", "event_type", "lesson_id", "timestamp", "metadata"}
_PSEUDONYM = re.compile(r"^anon_[A-Za-z0-9_-]{8,64}$")


def validate_learning_event(event: dict[str, Any]) -> None:
    """Fail closed on direct identifiers and unknown top-level fields."""
    unknown = set(event) - _ALLOWED_KEYS
    if unknown:
        raise PrivacyViolation(f"unsupported event fields: {sorted(unknown)}")
    student_key = event.get("student_key")
    if not isinstance(student_key, str) or not _PSEUDONYM.fullmatch(student_key):
        raise PrivacyViolation("student_key must be a pseudonymous anon_ identifier")
    for key in _FORBIDDEN_KEYS:
        if _contains_key(event, key):
            raise PrivacyViolation(f"personal-data field is not allowed: {key}")
    if not isinstance(event.get("event_type"), str) or not event["event_type"].strip():
        raise PrivacyViolation("event_type is required")
    if not isinstance(event.get("lesson_id"), str) or not event["lesson_id"].strip():
        raise PrivacyViolation("lesson_id is required")


def _contains_key(value: Any, target: str) -> bool:
    if isinstance(value, dict):
        for key, item in value.items():
            if not isinstance(key, str):
                raise PrivacyViolation("event object keys must be strings")
            if key.lower() == target or _contains_key(item, target):
                return True
        return False
    if isinstance(value, list):
        return any(_contains_key(item, target) for item in value)
    return False

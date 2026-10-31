"""Fail-closed feedback protocol for agent improvement.

This is a governance loop, not autonomous model training: feedback can improve
review playbooks only through an audited, human-approved change.
"""

from __future__ import annotations

from collections.abc import Mapping

REQUIRED_FEEDBACK_FIELDS = (
    "task_id",
    "agent",
    "signal",
    "evidence_ref",
    "lesson",
    "corrective_action",
    "review_required",
)
ALLOWED_SIGNALS = frozenset({"accepted", "rejected", "needs_revision", "regression"})


def validate_feedback_event(event: Mapping[str, object]) -> list[str]:
    """Validate one bounded feedback event before it enters the learning log."""
    errors = [field for field in REQUIRED_FEEDBACK_FIELDS if field not in event]
    if event.get("signal") not in ALLOWED_SIGNALS:
        errors.append("signal must be an allowed outcome")
    for field in ("task_id", "agent", "evidence_ref", "lesson", "corrective_action"):
        if field in event and (not isinstance(event[field], str) or not event[field].strip()):
            errors.append(f"{field} must be a non-empty string")
    if event.get("review_required") is not True:
        errors.append("review_required must be true")
    return errors

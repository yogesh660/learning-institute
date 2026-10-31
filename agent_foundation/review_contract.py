"""Validation contract for curriculum review evidence.

The public lesson source is reviewed in ml-model-zoo, while this repository
stores the control-plane rules that make that review reproducible.
"""

from __future__ import annotations

from collections.abc import Mapping

REQUIRED_EVIDENCE_FIELDS = (
    "source_repository",
    "source_revision",
    "comparison_target",
    "section_matrix",
    "architecture_review",
    "code_review",
    "research_sources",
    "qa_status",
    "human_review_required",
)
REQUIRED_SECTIONS = (
    "metadata",
    "idea",
    "steps",
    "architecture",
    "walkthrough",
    "lab",
    "maths",
    "tuning",
    "use_and_limitations",
    "code",
    "results",
    "quiz",
    "related_links",
)


def validate_curriculum_evidence(evidence: Mapping[str, object]) -> list[str]:
    """Return actionable errors; an empty list means the contract is valid."""
    errors = [field for field in REQUIRED_EVIDENCE_FIELDS if field not in evidence]
    matrix = evidence.get("section_matrix")
    if not isinstance(matrix, Mapping):
        errors.append("section_matrix must be an object")
    else:
        errors.extend(f"section_matrix missing {section}" for section in REQUIRED_SECTIONS if section not in matrix)
    if evidence.get("human_review_required") is not True:
        errors.append("human_review_required must be true")
    if evidence.get("qa_status") not in {"pass", "pending_human_review"}:
        errors.append("qa_status must be pass or pending_human_review")
    return errors

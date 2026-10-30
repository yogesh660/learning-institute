"""Academic Reviewer Agent: evidence and claim-quality checks."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any
from urllib.parse import urlparse


@dataclass(frozen=True)
class AcademicClaim:
    claim: str
    evidence_url: str
    review_note: str

    def validate(self) -> None:
        parsed = urlparse(self.evidence_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("academic evidence must use an absolute HTTP(S) URL")
        if not self.claim.strip() or not self.review_note.strip():
            raise ValueError("claim and review_note are required")


class AcademicReviewerAgent:
    name = "academic_reviewer"

    def review(self, claims: list[AcademicClaim]) -> dict[str, Any]:
        for claim in claims:
            claim.validate()
        return {
            "status": "pass",
            "claims_reviewed": len(claims),
            "claims": [asdict(claim) for claim in claims],
            "human_review_required": True,
            "production_changes": False,
        }

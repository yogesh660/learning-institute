"""Researcher Agent boundary for source-grounded reports."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Any
from urllib.parse import urlparse


@dataclass(frozen=True)
class ResearchFinding:
    claim: str
    source_url: str
    source_date: str
    relevance: str

    def validate(self) -> None:
        parsed = urlparse(self.source_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("source_url must be an absolute HTTP(S) URL")
        try:
            date.fromisoformat(self.source_date)
        except ValueError as exc:
            raise ValueError("source_date must be YYYY-MM-DD") from exc
        if not self.claim.strip() or not self.relevance.strip():
            raise ValueError("claim and relevance are required")


class ResearcherAgent:
    name = "researcher"

    def validate_report(self, findings: list[ResearchFinding]) -> dict[str, Any]:
        for finding in findings:
            finding.validate()
        return {
            "status": "pass",
            "finding_count": len(findings),
            "findings": [finding.__dict__ for finding in findings],
            "publication_required": True,
            "production_changes": False,
        }

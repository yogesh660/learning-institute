"""Researcher Agent boundary for source-grounded reports."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
import json
import os
import tempfile
from pathlib import Path
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

    def write_report(self, path: str | Path, findings: list[ResearchFinding]) -> dict[str, Any]:
        report = self.validate_report(findings)
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(prefix="research-report-", suffix=".json", dir=target.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(report, handle, indent=2)
                handle.write("\n")
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, target)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)
        return report

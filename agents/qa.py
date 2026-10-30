"""QA Engineer Agent: read-only validation of generated-output evidence."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class QAResult:
    source_report: str
    status: str
    expected_pages: int
    planned_pages: int
    failures: tuple[str, ...]
    production_changes: bool = False

    def to_dict(self) -> dict[str, Any]:
        result = asdict(self)
        result["failures"] = list(self.failures)
        return result


class QAEngineerAgent:
    name = "qa_engineer"

    def inspect_report(self, report_path: str | Path) -> QAResult:
        path = Path(report_path)
        evidence = json.loads(path.read_text(encoding="utf-8"))
        failures: list[str] = []
        for key in ("missingPages", "brokenLinks", "staleSourceLinks"):
            failures.extend(str(item) for item in evidence.get(key, []))
        status = evidence.get("status", "fail" if failures else "unknown")
        return QAResult(
            source_report=str(path),
            status=status,
            expected_pages=evidence.get("expectedPages", 0),
            planned_pages=evidence.get("plannedPages", 0),
            failures=tuple(failures),
        )

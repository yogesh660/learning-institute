"""QA Engineer Agent: read-only validation of generated-output evidence."""

from __future__ import annotations

import json
import os
import tempfile
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

    def write_result(self, output_path: str | Path, report_path: str | Path) -> QAResult:
        result = self.inspect_report(report_path)
        target = Path(output_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(prefix="qa-result-", suffix=".json", dir=target.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(result.to_dict(), handle, indent=2)
                handle.write("\n")
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, target)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)
        return result

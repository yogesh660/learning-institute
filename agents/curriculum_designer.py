"""Curriculum Designer Agent: proposal-only curriculum planning."""

from __future__ import annotations

import json
import os
import tempfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class CurriculumProposal:
    source_report: str
    planned_lessons: tuple[dict[str, Any], ...]
    priorities: tuple[str, ...]
    production_changes: bool = False

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["planned_lessons"] = list(self.planned_lessons)
        data["priorities"] = list(self.priorities)
        return data


class CurriculumDesignerAgent:
    name = "curriculum_designer"

    def propose_from_report(self, report_path: str | Path) -> CurriculumProposal:
        path = Path(report_path)
        evidence = json.loads(path.read_text(encoding="utf-8"))
        planned: list[dict[str, Any]] = []
        for curriculum_path in evidence.get("paths", []):
            for module in curriculum_path.get("modules", []):
                for lesson in module.get("plannedLessons", []):
                    planned.append(
                        {
                            "path": curriculum_path.get("id"),
                            "module": module.get("title"),
                            "title": lesson.get("title"),
                            "tier": lesson.get("tier"),
                        }
                    )
        priorities = ("Validate prerequisites before authoring planned lessons.",)
        if evidence.get("checks", {}).get("teacherReviewCandidates"):
            priorities += ("Resolve teacher-review candidates before expanding the curriculum.",)
        return CurriculumProposal(str(path), tuple(planned), priorities)

    def write_proposal(self, output_path: str | Path, report_path: str | Path) -> CurriculumProposal:
        proposal = self.propose_from_report(report_path)
        target = Path(output_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(prefix="curriculum-proposal-", suffix=".json", dir=target.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(proposal.to_dict(), handle, indent=2)
                handle.write("\n")
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, target)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)
        return proposal

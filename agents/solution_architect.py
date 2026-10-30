"""Solution Architect Agent: architecture gap analysis."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any


@dataclass(frozen=True)
class ArchitectureReview:
    present: tuple[str, ...]
    gaps: tuple[str, ...]
    human_decisions_required: tuple[str, ...]
    production_changes: bool = False

    def to_dict(self) -> dict[str, Any]:
        result = asdict(self)
        result["present"] = list(self.present)
        result["gaps"] = list(self.gaps)
        result["human_decisions_required"] = list(self.human_decisions_required)
        return result


class SolutionArchitectAgent:
    name = "solution_architect"

    def review(self, components: set[str]) -> ArchitectureReview:
        expected = {
            "task_state",
            "permissions",
            "audit_log",
            "provider_boundary",
            "github_readonly",
            "github_proposals",
            "agent_registry",
        }
        present = tuple(sorted(components & expected))
        gaps = tuple(sorted(expected - components))
        decisions = (
            "Choose an approved AI provider and retention policy before enabling provider calls.",
            "Choose backend authentication and student-data storage before accepting student records.",
        )
        return ArchitectureReview(present, gaps, decisions)

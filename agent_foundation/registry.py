"""Agent role registry backed by the least-privilege policy definitions."""

from __future__ import annotations

from dataclasses import dataclass

from .permissions import Action, AgentPolicy, PermissionManager, default_policies


@dataclass(frozen=True)
class AgentSpec:
    name: str
    purpose: str
    policy: AgentPolicy


class AgentRegistry:
    def __init__(self, policies: dict[str, AgentPolicy] | None = None) -> None:
        self._policies = policies or default_policies()
        self._permissions = PermissionManager(self._policies)
        purposes = {
            "teacher": "review lesson clarity and completeness",
            "researcher": "produce evidence-backed research reports",
            "curriculum_designer": "maintain paths, modules, and prerequisites",
            "software_engineer": "prepare reviewed website and content changes",
            "qa_engineer": "validate generated output and engineering evidence",
            "academic_reviewer": "independently verify academic claims and sources",
            "examiner": "draft objective assessments and rubrics",
            "student_support": "provide lesson-context-only learner guidance",
            "academic_analytics": "aggregate curriculum and QA evidence without student data",
            "solution_architect": "review architecture and identify governed implementation gaps",
            "principal": "approve important production decisions",
        }
        self._purposes = purposes

    def get(self, name: str) -> AgentSpec:
        policy = self._policies.get(name)
        if policy is None:
            raise KeyError(f"unknown agent: {name}")
        return AgentSpec(name, self._purposes.get(name, "unclassified agent"), policy)

    def require(self, name: str, action: Action) -> None:
        self._permissions.require(name, action)

    def names(self) -> tuple[str, ...]:
        return tuple(sorted(self._policies))

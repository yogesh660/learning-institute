"""Least-privilege policy checks for agent actions."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class Action(StrEnum):
    READ_PUBLIC_REPO = "read_public_repo"
    WRITE_BRANCH = "write_branch"
    CREATE_PULL_REQUEST = "create_pull_request"
    MERGE_PULL_REQUEST = "merge_pull_request"
    CALL_PROVIDER = "call_provider"
    READ_STUDENT_DATA = "read_student_data"


class PermissionDenied(RuntimeError):
    """Raised when an agent requests an action outside its policy."""


@dataclass(frozen=True)
class AgentPolicy:
    name: str
    actions: frozenset[Action]

    def allows(self, action: Action) -> bool:
        return action in self.actions


class PermissionManager:
    def __init__(self, policies: dict[str, AgentPolicy]) -> None:
        self._policies = policies

    def require(self, agent: str, action: Action) -> None:
        policy = self._policies.get(agent)
        if policy is None or not policy.allows(action):
            raise PermissionDenied(f"{agent} is not allowed to {action.value}")


def default_policies() -> dict[str, AgentPolicy]:
    """Return safe prototype policies; production credentials are separate."""
    read_only = frozenset({Action.READ_PUBLIC_REPO, Action.CALL_PROVIDER})
    return {
        "teacher": AgentPolicy("teacher", read_only),
        "researcher": AgentPolicy("researcher", read_only),
        "curriculum_designer": AgentPolicy("curriculum_designer", frozenset({Action.READ_PUBLIC_REPO})),
        "software_engineer": AgentPolicy(
            "software_engineer",
            frozenset({Action.READ_PUBLIC_REPO, Action.WRITE_BRANCH, Action.CREATE_PULL_REQUEST}),
        ),
        "principal": AgentPolicy("principal", frozenset({Action.READ_PUBLIC_REPO, Action.MERGE_PULL_REQUEST})),
    }

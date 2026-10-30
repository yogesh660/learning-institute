"""Fail-closed authorization primitives for a future authenticated backend."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class Role(StrEnum):
    STUDENT = "student"
    PRINCIPAL = "principal"
    AGENT = "agent"


class AuthorizationDenied(PermissionError):
    """Raised when an identity lacks an explicit capability."""


@dataclass(frozen=True)
class Identity:
    subject: str
    role: Role


class Authorizer:
    def __init__(self, permissions: dict[Role, frozenset[str]]) -> None:
        self._permissions = permissions

    def require(self, identity: Identity | None, capability: str) -> None:
        if (
            not isinstance(identity, Identity)
            or not isinstance(identity.subject, str)
            or not identity.subject.strip()
            or not isinstance(identity.role, Role)
            or not isinstance(capability, str)
            or capability not in self._permissions.get(identity.role, frozenset())
        ):
            raise AuthorizationDenied(f"identity is not allowed to {capability}")


def default_authorizer() -> Authorizer:
    return Authorizer(
        {
            Role.STUDENT: frozenset({"read_public_lessons", "submit_assessment"}),
            Role.PRINCIPAL: frozenset({"read_public_lessons", "approve_production", "read_audit"}),
            Role.AGENT: frozenset({"read_public_lessons", "prepare_proposal"}),
        }
    )

"""Environment-backed credential aliases with fail-closed access."""

from __future__ import annotations

import os
import re

from .audit import AuditLog


class CredentialUnavailable(RuntimeError):
    """Raised when an approved credential alias is not available."""


class CredentialManager:
    """Resolve allowlisted secret aliases without persisting credential values."""

    _ENV_NAME = re.compile(r"^[A-Z][A-Z0-9_]{1,127}$")

    def __init__(
        self,
        aliases: dict[str, str],
        environ: dict[str, str] | None = None,
        audit_log: AuditLog | None = None,
    ) -> None:
        if not isinstance(aliases, dict) or any(
            not isinstance(alias, str) or not alias.strip() or not isinstance(env_name, str) or not self._ENV_NAME.fullmatch(env_name)
            for alias, env_name in aliases.items()
        ):
            raise ValueError("credential aliases must map names to uppercase environment variables")
        self._aliases = dict(aliases)
        self._environ = os.environ if environ is None else environ
        self._audit_log = audit_log

    def available(self, alias: str) -> bool:
        env_name = self._aliases.get(alias)
        return env_name is not None and bool(self._environ.get(env_name))

    def resolve(self, alias: str) -> str:
        env_name = self._aliases.get(alias)
        if env_name is None:
            raise CredentialUnavailable("credential alias is not approved")
        value = self._environ.get(env_name)
        if not value:
            raise CredentialUnavailable("approved credential is unavailable")
        return value

    def aliases(self) -> tuple[str, ...]:
        return tuple(sorted(self._aliases))

    def rotate(self, alias: str, env_name: str) -> None:
        """Point an existing alias at a new environment variable for rotation."""
        if alias not in self._aliases:
            raise CredentialUnavailable("credential alias is not approved")
        if not isinstance(env_name, str) or not self._ENV_NAME.fullmatch(env_name):
            raise ValueError("credential environment variable name is invalid")
        previous = self._aliases[alias]
        self._aliases[alias] = env_name
        if self._audit_log:
            self._audit_log.append(
                {
                    "event": "credential_rotated",
                    "alias": alias,
                    "previous_env": previous,
                    "new_env": env_name,
                }
            )

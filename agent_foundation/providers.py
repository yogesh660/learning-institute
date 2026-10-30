"""Provider-neutral AI boundary for the operations control plane."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from .budgets import BudgetLedger
from .audit import AuditLog
from .permissions import Action, PermissionManager


class ProviderUnavailable(RuntimeError):
    """Raised when no approved provider adapter is configured."""


@dataclass(frozen=True)
class ProviderResponse:
    provider: str
    model: str
    text: str


class Provider(Protocol):
    name: str
    model: str

    def complete(self, prompt: str) -> ProviderResponse: ...


class DisabledProvider:
    """Safe default: prevents accidental network or credential use."""

    name = "disabled"
    model = "none"

    def complete(self, prompt: str) -> ProviderResponse:
        raise ProviderUnavailable("no AI provider is enabled")


class ProviderRouter:
    """Resolve an explicitly configured provider route; never fall back silently."""

    def __init__(self, providers: dict[str, Provider], routes: dict[str, str]) -> None:
        self.providers = providers
        self.routes = routes

    def for_task(self, task_kind: str) -> Provider:
        provider_name = self.routes.get(task_kind)
        if provider_name is None or provider_name not in self.providers:
            raise ProviderUnavailable(f"no approved provider route for {task_kind}")
        return self.providers[provider_name]


class BudgetedProvider:
    """Reserve usage before delegating to an explicitly configured adapter."""

    def __init__(
        self,
        provider: Provider,
        ledger: BudgetLedger,
        agent: str,
        permissions: PermissionManager,
        usd_per_call: float = 0.0,
        max_prompt_chars: int = 100_000,
        audit_log: AuditLog | None = None,
    ) -> None:
        self.provider = provider
        self.ledger = ledger
        self.agent = agent
        self.permissions = permissions
        self.usd_per_call = usd_per_call
        self.max_prompt_chars = max_prompt_chars
        self.audit_log = audit_log

    def complete(self, prompt: str) -> ProviderResponse:
        if not prompt.strip():
            raise ValueError("prompt must not be empty")
        if len(prompt) > self.max_prompt_chars:
            raise ValueError("prompt exceeds configured character limit")
        self.permissions.require(self.agent, Action.CALL_PROVIDER)
        self.ledger.reserve(self.agent, usd=self.usd_per_call, calls=1)
        try:
            response = self.provider.complete(prompt)
        except Exception as exc:
            if self.audit_log:
                self.audit_log.append(
                    {
                        "event": "provider_call",
                        "agent": self.agent,
                        "provider": self.provider.name,
                        "model": self.provider.model,
                        "prompt_chars": len(prompt),
                        "status": "failed",
                        "error_type": type(exc).__name__,
                    }
                )
            raise
        if self.audit_log:
            self.audit_log.append(
                {
                    "event": "provider_call",
                    "agent": self.agent,
                    "provider": self.provider.name,
                    "model": self.provider.model,
                    "prompt_chars": len(prompt),
                    "status": "completed",
                }
            )
        return response

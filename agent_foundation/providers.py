"""Provider-neutral AI boundary for the operations control plane."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from .budgets import BudgetLedger
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


class BudgetedProvider:
    """Reserve usage before delegating to an explicitly configured adapter."""

    def __init__(
        self,
        provider: Provider,
        ledger: BudgetLedger,
        agent: str,
        permissions: PermissionManager,
        usd_per_call: float = 0.0,
    ) -> None:
        self.provider = provider
        self.ledger = ledger
        self.agent = agent
        self.permissions = permissions
        self.usd_per_call = usd_per_call

    def complete(self, prompt: str) -> ProviderResponse:
        self.permissions.require(self.agent, Action.CALL_PROVIDER)
        self.ledger.reserve(self.agent, usd=self.usd_per_call, calls=1)
        return self.provider.complete(prompt)

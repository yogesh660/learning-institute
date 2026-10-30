"""Deterministic, side-effect-free Academy backend health report."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any

from agent_foundation.config import AcademyConfig
from agent_foundation.providers import DisabledProvider
from agent_foundation.registry import AgentRegistry


@dataclass(frozen=True)
class HealthReport:
    status: str
    source_repository: str
    operations_repository: str
    registered_agents: tuple[str, ...]
    provider: str
    external_calls_enabled: bool

    def to_dict(self) -> dict[str, Any]:
        result = asdict(self)
        result["registered_agents"] = list(self.registered_agents)
        return result


def collect_health(config: AcademyConfig | None = None, registry: AgentRegistry | None = None) -> HealthReport:
    config = config or AcademyConfig()
    registry = registry or AgentRegistry()
    provider = DisabledProvider()
    return HealthReport(
        status="ready-for-reviewed-workflows",
        source_repository=config.source_repository,
        operations_repository=config.operations_repository,
        registered_agents=registry.names(),
        provider=provider.name,
        external_calls_enabled=False,
    )

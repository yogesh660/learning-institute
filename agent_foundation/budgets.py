"""In-memory quota and budget accounting with fail-closed reservations."""

from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from typing import Callable


class BudgetExceeded(RuntimeError):
    """Raised when a reservation would exceed a configured limit."""


@dataclass(frozen=True)
class Budget:
    daily_usd: float
    monthly_usd: float
    daily_calls: int
    monthly_calls: int


class BudgetLedger:
    """Track usage by agent; persistence belongs to the operations layer."""

    def __init__(self, budgets: dict[str, Budget], clock: Callable[[], datetime] | None = None) -> None:
        self._budgets = budgets
        self._usage: dict[tuple[str, str, str], float | int] = {}
        self._clock = clock or (lambda: datetime.now(timezone.utc))
        self._lock = Lock()

    def reserve(self, agent: str, *, usd: float, calls: int = 1) -> None:
        if usd < 0 or calls < 0:
            raise ValueError("usage must be non-negative")
        with self._lock:
            budget = self._budgets[agent]
            day_usd = self._get(agent, "daily_usd") + usd
            month_usd = self._get(agent, "monthly_usd") + usd
            day_calls = self._get(agent, "daily_calls") + calls
            month_calls = self._get(agent, "monthly_calls") + calls
            if day_usd > budget.daily_usd or month_usd > budget.monthly_usd:
                raise BudgetExceeded(f"{agent}: monetary budget exceeded")
            if day_calls > budget.daily_calls or month_calls > budget.monthly_calls:
                raise BudgetExceeded(f"{agent}: call budget exceeded")
            self._set(agent, "daily_usd", day_usd)
            self._set(agent, "monthly_usd", month_usd)
            self._set(agent, "daily_calls", day_calls)
            self._set(agent, "monthly_calls", month_calls)

    def remaining(self, agent: str) -> dict[str, float | int]:
        budget = self._budgets[agent]
        return {
            "daily_usd": budget.daily_usd - self._get(agent, "daily_usd"),
            "monthly_usd": budget.monthly_usd - self._get(agent, "monthly_usd"),
            "daily_calls": budget.daily_calls - self._get(agent, "daily_calls"),
            "monthly_calls": budget.monthly_calls - self._get(agent, "monthly_calls"),
        }

    def _get(self, agent: str, metric: str) -> float | int:
        now = self._clock()
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)
        period = now.strftime("%Y-%m-%d") if metric.startswith("daily") else now.strftime("%Y-%m")
        return self._usage.get((agent, period, metric), 0)

    def _set(self, agent: str, metric: str, value: float | int) -> None:
        now = self._clock()
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)
        period = now.strftime("%Y-%m-%d") if metric.startswith("daily") else now.strftime("%Y-%m")
        self._usage[(agent, period, metric)] = value


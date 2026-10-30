"""In-memory quota and budget accounting with fail-closed reservations."""

from dataclasses import dataclass
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import tempfile
from threading import RLock
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
        self._lock = RLock()

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

    def snapshot(self) -> dict[str, dict[str, dict[str, float | int]]]:
        """Return limits and remaining capacity without exposing raw prompts."""
        return {
            agent: {
                "limits": {
                    "daily_usd": budget.daily_usd,
                    "monthly_usd": budget.monthly_usd,
                    "daily_calls": budget.daily_calls,
                    "monthly_calls": budget.monthly_calls,
                },
                "remaining": self.remaining(agent),
            }
            for agent, budget in sorted(self._budgets.items())
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


class PersistentBudgetLedger(BudgetLedger):
    """Atomically persist budget reservations to a local JSON file."""

    def __init__(self, budgets: dict[str, Budget], path: str | Path, clock: Callable[[], datetime] | None = None) -> None:
        super().__init__(budgets, clock=clock)
        self.path = Path(path)
        if self.path.exists():
            raw = json.loads(self.path.read_text(encoding="utf-8"))
            self._usage = {
                tuple(key.split("\u001f")): value for key, value in raw.items()
            }

    def reserve(self, agent: str, *, usd: float, calls: int = 1) -> None:
        with self._lock:
            before = dict(self._usage)
            try:
                super().reserve(agent, usd=usd, calls=calls)
                self._persist_usage()
            except Exception:
                self._usage = before
                raise

    def _persist_usage(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        serialised = {"\u001f".join(key): value for key, value in self._usage.items()}
        fd, temp_name = tempfile.mkstemp(prefix="academy-budget-", suffix=".json", dir=self.path.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(serialised, handle, indent=2)
                handle.write("\n")
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temp_name, self.path)
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)


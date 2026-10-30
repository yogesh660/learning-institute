"""Small fail-closed rate limiter for future authenticated endpoints.

This is intentionally an in-memory primitive for the prototype. Production
deployment must use a shared, durable counter (or gateway) before running
multiple backend workers.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from collections.abc import Callable


class RateLimitExceeded(PermissionError):
    """Raised when a caller has exhausted its configured request window."""

    def __init__(self, retry_after: float) -> None:
        self.retry_after = max(0.0, retry_after)
        super().__init__("request rate limit exceeded")


class InMemoryRateLimiter:
    """Thread-safe fixed-window limiter keyed by a pseudonymous caller key."""

    def __init__(
        self,
        max_requests: int,
        window_seconds: float,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if max_requests <= 0:
            raise ValueError("max_requests must be positive")
        if window_seconds <= 0:
            raise ValueError("window_seconds must be positive")
        self.max_requests = max_requests
        self.window_seconds = float(window_seconds)
        self._clock = clock
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, caller_key: str) -> None:
        """Consume one request or raise without revealing caller data."""
        if not isinstance(caller_key, str) or not caller_key.strip():
            raise ValueError("caller_key must not be blank")
        now = self._clock()
        with self._lock:
            events = self._events[caller_key]
            cutoff = now - self.window_seconds
            while events and events[0] <= cutoff:
                events.popleft()
            if len(events) >= self.max_requests:
                raise RateLimitExceeded(events[0] + self.window_seconds - now)
            events.append(now)

    def reset(self, caller_key: str) -> None:
        """Forget a caller's counters; intended for tests or controlled logout."""
        if not isinstance(caller_key, str) or not caller_key.strip():
            raise ValueError("caller_key must not be blank")
        with self._lock:
            self._events.pop(caller_key, None)

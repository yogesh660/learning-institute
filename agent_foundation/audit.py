"""Append-only JSONL audit logging with basic secret redaction."""

import json
from pathlib import Path
from typing import Any


_SECRET_KEYS = {"token", "api_key", "apikey", "password", "secret", "authorization"}


def _redact(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: "[REDACTED]" if k.lower() in _SECRET_KEYS else _redact(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_redact(v) for v in value]
    return value


class AuditLog:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)

    def append(self, event: dict[str, Any]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(_redact(event), sort_keys=True) + "\n")


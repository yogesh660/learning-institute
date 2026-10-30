"""Append-only JSONL audit logging with basic secret redaction."""

import json
import hashlib
import re
from pathlib import Path
from threading import Lock
from typing import Any


_SECRET_KEYS = {"token", "api_key", "apikey", "password", "secret", "authorization"}
_SECRET_VALUES = (
    re.compile(r"ghp_[A-Za-z0-9_]{20,}"),
    re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),
    re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"AIza[0-9A-Za-z_-]{30,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
)


def redact(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: "[REDACTED]" if k.lower() in _SECRET_KEYS else redact(v) for k, v in value.items()}
    if isinstance(value, list):
        return [redact(v) for v in value]
    if isinstance(value, str):
        for pattern in _SECRET_VALUES:
            value = pattern.sub("[REDACTED]", value)
        return value
    return value


class AuditLog:
    _GENESIS = "0" * 64

    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self._lock = Lock()

    def append(self, event: dict[str, Any]) -> None:
        with self._lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            previous = self._last_hash()
            record = redact(event)
            record.pop("_prev_hash", None)
            record.pop("_hash", None)
            record["_prev_hash"] = previous
            record["_hash"] = self._digest(record)
            with self.path.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(record, sort_keys=True) + "\n")

    def verify(self) -> bool:
        """Verify the hash chain; return false for malformed or altered records."""
        if not self.path.exists():
            return True
        previous = self._GENESIS
        try:
            lines = self.path.read_text(encoding="utf-8").splitlines()
            for line in lines:
                record = json.loads(line)
                if "_hash" not in record or "_prev_hash" not in record:
                    # Preserve compatibility with legacy entries and anchor the
                    # first chained entry to their exact serialized bytes.
                    previous = hashlib.sha256(line.encode("utf-8")).hexdigest()
                    continue
                if record["_prev_hash"] != previous or record["_hash"] != self._digest(record):
                    return False
                previous = record["_hash"]
        except (OSError, UnicodeError, json.JSONDecodeError, TypeError, ValueError):
            return False
        return True

    def _last_hash(self) -> str:
        if not self.path.exists():
            return self._GENESIS
        lines = self.path.read_text(encoding="utf-8").splitlines()
        if not lines:
            return self._GENESIS
        last_line = lines[-1]
        try:
            record = json.loads(last_line)
            if isinstance(record, dict) and isinstance(record.get("_hash"), str):
                return record["_hash"]
        except (OSError, UnicodeError, json.JSONDecodeError):
            pass
        return hashlib.sha256(last_line.encode("utf-8")).hexdigest()

    @staticmethod
    def _digest(record: dict[str, Any]) -> str:
        unsigned = {key: value for key, value in record.items() if key != "_hash"}
        encoded = json.dumps(unsigned, sort_keys=True, separators=(",", ":")).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()


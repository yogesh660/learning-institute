"""Small fail-closed scanner for common committed secret patterns."""

from __future__ import annotations

import re
from pathlib import Path


PATTERNS = (
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"(?:ghp|github_pat)_[A-Za-z0-9_]{20,}"),
    re.compile(r"AIza[0-9A-Za-z_-]{30,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"(?:sk|rk)-live-[A-Za-z0-9_-]{16,}"),
)
EXCLUDED = {".git", "node_modules", "__pycache__", ".pytest_cache"}


def scan(root: str | Path) -> list[str]:
    root = Path(root)
    findings: list[str] = []
    for path in root.rglob("*"):
        if not path.is_file() or any(part in EXCLUDED for part in path.parts):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for number, line in enumerate(text.splitlines(), start=1):
            if any(pattern.search(line) for pattern in PATTERNS):
                findings.append(f"{path.relative_to(root)}:{number}")
    return findings

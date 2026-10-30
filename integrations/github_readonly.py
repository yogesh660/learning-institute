"""Minimal read-only GitHub Contents API client.

The client intentionally exposes no mutation methods. It is suitable for
reading the public ``ml-model-zoo`` source repository before an agent proposes
changes through a separately reviewed workflow.
"""

from __future__ import annotations

import base64
import json
import os
from collections.abc import Callable
from urllib.parse import quote
from urllib.request import Request, urlopen


class GitHubReadError(RuntimeError):
    """Raised when a repository read cannot be completed safely."""


Transport = Callable[[str, dict[str, str]], tuple[int, bytes]]


def _default_transport(url: str, headers: dict[str, str]) -> tuple[int, bytes]:
    request = Request(url, headers=headers, method="GET")
    with urlopen(request, timeout=20) as response:  # noqa: S310 - fixed HTTPS API host
        return response.status, response.read()


class GitHubReadOnlyClient:
    def __init__(
        self,
        repository: str = "yogesh660/ml-model-zoo",
        *,
        token_env: str = "GITHUB_TOKEN",
        transport: Transport = _default_transport,
    ) -> None:
        if repository.count("/") != 1 or any(part == "" for part in repository.split("/")):
            raise ValueError("repository must be owner/name")
        self.repository = repository
        self.token_env = token_env
        self._transport = transport

    def read_file(self, path: str, ref: str = "main") -> str:
        clean_path = path.strip("/")
        if not clean_path or ".." in clean_path.split("/"):
            raise ValueError("path must remain inside the repository")
        url = (
            f"https://api.github.com/repos/{self.repository}/contents/"
            f"{quote(clean_path, safe='/')}?ref={quote(ref, safe='')}"
        )
        headers = {"Accept": "application/vnd.github+json", "User-Agent": "learning-institute"}
        token = os.getenv(self.token_env)
        if token:
            headers["Authorization"] = f"Bearer {token}"
        status, body = self._transport(url, headers)
        if status != 200:
            raise GitHubReadError(f"GitHub read failed with status {status}")
        try:
            payload = json.loads(body)
            if payload.get("type") != "file":
                raise GitHubReadError("GitHub path is not a file")
            return base64.b64decode(payload["content"], validate=False).decode("utf-8")
        except (KeyError, ValueError, UnicodeDecodeError) as exc:
            raise GitHubReadError("invalid GitHub file response") from exc

    def list_path(self, path: str = "", ref: str = "main") -> list[dict[str, str]]:
        """List a repository directory, returning only safe metadata."""
        clean_path = path.strip("/")
        if ".." in clean_path.split("/"):
            raise ValueError("path must remain inside the repository")
        suffix = f"contents/{quote(clean_path, safe='/')}" if clean_path else "contents"
        url = f"https://api.github.com/repos/{self.repository}/{suffix}?ref={quote(ref, safe='')}"
        headers = {"Accept": "application/vnd.github+json", "User-Agent": "learning-institute"}
        token = os.getenv(self.token_env)
        if token:
            headers["Authorization"] = f"Bearer {token}"
        status, body = self._transport(url, headers)
        if status != 200:
            raise GitHubReadError(f"GitHub directory read failed with status {status}")
        try:
            entries = json.loads(body)
            if not isinstance(entries, list):
                raise GitHubReadError("GitHub path is not a directory")
            return [
                {"name": entry["name"], "path": entry["path"], "type": entry["type"]}
                for entry in entries
            ]
        except (KeyError, ValueError, TypeError) as exc:
            raise GitHubReadError("invalid GitHub directory response") from exc

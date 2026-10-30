"""Permission-checked GitHub pull-request proposal adapter.

This adapter can open a PR from an already-created branch. It never merges,
pushes arbitrary files, or exposes credentials in returned data.
"""

from __future__ import annotations

import json
import os
from collections.abc import Callable
from urllib.parse import quote
from urllib.request import Request, urlopen

from agent_foundation.permissions import Action, PermissionManager
from agent_foundation.audit import AuditLog
from orchestrator.state import Task, TaskStatus


class GitHubProposalError(RuntimeError):
    """Raised when GitHub rejects a proposal request."""


class ApprovalRequired(GitHubProposalError):
    """Raised when a proposal task has not received Principal approval."""


Transport = Callable[[str, str, dict[str, str], bytes], tuple[int, bytes]]


def _default_transport(method: str, url: str, headers: dict[str, str], body: bytes) -> tuple[int, bytes]:
    request = Request(url, data=body, headers=headers, method=method)
    with urlopen(request, timeout=20) as response:  # noqa: S310 - fixed HTTPS API host
        return response.status, response.read()


class GitHubProposalClient:
    def __init__(
        self,
        repository: str = "yogesh660/ml-model-zoo",
        *,
        token_env: str = "GITHUB_TOKEN",
        permissions: PermissionManager,
        audit_log: AuditLog | None = None,
        transport: Transport = _default_transport,
    ) -> None:
        if repository.count("/") != 1:
            raise ValueError("repository must be owner/name")
        self.repository = repository
        self.token_env = token_env
        self.permissions = permissions
        self.audit_log = audit_log
        self._transport = transport

    def create_pull_request(
        self,
        agent: str,
        *,
        task: Task,
        title: str,
        body: str,
        head: str,
        base: str = "main",
    ) -> dict:
        self.permissions.require(agent, Action.CREATE_PULL_REQUEST)
        if task.status is not TaskStatus.APPROVED:
            raise ApprovalRequired(f"task {task.id} is not approved")
        if not title.strip() or not head.strip() or not base.strip():
            raise ValueError("title, head, and base are required")
        payload = json.dumps({"title": title, "body": body, "head": head, "base": base}).encode("utf-8")
        headers = {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "learning-institute",
        }
        token = os.getenv(self.token_env)
        if not token:
            raise GitHubProposalError("missing GitHub credential")
        headers["Authorization"] = f"Bearer {token}"
        url = f"https://api.github.com/repos/{quote(self.repository, safe='/')}/pulls"
        status, response_body = self._transport("POST", url, headers, payload)
        if status not in {201}:
            raise GitHubProposalError(f"GitHub pull-request proposal failed with status {status}")
        try:
            response = json.loads(response_body)
            result = {"number": response["number"], "url": response["html_url"], "head": head, "base": base}
            if self.audit_log:
                self.audit_log.append(
                    {
                        "event": "github_pull_request_proposed",
                        "agent": agent,
                        "task_id": task.id,
                        "repository": self.repository,
                        "pull_request": result["number"],
                    }
                )
            return result
        except (KeyError, ValueError, TypeError) as exc:
            raise GitHubProposalError("invalid GitHub pull-request response") from exc

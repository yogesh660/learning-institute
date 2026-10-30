"""Permission-checked GitHub pull-request proposal adapter.

This adapter can open a PR from an already-created branch. It never merges,
pushes arbitrary files, or exposes credentials in returned data.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from urllib.parse import quote
from urllib.request import Request, urlopen

from agent_foundation.permissions import Action, PermissionDenied, PermissionManager
from agent_foundation.audit import AuditLog
from agent_foundation.credentials import CredentialManager, CredentialUnavailable
from orchestrator.state import Task, TaskStatus


class GitHubProposalError(RuntimeError):
    """Raised when GitHub rejects a proposal request."""


class ApprovalRequired(GitHubProposalError):
    """Raised when a proposal task has not received Principal approval."""


class BranchProtectionRequired(GitHubProposalError):
    """Raised until repository protection and required checks are verified."""


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
        branch_policy_verified: bool = False,
        branch_policy_check: Callable[[], bool] | None = None,
        credentials: CredentialManager | None = None,
    ) -> None:
        if repository.count("/") != 1:
            raise ValueError("repository must be owner/name")
        self.repository = repository
        self.token_env = token_env
        self.permissions = permissions
        self.audit_log = audit_log
        self._transport = transport
        self.branch_policy_verified = branch_policy_verified
        self.branch_policy_check = branch_policy_check
        self.credentials = credentials or CredentialManager({token_env: token_env})

    def _audit_failure(self, agent: str, task: Task, reason: str, **details: object) -> None:
        if self.audit_log:
            self.audit_log.append(
                {
                    "event": "github_pull_request_proposal",
                    "status": "failed",
                    "reason": reason,
                    "agent": agent,
                    "task_id": task.id,
                    "repository": self.repository,
                    **details,
                }
            )

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
        try:
            self.permissions.require(agent, Action.CREATE_PULL_REQUEST)
        except PermissionDenied:
            self._audit_failure(agent, task, "permission_denied")
            raise
        if self.branch_policy_check is not None:
            try:
                policy_verified = self.branch_policy_check()
            except Exception as exc:
                self._audit_failure(agent, task, "branch_policy_check_error", error_type=type(exc).__name__)
                raise BranchProtectionRequired("branch policy verification failed") from exc
        else:
            policy_verified = self.branch_policy_verified
        if not policy_verified:
            self._audit_failure(agent, task, "branch_policy_unverified")
            raise BranchProtectionRequired("branch protection and required checks must be verified")
        if task.status is not TaskStatus.APPROVED:
            raise ApprovalRequired(f"task {task.id} is not approved")
        if not task.approved_by or not task.approval_reason or not task.approved_fingerprint:
            raise ApprovalRequired(f"task {task.id} has incomplete approval evidence")
        if task.approved_fingerprint != task.content_fingerprint():
            raise ApprovalRequired(f"task {task.id} approval no longer matches its content")
        if not title.strip() or not head.strip() or not base.strip():
            raise ValueError("title, head, and base are required")
        payload = json.dumps({"title": title, "body": body, "head": head, "base": base}).encode("utf-8")
        headers = {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "learning-institute",
        }
        try:
            token = self.credentials.resolve(self.token_env)
        except CredentialUnavailable:
            self._audit_failure(agent, task, "missing_credential")
            raise GitHubProposalError("missing GitHub credential")
        headers["Authorization"] = f"Bearer {token}"
        url = f"https://api.github.com/repos/{quote(self.repository, safe='/')}/pulls"
        try:
            status, response_body = self._transport("POST", url, headers, payload)
        except Exception as exc:
            self._audit_failure(agent, task, "transport_error", error_type=type(exc).__name__)
            raise
        if status not in {201}:
            self._audit_failure(agent, task, "github_rejected", http_status=status)
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
            self._audit_failure(agent, task, "invalid_response", error_type=type(exc).__name__)
            raise GitHubProposalError("invalid GitHub pull-request response") from exc

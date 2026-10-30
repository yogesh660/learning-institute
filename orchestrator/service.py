"""Authenticated service facade for Academy task workflows."""

from __future__ import annotations

from pathlib import Path

from security.auth import Authorizer, Identity, default_authorizer
from security.rate_limit import InMemoryRateLimiter
from security.auth import AuthorizationDenied
from agent_foundation.audit import AuditLog

from .state import Task, TaskStatus
from .store import DuplicateTaskKey, TaskStore
from .workflow import CurriculumReviewWorkflow


class AcademyService:
    def __init__(
        self,
        store: TaskStore,
        authorizer: Authorizer | None = None,
        rate_limiter: InMemoryRateLimiter | None = None,
        audit_log: AuditLog | None = None,
    ) -> None:
        self.store = store
        self.authorizer = authorizer or default_authorizer()
        self.rate_limiter = rate_limiter
        self.audit_log = audit_log or store.audit_log

    def _require(self, identity: Identity, capability: str) -> None:
        try:
            self.authorizer.require(identity, capability)
        except AuthorizationDenied:
            if self.audit_log:
                self.audit_log.append(
                    {
                        "event": "authorization_denied",
                        "subject": getattr(identity, "subject", None),
                        "role": getattr(getattr(identity, "role", None), "value", None),
                        "capability": capability,
                    }
                )
            raise
        if self.rate_limiter is not None:
            self.rate_limiter.check(identity.subject)

    def create_curriculum_review(self, identity: Identity, dedupe_key: str | None = None) -> Task:
        self._require(identity, "prepare_proposal")
        if dedupe_key is not None:
            dedupe_key = dedupe_key.strip()
            existing = self.store.find_by_dedupe_key(dedupe_key)
            if existing is not None:
                return existing
        task = Task(kind=CurriculumReviewWorkflow.kind, dedupe_key=dedupe_key)
        try:
            return self.store.save(task)
        except DuplicateTaskKey:
            if dedupe_key is not None:
                existing = self.store.find_by_dedupe_key(dedupe_key)
                if existing is not None:
                    return existing
            raise

    def run_curriculum_review(self, identity: Identity, task_id: str, repo_root: str | Path) -> Task:
        self._require(identity, "prepare_proposal")
        task = self.store.get(task_id)
        result = CurriculumReviewWorkflow().run(task, repo_root)
        return self.store.save(result)

    def approve(self, identity: Identity, task_id: str, reason: str) -> Task:
        self._require(identity, "approve_production")
        if not reason.strip():
            raise ValueError("approval reason is required")
        task = self.store.get(task_id)
        task.approve(identity.subject, reason)
        return self.store.save(task)

    def complete(self, identity: Identity, task_id: str) -> Task:
        self._require(identity, "approve_production")
        task = self.store.get(task_id)
        if task.approved_fingerprint != task.content_fingerprint():
            raise ValueError("task content changed after Principal approval")
        task.transition(TaskStatus.COMPLETED)
        task.completed_by = identity.subject
        return self.store.save(task)

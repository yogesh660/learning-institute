"""Authenticated service facade for Academy task workflows."""

from __future__ import annotations

from pathlib import Path

from security.auth import Authorizer, Identity, default_authorizer

from .state import Task, TaskStatus
from .store import TaskStore
from .workflow import CurriculumReviewWorkflow


class AcademyService:
    def __init__(self, store: TaskStore, authorizer: Authorizer | None = None) -> None:
        self.store = store
        self.authorizer = authorizer or default_authorizer()

    def create_curriculum_review(self, identity: Identity) -> Task:
        self.authorizer.require(identity, "prepare_proposal")
        return self.store.save(Task(kind=CurriculumReviewWorkflow.kind))

    def run_curriculum_review(self, identity: Identity, task_id: str, repo_root: str | Path) -> Task:
        self.authorizer.require(identity, "prepare_proposal")
        task = self.store.get(task_id)
        result = CurriculumReviewWorkflow().run(task, repo_root)
        return self.store.save(result)

    def approve(self, identity: Identity, task_id: str) -> Task:
        self.authorizer.require(identity, "approve_production")
        task = self.store.get(task_id)
        task.transition(TaskStatus.APPROVED)
        task.approved_by = identity.subject
        return self.store.save(task)

    def complete(self, identity: Identity, task_id: str) -> Task:
        self.authorizer.require(identity, "approve_production")
        task = self.store.get(task_id)
        task.transition(TaskStatus.COMPLETED)
        task.completed_by = identity.subject
        return self.store.save(task)

import tempfile
import unittest
from pathlib import Path

from orchestrator.service import AcademyService
from orchestrator.state import TaskStatus
from orchestrator.store import TaskStore
from security.auth import AuthorizationDenied, Identity, Role
from security.rate_limit import InMemoryRateLimiter, RateLimitExceeded


class ServiceTests(unittest.TestCase):
    def test_agent_can_prepare_but_only_principal_can_approve(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AcademyService(TaskStore(Path(directory) / "tasks.json"))
            agent = Identity("teacher-1", Role.AGENT)
            principal = Identity("principal-1", Role.PRINCIPAL)
            task = service.create_curriculum_review(agent)
            with self.assertRaises(AuthorizationDenied):
                service.approve(agent, task.id, "not allowed")
            task.transition(TaskStatus.RUNNING)
            task.transition(TaskStatus.REVIEW_REQUIRED)
            service.store.save(task)
            with self.assertRaises(ValueError):
                service.approve(principal, task.id, "")
            approved = service.approve(principal, task.id, "Reviewed evidence and approved the scoped proposal.")
            self.assertEqual(approved.status.value, "approved")
            self.assertEqual(approved.approved_by, "principal-1")
            self.assertEqual(approved.approval_reason, "Reviewed evidence and approved the scoped proposal.")
            completed = service.complete(principal, task.id)
            self.assertEqual(completed.completed_by, "principal-1")

    def test_anonymous_cannot_create_task(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AcademyService(TaskStore(Path(directory) / "tasks.json"))
            with self.assertRaises(AuthorizationDenied):
                service.create_curriculum_review(None)

    def test_create_is_idempotent_for_dedupe_key(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AcademyService(TaskStore(Path(directory) / "tasks.json"))
            agent = Identity("agent-1", Role.AGENT)
            first = service.create_curriculum_review(agent, "ci-run-123")
            second = service.create_curriculum_review(agent, "ci-run-123")
            self.assertEqual(first.id, second.id)
            self.assertEqual(len(service.store.list()), 1)

    def test_dedupe_key_is_normalized_before_persistence(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AcademyService(TaskStore(Path(directory) / "tasks.json"))
            agent = Identity("agent-1", Role.AGENT)
            first = service.create_curriculum_review(agent, "  ci-run-123  ")
            second = service.create_curriculum_review(agent, "ci-run-123")
            self.assertEqual(first.id, second.id)
            self.assertEqual(first.dedupe_key, "ci-run-123")

    def test_blank_dedupe_key_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AcademyService(TaskStore(Path(directory) / "tasks.json"))
            with self.assertRaises(ValueError):
                service.create_curriculum_review(Identity("agent-1", Role.AGENT), " ")

    def test_service_can_enforce_rate_limit_after_authorization(self):
        with tempfile.TemporaryDirectory() as directory:
            limiter = InMemoryRateLimiter(1, 60)
            service = AcademyService(TaskStore(Path(directory) / "tasks.json"), rate_limiter=limiter)
            agent = Identity("agent-1", Role.AGENT)
            service.create_curriculum_review(agent)
            with self.assertRaises(RateLimitExceeded):
                service.create_curriculum_review(agent)

    def test_unauthorized_identity_is_rejected_before_rate_limit(self):
        with tempfile.TemporaryDirectory() as directory:
            limiter = InMemoryRateLimiter(1, 60)
            service = AcademyService(TaskStore(Path(directory) / "tasks.json"), rate_limiter=limiter)
            with self.assertRaises(AuthorizationDenied):
                service.create_curriculum_review(Identity("student-1", Role.STUDENT))

    def test_completion_rejects_content_changed_after_approval(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AcademyService(TaskStore(Path(directory) / "tasks.json"))
            agent = Identity("agent-1", Role.AGENT)
            principal = Identity("principal-1", Role.PRINCIPAL)
            task = service.create_curriculum_review(agent)
            task.transition(TaskStatus.RUNNING)
            task.transition(TaskStatus.REVIEW_REQUIRED)
            service.store.save(task)
            approved = service.approve(principal, task.id, "Approved the reviewed evidence.")
            approved.payload["tampered"] = True
            service.store.save(approved)
            with self.assertRaises(ValueError):
                service.complete(principal, task.id)


if __name__ == "__main__":
    unittest.main()

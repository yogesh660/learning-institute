import tempfile
import unittest
from pathlib import Path

from orchestrator.service import AcademyService
from orchestrator.store import TaskStore
from security.auth import AuthorizationDenied, Identity, Role


class ServiceTests(unittest.TestCase):
    def test_agent_can_prepare_but_only_principal_can_approve(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AcademyService(TaskStore(Path(directory) / "tasks.json"))
            agent = Identity("teacher-1", Role.AGENT)
            principal = Identity("principal-1", Role.PRINCIPAL)
            task = service.create_curriculum_review(agent)
            with self.assertRaises(AuthorizationDenied):
                service.approve(agent, task.id)
            approved = service.approve(principal, task.id)
            self.assertEqual(approved.status.value, "approved")

    def test_anonymous_cannot_create_task(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AcademyService(TaskStore(Path(directory) / "tasks.json"))
            with self.assertRaises(AuthorizationDenied):
                service.create_curriculum_review(None)


if __name__ == "__main__":
    unittest.main()

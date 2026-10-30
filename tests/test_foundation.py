import json
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4

from agent_foundation.audit import AuditLog
from agent_foundation.config import AcademyConfig
from agent_foundation.budgets import Budget, BudgetExceeded, BudgetLedger
from agent_foundation.permissions import Action, PermissionDenied, PermissionManager, default_policies
from agent_foundation.providers import DisabledProvider, ProviderUnavailable
from agent_foundation.registry import AgentRegistry
from agent_foundation.schemas import Approval, Report, Task


class FoundationTests(unittest.TestCase):
    def test_task_and_approval_validation(self):
        task = Task("Review curriculum", "principal")
        approval = Approval(task.task_id, "principal", "approved", "Phase 1")
        report = Report(task.task_id, "teacher", "complete", "Reviewed", ("README.md",))
        self.assertEqual(approval.task_id, report.task_id)
        with self.assertRaises(ValueError):
            Task("", "principal")

    def test_repository_roles_are_distinct(self):
        config = AcademyConfig()
        self.assertEqual(config.source_repository, "yogesh660/ml-model-zoo")
        self.assertEqual(config.operations_repository, "yogesh660/learning-institute")

    def test_budget_fails_closed(self):
        ledger = BudgetLedger({"teacher": Budget(1.0, 5.0, 2, 10)})
        ledger.reserve("teacher", usd=0.5)
        self.assertEqual(ledger.remaining("teacher")["daily_calls"], 1)
        with self.assertRaises(BudgetExceeded):
            ledger.reserve("teacher", usd=0.6, calls=2)

    def test_audit_redacts_secrets(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "audit.jsonl"
            AuditLog(path).append({"event": "test", "api_key": "do-not-write"})
            record = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(record["api_key"], "[REDACTED]")

    def test_permissions_fail_closed(self):
        manager = PermissionManager(default_policies())
        manager.require("software_engineer", Action.CREATE_PULL_REQUEST)
        with self.assertRaises(PermissionDenied):
            manager.require("software_engineer", Action.MERGE_PULL_REQUEST)
        with self.assertRaises(PermissionDenied):
            manager.require("unknown-agent", Action.READ_PUBLIC_REPO)

    def test_provider_boundary_fails_closed(self):
        with self.assertRaises(ProviderUnavailable):
            DisabledProvider().complete("test prompt")

    def test_agent_registry_exposes_policy(self):
        registry = AgentRegistry()
        self.assertIn("teacher", registry.names())
        self.assertEqual(registry.get("teacher").purpose, "review lesson clarity and completeness")


if __name__ == "__main__":
    unittest.main()


import json
import tempfile
import unittest
from datetime import datetime, timezone
from threading import Thread
from pathlib import Path
from uuid import uuid4

from agent_foundation.audit import AuditLog
from agent_foundation.config import AcademyConfig
from agent_foundation.budgets import Budget, BudgetExceeded, BudgetLedger, PersistentBudgetLedger
from agent_foundation.permissions import Action, PermissionDenied, PermissionManager, default_policies
from agent_foundation.providers import BudgetedProvider, DisabledProvider, ProviderRouter, ProviderUnavailable
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
        with self.assertRaises(ValueError):
            AcademyConfig(github_repository="same/repo", source_repository="same/repo")

    def test_budget_fails_closed(self):
        ledger = BudgetLedger({"teacher": Budget(1.0, 5.0, 2, 10)})
        ledger.reserve("teacher", usd=0.5)
        self.assertEqual(ledger.remaining("teacher")["daily_calls"], 1)
        with self.assertRaises(BudgetExceeded):
            ledger.reserve("teacher", usd=0.6, calls=2)

    def test_budget_periods_reset(self):
        current = [datetime(2026, 1, 31, tzinfo=timezone.utc)]
        ledger = BudgetLedger({"teacher": Budget(1.0, 2.0, 2, 4)}, clock=lambda: current[0])
        ledger.reserve("teacher", usd=1.0, calls=2)
        current[0] = datetime(2026, 2, 1, tzinfo=timezone.utc)
        self.assertEqual(ledger.remaining("teacher")["daily_calls"], 2)
        self.assertEqual(ledger.remaining("teacher")["monthly_calls"], 4)

    def test_budget_ledger_round_trips_persisted_usage(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "budgets.json"
            budgets = {"teacher": Budget(1.0, 2.0, 2, 4)}
            PersistentBudgetLedger(budgets, path).reserve("teacher", usd=0.5, calls=1)
            restored = PersistentBudgetLedger(budgets, path)
            self.assertEqual(restored.remaining("teacher")["daily_calls"], 1)
            self.assertEqual(restored.remaining("teacher")["monthly_usd"], 1.5)

    def test_audit_redacts_secrets(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "audit.jsonl"
            AuditLog(path).append({"event": "test", "api_key": "do-not-write"})
            record = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(record["api_key"], "[REDACTED]")

    def test_audit_serializes_concurrent_appends(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "audit.jsonl"
            audit = AuditLog(path)
            threads = [Thread(target=audit.append, args=({"event": "parallel", "index": i},)) for i in range(20)]
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()
            records = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]
            self.assertEqual(len(records), 20)

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

    def test_provider_requires_agent_permission(self):
        class FakeProvider:
            name = "fake"
            model = "test"

            def complete(self, prompt):
                return None

        ledger = BudgetLedger({"curriculum_designer": Budget(1.0, 2.0, 2, 4)})
        with self.assertRaises(PermissionDenied):
            BudgetedProvider(FakeProvider(), ledger, "curriculum_designer", PermissionManager(default_policies())).complete("x")

    def test_provider_router_requires_explicit_route(self):
        fake = object()
        router = ProviderRouter({"test": fake}, {"curriculum-review": "test"})
        self.assertIs(router.for_task("curriculum-review"), fake)
        with self.assertRaises(ProviderUnavailable):
            router.for_task("unknown-task")

    def test_allowed_provider_call_consumes_budget(self):
        class FakeProvider:
            name = "fake"
            model = "test"

            def complete(self, prompt):
                return "ok"

        ledger = BudgetLedger({"teacher": Budget(1.0, 2.0, 2, 4)})
        result = BudgetedProvider(FakeProvider(), ledger, "teacher", PermissionManager(default_policies()), usd_per_call=0.25).complete("x")
        self.assertEqual(result, "ok")
        self.assertEqual(ledger.remaining("teacher")["daily_calls"], 1)
        self.assertEqual(ledger.remaining("teacher")["daily_usd"], 0.75)
        with self.assertRaises(ValueError):
            BudgetedProvider(FakeProvider(), ledger, "teacher", PermissionManager(default_policies())).complete(" ")

    def test_agent_registry_exposes_policy(self):
        registry = AgentRegistry()
        self.assertIn("teacher", registry.names())
        self.assertEqual(registry.get("teacher").purpose, "review lesson clarity and completeness")


if __name__ == "__main__":
    unittest.main()


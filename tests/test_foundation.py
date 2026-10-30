import json
import tempfile
import unittest
from datetime import datetime, timezone
from threading import Thread
from pathlib import Path
from uuid import uuid4

from agent_foundation.audit import AuditLog
from agent_foundation.config import AcademyConfig
from agent_foundation.credentials import CredentialManager, CredentialUnavailable
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

    def test_credentials_are_allowlisted_and_environment_backed(self):
        manager = CredentialManager({"primary": "TEST_PROVIDER_KEY"}, {"TEST_PROVIDER_KEY": "secret-value"})
        self.assertEqual(manager.aliases(), ("primary",))
        self.assertTrue(manager.available("primary"))
        self.assertEqual(manager.resolve("primary"), "secret-value")
        manager.rotate("primary", "TEST_PROVIDER_KEY_NEXT")
        self.assertFalse(manager.available("primary"))
        with self.assertRaises(CredentialUnavailable):
            manager.resolve("primary")
        with self.assertRaises(ValueError):
            manager.rotate("primary", "bad-name")
        with self.assertRaises(CredentialUnavailable):
            manager.resolve("unknown")
        with self.assertRaises(ValueError):
            CredentialManager({"primary": "lowercase_env"})

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

    def test_budget_snapshot_exposes_limits_and_remaining_capacity(self):
        ledger = BudgetLedger({"teacher": Budget(1.0, 2.0, 2, 4)})
        ledger.reserve("teacher", usd=0.25, calls=1)
        snapshot = ledger.snapshot()
        self.assertEqual(snapshot["teacher"]["limits"]["daily_usd"], 1.0)
        self.assertEqual(snapshot["teacher"]["remaining"]["daily_usd"], 0.75)
        self.assertNotIn("prompt", snapshot["teacher"])

    def test_budget_ledger_round_trips_persisted_usage(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "budgets.json"
            budgets = {"teacher": Budget(1.0, 2.0, 2, 4)}
            PersistentBudgetLedger(budgets, path).reserve("teacher", usd=0.5, calls=1)
            restored = PersistentBudgetLedger(budgets, path)
            self.assertEqual(restored.remaining("teacher")["daily_calls"], 1)
            self.assertEqual(restored.remaining("teacher")["monthly_usd"], 1.5)

    def test_persistent_budget_reservations_serialize_concurrently(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "budgets.json"
            budgets = {"teacher": Budget(10.0, 10.0, 10, 10)}
            ledger = PersistentBudgetLedger(budgets, path)
            threads = [Thread(target=ledger.reserve, args=("teacher",), kwargs={"usd": 1.0, "calls": 1}) for _ in range(10)]
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()
            restored = PersistentBudgetLedger(budgets, path)
            self.assertEqual(restored.remaining("teacher")["daily_calls"], 0)

    def test_persistent_budget_rolls_back_when_write_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            class FailingLedger(PersistentBudgetLedger):
                def _persist_usage(self):
                    raise OSError("disk unavailable")

            ledger = FailingLedger({"teacher": Budget(1.0, 1.0, 1, 1)}, Path(directory) / "budgets.json")
            with self.assertRaises(OSError):
                ledger.reserve("teacher", usd=0.25, calls=1)
            self.assertEqual(ledger.remaining("teacher")["daily_calls"], 1)

    def test_audit_redacts_secrets(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "audit.jsonl"
            AuditLog(path).append({"event": "test", "api_key": "do-not-write"})
            record = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(record["api_key"], "[REDACTED]")
            AuditLog(path).append({"event": "embedded", "message": "ghp_" + "123456789012345678901234567890"})
            embedded = json.loads(path.read_text(encoding="utf-8").splitlines()[-1])
            self.assertNotIn("ghp_", embedded["message"])
            AuditLog(path).append({"event": "provider", "message": "sk-" + "a" * 24})
            provider = json.loads(path.read_text(encoding="utf-8").splitlines()[-1])
            self.assertNotIn("sk-", provider["message"])

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

    def test_audit_hash_chain_detects_tampering(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "audit.jsonl"
            audit = AuditLog(path)
            audit.append({"event": "first"})
            audit.append({"event": "second"})
            self.assertTrue(audit.verify())
            path.write_text(path.read_text(encoding="utf-8").replace('"first"', '"changed"'), encoding="utf-8")
            self.assertFalse(audit.verify())

    def test_audit_chain_preserves_secret_redaction(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "audit.jsonl"
            audit = AuditLog(path)
            audit.append({"event": "secret", "api_key": "do-not-write"})
            record = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(record["api_key"], "[REDACTED]")
            self.assertTrue(audit.verify())

    def test_permissions_fail_closed(self):
        manager = PermissionManager(default_policies())
        manager.require("software_engineer", Action.CREATE_PULL_REQUEST)
        with self.assertRaises(PermissionDenied):
            manager.require("software_engineer", Action.MERGE_PULL_REQUEST)
        with self.assertRaises(PermissionDenied):
            manager.require("unknown-agent", Action.READ_PUBLIC_REPO)
        with self.assertRaises(PermissionDenied):
            manager.require([], Action.READ_PUBLIC_REPO)
        with self.assertRaises(PermissionDenied):
            manager.require("teacher", "read_public_repo")

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

    def test_denied_provider_call_is_audited_without_prompt(self):
        class FakeProvider:
            name = "fake"
            model = "test"

            def complete(self, prompt):
                return "never"

        with tempfile.TemporaryDirectory() as directory:
            audit_path = Path(directory) / "audit.jsonl"
            ledger = BudgetLedger({"curriculum_designer": Budget(1.0, 2.0, 2, 4)})
            provider = BudgetedProvider(
                FakeProvider(),
                ledger,
                "curriculum_designer",
                PermissionManager(default_policies()),
                audit_log=AuditLog(audit_path),
            )
            with self.assertRaises(PermissionDenied):
                provider.complete("private prompt")
            record = json.loads(audit_path.read_text(encoding="utf-8"))
            self.assertEqual(record["status"], "denied")
            self.assertNotIn("private prompt", record)

    def test_provider_router_requires_explicit_route(self):
        fake = object()
        router = ProviderRouter({"test": fake}, {"curriculum-review": "test"})
        self.assertIs(router.for_task("curriculum-review"), fake)
        with self.assertRaises(ProviderUnavailable):
            router.for_task("unknown-task")

    def test_provider_route_denials_are_audited_without_configuration_details(self):
        with tempfile.TemporaryDirectory() as directory:
            audit_path = Path(directory) / "audit.jsonl"
            router = ProviderRouter(
                {}, {"curriculum-review": "missing"}, audit_log=AuditLog(audit_path)
            )
            with self.assertRaises(ProviderUnavailable):
                router.for_task("curriculum-review")
            record = json.loads(audit_path.read_text(encoding="utf-8"))
            self.assertEqual(record["event"], "provider_route_denied")
            self.assertEqual(record["reason"], "provider_unavailable")
            self.assertNotIn("provider", record)

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

    def test_provider_cache_avoids_duplicate_budgeted_calls_without_storing_prompt(self):
        class FakeProvider:
            name = "fake"
            model = "test"
            calls = 0

            def complete(self, prompt):
                self.calls += 1
                return f"result:{prompt}"

        fake = FakeProvider()
        cache = {}
        ledger = BudgetLedger({"teacher": Budget(1.0, 2.0, 1, 4)})
        provider = BudgetedProvider(
            fake, ledger, "teacher", PermissionManager(default_policies()), usd_per_call=0.25, cache=cache
        )
        self.assertEqual(provider.complete("same"), "result:same")
        self.assertEqual(provider.complete("same"), "result:same")
        self.assertEqual(fake.calls, 1)
        self.assertEqual(ledger.remaining("teacher")["daily_calls"], 0)
        self.assertNotIn("same", cache)

    def test_provider_audit_records_metadata_without_prompt(self):
        class FakeProvider:
            name = "fake"
            model = "test"

            def complete(self, prompt):
                return "ok"

        with tempfile.TemporaryDirectory() as directory:
            audit_path = Path(directory) / "audit.jsonl"
            ledger = BudgetLedger({"teacher": Budget(1.0, 2.0, 2, 4)})
            provider = BudgetedProvider(
                FakeProvider(), ledger, "teacher", PermissionManager(default_policies()), audit_log=AuditLog(audit_path)
            )
            provider.complete("private prompt that must not be persisted")
            record = json.loads(audit_path.read_text(encoding="utf-8"))
            self.assertEqual(record["status"], "completed")
            self.assertEqual(record["prompt_chars"], 41)
            self.assertNotIn("private prompt", record)

    def test_failed_provider_call_is_audited_and_re_raised(self):
        class FailingProvider:
            name = "fake"
            model = "test"

            def complete(self, prompt):
                raise RuntimeError("provider unavailable")

        with tempfile.TemporaryDirectory() as directory:
            audit_path = Path(directory) / "audit.jsonl"
            ledger = BudgetLedger({"teacher": Budget(1.0, 2.0, 2, 4)})
            provider = BudgetedProvider(
                FailingProvider(), ledger, "teacher", PermissionManager(default_policies()), audit_log=AuditLog(audit_path)
            )
            with self.assertRaises(RuntimeError):
                provider.complete("x")
            record = json.loads(audit_path.read_text(encoding="utf-8"))
            self.assertEqual(record["status"], "failed")
            self.assertEqual(record["error_type"], "RuntimeError")

    def test_agent_registry_exposes_policy(self):
        registry = AgentRegistry()
        self.assertIn("teacher", registry.names())
        self.assertEqual(registry.get("teacher").purpose, "review lesson clarity and completeness")


if __name__ == "__main__":
    unittest.main()


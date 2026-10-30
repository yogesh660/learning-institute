import json
import hashlib
import tempfile
import unittest
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from agent_foundation.audit import AuditLog

from orchestrator.state import Task, TaskStatus
from orchestrator.store import ConcurrentTaskUpdate, SensitiveTaskData, TaskStore
from orchestrator.workflow import CurriculumReviewWorkflow
from orchestrator.main import main


class OrchestratorTests(unittest.TestCase):
    def test_invalid_transition_is_rejected(self):
        with self.assertRaises(ValueError):
            Task(kind="curriculum-review").transition(TaskStatus.COMPLETED)

    def test_approval_requires_explicit_approval_operation(self):
        task = Task(kind="curriculum-review")
        task.transition(TaskStatus.RUNNING)
        task.transition(TaskStatus.REVIEW_REQUIRED)
        with self.assertRaises(ValueError):
            task.transition(TaskStatus.APPROVED)
        task.approve("principal-1", "Reviewed the evidence.")
        self.assertEqual(task.status, TaskStatus.APPROVED)

    def test_store_round_trip(self):
        with tempfile.TemporaryDirectory() as directory:
            store = TaskStore(Path(directory) / "tasks.json")
            task = store.save(Task(kind="curriculum-review"))
            loaded = store.get(task.id)
            self.assertEqual(loaded.id, task.id)
            self.assertEqual(loaded.status, TaskStatus.CREATED)
            self.assertEqual(loaded.revision, 1)
            self.assertEqual([item.id for item in store.list()], [task.id])
            self.assertEqual([item.id for item in store.list(TaskStatus.CREATED)], [task.id])
            self.assertNotIn("payload", task.summary())

    def test_store_rejects_stale_task_revision(self):
        with tempfile.TemporaryDirectory() as directory:
            store = TaskStore(Path(directory) / "tasks.json")
            created = store.save(Task(kind="curriculum-review"))
            stale = store.get(created.id)
            current = store.get(created.id)
            current.transition(TaskStatus.RUNNING)
            store.save(current)
            stale.transition(TaskStatus.RUNNING)
            with self.assertRaises(ConcurrentTaskUpdate):
                store.save(stale)

    def test_store_can_audit_task_transitions_without_payload(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            audit = root / "audit.jsonl"
            store = TaskStore(root / "tasks.json", AuditLog(audit))
            task = store.save(Task(kind="curriculum-review", payload={"context": "safe"}))
            record = audit.read_text(encoding="utf-8")
            self.assertIn(task.id, record)
            self.assertNotIn('"payload"', record)

    def test_store_rejects_secret_like_task_data(self):
        with tempfile.TemporaryDirectory() as directory:
            store = TaskStore(Path(directory) / "tasks.json")
            with self.assertRaises(SensitiveTaskData):
                store.save(Task(kind="curriculum-review", payload={"api_key": "must-not-persist"}))

    def test_audit_verify_cli_accepts_missing_optional_log(self):
        with tempfile.TemporaryDirectory() as directory:
            output = StringIO()
            with redirect_stdout(output):
                code = main(["audit-verify", "--audit", str(Path(directory) / "missing.jsonl")])
            self.assertEqual(code, 0)
            self.assertIn('"valid": true', output.getvalue())

    def test_curriculum_review_pauses_for_approval(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            report = root / "reports" / "phase-2-curriculum-audit.json"
            report.parent.mkdir()
            report.write_text(json.dumps({"status": "pass", "summary": {"lessons": 379, "planned": 18}}))
            task = CurriculumReviewWorkflow().run(Task(kind="curriculum-review"), root)
            self.assertEqual(task.status, TaskStatus.REVIEW_REQUIRED)
            self.assertTrue(task.result["approval_required"])
            self.assertEqual(task.result["side_effects"], [])
            expected_hash = hashlib.sha256(report.read_bytes()).hexdigest()
            self.assertEqual(task.result["evidence_sha256"]["curriculum"], expected_hash)
            self.assertEqual(task.result["teacher_review"]["lessons_reviewed"], 379)
            self.assertIsInstance(task.result["curriculum_proposal"]["planned_lessons"], list)
            self.assertIsNone(task.result["qa_result"])
            self.assertIsNone(task.result["analytics"])


if __name__ == "__main__":
    unittest.main()


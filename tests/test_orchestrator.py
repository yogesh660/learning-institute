import json
import tempfile
import unittest
from pathlib import Path
from agent_foundation.audit import AuditLog

from orchestrator.state import Task, TaskStatus
from orchestrator.store import ConcurrentTaskUpdate, TaskStore
from orchestrator.workflow import CurriculumReviewWorkflow


class OrchestratorTests(unittest.TestCase):
    def test_invalid_transition_is_rejected(self):
        with self.assertRaises(ValueError):
            Task(kind="curriculum-review").transition(TaskStatus.COMPLETED)

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
            task = store.save(Task(kind="curriculum-review", payload={"api_key": "must-not-log"}))
            record = audit.read_text(encoding="utf-8")
            self.assertIn(task.id, record)
            self.assertNotIn("must-not-log", record)
            self.assertNotIn('"payload"', record)

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
            self.assertEqual(task.result["teacher_review"]["lessons_reviewed"], 379)
            self.assertIsInstance(task.result["curriculum_proposal"]["planned_lessons"], list)
            self.assertIsNone(task.result["qa_result"])
            self.assertIsNone(task.result["analytics"])


if __name__ == "__main__":
    unittest.main()


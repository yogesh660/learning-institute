import json
import tempfile
import unittest
from pathlib import Path

from orchestrator.state import Task, TaskStatus
from orchestrator.store import TaskStore
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


if __name__ == "__main__":
    unittest.main()


import json
import tempfile
import unittest
from datetime import datetime, timezone
from uuid import uuid4
from pathlib import Path

from agents.analytics import AcademicAnalyticsAgent


class AnalyticsAgentTests(unittest.TestCase):
    @staticmethod
    def _event(subject: str) -> dict[str, str]:
        return {
            "event_id": str(uuid4()),
            "student_subject": subject,
            "event_type": "lesson_completed",
            "lesson_id": "gradient-descent",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
        }

    def test_aggregates_repository_evidence_without_student_data(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            curriculum = root / "curriculum.json"
            qa = root / "qa.json"
            curriculum.write_text(json.dumps({"totals": {"sourceLessons": 379, "planned": 18}, "checks": {"structuralStatus": "pass"}}))
            qa.write_text(json.dumps({"status": "pass"}))
            snapshot = AcademicAnalyticsAgent().aggregate(curriculum, qa)
            self.assertEqual(snapshot.curriculum_lessons, 379)
            self.assertEqual(snapshot.qa_status, "pass")
            self.assertFalse(snapshot.student_data_read)
            self.assertFalse(snapshot.personal_data_read)

    def test_writes_snapshot_atomically(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            curriculum = root / "curriculum.json"
            qa = root / "qa.json"
            output = root / "snapshot.json"
            curriculum.write_text(json.dumps({"totals": {"sourceLessons": 1, "planned": 0}, "checks": {"structuralStatus": "pass"}}))
            qa.write_text(json.dumps({"status": "pass"}))
            AcademicAnalyticsAgent().write_snapshot(output, curriculum, qa)
            self.assertEqual(json.loads(output.read_text(encoding="utf-8"))["student_data_read"], False)

    def test_student_analytics_suppresses_small_cohorts(self):
        events = [self._event("anon_student01"), self._event("anon_student02")]
        summary = AcademicAnalyticsAgent().aggregate_student_events(events)
        self.assertTrue(summary.suppressed)
        self.assertEqual(summary.by_lesson, {})

    def test_student_analytics_aggregates_only_large_cohorts(self):
        events = [self._event(f"anon_student0{i}") for i in range(1, 6)]
        summary = AcademicAnalyticsAgent().aggregate_student_events(events)
        self.assertFalse(summary.suppressed)
        self.assertEqual(summary.by_lesson["gradient-descent"], 5)
        self.assertNotIn("anon_student01", summary.to_dict())


if __name__ == "__main__":
    unittest.main()

import json
import tempfile
import unittest
from pathlib import Path

from agents.analytics import AcademicAnalyticsAgent


class AnalyticsAgentTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()

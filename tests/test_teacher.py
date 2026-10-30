import json
import tempfile
import unittest
from pathlib import Path

from agents.teacher import TeacherAgent


class TeacherAgentTests(unittest.TestCase):
    def test_review_is_structured_and_side_effect_free(self):
        with tempfile.TemporaryDirectory() as directory:
            report = Path(directory) / "audit.json"
            report.write_text(
                json.dumps(
                    {
                        "totals": {"sourceLessons": 2, "planned": 1},
                        "checks": {
                            "structuralStatus": "pass",
                            "teacherReviewCandidates": [{"lesson": "example", "notes": ["short summary"]}],
                        },
                    }
                ),
                encoding="utf-8",
            )
            before = report.read_bytes()
            review = TeacherAgent().review_report(report)
            self.assertEqual(review.lessons_reviewed, 2)
            self.assertEqual(review.status, "pass")
            self.assertEqual(len(review.candidates), 1)
            self.assertFalse(review.production_changes)
            self.assertEqual(report.read_bytes(), before)

    def test_writes_review_atomically(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            report = root / "audit.json"
            output = root / "teacher.json"
            report.write_text(json.dumps({"totals": {"sourceLessons": 1}, "checks": {"structuralStatus": "pass"}}), encoding="utf-8")
            TeacherAgent().write_review(output, report)
            self.assertEqual(json.loads(output.read_text(encoding="utf-8"))["lessons_reviewed"], 1)


if __name__ == "__main__":
    unittest.main()

import json
import tempfile
import unittest
from pathlib import Path

from agents.curriculum_designer import CurriculumDesignerAgent


class CurriculumDesignerTests(unittest.TestCase):
    def test_proposal_extracts_planned_lessons_without_editing_report(self):
        with tempfile.TemporaryDirectory() as directory:
            report = Path(directory) / "audit.json"
            report.write_text(
                json.dumps(
                    {
                        "paths": [
                            {
                                "id": "ai",
                                "modules": [{"title": "Agents", "plannedLessons": [{"title": "Tool use", "tier": "Core"}]}],
                            }
                        ],
                        "checks": {"teacherReviewCandidates": []},
                    }
                ),
                encoding="utf-8",
            )
            original = report.read_bytes()
            proposal = CurriculumDesignerAgent().propose_from_report(report)
            self.assertEqual(proposal.planned_lessons[0]["path"], "ai")
            self.assertFalse(proposal.production_changes)
            self.assertEqual(report.read_bytes(), original)


if __name__ == "__main__":
    unittest.main()

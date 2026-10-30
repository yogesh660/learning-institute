import unittest

from agents.academic_reviewer import AcademicClaim, AcademicReviewerAgent
from agents.software_engineer import SoftwareEngineerAgent


class ReviewAgentTests(unittest.TestCase):
    def test_academic_reviewer_requires_evidence(self):
        result = AcademicReviewerAgent().review([AcademicClaim("claim", "https://example.org/source", "check context")])
        self.assertEqual(result["status"], "pass")
        self.assertTrue(result["human_review_required"])

    def test_software_engineer_plan_is_source_only(self):
        plan = SoftwareEngineerAgent().plan_change("task-1", ["content/curriculum.js"], ["curriculum audit"])
        self.assertEqual(plan.generated_paths, ())
        self.assertFalse(plan.production_changes)
        with self.assertRaises(ValueError):
            SoftwareEngineerAgent().plan_change("task-1", ["../README.md"], [])


if __name__ == "__main__":
    unittest.main()

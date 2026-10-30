import unittest

from agents.solution_architect import SolutionArchitectAgent


class ArchitectTests(unittest.TestCase):
    def test_reports_current_components_and_open_decisions(self):
        review = SolutionArchitectAgent().review({"task_state", "permissions", "audit_log"})
        self.assertIn("task_state", review.present)
        self.assertIn("github_proposals", review.gaps)
        self.assertTrue(review.human_decisions_required)
        self.assertFalse(review.production_changes)


if __name__ == "__main__":
    unittest.main()

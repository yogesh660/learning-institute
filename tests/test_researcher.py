import unittest

from agents.researcher import ResearchFinding, ResearcherAgent


class ResearcherAgentTests(unittest.TestCase):
    def test_validates_source_grounded_findings(self):
        finding = ResearchFinding(
            "A claim supported by a primary source.",
            "https://example.org/paper",
            "2026-10-31",
            "Relevant to curriculum review",
        )
        report = ResearcherAgent().validate_report([finding])
        self.assertEqual(report["status"], "pass")
        self.assertTrue(report["publication_required"])

    def test_rejects_unverifiable_finding(self):
        finding = ResearchFinding("claim", "not-a-url", "today", "context")
        with self.assertRaises(ValueError):
            ResearcherAgent().validate_report([finding])


if __name__ == "__main__":
    unittest.main()

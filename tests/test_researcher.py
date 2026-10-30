import json
import tempfile
import unittest
from pathlib import Path

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

    def test_writes_reproducible_report_atomically(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "research.json"
            finding = ResearchFinding("claim", "https://example.org/source", "2026-10-31", "context")
            report = ResearcherAgent().write_report(path, [finding])
            self.assertEqual(report["finding_count"], 1)
            self.assertEqual(json.loads(path.read_text(encoding="utf-8"))["status"], "pass")
            self.assertEqual(ResearcherAgent().read_report(path), report)

    def test_read_report_rejects_tampered_document(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "research.json"
            finding = ResearchFinding("claim", "https://example.org/source", "2026-10-31", "context")
            ResearcherAgent().write_report(path, [finding])
            document = json.loads(path.read_text(encoding="utf-8"))
            document["finding_count"] = 99
            path.write_text(json.dumps(document), encoding="utf-8")
            with self.assertRaises(ValueError):
                ResearcherAgent().read_report(path)


if __name__ == "__main__":
    unittest.main()

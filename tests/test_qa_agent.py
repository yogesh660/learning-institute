import json
import tempfile
import unittest
from pathlib import Path

from agents.qa import QAEngineerAgent


class QAAgentTests(unittest.TestCase):
    def test_reports_failures_without_editing_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            report = Path(directory) / "qa.json"
            report.write_text(
                json.dumps(
                    {
                        "status": "fail",
                        "expectedPages": 4,
                        "plannedPages": 1,
                        "missingPages": ["concepts/missing/index.html"],
                        "brokenLinks": [],
                        "staleSourceLinks": [],
                    }
                ),
                encoding="utf-8",
            )
            before = report.read_bytes()
            result = QAEngineerAgent().inspect_report(report)
            self.assertEqual(result.status, "fail")
            self.assertEqual(result.failures, ("concepts/missing/index.html",))
            self.assertFalse(result.production_changes)
            self.assertEqual(report.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()

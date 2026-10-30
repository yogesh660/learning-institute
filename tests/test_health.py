import unittest

from orchestrator.health import collect_health


class HealthTests(unittest.TestCase):
    def test_health_is_deterministic_and_external_calls_are_disabled(self):
        report = collect_health().to_dict()
        self.assertEqual(report["source_repository"], "yogesh660/ml-model-zoo")
        self.assertEqual(report["operations_repository"], "yogesh660/learning-institute")
        self.assertIn("teacher", report["registered_agents"])
        self.assertFalse(report["external_calls_enabled"])
        self.assertEqual(report["provider"], "disabled")


if __name__ == "__main__":
    unittest.main()

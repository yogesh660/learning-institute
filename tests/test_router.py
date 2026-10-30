import unittest

from orchestrator.router import TaskRouter, UnknownTaskKind


class TaskRouterTests(unittest.TestCase):
    def test_routes_are_deterministic_and_ordered(self):
        self.assertEqual(
            TaskRouter().agents_for("curriculum-review"),
            ("teacher", "curriculum_designer", "qa_engineer", "academic_analytics"),
        )

    def test_unknown_kinds_fail_closed(self):
        with self.assertRaises(UnknownTaskKind):
            TaskRouter().agents_for("unregistered")
        with self.assertRaises(UnknownTaskKind):
            TaskRouter().agents_for(" ")


if __name__ == "__main__":
    unittest.main()

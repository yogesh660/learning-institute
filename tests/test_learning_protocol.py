import unittest

from agent_foundation.learning_protocol import validate_feedback_event


class LearningProtocolTests(unittest.TestCase):
    def test_rejects_unreviewed_or_unreferenced_feedback(self):
        errors = validate_feedback_event({"signal": "accepted"})
        self.assertIn("evidence_ref", errors)
        self.assertIn("review_required must be true", errors)

    def test_accepts_bounded_feedback_event(self):
        event = {
            "task_id": "task-123",
            "agent": "qa_engineer",
            "signal": "needs_revision",
            "evidence_ref": "pr-2#review-1",
            "lesson": "Compare every lesson against its closest model template.",
            "corrective_action": "Require a section matrix before proposal creation.",
            "review_required": True,
        }
        self.assertEqual(validate_feedback_event(event), [])


if __name__ == "__main__":
    unittest.main()

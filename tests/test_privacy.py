import unittest

from security.privacy import PrivacyViolation, validate_learning_event


class PrivacyTests(unittest.TestCase):
    def test_accepts_pseudonymous_learning_event(self):
        validate_learning_event(
            {
                "student_key": "anon_example01",
                "event_type": "lesson_viewed",
                "lesson_id": "gradient-descent",
                "metadata": {"duration_seconds": 42},
            }
        )

    def test_rejects_direct_identifier_and_unknown_fields(self):
        with self.assertRaises(PrivacyViolation):
            validate_learning_event(
                {"student_key": "anon_example01", "event_type": "lesson_viewed", "lesson_id": "x", "email": "a@b.test"}
            )
        with self.assertRaises(PrivacyViolation):
            validate_learning_event(
                {"student_key": "real-student-123", "event_type": "lesson_viewed", "lesson_id": "x"}
            )


if __name__ == "__main__":
    unittest.main()

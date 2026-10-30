import unittest
from datetime import datetime, timedelta, timezone

from security.retention import RetentionPolicy


class RetentionTests(unittest.TestCase):
    def test_event_retention_is_explicit(self):
        policy = RetentionPolicy(event_days=30, audit_days=365)
        created = datetime(2026, 1, 1, tzinfo=timezone.utc)
        self.assertFalse(policy.deletion_due(created, kind="student_event", now=created + timedelta(days=29)))
        self.assertTrue(policy.deletion_due(created, kind="student_event", now=created + timedelta(days=30)))

    def test_rejects_unknown_kind_and_invalid_window(self):
        with self.assertRaises(ValueError):
            RetentionPolicy(event_days=0)
        with self.assertRaises(ValueError):
            RetentionPolicy().expires_at(datetime.now(), kind="unknown")


if __name__ == "__main__":
    unittest.main()

import unittest
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from security.retention import RetentionPolicy
from security.student_data import StudentEventViolation, delete_events, export_events, purge_expired_events


def event(subject: str, days_ago: int = 0) -> dict[str, str]:
    occurred = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return {
        "event_id": str(uuid4()),
        "student_subject": subject,
        "event_type": "lesson_completed",
        "lesson_id": "gradient-descent",
        "occurred_at": occurred.isoformat(),
    }


class StudentDataTests(unittest.TestCase):
    def test_export_is_subject_scoped_and_detached(self):
        events = [event("anon_student01"), event("anon_student02")]
        exported = export_events(events, "anon_student01")
        self.assertEqual(len(exported), 1)
        exported[0]["lesson_id"] = "changed"
        self.assertEqual(events[0]["lesson_id"], "gradient-descent")

    def test_delete_returns_remaining_events_and_count(self):
        remaining, deleted = delete_events([event("anon_student01"), event("anon_student02")], "anon_student01")
        self.assertEqual(deleted, 1)
        self.assertEqual([item["student_subject"] for item in remaining], ["anon_student02"])

    def test_purge_applies_retention_policy(self):
        old = event("anon_student01", days_ago=31)
        fresh = event("anon_student01", days_ago=1)
        retained, deleted = purge_expired_events([old, fresh], RetentionPolicy(event_days=30), now=datetime.now(timezone.utc))
        self.assertEqual(deleted, 1)
        self.assertEqual(len(retained), 1)

    def test_invalid_events_fail_closed(self):
        invalid = event("real-student")
        with self.assertRaises(StudentEventViolation):
            export_events([invalid], "anon_student01")
        invalid_timestamp = event("anon_student01")
        invalid_timestamp["occurred_at"] = "2026-10-31T12:00:00"
        with self.assertRaises(StudentEventViolation):
            export_events([invalid_timestamp], "anon_student01")


if __name__ == "__main__":
    unittest.main()

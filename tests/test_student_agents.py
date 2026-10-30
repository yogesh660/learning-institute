import unittest

from agents.examiner import ExaminerAgent
from agents.student_support import StudentSupportAgent


class StudentAgentTests(unittest.TestCase):
    def test_examiner_draft_does_not_persist_student_data(self):
        draft = ExaminerAgent().draft("gradient-descent", ["Explain the update rule"])
        self.assertEqual(len(draft.questions), 1)
        self.assertFalse(draft.persisted_student_data)

    def test_support_is_stateless_and_escalates_grading(self):
        response = StudentSupportAgent().respond("lesson", "gradient descent context", "Can you grade my answer?")
        self.assertEqual(response.escalation, "teacher")
        self.assertFalse(response.stored_student_data)


if __name__ == "__main__":
    unittest.main()

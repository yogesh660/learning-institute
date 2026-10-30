"""Specialised Academy agents."""

from .academic_reviewer import AcademicReviewerAgent, AcademicClaim
from .analytics import AcademicAnalyticsAgent, AnalyticsSnapshot
from .examiner import AssessmentDraft, ExaminerAgent
from .software_engineer import SoftwareEngineerAgent, ChangePlan
from .solution_architect import ArchitectureReview, SolutionArchitectAgent
from .student_support import StudentSupportAgent, SupportResponse
from .teacher import TeacherAgent, TeacherReview
from .qa import QAEngineerAgent, QAResult

__all__ = [
    "AcademicClaim", "AcademicAnalyticsAgent", "AcademicReviewerAgent", "AnalyticsSnapshot", "ChangePlan", "QAEngineerAgent",
    "QAResult", "AssessmentDraft", "ExaminerAgent", "SoftwareEngineerAgent",
    "StudentSupportAgent", "SupportResponse", "ArchitectureReview", "SolutionArchitectAgent",
    "TeacherAgent", "TeacherReview",
]

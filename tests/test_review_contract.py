import unittest

from agent_foundation.review_contract import REQUIRED_SECTIONS, validate_curriculum_evidence


class ReviewContractTests(unittest.TestCase):
    def test_rejects_missing_comparison_and_review_evidence(self):
        errors = validate_curriculum_evidence({})
        self.assertIn("source_repository", errors)
        self.assertIn("section_matrix must be an object", errors)

    def test_accepts_complete_pending_review(self):
        evidence = {
            "source_repository": "yogesh660/ml-model-zoo",
            "source_revision": "abcdef1234567",
            "comparison_target": "models/convolutional_neural_networks",
            "section_matrix": {section: "present" for section in REQUIRED_SECTIONS},
            "architecture_review": {"status": "reviewed"},
            "code_review": {"status": "reviewed"},
            "research_sources": ["primary-source"],
            "qa_status": "pending_human_review",
            "human_review_required": True,
        }
        self.assertEqual(validate_curriculum_evidence(evidence), [])


if __name__ == "__main__":
    unittest.main()

import base64
import json
import unittest

from integrations.github_readonly import GitHubReadError, GitHubReadOnlyClient


class GitHubReadOnlyTests(unittest.TestCase):
    def test_reads_utf8_file_without_write_capability(self):
        seen = {}

        def transport(url, headers):
            seen["url"] = url
            seen["headers"] = headers
            body = base64.b64encode(b"hello").decode()
            return 200, json.dumps({"type": "file", "content": body}).encode()

        client = GitHubReadOnlyClient(transport=transport)
        self.assertEqual(client.read_file("content/curriculum.js"), "hello")
        self.assertIn("ml-model-zoo/contents/content/curriculum.js", seen["url"])
        self.assertNotIn("Authorization", seen["headers"])
        self.assertFalse(hasattr(client, "create_pull_request"))

    def test_rejects_parent_paths_and_bad_responses(self):
        client = GitHubReadOnlyClient(transport=lambda url, headers: (404, b"{}"))
        with self.assertRaises(ValueError):
            client.read_file("../secrets.txt")
        with self.assertRaises(GitHubReadError):
            client.read_file("README.md")

    def test_lists_directory_metadata_only(self):
        def transport(url, headers):
            return 200, json.dumps([{"name": "curriculum.js", "path": "content/curriculum.js", "type": "file", "sha": "secret-to-hide"}]).encode()

        entries = GitHubReadOnlyClient(transport=transport).list_path("content")
        self.assertEqual(entries, [{"name": "curriculum.js", "path": "content/curriculum.js", "type": "file"}])

    def test_verifies_required_reviews_and_checks_without_writing(self):
        seen = {}

        def transport(url, headers):
            seen["url"] = url
            return 200, json.dumps(
                {
                    "required_pull_request_reviews": {"required_approving_review_count": 1},
                    "required_status_checks": {"contexts": ["Validate", "Academy backend validation"]},
                }
            ).encode()

        client = GitHubReadOnlyClient(repository="yogesh660/learning-institute", transport=transport)
        self.assertTrue(client.verify_branch_policy("main", ("Validate",)))
        self.assertFalse(client.verify_branch_policy("main", ("missing-check",)))
        self.assertIn("branches/main/protection", seen["url"])

    def test_branch_policy_read_fails_closed(self):
        client = GitHubReadOnlyClient(transport=lambda url, headers: (404, b"{}"))
        with self.assertRaises(GitHubReadError):
            client.verify_branch_policy()


if __name__ == "__main__":
    unittest.main()

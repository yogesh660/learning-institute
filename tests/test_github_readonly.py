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


if __name__ == "__main__":
    unittest.main()

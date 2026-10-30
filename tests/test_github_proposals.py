import json
import os
import unittest

from agent_foundation.permissions import PermissionManager, default_policies
from integrations.github_proposals import GitHubProposalClient, GitHubProposalError


class GitHubProposalTests(unittest.TestCase):
    def test_engineer_can_create_proposal_but_teacher_cannot(self):
        calls = []

        def transport(method, url, headers, body):
            calls.append((method, url, json.loads(body)))
            return 201, json.dumps({"number": 7, "html_url": "https://github.com/example/pr/7"}).encode()

        old = os.environ.get("TEST_GITHUB_TOKEN")
        os.environ["TEST_GITHUB_TOKEN"] = "test-token"
        try:
            client = GitHubProposalClient(
                permissions=PermissionManager(default_policies()),
                token_env="TEST_GITHUB_TOKEN",
                transport=transport,
            )
            with self.assertRaises(Exception):
                client.create_pull_request("teacher", title="x", body="y", head="agent/x")
            result = client.create_pull_request("software_engineer", title="x", body="y", head="agent/x")
            self.assertEqual(result["number"], 7)
            self.assertEqual(calls[0][0], "POST")
        finally:
            if old is None:
                os.environ.pop("TEST_GITHUB_TOKEN", None)
            else:
                os.environ["TEST_GITHUB_TOKEN"] = old

    def test_missing_credential_fails_closed(self):
        os.environ.pop("TEST_GITHUB_TOKEN", None)
        client = GitHubProposalClient(
            permissions=PermissionManager(default_policies()), token_env="TEST_GITHUB_TOKEN", transport=lambda *args: (201, b"{}")
        )
        with self.assertRaises(GitHubProposalError):
            client.create_pull_request("software_engineer", title="x", body="y", head="agent/x")


if __name__ == "__main__":
    unittest.main()

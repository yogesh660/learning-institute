import json
import os
import tempfile
import unittest
from pathlib import Path

from agent_foundation.permissions import PermissionManager, default_policies
from agent_foundation.audit import AuditLog
from integrations.github_proposals import ApprovalRequired, GitHubProposalClient, GitHubProposalError
from orchestrator.state import Task, TaskStatus


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
                audit_log=AuditLog(Path(tempfile.mkdtemp()) / "audit.jsonl"),
                transport=transport,
            )
            task = Task("curriculum-review")
            with self.assertRaises(ApprovalRequired):
                client.create_pull_request("software_engineer", task=task, title="x", body="y", head="agent/x")
            task.transition(TaskStatus.RUNNING)
            task.transition(TaskStatus.REVIEW_REQUIRED)
            task.approve("principal-1", "Reviewed the evidence.")
            with self.assertRaises(Exception):
                client.create_pull_request("teacher", task=task, title="x", body="y", head="agent/x")
            result = client.create_pull_request("software_engineer", task=task, title="x", body="y", head="agent/x")
            self.assertEqual(result["number"], 7)
            self.assertEqual(calls[0][0], "POST")
        finally:
            if old is None:
                os.environ.pop("TEST_GITHUB_TOKEN", None)
            else:
                os.environ["TEST_GITHUB_TOKEN"] = old

    def test_missing_credential_fails_closed(self):
        os.environ.pop("TEST_GITHUB_TOKEN", None)
        with tempfile.TemporaryDirectory() as directory:
            audit_path = Path(directory) / "audit.jsonl"
            client = GitHubProposalClient(
                permissions=PermissionManager(default_policies()),
                token_env="TEST_GITHUB_TOKEN",
                audit_log=AuditLog(audit_path),
                transport=lambda *args: (201, b"{}"),
            )
            task = Task("curriculum-review")
            task.transition(TaskStatus.RUNNING)
            task.transition(TaskStatus.REVIEW_REQUIRED)
            task.approve("principal-1", "Reviewed the evidence.")
            with self.assertRaises(GitHubProposalError):
                client.create_pull_request("software_engineer", task=task, title="x", body="y", head="agent/x")
            record = json.loads(audit_path.read_text(encoding="utf-8"))
            self.assertEqual(record["reason"], "missing_credential")
            self.assertNotIn("Authorization", record)

    def test_rejected_response_is_audited_without_request_content(self):
        os.environ["TEST_GITHUB_TOKEN"] = "test-token"
        with tempfile.TemporaryDirectory() as directory:
            audit_path = Path(directory) / "audit.jsonl"
            client = GitHubProposalClient(
                permissions=PermissionManager(default_policies()),
                token_env="TEST_GITHUB_TOKEN",
                audit_log=AuditLog(audit_path),
                transport=lambda *args: (422, b"rejected"),
            )
            task = Task("curriculum-review")
            task.transition(TaskStatus.RUNNING)
            task.transition(TaskStatus.REVIEW_REQUIRED)
            task.approve("principal-1", "Reviewed the evidence.")
            with self.assertRaises(GitHubProposalError):
                client.create_pull_request("software_engineer", task=task, title="private title", body="private body", head="agent/x")
            record = json.loads(audit_path.read_text(encoding="utf-8"))
            self.assertEqual(record["http_status"], 422)
            self.assertNotIn("private title", record)
        client = GitHubProposalClient(
            permissions=PermissionManager(default_policies()), token_env="TEST_GITHUB_TOKEN", transport=lambda *args: (201, b"{}")
        )
        task = Task("curriculum-review")
        task.transition(TaskStatus.RUNNING)
        task.transition(TaskStatus.REVIEW_REQUIRED)
        task.approve("principal-1", "Reviewed the evidence.")
        with self.assertRaises(GitHubProposalError):
            client.create_pull_request("software_engineer", task=task, title="x", body="y", head="agent/x")


if __name__ == "__main__":
    unittest.main()

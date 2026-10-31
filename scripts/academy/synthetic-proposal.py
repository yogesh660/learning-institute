#!/usr/bin/env python3
"""Run an offline end-to-end pull-request proposal gate test."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from agent_foundation.audit import AuditLog
from agent_foundation.credentials import CredentialManager
from agent_foundation.permissions import PermissionManager, default_policies
from agent_foundation.review_contract import REQUIRED_SECTIONS, validate_curriculum_evidence
from integrations.github_proposals import GitHubProposalClient
from orchestrator.state import Task, TaskStatus


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="synthetic-proposal.json")
    args = parser.parse_args()
    output = Path(args.output)
    audit_path = output.with_suffix(".audit.jsonl")

    task = Task(
        kind="lesson-change",
        requested_by="synthetic-agent",
        acceptance_criteria=["build passes", "review evidence attached"],
    )
    task.transition(TaskStatus.RUNNING)
    task.transition(TaskStatus.REVIEW_REQUIRED)
    task.approve("synthetic-principal", "Approved offline proposal gate test.")
    review_evidence = {
        "source_repository": "yogesh660/ml-model-zoo",
        "source_revision": "abcdef1234567",
        "comparison_target": "models/convolutional_neural_networks",
        "section_matrix": {section: "reviewed" for section in REQUIRED_SECTIONS},
        "architecture_review": {"status": "reviewed"},
        "code_review": {"status": "reviewed"},
        "research_sources": ["offline-fixture"],
        "qa_status": "pending_human_review",
        "human_review_required": True,
    }
    contract_errors = validate_curriculum_evidence(review_evidence)
    if contract_errors:
        raise RuntimeError("invalid review evidence: " + "; ".join(contract_errors))

    def transport(method: str, url: str, headers: dict[str, str], body: bytes) -> tuple[int, bytes]:
        return 201, json.dumps({"number": 1, "html_url": "https://example.invalid/pull/1"}).encode()

    client = GitHubProposalClient(
        repository="yogesh660/ml-model-zoo",
        token_env="SYNTHETIC_GITHUB_TOKEN",
        credentials=CredentialManager({"SYNTHETIC_GITHUB_TOKEN": "SYNTHETIC_GITHUB_TOKEN"}, {"SYNTHETIC_GITHUB_TOKEN": "offline-token"}),
        permissions=PermissionManager(default_policies()),
        audit_log=AuditLog(audit_path),
        transport=transport,
        branch_policy_verified=True,
    )
    result = client.create_pull_request(
        "software_engineer",
        task=task,
        title="Synthetic proposal",
        body="Offline evidence-only proposal.",
        head="agent/synthetic",
    )
    rendered = {
        "synthetic": True,
        "task_id": task.id,
        "proposal": result,
        "network_calls": 0,
        "production_merge": False,
        "review_evidence": review_evidence,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(rendered, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(rendered, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

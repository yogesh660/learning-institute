# Agent learning protocol

The institute uses a reinforced feedback loop between agents, but it does not
permit agents to self-modify, self-reward, or silently change their policies.
The loop is:

1. **Observe** — record the task, agent role, outcome, and a stable evidence
   reference such as a PR review, failed check, or approved report.
2. **Reflect** — write the specific lesson and corrective action. A vague score
   or an unreferenced “reward” is not accepted.
3. **Cross-review** — a different agent checks whether the lesson is supported
   by the evidence and whether it changes curriculum, architecture, safety, or
   privacy assumptions.
4. **Constrain** — keep the feedback event bounded and free of prompts,
   credentials, direct student identifiers, and provider payloads.
5. **Improve by proposal** — update a playbook, schema, test, or workflow only
   through a reviewed feature branch and pull request. The Principal remains
   responsible for approval and merge.
6. **Verify** — rerun tests, secret scanning, source-repository QA, and the
   review-evidence contract. Regressions create a new feedback event; they do
   not trigger an automatic merge or policy bypass.

Every event must contain `task_id`, `agent`, `signal`, `evidence_ref`, `lesson`,
`corrective_action`, and `review_required: true`. Allowed outcome signals are
`accepted`, `rejected`, `needs_revision`, and `regression`.

This protocol keeps improvement persistent across agents while preserving the
source boundary: `yogesh660/ml-model-zoo` remains the public curriculum source,
and this repository remains the governed control plane.

# AI Learning Institute

`learning-institute` is the governed backend/control plane for agents that research, review, and propose changes to the public learning hub:

`yogesh660/ml-model-zoo`

The public static learning experience is hosted from `ml-model-zoo`. This repository intentionally does not mirror its lessons, generated HTML, assets, datasets, or model-training examples.

## Repository layout

```text
agent_foundation/  policies, budgets, audit log, credentials
agents/            governed teacher, QA, research, analytics agents
orchestrator/      task state, approvals, service facade, health
integrations/      read-only source access and PR proposal boundary
security/          auth, privacy, retention, rate limits, secret scanning
schemas/           task, report, student-event schemas
scripts/academy/   backend audits, evidence, synthetic proposal gate
tests/             backend unit and governance tests
docs/              architecture, security, deployment, and operating policy
.github/workflows/ validation and scheduled backend audits
```

## Checks

```bash
python -m unittest discover -s tests -v
python scripts/academy/secret-scan.py .
python scripts/academy/synthetic-proposal.py --output synthetic-proposal.json
python -m orchestrator.main health --output backend-health.json
python -m orchestrator.main audit-verify --audit .academy/audit.jsonl
```

## Controlled source changes

Agents may inspect the public source, prepare evidence, and create a feature branch/pull request after policy and Principal approval. They must not edit or merge `ml-model-zoo/main` directly. The GitHub credential is supplied as `ACADEMY_GITHUB_TOKEN` with least-privilege access to the source repository.

Every curriculum proposal must compare the requested lesson with the closest existing model/lesson template, check architecture and interaction sections, run source-repository QA, and record unresolved gaps for human review.

Agent improvement follows the bounded [agent learning protocol](docs/agent-learning-protocol.md): feedback is evidence-linked and cross-reviewed, and any playbook or policy change requires a reviewed pull request and Principal approval.

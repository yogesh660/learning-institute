# Learning Institute backend

This repository is the governed backend/control plane for agents that work on
`yogesh660/ml-model-zoo`. The public learning site and curriculum source remain
in that repository.

## Boundaries

- Treat `yogesh660/ml-model-zoo` as read-only until a reviewed feature branch and pull request are prepared.
- Never copy or regenerate the public site into this repository.
- Never merge or push directly to the source repository's `main` branch.
- Keep credentials in the environment as `ACADEMY_GITHUB_TOKEN`; never commit or print token values.

## Backend checks

```text
python -m unittest discover -s tests -v
python scripts/academy/secret-scan.py .
python scripts/academy/synthetic-proposal.py --output synthetic-proposal.json
python -m orchestrator.main health --output backend-health.json
```

Curriculum proposals must include source evidence, a template comparison, an architecture/interaction review, QA results, and explicit human approval before the GitHub proposal adapter may open a pull request.

Use the bounded agent learning protocol in `docs/agent-learning-protocol.md`. Never treat an outcome score as permission to self-modify, bypass review, expose prompts/credentials/student data, or merge automatically.

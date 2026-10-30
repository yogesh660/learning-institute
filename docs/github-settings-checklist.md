# GitHub settings checklist

Repository: `yogesh660/learning-institute`

The connected integration cannot read or change branch protection (`403
Resource not accessible by integration`). A repository owner must apply these
settings before any real source-repository proposal is attempted.

## Rules → main

- Require a pull request before merging.
- Require at least one approving review.
- Require status checks before merging:
  - `Validate`
  - `Academy backend validation`
- Require branches to be up to date before merging.
- Dismiss stale approvals when new commits are pushed.
- Disable force pushes and branch deletion.
- Do not allow administrators to bypass these rules unless explicitly approved.

## Actions

- Set workflow permissions to read repository contents by default.
- Keep pull-request workflows free of production credentials.
- Review third-party actions and pin or trust only the actions used by the
  checked-in workflows.

## Secrets and environments

- Do not add provider credentials until a provider is approved.
- If GitHub API access is enabled, use a GitHub App or fine-grained token with
  only the required repository permissions.
- Store the integration credential as `ACADEMY_GITHUB_TOKEN` when using a
  fine-grained token; never send its value in chat or commit it to the repo.
- Store credentials in an environment, not in repository files or task JSON.
- Rotate credentials through the documented credential alias mechanism.

## Pages

Keep Pages disabled for `learning-institute`; the public learning site remains
`yogesh660/ml-model-zoo`. The local Pages workflow is manual-only compatibility
code.

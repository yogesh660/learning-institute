# Controlled GitHub proposals

`integrations/github_proposals.py` is the only current mutation boundary for
the operations control plane. It can request a pull request in the configured
repository only when both conditions hold:

1. The caller is allowed `create_pull_request` by the agent policy.
2. The associated task is in the explicit `approved` state.

The adapter does not merge, create arbitrary commits, or expose credentials.
Successful proposals and metadata-only failures are written to the configured
hash-chained, secret-free audit log. Credentials, request bodies, and proposal
text are never recorded.
Production merges remain a Principal action outside this adapter.

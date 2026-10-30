# Operations security boundaries

`learning-institute` is a private control plane for work on the public
`ml-model-zoo` repository. These controls are active in the current codebase:

- Agent actions are least-privilege and fail closed.
- CLI task operations require an explicit identity and role.
- Only Principal identities can approve or complete production-bound tasks.
- GitHub pull-request proposals require both an allowed agent and an
  `approved` task.
- The default AI provider is disabled; no provider call happens implicitly.
- Student events must use pseudonymous `anon_...` keys and cannot contain
  direct identifiers, raw answers, or free-form personal data.
- Retention windows are explicit; no automatic deletion is performed.
- Task and proposal operations can be written to a secret-free audit log.
- CI scans committed files for common credential patterns.

The repository does not yet implement a production identity provider, student
database, or live AI provider adapter. Those decisions require Principal review
of privacy, retention, provider terms, and deployment configuration first.

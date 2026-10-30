# Operations security boundaries

`learning-institute` is a private control plane for work on the public
`ml-model-zoo` repository. These controls are active in the current codebase:

- Agent actions are least-privilege and fail closed.
- CLI task operations require an explicit identity and role.
- Only Principal identities can approve or complete production-bound tasks.
- Principal approval is bound to a canonical task-content fingerprint; changing
  the payload or result after approval blocks completion.
- Approved state can only be created through the explicit approval operation;
  GitHub proposals require the recorded approver, rationale, and fingerprint.
- Task writes use optimistic revisions so concurrent workers cannot silently
  overwrite newer lifecycle state.
- GitHub pull-request proposals require both an allowed agent and an
  `approved` task.
- The default AI provider is disabled; no provider call happens implicitly.
- Configured provider calls can emit hash-chained, metadata-only audit events;
  prompts and provider responses are never recorded by the boundary.
- Student events must use pseudonymous `anon_...` keys and cannot contain
  direct identifiers, raw answers, or free-form personal data.
- Retention windows are explicit; no automatic deletion is performed.
- Task and proposal operations can be written to a secret-free audit log.
- Audit entries are hash-chained and can be verified for tampering; legacy
  unchained entries are retained but only anchor subsequent entries.
- CI scans committed files for common credential patterns.

The repository does not yet implement a production identity provider, student
database, or live AI provider adapter. Those decisions require Principal review
of privacy, retention, provider terms, and deployment configuration first.

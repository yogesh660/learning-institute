# Student backend security design

## Scope

This is a design gate, not a deployed student service. The current repository
must continue to accept only synthetic or pseudonymous offline events.

## Trust boundaries

1. Browser/static site: untrusted; may not receive provider credentials.
2. Authenticated API: validates identity, authorization, schemas, rate limits,
   and audit events.
3. Student store: encrypted at rest, access-controlled, backed up, and subject
   to retention and deletion policy.
4. AI provider boundary: receives only explicitly approved, minimized context.
5. Principal/reviewer boundary: required for consequential or disputed grading.

## Data classification

- Public: lesson content and build artifacts.
- Pseudonymous: validated event ID, anonymous subject, lesson, event type, and
  timezone-aware timestamp.
- Sensitive: assessment submissions, support conversations, and derived
  performance data; prohibited until the backend and privacy review exist.
- Secrets: tokens and provider credentials; environment/secret-manager only.

## Required controls before launch

- OIDC/session authentication with role-based authorization.
- Tenant/subject isolation and server-side schema validation.
- Shared durable rate limits, budget controls, and idempotency keys.
- TLS in transit, encrypted storage, key rotation, and backup restoration test.
- Export, deletion, retention purge, consent withdrawal, and audit procedures.
- No raw student data in logs, prompts, pull requests, or CI artifacts.
- Human review for disputed or consequential assessment outcomes.
- Threat-model review, incident response runbook, and Principal approval.

## Go/no-go test

Do not enable student ingestion until every required control has an owner,
implementation evidence, and a passing security/privacy review. Until then,
`security.student_data` remains an offline validation helper only.

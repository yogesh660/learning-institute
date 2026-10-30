# Phase 4: student support and assessment boundary

The current product is a public-style static learning site. It must not be
used as a student-record system. GitHub Pages and browser `localStorage` do
not provide authentication, authorisation, protected submissions, secure
grading records, or reliable cross-device progress.

## Required boundary before implementation

- A separately deployed backend with authentication and authorisation.
- A documented student-data classification and retention policy.
- Server-side validation, rate limiting, and audit events.
- Provider isolation so browser code never receives an AI-provider secret.
- A human review path for consequential or disputed grading.
- Explicit deletion and export behavior for student data.

## Safe first step

Until that boundary exists, Phase 4 may only define schemas, threat models,
and offline examples using synthetic or pseudonymous data. It must not collect
real student names, emails, assessment answers, or provider credentials in this
repository.

The repository now includes `security.rate_limit.InMemoryRateLimiter` as a
thread-safe prototype primitive. It is not a production distributed limiter:
before deploying multiple backend workers, replace it with a shared counter or
an API gateway policy while preserving the same fail-closed behavior.


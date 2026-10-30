# Backend deployment decision

## Decision

Until authenticated student features are approved, the Academy control plane
will run as a dependency-light Python service/CLI invoked by GitHub Actions and
human-triggered workflows. Task, budget, and audit state remains local to each
run and is uploaded only as metadata-only artifacts for experiments.

We will not deploy a public API, add a database, or accept student records in
this phase.

## Rationale

- The current product is an operations control plane, not a student-facing
  application.
- GitHub Actions already provides isolated execution, reviewable configuration,
  and immutable run evidence.
- A network service before identity, consent, retention, and incident-response
  decisions would create unnecessary exposure.
- The repository remains dependency-light and easy to reproduce locally.

## Exit criteria for a durable service

Revisit this decision only when all are approved by the Principal:

1. Authentication and role model.
2. Student-data classification, consent, retention, export, and deletion.
3. Durable encrypted storage and backup/restore procedure.
4. Shared rate-limit and budget storage.
5. Threat model, monitoring, incident response, and cost budget.

At that point, select a managed Python API runtime and a managed relational
database through a separate architecture decision record. No provider or
database is implicitly approved by this document.

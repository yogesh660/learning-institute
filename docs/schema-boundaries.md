# Schema boundaries

The original `schemas/task.schema.json` and `schemas/report.schema.json`
remain the foundation contracts for delegated task/report messages.

The runtime JSON task store uses the separate `workflow-task.schema.json` and
`workflow-report.schema.json` contracts. Keeping these schemas distinct avoids
silently changing the Phase 1 contract while the orchestrator evolves.

Curriculum workflow results include SHA-256 digests of the evidence files that
were reviewed. The digest provides provenance without copying report contents
into task metadata.

# Phase 1 foundation

This repository contains the public learning site and a small, dependency-free
foundation for future governed agent workflows.

## Boundaries

- `ml-model-zoo` is the read-only source import.
- Agent code must use feature branches and pull requests.
- Credentials come from the execution environment or a secrets manager.
- The foundation never prints credential values.
- Budget reservations fail closed before a provider call.
- Audit events are append-only JSONL records with common secret keys redacted.
- These primitives do not grant GitHub access, merge pull requests, or deploy production.

## Phase 1 follow-up

The next implementation should connect these interfaces to a narrowly scoped
GitHub App, persistent usage storage, and a human approval workflow. Branch
protection and required checks must be enabled in repository settings before
agents are allowed to create production pull requests.


# AI Learning Institute

A repository for building a governed, AI-assisted learning institute on top of the imported ML Model Zoo learning hub.

## Current state

- Repository: `yogesh660/learning-institute`
- Visibility: private
- Public source: `yogesh660/ml-model-zoo` remains the read-only Learning Hub
- Operations role: this private repository hosts governed agents and backend control-plane code
- Curriculum: 379 live lessons, 50 model lessons, 329 concept lessons, and 18 planned pages
- Build output: 107 hours of generated learning material
- Deployment: the public site remains on `ml-model-zoo`; Pages here is manual-only compatibility

## Repository layout

```text
content/                  curriculum and lesson source
models/                   generated model pages and training scripts
concepts/                 generated concept pages
assets/                   shared site styles, behaviour, and browser labs
datasets/raw/             small educational datasets
scripts/build.js          deterministic site generator
scripts/dev/              visual QA, quiz checks, merge queue, tracker
agent_foundation/         Phase 1 schemas, budgets, audit log, and config primitives
agents/                   governed academic, engineering, support, and analytics agents
orchestrator/             task state, approval workflow, service facade, and health checks
integrations/             read-only source access and permission-checked PR proposals
security/                 authorization, privacy validation, and retention policies
schemas/                  JSON Schemas for academy tasks and reports
tests/                    foundation tests
docs/                     phase plans and security boundaries
.github/workflows/        validation and deployment workflows
```

## Build and local development

```bash
node scripts/build.js
node server.js
```

The site is plain HTML, CSS, and browser JavaScript. No npm install is required. Python is used by model-training examples and the foundation test workflow.

## Quality checks

```bash
python -m unittest discover -s tests -v
python3 scripts/dev/check.py overflow concepts/<lesson-id>
node scripts/dev/quiz-check.js --hard
python -m orchestrator.main health
python -m orchestrator.main audit-verify --audit .academy/audit.jsonl
python scripts/academy/secret-scan.py .
```

The validation workflows run the Python backend suite, rebuild the imported static tree, run curriculum/QA checks, and publish a backend health artifact. The Academy backend defaults to no provider calls and requires explicit Principal approval before a GitHub pull-request proposal.

## Backend workflow

```bash
python -m orchestrator.main create --store .academy/tasks.json --subject teacher-1 --role agent
# Retries with the same key return the existing task instead of creating duplicate work.
python -m orchestrator.main create --store .academy/tasks.json --subject teacher-1 --role agent --dedupe-key ci-run-2026-10-31
python -m orchestrator.main run TASK_ID --store .academy/tasks.json --repo-root . --subject teacher-1 --role agent --output reports/task-review.json
python -m orchestrator.main approve TASK_ID --store .academy/tasks.json --subject principal-1 --role principal --reason "Reviewed evidence and approved the scoped proposal."
python -m orchestrator.main list --store .academy/tasks.json
python -m orchestrator.main list --store .academy/tasks.json --status-filter review_required
```

`learning-institute` prepares evidence and proposals for `ml-model-zoo`; it does not replace the public site or merge production changes.

## Academy phases

- Phase 0: repository, curriculum, build, QA, and security audit.
- Phase 1: governed foundation primitives, schemas, budgets, audit logging, credential conventions, and validation workflow.
- Phase 2: repository-aware curriculum review with deterministic teacher and curriculum checks.
- Phase 3: engineering and QA automation around builds, generated output, and pull-request evidence.
- Phase 4: student-safety boundaries and a versioned event schema, with no production student data or provider integrations.
- Phase 5: privacy-safe academic analytics derived only from committed curriculum and QA evidence.
- Phase 6: a read-only academy command center snapshot and manual GitHub Actions status workflow.

## Safety boundaries

- Agents may inspect, propose, test, and prepare pull requests.
- Production changes require human review.
- Credentials must come from the execution environment or a secrets manager.
- Secrets and student records must not be committed.
- The browser `localStorage` progress feature is not a secure student database.
- Do not add a backend or provider integration without an explicit security and privacy design.

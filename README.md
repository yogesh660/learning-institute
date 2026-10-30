# AI Learning Institute

A repository for building a governed, AI-assisted learning institute on top of the imported ML Model Zoo learning hub.

## Current state

- Repository: `yogesh660/learning-institute`
- Visibility: private
- Source import: `yogesh660/ml-model-zoo` at the Phase 0 import commit
- Source boundary: `ml-model-zoo` is read-only; all future work belongs here
- Curriculum: 379 live lessons, 50 model lessons, 329 concept lessons, and 18 planned pages
- Build output: 107 hours of generated learning material
- Deployment: GitHub Pages is not enabled yet; deployment policy is being prepared before activation

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
```

The pull-request validation workflow runs the foundation tests, rebuilds the site, and checks generated local links. Production deployment is currently restricted to `main`; GitHub Pages will be enabled only after repository governance and deployment settings are reviewed.

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

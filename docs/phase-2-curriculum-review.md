# Phase 2: repository-aware curriculum review

Phase 2 starts with deterministic review primitives for the Teacher and
Curriculum Designer workflows. The audit reads the current curriculum and
lesson source files, reports structural facts, and flags lessons for human
review. It does not rewrite production content and does not call an external
AI provider.

Run it from the repository root:

```bash
node scripts/academy/curriculum-audit.js reports/phase-2-curriculum-audit.json
node scripts/academy/curriculum-audit.js reports/phase-2-curriculum-audit.json --strict
```

The report records paths, modules, live and planned lesson counts, duplicate
IDs, orphan lessons, broken references, missing required fields, and simple
teacher-review candidates. A human Principal must approve any curriculum or
lesson change derived from the report.

Researcher work is deliberately separate: source-backed research reports must
include links, dates, and evidence before they can become curriculum input.


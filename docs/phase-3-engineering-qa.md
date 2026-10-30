# Phase 3: engineering and QA controls

Phase 3 adds a deterministic generated-output report and pull-request review
evidence. The QA report checks that curriculum entries have generated pages,
local links resolve, and generated pages no longer reference the read-only
source repository.

Run it from the repository root:

```bash
node scripts/academy/qa-report.js reports/phase-3-qa-report.json
node scripts/academy/qa-report.js reports/phase-3-qa-report.json --strict
```

The report is evidence for a pull request. It does not deploy, merge, or
rewrite content. Browser-level checks remain available through
`scripts/dev/check.py` and should be run for changes affecting labs,
walkthroughs, diagrams, or responsive layout.


# Phase 5: academic analytics

Phase 5 begins with repository-level analytics only. It aggregates the Phase 2
curriculum audit and Phase 3 QA report into a privacy-safe summary. It does not
read student records, browser `localStorage`, assessment answers, or provider
telemetry.

```bash
node scripts/academy/analytics-report.js reports/phase-5-analytics-report.json
```

Student learning analytics require the Phase 4 backend, consent, retention,
access-control, and data-minimisation decisions first. Until those exist,
analytics must remain limited to curriculum and engineering evidence.


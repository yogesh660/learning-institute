# Phase 6: Academy Command Center

The first command-center slice is intentionally manual and read-only. It
combines the curriculum, QA, and privacy-safe analytics reports into one
status snapshot. Budget-ledger integrations can add the metadata-only limits
and remaining-capacity snapshot from `BudgetLedger.snapshot()`.

```bash
node scripts/academy/status.js reports/phase-6-status.json
```

The status workflow passes its freshly generated evidence directory explicitly;
the snapshot therefore does not silently fall back to stale committed reports.
If a local `.academy/tasks.json` exists, the snapshot includes only task counts
by status, never task payloads. It does not merge pull requests, enable GitHub
Pages, call AI providers, or read student data. A future dashboard can replace
this report after the backend, authentication, audit retention, and approval
model are settled. If `ACADEMY_BUDGET_SNAPSHOT` points to a metadata-only
`BudgetLedger.snapshot()` JSON file, the report also includes quota capacity;
otherwise it explicitly marks budget data unavailable.
If `ACADEMY_AUDIT_LOG` is supplied, only its hash-chain validity and entry count
are reported; raw audit events are never included in the snapshot.


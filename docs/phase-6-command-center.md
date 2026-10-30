# Phase 6: Academy Command Center

The first command-center slice is intentionally manual and read-only. It
combines the curriculum, QA, and privacy-safe analytics reports into one
status snapshot.

```bash
node scripts/academy/status.js reports/phase-6-status.json
```

It does not merge pull requests, enable GitHub Pages, call AI providers, or
read student data. A future dashboard can replace this report after the
backend, authentication, audit retention, and approval model are settled.


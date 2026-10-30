#!/usr/bin/env node
// Phase 6 manual command-center snapshot. It reads committed evidence only.
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const files = {
  curriculum: 'reports/phase-2-curriculum-audit.json',
  qa: 'reports/phase-3-qa-report.json',
  analytics: 'reports/phase-5-analytics-report.json',
};
const evidence = {};
for (const [name, file] of Object.entries(files)) {
  const full = path.join(ROOT, file);
  evidence[name] = fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf8')) : null;
}
const snapshot = {
  phase: 6,
  repository: 'yogesh660/learning-institute',
  mode: 'manual, read-only snapshot',
  evidence,
  deployment: { branch: 'main', pagesEnabled: false, automaticMerge: false },
  approvals: { productionChangesRequirePrincipal: true, studentDataFeaturesRequirePrivacyReview: true },
};
const output = process.argv[2] || path.join(ROOT, 'reports', 'phase-6-status.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${path.relative(ROOT, output)}: command-center snapshot`);


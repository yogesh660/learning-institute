#!/usr/bin/env node
// Phase 6 manual command-center snapshot. It reads committed evidence only.
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const EVIDENCE_ROOT = process.env.ACADEMY_EVIDENCE_DIR
  ? path.resolve(process.env.ACADEMY_EVIDENCE_DIR)
  : ROOT;
const files = {
  curriculum: 'reports/phase-2-curriculum-audit.json',
  qa: 'reports/phase-3-qa-report.json',
  analytics: 'reports/phase-5-analytics-report.json',
};
const evidence = {};
for (const [name, file] of Object.entries(files)) {
  const generated = path.join(EVIDENCE_ROOT, path.basename(file));
  const full = fs.existsSync(generated) ? generated : path.join(ROOT, file);
  evidence[name] = fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf8')) : null;
}
const taskStore = process.env.ACADEMY_TASK_STORE
  ? path.resolve(process.env.ACADEMY_TASK_STORE)
  : path.join(ROOT, '.academy', 'tasks.json');
let taskQueue = { available: false, total: 0, byStatus: {} };
if (fs.existsSync(taskStore)) {
  const tasks = JSON.parse(fs.readFileSync(taskStore, 'utf8'));
  const byStatus = {};
  for (const task of Object.values(tasks)) {
    const status = typeof task.status === 'string' ? task.status : 'unknown';
    byStatus[status] = (byStatus[status] || 0) + 1;
  }
  taskQueue = { available: true, total: Object.keys(tasks).length, byStatus };
}
let budgets = { available: false, data: null };
if (process.env.ACADEMY_BUDGET_SNAPSHOT) {
  const budgetPath = path.resolve(process.env.ACADEMY_BUDGET_SNAPSHOT);
  if (fs.existsSync(budgetPath)) {
    const data = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
    budgets = { available: true, data };
  }
}
const snapshot = {
  phase: 6,
  repository: 'yogesh660/learning-institute',
  mode: 'manual, read-only snapshot',
  evidence,
  taskQueue,
  budgets,
  agentOperations: {
    providerCallsEnabled: false,
    productionMergeEnabled: false,
    payloadsIncluded: false,
  },
  deployment: { branch: 'main', pagesEnabled: false, automaticMerge: false },
  approvals: { productionChangesRequirePrincipal: true, studentDataFeaturesRequirePrivacyReview: true },
};
const output = process.argv[2] || path.join(ROOT, 'reports', 'phase-6-status.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${path.relative(ROOT, output)}: command-center snapshot`);


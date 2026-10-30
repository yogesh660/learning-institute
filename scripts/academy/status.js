#!/usr/bin/env node
// Phase 6 manual command-center snapshot. It reads committed evidence only.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
let audit = { available: false, valid: true, entries: 0 };
if (process.env.ACADEMY_AUDIT_LOG) {
  const auditPath = path.resolve(process.env.ACADEMY_AUDIT_LOG);
  if (fs.existsSync(auditPath)) {
    const lines = fs.readFileSync(auditPath, 'utf8').split(/\r?\n/).filter(Boolean);
    audit = { available: true, valid: true, entries: lines.length };
    let previous = '0'.repeat(64);
    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        if (!('_hash' in record) || !('_prev_hash' in record)) {
          previous = crypto.createHash('sha256').update(line, 'utf8').digest('hex');
          continue;
        }
        const unsigned = Object.fromEntries(Object.entries(record).filter(([key]) => key !== '_hash'));
        const canonical = JSON.stringify(sortKeys(unsigned));
        const digest = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
        if (record._prev_hash !== previous || record._hash !== digest) audit.valid = false;
        previous = record._hash;
      } catch { audit.valid = false; }
    }
  }
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortKeys(value[key])]));
  }
  return value;
}
const snapshot = {
  phase: 6,
  repository: 'yogesh660/learning-institute',
  mode: 'manual, read-only snapshot',
  evidence,
  taskQueue,
  budgets,
  audit,
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


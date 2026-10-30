#!/usr/bin/env node
// Phase 5 analytics over repository evidence only. No student records are read.
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');

function read(name) {
  const file = path.join(ROOT, name);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

const curriculum = read('reports/phase-2-curriculum-audit.json');
const qa = read('reports/phase-3-qa-report.json');
const report = {
  phase: 5,
  scope: 'curriculum and platform evidence only',
  privacy: { studentDataRead: false, personalDataRead: false, providerCallsMade: false },
  curriculum: curriculum ? {
    lessons: curriculum.totals.sourceLessons,
    live: curriculum.totals.curriculumLive,
    planned: curriculum.totals.planned,
    paths: curriculum.totals.paths,
    modules: curriculum.totals.modules,
    teacherReviewCandidates: curriculum.checks.teacherReviewCandidates.length,
    structuralStatus: curriculum.checks.structuralStatus,
  } : null,
  engineering: qa ? {
    expectedPages: qa.totals.expectedPages,
    plannedPages: qa.totals.plannedPages,
    qaStatus: qa.checks.status,
  } : null,
  recommendations: [],
};
if (report.curriculum?.planned > 0) report.recommendations.push('Prioritise planned lessons only after curriculum and academic review.');
if (report.curriculum?.teacherReviewCandidates > 0) report.recommendations.push('Have a Teacher agent review the flagged lessons before editing content.');
if (report.engineering?.qaStatus !== 'pass') report.recommendations.push('Resolve engineering QA failures before production deployment.');
if (!report.recommendations.length) report.recommendations.push('No repository-level recommendation was generated.');

const output = process.argv[2] || path.join(ROOT, 'reports', 'phase-5-analytics-report.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${path.relative(ROOT, output)}: privacy-safe repository analytics`);


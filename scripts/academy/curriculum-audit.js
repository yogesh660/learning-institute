#!/usr/bin/env node
// Deterministic Phase 2 curriculum review. It reports facts from the repository;
// it does not rewrite lessons or call an external model provider.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const FILES = ['concepts', 'regression', 'classification', 'clustering', 'neural', 'sequences', 'language', 'statistics', 'datascience', 'mltoolbox', 'deeplearning', 'vision', 'nlp', 'ai'];
const lessons = FILES.flatMap(file => require(path.join(ROOT, 'content', `${file}.js`)).map(lesson => ({ ...lesson, source: `content/${file}.js` })));
const curriculum = require(path.join(ROOT, 'content', 'curriculum.js'));
const byId = new Map();
const duplicateIds = [];
for (const lesson of lessons) {
  if (byId.has(lesson.id)) duplicateIds.push(lesson.id);
  byId.set(lesson.id, lesson);
}

const liveIds = new Set();
const planned = [];
const paths = curriculum.map(track => ({
  id: track.id,
  title: track.title,
  track: track.track,
  modules: track.modules.map(module => {
    const live = module.lessons.filter(entry => typeof entry === 'string');
    const waiting = module.lessons.filter(entry => Array.isArray(entry)).map(entry => ({ title: entry[0], tier: entry[1] }));
    live.forEach(id => liveIds.add(id));
    planned.push(...waiting.map(entry => ({ ...entry, path: track.title, module: module.title })));
    return { title: module.title, live: live.length, planned: waiting.length, lessonIds: live, plannedLessons: waiting };
  }),
}));

const references = [];
for (const lesson of lessons) {
  for (const field of ['related', 'prereq', 'concepts', 'usedBy']) {
    for (const id of lesson[field] || []) references.push({ from: lesson.id, field, id });
  }
}
const brokenReferences = references.filter(ref => !byId.has(ref.id) && !planned.some(item => slug(item.title) === ref.id));
const orphanLessons = lessons.filter(lesson => !liveIds.has(lesson.id)).map(lesson => lesson.id);
const missing = [];
const review = [];
for (const lesson of lessons) {
  const required = ['id', 'title', 'summary', 'lead', 'code', 'keywords'];
  for (const field of required) if (!lesson[field]) missing.push({ lesson: lesson.id, field });
  if (!Number.isInteger(lesson.level) || lesson.level < 1 || lesson.level > 3) missing.push({ lesson: lesson.id, field: 'level' });
  if (!Number.isFinite(lesson.minutes) || lesson.minutes <= 0) missing.push({ lesson: lesson.id, field: 'minutes' });
  const notes = [];
  if (String(lesson.summary || '').length < 80) notes.push('short summary');
  if (!Array.isArray(lesson.steps) || lesson.steps.length < 3) notes.push('fewer than three steps');
  if (!Array.isArray(lesson.quiz) || lesson.quiz.length < 1) notes.push('no quiz');
  if (!Array.isArray(lesson.related) || lesson.related.length < 1) notes.push('no related lesson');
  if (notes.length) review.push({ lesson: lesson.id, source: lesson.source, notes });
}

function slug(title) {
  return title.replace(/ ⚙$/, '').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const report = {
  phase: 2,
  purpose: 'Repository-aware curriculum review',
  sourceOfTruth: 'content/*.js and content/curriculum.js',
  totals: { sourceLessons: lessons.length, curriculumLive: liveIds.size, planned: planned.length, paths: curriculum.length, modules: paths.reduce((n, track) => n + track.modules.length, 0) },
  paths,
  checks: {
    duplicateIds,
    orphanLessons,
    brokenReferences,
    missingRequiredFields: missing,
    teacherReviewCandidates: review,
    structuralStatus: duplicateIds.length || orphanLessons.length || brokenReferences.length || missing.length ? 'needs-review' : 'pass',
  },
  policy: { modifiesProductionContent: false, externalResearchIncluded: false, humanApprovalRequired: true },
};

const output = process.argv[2] || path.join(ROOT, 'reports', 'phase-2-curriculum-audit.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${path.relative(ROOT, output)}: ${lessons.length} lessons, ${planned.length} planned, status=${report.checks.structuralStatus}`);
if (process.argv.includes('--strict') && report.checks.structuralStatus !== 'pass') process.exitCode = 1;


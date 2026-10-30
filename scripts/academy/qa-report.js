#!/usr/bin/env node
// Deterministic Phase 3 engineering/QA report for generated output.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const FILES = ['concepts', 'regression', 'classification', 'clustering', 'neural', 'sequences', 'language', 'statistics', 'datascience', 'mltoolbox', 'deeplearning', 'vision', 'nlp', 'ai'];
const lessons = FILES.flatMap(file => require(path.join(ROOT, 'content', `${file}.js`)));
const curriculum = require(path.join(ROOT, 'content', 'curriculum.js'));
const sourceIds = new Set(lessons.map(lesson => lesson.id));
const expected = [];
const planned = [];
for (const track of curriculum) for (const module of track.modules) for (const entry of module.lessons) {
  if (typeof entry === 'string') {
    const lesson = lessons.find(item => item.id === entry);
    expected.push(`${lesson.task === 'concepts' ? 'concepts' : 'models'}/${entry}/index.html`);
  } else planned.push(`concepts/${slug(entry[0])}/index.html`);
}

const missing = [...expected, ...planned].filter(file => !fs.existsSync(path.join(ROOT, file)));
const pages = ['index.html', ...expected, ...planned];
const brokenLinks = [];
for (const file of pages) {
  if (!fs.existsSync(path.join(ROOT, file))) continue;
  const base = path.dirname(file);
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const url of html.matchAll(/(?:href|src)="([^"#:?]+)(?:[?#][^"]*)?"/g)) {
    const target = url[1];
    if (target.startsWith('http') || target.startsWith('mailto') || target.startsWith('/')) continue;
    let resolved = path.normalize(path.join(base, target));
    if (target.endsWith('/')) resolved = path.join(resolved, 'index.html');
    if (!fs.existsSync(path.join(ROOT, resolved))) brokenLinks.push({ file, target });
  }
}
const staleSourceLinks = pages.filter(file => fs.readFileSync(path.join(ROOT, file), 'utf8').includes('github.com/yogesh660/ml-model-zoo'));
const report = {
  phase: 3,
  totals: { sourceLessons: lessons.length, expectedPages: expected.length, plannedPages: planned.length },
  checks: { missingGeneratedPages: missing, brokenLinks, staleSourceLinks, status: missing.length || brokenLinks.length || staleSourceLinks.length ? 'fail' : 'pass' },
  policy: { modifiesProductionContent: false, requiresPullRequestEvidence: true, deploymentBranch: 'main' },
};
const output = process.argv[2] || path.join(ROOT, 'reports', 'phase-3-qa-report.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${path.relative(ROOT, output)}: status=${report.checks.status}`);
if (process.argv.includes('--strict') && report.checks.status !== 'pass') process.exitCode = 1;

function slug(title) {
  return title.replace(/ ⚙$/, '').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}


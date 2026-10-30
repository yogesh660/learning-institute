#!/usr/bin/env node
// Writes the data behind the Learn Hub Tracker dashboard: one row per lesson (live and planned), one per
// path, one per module, plus site totals and branch status.
//
//   node scripts/dev/tracker.js [out-dir]     default out-dir: /tmp/learn-tracker
//
// Branch rows come from `merge-queue.js status --json`, so run it from the repo root with the
// content/* branches fetched (merge-queue fetches them itself).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const out = path.resolve(process.argv[2] || '/tmp/learn-tracker');
fs.mkdirSync(out, { recursive: true });
const FILES = ['concepts', 'regression', 'classification', 'clustering', 'neural', 'sequences', 'language', 'statistics', 'datascience', 'mltoolbox', 'deeplearning', 'vision', 'nlp', 'ai'];
const TRACKS = { stats: 'Statistics', ml: 'Machine learning', ds: 'Data science', dl: 'Deep learning', cv: 'Computer vision', nlp: 'NLP', ai: 'AI' };
const LEVELS = ['', 'Beginner', 'Intermediate', 'Advanced'];
const SITE = 'https://yogesh660.github.io/ml-model-zoo/';
const slug = t => t.replace(/ ⚙$/, '').normalize('NFKD').toLowerCase().replace(/[̀-ͯ]/g, '').replace(/['’]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const plain = s => String(s || '').replace(/\$+([^$]*)\$+/g, '$1').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const byId = {};
for (const f of FILES) for (const l of require(path.resolve('content', f))) byId[l.id] = { ...l, file: f };
const curriculum = require(path.resolve('content/curriculum.js'));
// curriculum.js swaps a planned entry for its id once the lesson is written, which drops its tier; load a copy
// that keeps every entry as [title, tier] to recover it. Lessons listed by id from the start are "Original".
const TIER = {};
{
  const src = fs.readFileSync('content/curriculum.js', 'utf8').replace("LIVE.has(slug(x)) ? slug(x) : [x, tier]", '[x, tier]');
  const m = { exports: {} };
  new Function('module', 'exports', 'require', src)(m, m.exports, f => require(path.resolve('content', f)));
  for (const p of m.exports) for (const md of p.modules) for (const e of md.lessons) if (Array.isArray(e)) TIER[slug(e[0])] = e[1];
}

// which labs, walkthroughs and diagrams the browser scripts actually register: run them in a sandbox with
// stubbed browser globals and read the keys of root.Labs.*
const REG = (() => {
  const vm = require('vm');
  const any = () => new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : k === Symbol.iterator ? function* () {} : any(), apply: () => any(), construct: () => any() });
  const root = { Lab: any(), Algo: any(), Labs: {}, matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }), devicePixelRatio: 1, TextEncoder, TextDecoder };
  const ctx = vm.createContext({ window: root, document: any(), console: { log() {}, warn() {}, error() {} }, TextEncoder, TextDecoder });
  for (const f of ['models', 'sequences', 'concepts', 'language', 'explainers', 'architecture']) {
    try { vm.runInContext(fs.readFileSync(`assets/labs/${f}.js`, 'utf8'), ctx); } catch (e) { console.warn(`could not load assets/labs/${f}.js: ${e.message}`); }
  }
  const L = root.Labs;
  return { lab: new Set([...Object.keys(L.models || {}), ...Object.keys(L.concepts || {})]), ex: new Set(Object.keys(L.explainers || {})), arch: new Set(Object.keys(L.architectures || {})) };
})();
// extra lab files a lesson names with labFile register into Labs.concepts/models too; they are loaded above only
// if they are one of the standard files, so treat a labFile lesson as having its lab
const n = a => (Array.isArray(a) ? a.filter(Boolean).length : 0);
const yes = b => (b ? 'Yes' : 'No');
// every section a lesson page can show, in page order: [field, label, applies to models, applies to concepts]
const SECTIONS = [
  ['s_idea', 'The idea', 1, 1], ['s_analogy', 'In everyday terms', 1, 1], ['s_how', 'How it works', 1, 1], ['s_arch', 'The architecture', 1, 1],
  ['s_watch', 'Watch it work', 1, 1], ['s_lab', 'Try it', 1, 1], ['s_try', 'Things to try', 1, 1], ['s_maths', 'The maths', 1, 1],
  ['s_hyper', 'Hyperparameters', 1, 0], ['s_when', 'When to use it', 1, 0], ['s_takeaways', 'Key takeaways', 0, 1], ['s_code', 'In code', 1, 1],
  ['s_pitfalls', 'Common pitfalls', 1, 1], ['s_results', 'On real data', 1, 0], ['s_quiz', 'Check yourself', 1, 1], ['s_related', 'Related lessons', 1, 1],
  ['s_glance', 'At a glance', 1, 1], ['s_prereq', 'Before this (prerequisites)', 1, 1], ['s_keywords', 'Search keywords', 1, 1],
];
function pageSections(l, isModel) {
  const hasLab = !l.noLab && (REG.lab.has(l.id) || !!l.labFile);
  const s = {
    s_idea: n(l.intuition), s_analogy: yes(l.analogy), s_how: n(l.steps),
    s_arch: l.architecture ? (REG.arch.has(l.architecture) ? 'Yes' : 'Broken') : 'No',
    s_watch: l.explainer ? (REG.ex.has(l.explainer) ? 'Yes' : 'Broken') : 'No',
    s_lab: l.noLab ? 'No' : hasLab ? 'Yes' : 'Empty', s_try: l.noLab ? null : n(l.tryThis), s_maths: n(l.math),
    s_hyper: isModel ? n(l.hyper) : null,
    s_when: isModel ? ([n(l.pros), n(l.cons), l.use, l.avoid].filter(Boolean).length === 4 ? 'Yes' : [n(l.pros), n(l.cons), l.use, l.avoid].some(Boolean) ? 'Partial' : 'No') : null,
    s_takeaways: isModel ? null : n(l.keyPoints),
    s_code: l.code ? l.code.trim().split('\n').length : 0, s_pitfalls: n(l.pitfalls),
    s_results: isModel ? yes(fs.existsSync(`models/${l.id}/metrics.json`)) : null,
    s_quiz: n(l.quiz), s_related: new Set([...(l.related || []), ...(l.concepts || []), ...(l.usedBy || [])].filter(x => x !== l.id)).size,
    s_glance: isModel ? (l.glance && l.glance.family && l.glance.learns && l.complexity && l.complexity[0] && l.complexity[1] ? 'Yes' : 'Partial') : 'Yes',
    s_prereq: n(l.prereq), s_keywords: yes(l.keywords),
  };
  // a section counts as there when it is Yes or a count above zero; optional extras (architecture, walkthrough,
  // prerequisites) never count as missing
  const optional = new Set(['s_arch', 's_watch', 's_prereq']);
  const due = SECTIONS.filter(([f, , m, c]) => (isModel ? m : c) && !optional.has(f) && !(f === 's_try' && l.noLab) && !(f === 's_lab' && l.noLab));
  const ok = v => v === 'Yes' || (typeof v === 'number' && v > 0);
  const missing = due.filter(([f]) => !ok(s[f])).map(([, label]) => label);
  return { ...s, sections_done: due.length - missing.length, sections_due: due.length, missing: missing.join(', ') };
}

// a lesson is "Complete" once it is live with a full levelled quiz (12 questions, every one tagged d:1–3)
const lessons = [];
for (const p of curriculum) p.modules.forEach((m, mi) => m.lessons.forEach(e => {
  const base = { path: `${p.num} ${p.title}`, path_id: p.id, track: TRACKS[p.track], module: m.title, module_no: mi + 1, order: lessons.length + 1 };
  if (Array.isArray(e)) {
    const id = slug(e[0]);
    lessons.push({ ...base, id, title: e[0].replace(/ ⚙$/, ''), status: 'Planned', tier: e[1], kind: 'Concept', level: '', minutes: null, questions: 0, q_easy: 0, q_medium: 0, q_hard: 0, q_untagged: 0, lab: /⚙$/.test(e[0]) ? 'Planned' : 'No', walkthrough: 'No', diagram: 'No', real_data: 'No', ...Object.fromEntries(SECTIONS.map(([f]) => [f, null])), sections_done: 0, sections_due: 0, missing: 'Not written yet', file: '', url: `${SITE}concepts/${id}/` });
    return;
  }
  const l = byId[e], q = l.quiz || [], d = [0, 0, 0, 0];
  q.forEach(x => d[[1, 2, 3].includes(x.d) ? x.d : 0]++);
  const kind = l.task === 'concepts' ? 'concepts' : 'models';
  const status = q.length >= 12 && d[0] === 0 ? 'Complete' : 'Live';
  lessons.push({ ...base, id: l.id, title: plain(l.title), status, tier: TIER[l.id] || 'Original', kind: kind === 'models' ? 'Model' : 'Concept', level: LEVELS[l.level], minutes: l.minutes, questions: q.length, q_easy: d[1], q_medium: d[2], q_hard: d[3], q_untagged: d[0], lab: l.noLab ? 'No' : (REG.lab.has(l.id) || l.labFile) ? 'Yes' : 'Empty', walkthrough: l.explainer ? 'Yes' : 'No', diagram: l.architecture ? 'Yes' : 'No', real_data: fs.existsSync(`models/${l.id}/metrics.json`) ? 'Yes' : 'No', ...pageSections(l, kind === 'models'), file: `content/${l.file}.js`, url: `${SITE}${kind}/${l.id}/` });
}));

const tally = rows => {
  const live = rows.filter(r => r.status !== 'Planned');
  const n = k => live.reduce((s, r) => s + (r[k] || 0), 0);
  return {
    lessons: rows.length, live: live.length, complete: rows.filter(r => r.status === 'Complete').length, live_only: rows.filter(r => r.status === 'Live').length, planned: rows.length - live.length,
    planned_core: rows.filter(r => r.status === 'Planned' && r.tier === 'Core').length, planned_extended: rows.filter(r => r.status === 'Planned' && r.tier === 'Extended').length, planned_capstone: rows.filter(r => r.status === 'Planned' && r.tier === 'Capstone').length,
    beginner: live.filter(r => r.level === 'Beginner').length, intermediate: live.filter(r => r.level === 'Intermediate').length, advanced: live.filter(r => r.level === 'Advanced').length,
    minutes: n('minutes'), questions: n('questions'), q_easy: n('q_easy'), q_medium: n('q_medium'), q_hard: n('q_hard'), q_untagged: n('q_untagged'),
    labs: live.filter(r => r.lab === 'Yes').length, labs_planned: rows.filter(r => r.lab === 'Planned').length, walkthroughs: live.filter(r => r.walkthrough === 'Yes').length, diagrams: live.filter(r => r.diagram === 'Yes').length, real_data: live.filter(r => r.real_data === 'Yes').length,
    short_quiz: live.filter(r => r.questions < 12).length,
    labs_empty: live.filter(r => r.lab === 'Empty').length, pages_full: live.filter(r => r.sections_due && r.sections_done === r.sections_due).length,
    sections_done: n('sections_done'), sections_due: n('sections_due'),
  };
};
const paths = curriculum.map(p => ({ path: `${p.num} ${p.title}`, path_id: p.id, track: TRACKS[p.track], modules: p.modules.length, ...tally(lessons.filter(r => r.path_id === p.id)) }));
const modules = [];
curriculum.forEach(p => p.modules.forEach((m, mi) => modules.push({ key: `${p.id}/${mi + 1}`, path: `${p.num} ${p.title}`, module: m.title, ...tally(lessons.filter(r => r.path_id === p.id && r.module_no === mi + 1)) })));

const mq = JSON.parse(execSync('node scripts/dev/merge-queue.js status --json', { maxBuffer: 1 << 26 }).toString());
const onGithub = new Set(mq.branches.map(b => b.branch));
let prev = [];
try { prev = JSON.parse(fs.readFileSync(path.join(out, 'branches.json'), 'utf8')); } catch (e) { /* first run */ }
// a lesson branch keeps the lesson count it had when first tracked, so merged = that count - pending
const prevBy = Object.fromEntries(prev.map(r => [r.branch, r]));
const today = new Date().toISOString().slice(0, 10);
const branches = mq.branches.map(b => {
  if (b.kind !== 'lessons') return { branch: b.branch, kind: b.kind === 'quizzes' ? 'Quizzes' : 'Other', new_lessons: null, merged: null, pending: null, on_github: true, status: b.done ? 'Ready to delete' : 'In progress', last_checked: today };
  const p = prevBy[b.branch], total = p && p.new_lessons != null ? p.new_lessons : b.pending, merged = Math.max(0, total - b.pending);
  return { branch: b.branch, kind: 'Lessons', new_lessons: total, merged, pending: b.pending, on_github: true, status: b.done ? 'Ready to delete' : merged === 0 ? 'Not started' : 'In progress', last_checked: today };
});
// branches that were tracked before but have since been deleted on GitHub stay in the list as "Deleted"
for (const r of prev) if (!onGithub.has(r.branch)) branches.push({ ...r, status: 'Deleted', on_github: false, pending: 0 });

const t = tally(lessons);
const summary = [{ live_lessons: t.live, planned_left: t.planned, written_not_merged: mq.summary.writtenButNotMerged, total_lessons: t.lessons, complete: t.complete, questions: t.questions, minutes: t.minutes, paths: paths.length, modules: modules.length, commit: execSync('git rev-parse --short HEAD').toString().trim(), generated: new Date().toISOString() }];

// the Learn hub landing page (index.html), section by section, read from the built file
const hub = (() => {
  const html = fs.readFileSync('index.html', 'utf8');
  const has = re => re.test(html);
  const count = re => (html.match(re) || []).length;
  const grab = re => { const m = html.match(re); return m ? m[1].replace(/&amp;/g, '&').trim() : ''; };
  const stat = label => { const m = html.match(new RegExp(`data-count="(\\d+)"[^>]*>[^<]*</strong><span>${label}`)); return m ? +m[1] : null; };
  const live = t.live, labs = t.labs, rows = [];
  const add = (area, item, present, shows, check, note) => rows.push({ order: rows.length + 1, area, item, present: present ? 'Yes' : 'No', shows: String(shows), check: present ? check || 'OK' : 'Missing', note: note || '' });
  const modelsN = lessons.filter(r => r.status !== 'Planned' && r.kind === 'Model').length, conceptsN = live - modelsN;
  add('Top bar', 'Site navigation', has(/<nav id="nav">/), 'Shared portfolio nav');
  add('Hero', 'Availability line', has(/class="availability/), grab(/class="availability[^>]*><i><\/i>([^<]*)/), grab(/class="availability[^>]*><i><\/i>(\d+)/) == live ? 'OK' : 'Issue', 'Live and planned counts');
  add('Hero', 'Headline and intro', has(/Learn ML/), 'Learn ML by doing');
  add('Hero', 'Start learning / Browse lessons buttons', has(/Start learning/) && has(/Browse lessons/), 'Two call-to-action buttons');
  add('Hero', 'Live decision-boundary canvas', has(/id="hero-canvas"/), 'Animated canvas');
  const hs = [stat('Models'), stat('Core concepts'), stat('Learning paths'), stat('Of material')];
  add('Hero', 'Inside the curriculum stats', hs.every(v => v != null), `${hs[0]} models · ${hs[1]} concepts · ${hs[2]} paths · ${hs[3]} h`, hs[0] === modelsN && hs[1] === conceptsN && hs[2] === paths.length ? 'OK' : 'Issue');
  add('Hero', 'Continue where you left off', has(/id="continue"/), 'Resumes the next unfinished lesson (saved in the browser)');
  add('Hero', 'Quick links to paths', has(/class="quick-links"/), `${count(/class="quick-links"[\s\S]*?<\/div>/g) && (html.match(/class="quick-links">([\s\S]*?)<\/div>/) || ['', ''])[1].split('<a ').length - 1} paths`);
  add('Hero', 'Lessons completed counter', has(/id="done-count"/), 'Progress kept in the browser, no login');
  add('Hero', 'Lesson marquee', has(/class="marquee"/), `${count(/<span>[^<]*<\/span><i><\/i>/g) / 2} lesson names scrolling`);
  const lab = stat('lessons, each with its own live lab');
  add('01 How it works', 'Intro and headline stats', lab != null, `${lab} lessons, each with its own live lab · ${stat('paths, ordered from beginner to advanced')} paths · 0 sign-ups`, lab === labs ? 'OK' : 'Issue', lab === labs ? '' : `Says every lesson has a live lab, but ${labs} of ${live} do`);
  add('02 Learning paths', 'Path cards', has(/class="paths">/), `${count(/class="case-card path-card/g)} cards with progress meter and Start path`, count(/class="case-card path-card/g) === paths.length ? 'OK' : 'Issue');
  const filt = count(/class="filter[^"]*" type="button" data-task=/g);
  add('03 Curriculum', 'Subject filter buttons', filt > 0, `${filt} buttons (All + ${filt - 1} tracks)`);
  add('03 Curriculum', 'Level filter buttons', count(/class="filter" type="button" data-level=/g) === 3, 'Beginner · Intermediate · Advanced');
  add('03 Curriculum', 'Search box', has(/id="q"/), 'Searches titles, ideas and keywords');
  const rowsN = count(/class="lesson-row/g), plannedRows = count(/class="lesson-row planned-row/g);
  add('03 Curriculum', 'Syllabus rows', rowsN > 0, `${rowsN} rows (${rowsN - plannedRows} live, ${plannedRows} planned)`, rowsN === lessons.length ? 'OK' : 'Issue');
  add('03 Curriculum', 'Path headers in the syllabus', count(/class="syl-path/g) > 0, `${count(/class="syl-path/g)} paths`, count(/class="syl-path/g) === paths.length ? 'OK' : 'Issue');
  const full = lessons.filter(r => r.status !== 'Planned' && !r.missing).length;
  add('04 Inside every lesson', 'Six steps cards', count(/class="standard"/g) === 6, `${count(/class="standard"/g)} cards`, 'OK', `${full} of ${live} live pages have every section due for their kind`);
  add('05 Datasets', 'Dataset cards', count(/class="data-card/g) > 0, `${count(/class="data-card/g)} datasets with shape, target, lessons and CSV link`);
  add('06 Roadmap', 'Track cards (Coming next)', count(/class="project reveal"/g) > 0, `${count(/class="project reveal"/g)} tracks with live and planned counts`);
  add('Footer', 'Contact block', has(/id="contact"/), 'Have a hard problem?');
  add('Footer', 'Footer', has(/<footer>/), 'Shared portfolio footer');
  add('Behaviour', 'Mark as complete on lesson pages', has(/learn\.js/), 'Saved in localStorage; no account');
  add('Behaviour', 'Search index', has(/window\.LEARN = /), (() => { try { const n = JSON.parse(html.match(/window\.LEARN = (.*?);<\/script>/s)[1]).lessons.length; return `${n} lessons in the index`; } catch (e) { return 'Could not read'; } })());
  add('Not built yet', 'Practice-test builder', false, 'Roadmap step 3', 'Planned');
  add('Not built yet', 'Report box and analytics', false, 'Roadmap step 4', 'Planned');
  add('Not built yet', 'Login (Google or Facebook) and dashboards', false, 'Roadmap steps 5 and 6', 'Planned');
  for (const r of rows) if (r.area === 'Not built yet') r.check = 'Planned';
  return rows;
})();

const sec = SECTIONS.map(([f, label, m, c]) => {
  const rows = lessons.filter(r => r.status !== 'Planned' && (r.kind === 'Model' ? m : c));
  const ok = v => v === 'Yes' || (typeof v === 'number' && v > 0);
  const rel = rows.filter(r => r[f] !== null && r[f] !== undefined);
  return { field: f, section: label, applies_to: m && c ? 'All lessons' : m ? 'Models' : 'Concepts', lessons: rel.length, present: rel.filter(r => ok(r[f])).length, missing: rel.filter(r => !ok(r[f])).length, avg_items: rel.some(r => typeof r[f] === 'number') ? Math.round(rel.reduce((a, r) => a + (typeof r[f] === 'number' ? r[f] : 0), 0) / rel.length * 10) / 10 : null };
});

for (const [name, rows] of Object.entries({ lessons, paths, modules, branches, summary, hub, sections: sec })) fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(rows));
console.log(`wrote ${out}: ${lessons.length} lessons (${t.live} live, ${t.complete} complete, ${t.planned} planned), ${paths.length} paths, ${modules.length} modules, ${branches.length} branches`);

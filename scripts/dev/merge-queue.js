#!/usr/bin/env node
// Brings lessons written on Antigravity's content/* branches into the working tree a few at a time.
//
//   node scripts/dev/merge-queue.js status [--json]   branches, how many lessons are still to bring in, deletable ones
//   node scripts/dev/merge-queue.js take [N]          bring in the next N planned lessons (default 5), build, print review notes
//
// A lesson counts as merged once its id exists in content/*.js on the working tree. Existing lessons are
// never overwritten. curriculum.js turns a planned entry into a live one by itself, so only content/*.js changes.
// Run from the repo root on feature/learn-hub with a clean tree.
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sh = (c, o = {}) => execSync(c, { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'], ...o }).toString();
const FILES = ['concepts', 'regression', 'classification', 'clustering', 'neural', 'sequences', 'language', 'statistics', 'datascience', 'mltoolbox', 'deeplearning', 'vision', 'nlp', 'ai'];
const load = src => { const m = { exports: {} }; new Function('module', 'exports', 'require', src)(m, m.exports, require); return m.exports; };
const slug = t => t.replace(/ ⚙$/, '').normalize('NFKD').toLowerCase().replace(/[̀-ͯ]/g, '').replace(/['’]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// split a content file into its top-level lesson objects. A small scanner that knows about strings,
// template literals and comments finds each object inside `module.exports = [ ... ]`, whatever the
// indentation or formatting, and the object is evaluated to read its id.
function blocks(src) {
  const out = new Map(), start = src.indexOf('module.exports');
  let i = src.indexOf('[', start), depth = 0, objStart = -1, quote = null;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue; }
    if (c === '/' && n === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '/' && n === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '{' || c === '[') { depth++; if (c === '{' && depth === 2) objStart = i; }
    else if (c === '}' || c === ']') {
      if (c === '}' && depth === 2 && objStart >= 0) {
        const text = src.slice(objStart, i + 1);
        try { const o = new Function('r', 'return ' + text)(String.raw); if (o && o.id) out.set(o.id, text); } catch (e) { out.set('UNPARSABLE:' + objStart, text); }
        objStart = -1;
      }
      depth--;
      if (depth === 0) break;
    }
  }
  return out;
}

function fetchBranches() {
  sh("git fetch origin '+refs/heads/content/*:refs/remotes/origin/content/*' '+refs/heads/feature/*:refs/remotes/origin/feature/*' --prune");
  return sh("git for-each-ref --format='%(refname:short)|%(committerdate:unix)' refs/remotes/origin/content refs/remotes/origin/feature")
    .split('\n').filter(Boolean).map(l => { const [ref, t] = l.split('|'); return { ref, name: ref.replace(/^origin\//, ''), time: +t }; })
    .filter(b => b.name !== 'feature/learn-hub');
}

function liveIds() {
  const ids = new Set();
  for (const f of FILES) for (const l of load(fs.readFileSync(`content/${f}.js`, 'utf8'))) ids.add(l.id);
  return ids;
}

function plannedOrder() { // [{id,title,tier,path,module}] in curriculum order, planned (not yet live) only
  delete require.cache[require.resolve(path.resolve('content/curriculum.js'))];
  const out = [];
  for (const p of require(path.resolve('content/curriculum.js'))) for (const m of p.modules) for (const e of m.lessons) {
    if (Array.isArray(e)) out.push({ id: slug(e[0]), title: e[0].replace(/ ⚙$/, ''), tier: e[1], path: p.title, module: m.title });
  }
  return out;
}

// every branch's lessons: Map id -> [{branch, file, text, time}]. Files are parsed once per distinct blob.
let CACHE = null;
function branchLessons(branches) {
  if (CACHE) return CACHE;
  const all = new Map(), perBranch = {}, parsed = new Map();
  const head = {}; for (const f of FILES) head[f] = sh(`git rev-parse HEAD:content/${f}.js`).trim();
  for (const b of branches.filter(x => x.name.startsWith('content/'))) {
    perBranch[b.name] = [];
    for (const f of FILES) {
      let blob; try { blob = sh(`git rev-parse ${b.ref}:content/${f}.js`).trim(); } catch (e) { continue; }
      if (blob === head[f]) continue; // identical to the working tree: nothing new in it
      if (!parsed.has(blob)) parsed.set(blob, blocks(sh(`git cat-file blob ${blob}`)));
      for (const [id, text] of parsed.get(blob)) {
        if (id.startsWith('UNPARSABLE')) continue; // lessons built from file-level helpers are existing ones
        perBranch[b.name].push(id);
        if (!all.has(id)) all.set(id, []);
        all.get(id).push({ branch: b.name, file: f, text, time: b.time });
      }
    }
  }
  return (CACHE = { all, perBranch });
}

function status(json) {
  const branches = fetchBranches(), live = liveIds(), { perBranch } = branchLessons(branches);
  const planned = new Set(plannedOrder().map(p => p.id));
  const rows = [];
  for (const b of branches) {
    if (b.name.startsWith('content/')) {
      const ids = perBranch[b.name], pending = ids.filter(i => !live.has(i));
      const wanted = pending.filter(i => planned.has(i)), odd = pending.filter(i => !planned.has(i));
      rows.push({ branch: b.name, kind: 'lessons', total: ids.length, merged: ids.length - pending.length, pending: wanted.length, unplanned: odd, done: pending.length === 0 });
    } else if (b.name.startsWith('feature/quizzes-')) {
      const ahead = +sh(`git rev-list --count origin/main..${b.ref}`).trim();
      rows.push({ branch: b.name, kind: 'quizzes', ahead, done: ahead === 0 });
    } else rows.push({ branch: b.name, kind: 'other', done: false });
  }
  const left = plannedOrder(), written = branchLessons(branches).all;
  const summary = { liveLessons: live.size, plannedLeft: left.length, writtenButNotMerged: left.filter(p => written.has(p.id)).length };
  if (json) return console.log(JSON.stringify({ summary, branches: rows }, null, 1));
  console.log(`live lessons ${summary.liveLessons} | planned left ${summary.plannedLeft} | written on branches, not merged ${summary.writtenButNotMerged}`);
  for (const r of rows) console.log(`${r.done ? 'DELETE ' : 'keep   '} ${r.branch.padEnd(78)} ${r.kind === 'lessons' ? `${r.merged}/${r.total} merged, ${r.pending} pending${r.unplanned.length ? `, ${r.unplanned.length} unplanned ids` : ''}` : r.kind === 'quizzes' ? `${r.ahead} commits not in main` : ''}`);
}

function take(n) {
  const branches = fetchBranches(), live = liveIds(), { all } = branchLessons(branches);
  const queue = plannedOrder().filter(p => all.has(p.id) && !live.has(p.id)).slice(0, n);
  if (!queue.length) return console.log('Nothing left to bring in from content/* branches.');
  const touched = new Map(), taken = [];
  for (const q of queue) {
    const versions = all.get(q.id).sort((a, b) => b.time - a.time), v = versions[0];
    const distinct = new Set(versions.map(x => x.text)).size;
    if (!touched.has(v.file)) touched.set(v.file, fs.readFileSync(`content/${v.file}.js`, 'utf8'));
    let src = touched.get(v.file);
    const at = src.lastIndexOf('\n];');
    if (at < 0) throw new Error(`content/${v.file}.js has no closing "];"`);
    const head = src.slice(0, at).replace(/\s+$/, '');
    touched.set(v.file, head + (head.endsWith(',') || head.endsWith('[') ? '' : ',') + '\n  ' + v.text + ',' + src.slice(at));
    taken.push({ ...q, file: v.file, branch: v.branch, variants: distinct });
  }
  for (const [f, src] of touched) fs.writeFileSync(`content/${f}.js`, src);
  console.log(`Brought in ${taken.length}: ${taken.map(t => t.id).join(', ')}\n`);
  const b = spawnSync('node', ['scripts/build.js'], { encoding: 'utf8' });
  process.stdout.write(b.stdout.split('\n').filter(l => /warn|US spelling|built/i.test(l)).join('\n') + '\n');
  if (b.status !== 0) { console.log('BUILD FAILED:\n' + (b.stderr || '').split('\n').slice(0, 8).join('\n') + '\nFix the named lesson (or undo with: git checkout -- content) and rerun.'); process.exit(2); }
  // review notes
  const byId = {}; for (const f of FILES) for (const l of load(fs.readFileSync(`content/${f}.js`, 'utf8'))) byId[l.id] = l;
  const tmp = path.join(require('os').tmpdir(), 'lesson-code.py');
  for (const t of taken) {
    const l = byId[t.id], notes = [];
    if (l.code) { fs.writeFileSync(tmp, l.code); const r = spawnSync('python3', ['-I', '-c', 'import ast,sys;ast.parse(open(sys.argv[1]).read())', tmp], { encoding: 'utf8' }); if (r.status !== 0) notes.push('PYTHON CODE DOES NOT PARSE: ' + (r.stderr.trim().split('\n').pop())); }
    const qs = l.quiz || [], dup = qs.filter((q, i) => qs.findIndex(x => x.q.trim() === q.q.trim()) !== i).length;
    if (dup) notes.push(`${dup} duplicate quiz question(s)`);
    const hist = [0, 0, 0, 0]; qs.forEach(q => hist[q.a]++);
    console.log(`=== ${t.id} | ${t.path} / ${t.module} | ${t.tier} | from ${t.branch}${t.variants > 1 ? ` (${t.variants} different versions on branches, newest used)` : ''}`);
    console.log(`    ${l.minutes} min, ${qs.length} questions (answers A-D: ${hist.join('/')}), ${(l.math || []).length} maths blocks, lab: ${l.noLab ? 'no' : 'yes'}${notes.length ? '\n    ' + notes.join('\n    ') : ''}`);
    const hard = qs.filter(q => q.d === 3).slice(0, 4);
    for (const q of (hard.length ? hard : qs.slice(-3))) console.log(`    HARD? ${q.q.replace(/\s+/g, ' ').slice(0, 330)}\n      => ${q.o[q.a].replace(/\s+/g, ' ').slice(0, 160)} | ${q.why.replace(/\s+/g, ' ').slice(0, 420)}`);
  }
  console.log('\nFiles changed: ' + [...touched.keys()].map(f => `content/${f}.js`).join(', ') + ' + rebuilt HTML. Review, fix, then commit.');
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'status') status(process.argv.includes('--json'));
else if (cmd === 'take') take(Math.max(1, parseInt(arg, 10) || 5));
else console.log('usage: merge-queue.js status [--json] | take [N]');

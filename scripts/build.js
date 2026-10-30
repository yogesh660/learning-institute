// Builds the Learn hub (index.html) and every lesson page from content/.
// No dependencies:  node scripts/build.js
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };

const PATHS = require('../content/curriculum');
const LESSONS = [
  ...require('../content/concepts'),
  ...require('../content/regression'),
  ...require('../content/classification'),
  ...require('../content/clustering'),
  ...require('../content/neural'),
  ...require('../content/sequences'),
  ...require('../content/language'),
  ...require('../content/statistics'),
  ...require('../content/datascience'),
  ...require('../content/mltoolbox'),
  ...require('../content/deeplearning'),
  ...require('../content/vision'),
  ...require('../content/nlp'),
  ...require('../content/ai'),
];

const SITE = 'https://yogesh660.github.io/';
const PROFILE = {
  name: 'Yogesh Awate', email: 'awateyogeshs@gmail.com',
  linkedin: 'https://www.linkedin.com/in/yogesh-s-awate/', github: 'https://github.com/yogesh660',
  medium: 'https://medium.com/@yogeshinawate', twitter: 'https://twitter.com/YogeshSAwate1',
};
const REPO = 'https://github.com/yogesh660/ml-model-zoo';
const VERSION = Date.now().toString(36);
const YEAR = new Date().getFullYear();

// ------------------------------------------------------------------ icons (same set as the portfolio)
const ICONS = {
  arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
  back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.1-1.2-.3-2.5-1-3.5.3-1.1.3-2.4 0-3.5 0 0-1 0-3 1.5a10.5 10.5 0 0 0-8 0C6 2 5 2 5 2c-.3 1.1-.3 2.4 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.4.5-.7 1-.9 1.6-.2.6-.2 1.3-.1 1.9v4"/><path d="M9 18c-4.5 2-5-2-7-2"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  play: '<path d="M6 4v16l14-8z"/>',
  idea: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  lab: '<path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7 15h10"/>',
  sigma: '<path d="M18 7V4H6l6 8-6 8h12v-3"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  quiz: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  warn: '<path d="m10.3 3.9-8.2 14A2 2 0 0 0 3.8 21h16.4a2 2 0 0 0 1.7-3.1l-8.2-14a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  data: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
};
const icon = n => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = s => String(s).replace(/<[^>]+>/g, '').replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/\$+([^$]*)\$+/g, (m, t) => t.replace(/\\[a-zA-Z]+/g, '').replace(/[{}^_\\]/g, '')).replace(/\s+/g, ' ').trim();
// Short one-line blurb for hub rows and search: the first sentence, capped at about 160 characters.
const blurb = s => {
  const t = plain(s), re = /[.!?](?=\s|$)/g;
  let m, first = t;
  while ((m = re.exec(t))) if (!/\b(e\.g|i\.e|etc|vs|cf|approx|al|Fig)$/i.test(t.slice(0, m.index))) { first = t.slice(0, m.index + 1); break; }
  return first.length <= 170 ? first : first.slice(0, 160).replace(/\s+\S*$/, '') + '…';
};
const LEVELS = ['', 'Beginner', 'Intermediate', 'Advanced'];
const level = l => `<span class="lvl" data-l="${l}"><i><b></b></i>${LEVELS[l]}</span>`;

// ------------------------------------------------------------------ index the curriculum
const byId = Object.fromEntries(LESSONS.map(l => [l.id, l]));
const ORDER = [];      // live lessons, in learning order
const PLANNED = [];    // planned lessons: a "coming soon" page each
const seen = new Set();
const slug = t => t.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/['\u2019]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
PATHS.forEach(p => {
  p.count = 0; p.live = 0; p.planned = 0; p.minutes = 0; p.items = [];
  p.modules.forEach(m => {
    m.items = m.lessons.map(entry => {
      p.count++;
      let l;
      if (Array.isArray(entry)) {
        const title = entry[0].replace(/ \u2699$/, ''), id = slug(title);
        if (byId[id] || seen.has(id)) throw new Error(`planned lesson "${title}" clashes with id "${id}"`);
        seen.add(id);
        l = { id, title, short: title, planned: true, tier: entry[1], lab: / \u2699$/.test(entry[0]), kind: 'concepts', level: 0, minutes: 0, task: p.track, summary: 'Planned lesson' };
        p.planned++; PLANNED.push(l);
      } else {
        if (!byId[entry]) throw new Error(`curriculum lists unknown lesson "${entry}"`);
        if (seen.has(entry)) throw new Error(`lesson "${entry}" appears twice in the curriculum`);
        seen.add(entry);
        l = byId[entry];
        l.kind = l.task === 'concepts' ? 'concepts' : 'models';
        p.live++; p.minutes += l.minutes;
        ORDER.push(l);
      }
      Object.assign(l, { path: p, module: m.title, pathIndex: p.count });
      p.items.push(l);
      return l;
    });
  });
});
LESSONS.forEach(l => { if (!seen.has(l.id)) throw new Error(`lesson "${l.id}" is not placed in any path`); });
// ------------------------------------------------------------------ lesson checks
// Fails the build on a malformed lesson; spelling slips only warn. `noLab: true` lets a lesson skip the lab.
const prose = v => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(prose) : v && typeof v === 'object' ? Object.values(v).flatMap(prose) : []);
const US = /\b(normaliz\w*|optimiz\w*|regulariz\w*|generaliz\w*|visualiz\w*|summariz\w*|categoriz\w*|standardiz\w*|minimiz\w*|maximiz\w*|parameteriz\w*|behavior\w*|colors?|centers?|analyz\w*|labeled|modeling|modeled|neighbors?|favorite|license)\b/gi;
function checkLesson(l) {
  const e = [], need = (ok, msg) => { if (!ok) e.push(msg); };
  const str = k => typeof l[k] === 'string' && l[k].trim().length > 0, arr = (k, min = 1) => Array.isArray(l[k]) && l[k].length >= min;
  ['id', 'short', 'title', 'summary', 'lead', 'analogy', 'code', 'keywords'].forEach(k => need(str(k), `missing text field "${k}"`));
  need(Number.isInteger(l.level) && l.level >= 1 && l.level <= 3, 'level must be 1, 2 or 3');
  need(Number.isFinite(l.minutes) && l.minutes > 0, 'minutes must be a positive number');
  need(arr('intuition', 1), 'intuition needs at least 1 paragraph');
  need(arr('steps', 3), 'steps needs at least 3 items');
  need(arr('math', 1) && l.math.every(m => m && m.h && m.tex && m.p), 'every math entry needs h, tex and p');
  need(arr('pitfalls', 1), 'pitfalls needs at least 1 item');
  need(arr('quiz', 1) && l.quiz.every(q => q && q.q && Array.isArray(q.o) && q.o.length === 4 && Number.isInteger(q.a) && q.a >= 0 && q.a < 4 && q.why), 'every quiz entry needs q, 4 options in o, a (0-3) and why; at least 1 question');
  need(arr('related', 1), 'related needs at least 1 lesson id');
  if (l.task === 'concepts') { need(arr('keyPoints', 2), 'concepts need keyPoints (at least 2)'); need(arr('usedBy', 0), 'concepts need usedBy (may be empty)'); }
  else ['hyper', 'pros', 'cons'].forEach(k => need(arr(k), `models need "${k}"`));
  if (!l.noLab) need(str('labIntro') && arr('tryThis', 1), 'a lesson with a lab needs labIntro and at least 1 tryThis item (or set noLab: true)');
  const bad = [...new Set(prose([l.summary, l.lead, l.intuition, l.analogy, l.steps, l.math, l.pitfalls, l.quiz, l.keyPoints]).flatMap(t => (t.replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$2').replace(/\$[^$]*\$/g, '').match(US) || []).map(w => w.toLowerCase())))];
  return { errors: e, spelling: bad };
}
{
  const problems = [], spelled = [];
  LESSONS.forEach(l => { const r = checkLesson(l); if (r.errors.length) problems.push(`${l.id}:\n    - ${r.errors.join('\n    - ')}`); if (r.spelling.length) spelled.push(`${l.id}: ${r.spelling.join(', ')}`); });
  if (spelled.length) console.warn(`spelling (British, please): ${spelled.join(' | ')}`);
  if (problems.length) throw new Error(`lesson checks failed:\n  ${problems.join('\n  ')}`);
}
const hrefFromRoot = l => `${l.kind}/${l.id}/`;
const totalMinutes = ORDER.reduce((s, l) => s + l.minutes, 0);
const N_MODELS = ORDER.filter(l => l.kind === 'models').length, N_CONCEPTS = ORDER.filter(l => l.kind === 'concepts').length;

// ------------------------------------------------------------------ text helpers
// [[id]] and [[id|text]] become links; maths gets its <, > and & escaped so KaTeX sees them intact
function rich(s, rootRel) {
  if (!s) return '';
  let out = String(s).replace(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g, m => m.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  out = out.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, id, text) => {
    const l = byId[id] || PLANNED.find(x => x.id === id); // a link to a planned lesson goes to its "coming soon" page
    if (!l) throw new Error(`unknown lesson link [[${id}]]`);
    return `<a class="inline" href="${rootRel}${hrefFromRoot(l)}">${text || l.short}</a>`;
  });
  return out;
}

function highlightPython(code) {
  const re = /(#[^\n]*)|("""[\s\S]*?"""|f?"(?:[^"\\\n]|\\.)*"|f?'(?:[^'\\\n]|\\.)*')|\b(import|from|as|def|return|for|in|if|else|elif|while|class|with|lambda|None|True|False|and|or|not|print|range|len|super|self)\b|\b(\d+\.?\d*(?:e-?\d+)?)\b|\b([A-Za-z_]\w*)(?=\()/g;
  let out = '', last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    if (m[1]) out += `<span class="c">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="s">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="k">${esc(m[3])}</span>`;
    else if (m[4]) out += `<span class="n">${esc(m[4])}</span>`;
    else out += `<span class="f">${esc(m[5])}</span>`;
    last = re.lastIndex;
  }
  return out + esc(code.slice(last));
}

const SKIP_API = new Set(['StandardScaler', 'OneHotEncoder', 'PolynomialFeatures', 'GridSearchCV', 'TransformedTargetRegressor', 'StratifiedKFold', 'TimeSeriesSplit', 'GroupKFold', 'CountVectorizer', 'CalibratedClassifierCV', 'ConfusionMatrixDisplay', 'SelectKBest', 'Pipeline', 'LinearRegression']);
function apiName(l) {
  if (!l.code) return '';
  const imported = [];
  l.code.split('\n').forEach(line => {
    const m = line.match(/^\s*from\s+([\w.]+)\s+import\s+(.+)$/) || line.match(/^\s*import\s+([\w.]+)(?:\s+as\s+\w+)?/);
    if (m && m[2]) m[2].split(',').forEach(n => imported.push({ mod: m[1], name: n.trim().split(/\s+as\s+/)[0] }));
  });
  const cands = imported.filter(x => /^[A-Z]/.test(x.name) && !SKIP_API.has(x.name) && new RegExp(`\\b${x.name}\\(`).test(l.code));
  if (l.id === 'ols_linear_regression') return 'sklearn.linear_model.LinearRegression';
  if (l.id === 'xgboost_regressor') return 'xgboost.XGBRegressor';
  if (l.id === 'lightgbm_regressor') return 'lightgbm.LGBMRegressor';
  if (l.id === 'convolutional_neural_networks') return 'torch.nn.Conv2d';
  if (l.id === 'recurrent_neural_networks') return 'torch.nn.RNN';
  if (l.id === 'gru_networks') return 'torch.nn.GRU';
  if (l.id === 'lstm_networks') return 'torch.nn.LSTM';
  if (l.id === 'transformer_networks') return 'torch.nn.TransformerEncoder';
  return cands.length ? `${cands[0].mod}.${cands[0].name}` : '';
}

// ------------------------------------------------------------------ shared shell
function shell({ rootRel, title, description, bodyClass, lessonId, main, extraHead = '', extraScripts = '' }) {
  // Same five links as the portfolio, so Work, Learn and Play read as one site. Root-relative,
  // so page transitions stay same-origin whichever domain serves the user site.
  const learnHome = rootRel || './';
  const nav = [
    ['Work', '/work/'], ['Learn', learnHome, true], ['Play', '/featured-games/'], ['About', '/about/'], ['Contact', '#contact'],
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#070709">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${SITE}assets/yogesh-suit-cutout.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${rootRel}assets/site.css?v=${VERSION}">
<link rel="stylesheet" href="${rootRel}assets/learn.css?v=${VERSION}">
${extraHead}<script>document.documentElement.classList.add('js')</script>
</head>
<body class="${bodyClass}"${lessonId ? ` data-lesson="${lessonId}"` : ''}>
<a class="skip" href="#main">Skip to content</a>

<nav id="nav">
  <div class="brand"><a class="mark" href="/" aria-label="${PROFILE.name}, home">YA<span>.</span></a><a class="brand-sub" href="${learnHome}">Learn</a></div>
  <div class="navlinks" id="navlinks">
    ${nav.map(([t, h, on]) => `<a href="${h}"${on ? ' class="active" aria-current="page"' : ''}>${t}</a>`).join('\n    ')}
    <a class="pill" href="mailto:${PROFILE.email}?subject=R%C3%A9sum%C3%A9%20request">Request résumé ${icon('arrow')}</a>
  </div>
  <button class="menu" id="menu" aria-label="Open menu" aria-expanded="false" aria-controls="navlinks">${icon('menu')}</button>
</nav>

<main id="main">
${main}
</main>

<section id="contact" class="contact">
  <span class="tag reveal">Let's connect</span>
  <h2 class="reveal">Have a hard problem?<br><span>Let's make it simple.</span></h2>
  <a class="email reveal" href="mailto:${PROFILE.email}">${PROFILE.email} ${icon('arrow')}</a>
  <div class="socials reveal">
    <a href="${PROFILE.linkedin}" target="_blank" rel="noopener">${icon('linkedin')} LinkedIn</a>
    <a href="${PROFILE.github}" target="_blank" rel="noopener">${icon('github')} GitHub</a>
    <a href="${PROFILE.medium}" target="_blank" rel="noopener">${icon('pen')} Medium</a>
    <a href="${PROFILE.twitter}" target="_blank" rel="noopener">${icon('arrow')} X / Twitter</a>
  </div>
</section>

<footer>
  <a class="mark" href="/">YA<span>.</span></a>
  <div class="footlinks"><a href="/work/">Work</a><a href="${learnHome}">Learn</a><a href="/featured-games/">Play</a><a href="/about/">About</a></div>
  <span>© ${YEAR} ${PROFILE.name.toUpperCase()}</span>
</footer>

<script src="${rootRel}assets/site.js?v=${VERSION}" defer></script>
${extraScripts}<script src="${rootRel}assets/learn.js?v=${VERSION}" defer></script>
</body>
</html>
`;
}

// ------------------------------------------------------------------ datasets (for the hub)
const DATASETS = [
  { file: 'california_housing', name: 'California housing', task: 'Regression', target: 'MedHouseVal', text: 'Census block groups with income, house age, rooms, occupancy and location. The target is median house value (in $100k).', lessons: ['ols_linear_regression', 'ridge_regression', 'random_forest_regressor', 'exploratory-data-analysis'] },
  { file: 'diabetes', name: 'Diabetes progression', task: 'Regression', target: 'Target', text: 'Ten baseline measurements (age, BMI, blood pressure, six blood serum values) and a disease-progression score one year later.', lessons: ['lasso_regression', 'elastic_net', 'gradient_boosting_regressor'] },
  { file: 'collinear_housing', name: 'Collinear housing', task: 'Regression', target: 'Price', text: 'House size, bedrooms, bathrooms and lot size: features that move together on purpose, to show what multicollinearity does to linear models.', lessons: ['ridge_regression', 'exploratory-data-analysis'] },
  { file: 'titanic', name: 'Titanic survival', task: 'Classification', target: 'Survived', text: 'Passenger class, sex, age, family aboard and fare. A small, imbalanced binary problem with a strong categorical signal.', lessons: ['logistic_regression', 'decision_tree_classifier', 'confusion-matrix'] },
  { file: 'breast_cancer', name: 'Breast cancer', task: 'Classification', target: 'Diagnosis', text: 'Eight cell-nucleus measurements from biopsy images and a benign/malignant label. Several features are almost perfectly correlated.', lessons: ['support_vector_classifier', 'linear_discriminant_analysis', 'roc-auc'] },
  { file: 'mall_customers', name: 'Mall customers', task: 'Clustering', target: 'none (unsupervised)', text: 'Gender, age, annual income and a spending score for retail customers: the classic segmentation playground.', lessons: ['kmeans_clustering', 'dbscan_clustering', 'gaussian_mixture_models'] },
];
DATASETS.forEach(d => {
  const lines = read(`datasets/raw/${d.file}.csv`).trim().split(/\r?\n/);
  d.rows = lines.length - 1; d.cols = lines[0].split(',');
});

// ------------------------------------------------------------------ hub
const TRACKS = [['stats', 'Statistics'], ['ml', 'Machine learning'], ['ds', 'Data science'], ['dl', 'Deep learning'], ['cv', 'Vision'], ['nlp', 'Language'], ['ai', 'AI']];
const countText = p => p.planned ? `${p.live ? `${p.live} live · ` : ''}${p.planned} planned` : `${p.live} lessons`;
function hub() {
  const rootRel = '';
  const first = ORDER[0];
  const marquee = ORDER.filter((_, i) => i % 2 === 0).map(l => `<span>${esc(l.short)}</span><i></i>`).join('');
  const lessonRow = (l, i) => `
            <li class="lesson-row${l.planned ? ' planned-row' : ''}" data-id="${l.id}" data-task="${l.path.track}" data-level="${l.level}">
              <span class="idx">${String(l.pathIndex).padStart(2, '0')}</span>
              <span class="ttl"><b><a href="${hrefFromRoot(l)}">${esc(l.short)}</a></b><em>${l.planned ? `Planned · ${l.tier}${l.lab ? ' · live lab' : ''}` : esc(blurb(l.summary))}</em></span>
              <span class="meta"><span class="done">${icon('check')}</span>${l.planned ? '<span class="soon">Planned</span>' : level(l.level)}<span>${l.planned ? '' : `${l.minutes} min`}</span></span>
            </li>`;
  const syllabus = PATHS.map(p => `
      <section class="syl-path reveal" id="path-${p.id}" data-tasks="${p.track}">
        <header>
          <span class="num">Path ${p.num} · ${esc(p.kicker)}</span>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.blurb)}</p>
          <div data-path-progress="${p.id}"><div class="meter-label"><span data-progress-text>${countText(p)}</span><span>${p.live ? `≈ ${Math.round(p.minutes / 60 * 2) / 2} h` : 'Coming soon'}</span></div><div class="meter"><i></i></div></div>
          <a class="text-link" href="${hrefFromRoot(p.items.find(l => !l.planned) || p.items[0])}">${p.live ? 'Start path' : 'See the plan'} ${icon('arrow')}</a>
        </header>
        <div class="modules">${p.modules.map(m => `
          <details class="module" open>
            <summary><span><small>Module</small><b>${esc(m.title)}</b></span><span class="path-meta"><span>${m.items.length} ${m.items.length === 1 ? 'lesson' : 'lessons'}</span>${icon('chev').replace('class="i"', 'class="i chev"')}</span></summary>
            <ol class="lessons">${m.items.map(lessonRow).join('')}
            </ol>
          </details>`).join('')}
        </div>
      </section>`).join('');

  const pathCards = PATHS.map(p => {
    const live = p.items.filter(l => !l.planned);
    const shown = (live.length ? live : p.items).slice(0, 4);
    const range = live.length ? ` · ${LEVELS[Math.min(...live.map(l => l.level))]} → ${LEVELS[Math.max(...live.map(l => l.level))]}` : '';
    return `
      <article class="case-card path-card spot reveal${p.live ? '' : ' path-soon'}" id="paths-${p.id}">
        <div class="row"><small>Path ${p.num} · ${esc(p.kicker)}</small><span class="num">${p.count} lessons</span></div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.blurb)}</p>
        <ol>${shown.map((l, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${esc(l.short)}</li>`).join('')}${p.count > shown.length ? `<li class="more-li">+ ${p.count - shown.length} more</li>` : ''}</ol>
        <div data-path-progress="${p.id}" style="margin-top:auto"><div class="meter-label"><span data-progress-text>${countText(p)}</span><span>${p.live ? `≈ ${Math.round(p.minutes / 60 * 2) / 2} h${range}` : 'Coming soon'}</span></div><div class="meter"><i></i></div></div>
        <a class="more" data-start href="${hrefFromRoot(live[0] || p.items[0])}"><span data-start-label>${p.live ? 'Start path' : 'See the plan'}</span> ${icon('arrow')}</a>
      </article>`;
  }).join('');

  const tasks = [['all', 'All', ORDER.length + PLANNED.length], ...TRACKS.map(([k, t]) => [k, t, PATHS.filter(p => p.track === k).reduce((n, p) => n + p.count, 0)])];

  const inside = [
    ['01', 'Intuition first', 'Every lesson opens with the idea in plain words and an everyday analogy, before a single symbol appears.'],
    ['02', 'A live lab', 'The real algorithm, written from scratch and running in your browser. Move a slider and it retrains.'],
    ['03', 'The maths, properly', 'Objectives, update rules and derivations, typeset and explained line by line.'],
    ['04', 'The trade-offs', 'Hyperparameters, strengths, weaknesses and when not to use it, the part most tutorials skip.'],
    ['05', 'Code you can run', 'scikit-learn (or PyTorch) snippets against the datasets in this repository, plus the pitfalls to watch for.'],
    ['06', 'Check yourself', 'Short questions with explanations, and progress that is remembered in your browser.'],
  ];

  const data = {
    lessons: [...ORDER, ...PLANNED].map(l => ({ id: l.id, href: hrefFromRoot(l), title: plain(l.title), short: l.short, summary: blurb(l.summary), path: l.path.id, pathTitle: l.path.title, module: l.module, level: l.level, minutes: l.minutes, task: l.path.track, keywords: l.keywords || '', ...(l.planned ? { planned: true, tier: l.tier } : {}) })),
    paths: PATHS.map(p => ({ id: p.id, lessons: p.items.filter(l => !l.planned).map(l => l.id), planned: p.planned })),
  };

  const main = `
<header class="hero learn-hero">
  <div class="hero-stage" aria-hidden="true"><i></i><i></i><i></i></div>

  <div class="hero-card hero-intro">
    <p class="availability rise" style="--d:1"><i></i>${ORDER.length} live lessons · ${PLANNED.length} planned · free</p>
    <p class="kicker rise" style="--d:2">Machine learning, from first principles</p>
    <h1><span class="line"><span class="rise" style="--d:3">Learn ML</span></span><span class="line"><span class="rise dim" style="--d:4">by doing.</span></span></h1>
    <p class="focus rise" style="--d:5">Every algorithm explained in plain words, derived properly, and running live in your browser. ${PATHS.length} paths across statistics, machine learning, data science, deep learning, vision, language and AI, with new lessons landing in batches.</p>
    <div class="actions rise" style="--d:6">
      <a class="button light" href="${hrefFromRoot(first)}">Start learning ${icon('arrow')}</a>
      <a class="button ghost" href="#curriculum">Browse lessons</a>
    </div>
  </div>

  <figure class="hero-visual" aria-hidden="true">
    <div class="hero-name">LEARN</div>
    <canvas id="hero-canvas"></canvas>
    <figcaption>A decision boundary, drawn live</figcaption>
  </figure>

  <aside class="hero-card hero-side rise" style="--d:7">
    <small>Inside the curriculum</small>
    <div class="hero-stats">
      <div><strong data-count="${N_MODELS}">${N_MODELS}</strong><span>Models</span></div>
      <div><strong data-count="${N_CONCEPTS}">${N_CONCEPTS}</strong><span>Core concepts</span></div>
      <div><strong data-count="${PATHS.length}">${PATHS.length}</strong><span>Learning paths</span></div>
      <div><strong data-count="${Math.round(totalMinutes / 60)}" data-suffix=" h">${Math.round(totalMinutes / 60)} h</strong><span>Of material</span></div>
    </div>
    <a class="side-cta" id="continue" href="${hrefFromRoot(first)}">${icon('play')} <span data-label>Start lesson 1: ${esc(first.short)}</span> ${icon('arrow')}</a>
    <div class="quick-links">
      ${PATHS.filter(p => p.live).slice(1, 4).map(p => `<a href="#path-${p.id}">${esc(p.title)} ${icon('arrow')}</a>`).join('\n      ')}
    </div>
    <span class="where" id="done-count">Open source · progress stays in your browser</span>
  </aside>
</header>

<div class="marquee" aria-hidden="true"><div class="track">${marquee}${marquee}</div></div>

<section class="section intro">
  <div class="intro-grid">
    <div class="reveal">
      <span class="tag">01 / How it works</span>
      <p class="big">A learning hub for the models data scientists actually use. Each lesson takes one idea from intuition to maths to working code, and lets you break it in a live lab until it makes sense.</p>
      <a class="text-link" href="${REPO}" target="_blank" rel="noopener">Source on GitHub ${icon('arrow')}</a>
    </div>
    <div class="stats reveal">
      <div><strong data-count="${ORDER.length}">${ORDER.length}</strong><span>lessons, each with its own live lab</span></div>
      <div><strong data-count="${PATHS.length}">${PATHS.length}</strong><span>paths, ordered from beginner to advanced</span></div>
      <div><strong data-count="0">0</strong><span>sign-ups, trackers or paywalls</span></div>
    </div>
  </div>
</section>

<section class="section band" id="paths">
  <div class="inner">
    <div class="head reveal">
      <div><span class="tag">02 / Learning paths</span><h2>Pick a path.</h2></div>
      <p>New to machine learning? Start with Foundations. Already comfortable? Jump straight to the family of models you need.</p>
    </div>
    <div class="paths">${pathCards}
    </div>
  </div>
</section>

<section class="section" id="curriculum">
  <div class="head reveal">
    <div><span class="tag">03 / Curriculum</span><h2>The full syllabus.</h2></div>
    <p>Every lesson in learning order, live and planned. Filter by subject or level, or search by name, idea or keyword.</p>
  </div>
  <div class="toolbar reveal">
    <div class="filters" role="group" aria-label="Filter by subject">
      ${tasks.map(([k, t, n], i) => `<button class="filter${i ? '' : ' on'}" type="button" data-task="${k}">${t} <b>${n}</b></button>`).join('\n      ')}
    </div>
    <label class="search"><span class="sr-only" hidden>Search lessons</span>${icon('search')}<input id="q" type="search" placeholder="Search lessons, e.g. kernel, overfitting, trees" autocomplete="off" aria-label="Search lessons"><kbd>/</kbd></label>
  </div>
  <div class="toolbar reveal" style="margin-top:-18px">
    <div class="filters level-filter" role="group" aria-label="Filter by level">
      ${[1, 2, 3].map(l => `<button class="filter" type="button" data-level="${l}">${level(l)}</button>`).join('\n      ')}
    </div>
  </div>
  <p class="result-note" id="result-note" aria-live="polite"></p>
  <div class="syllabus" id="syllabus">${syllabus}
  </div>
  <div class="results" id="results" hidden></div>
</section>

<section class="section band">
  <div class="inner">
    <div class="head reveal">
      <div><span class="tag">04 / Inside every lesson</span><h2>Six steps, every time.</h2></div>
      <p>The same structure in all ${ORDER.length} lessons, so you always know where to find the intuition, the maths and the code.</p>
    </div>
    <div class="standards six reveal">${inside.map(([n, t, d]) => `
      <div class="standard"><span class="num">${n}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="section" id="datasets">
  <div class="head reveal">
    <div><span class="tag">05 / Datasets</span><h2>Small datasets you can read.</h2></div>
    <p>Synthetic teaching samples modelled on well-known datasets: a few hundred rows each, cleaner and easier than the originals, and stored in the repository so every script runs offline.</p>
  </div>
  <div class="data-grid">${DATASETS.map(d => `
    <article class="data-card spot reveal">
      <span class="status">${icon('data')} ${d.task}</span>
      <h3>${esc(d.name)}</h3>
      <p>${esc(d.text)}</p>
      <dl>
        <dt>Shape</dt><dd>${d.rows} rows × ${d.cols.length} columns</dd>
        <dt>Target</dt><dd><code class="no-math">${esc(d.target)}</code></dd>
        <dt>Used in</dt><dd>${d.lessons.map(id => `<a class="kicker-link" href="${hrefFromRoot(byId[id])}">${esc(byId[id].short)}</a>`).join(', ')}</dd>
      </dl>
      <a class="text-link" href="${REPO}/blob/main/datasets/raw/${d.file}.csv" target="_blank" rel="noopener">View CSV ${icon('arrow')}</a>
    </article>`).join('')}
  </div>
</section>

<section class="section band" id="roadmap">
  <div class="inner">
    <div class="head reveal">
      <div><span class="tag">06 / Roadmap</span><h2>Coming next.</h2></div>
      <p>The full syllabus is mapped out: ${PLANNED.length} more lessons are planned, and each gets a page now so you can see where it fits. They are written in batches, Core lessons first, each with the same six steps and a live lab.</p>
    </div>
    <div class="planned">${TRACKS.map(([k, t]) => { const ps = PATHS.filter(p => p.track === k); const live = ps.reduce((n, p) => n + p.live, 0), pl = ps.reduce((n, p) => n + p.planned, 0); return `
      <article class="project reveal"><div class="row"><span class="status"><i></i>${pl ? 'Planned' : 'Complete'}</span></div><h3>${t}</h3><p>${live} live · ${pl} planned across ${ps.map(p => esc(p.title)).join(', ')}.</p><a class="text-link" href="#path-${ps[0].id}">See ${ps.length === 1 ? 'the path' : 'the paths'} ${icon('arrow')}</a></article>`; }).join('')}
    </div>
  </div>
</section>

<script>window.LEARN = ${JSON.stringify(data)};</script>`;

  return shell({
    rootRel, bodyClass: 'page-learn',
    title: 'Learn machine learning · Yogesh Awate',
    description: `${ORDER.length} interactive lessons on statistics and machine learning: ${N_MODELS} models and ${N_CONCEPTS} core concepts, each with intuition, maths, code and a live lab.`,
    main,
  });
}

// ------------------------------------------------------------------ lesson page
function metricsSection(l, rootRel) {
  const f = path.join(ROOT, 'models', l.id, 'metrics.json');
  if (!fs.existsSync(f)) return '';
  let m; try { m = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return ''; }
  if (!m || !m.metrics || !m.dataset) return '';
  const rows = Object.entries(m.metrics).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(typeof v === 'number' ? (Math.abs(v) < 10 ? v.toFixed(3) : v.toFixed(1)) : v)}</td><td>${m.baseline && m.baseline[k] !== undefined ? esc(typeof m.baseline[k] === 'number' ? m.baseline[k].toFixed(3) : m.baseline[k]) : '–'}</td></tr>`).join('');
  return `
      <section class="reveal" id="results">
        <h2 class="h3"><span>08</span> On real data</h2>
        <p>${esc(m.summary || `Trained on ${m.dataset} with a held-out test set.`)}</p>
        <div class="table-wrap" style="margin-top:18px"><table class="kv results-table">
          <thead><tr><th>Metric</th><th>${esc(m.model_label || l.short)}</th><th>${esc(m.baseline_label || 'Baseline')}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <p class="note">Produced by <a href="${REPO}/blob/main/models/${l.id}/train.py" target="_blank" rel="noopener">models/${l.id}/train.py</a>${m.generated ? ` · ${esc(m.generated)}` : ''}. Run it yourself: <code class="no-math">python models/${l.id}/train.py</code></p>
      </section>`;
}

// Quiz options are shown in a fixed pseudo-random order per question (seeded by lesson id and position),
// so the right answer is not always in the same place whatever order the source file lists them in.
function quizOrder(l) {
  return (l.quiz || []).map((q, i) => {
    if (/\b(above|previous|first (two|option)|both (of )?(the )?(first|last)|last option|all of the|none of the)\b/i.test(q.o.join(' ') + q.q)) return q;
    let h = 2166136261; for (const c of `${l.id}:${i}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
    const rnd = () => (h = (Math.imul(h, 1664525) + 1013904223) >>> 0) / 4294967296;
    const order = [0, 1, 2, 3];
    for (let k = 3; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
    return { ...q, o: order.map(k => q.o[k]), a: order.indexOf(q.a) };
  });
}

function lessonPage(l) {
  const rootRel = '../../';
  const idx = ORDER.indexOf(l), prev = ORDER[idx - 1], next = ORDER[idx + 1];
  const isModel = l.kind === 'models';
  const R = s => rich(s, rootRel);
  const find = id => byId[id] || PLANNED.find(x => x.id === id); // live lessons, or planned ones (their "coming soon" page)
  const link = id => { const t = find(id); if (!t) throw new Error(`unknown lesson "${id}" in ${l.id}`); return `${rootRel}${hrefFromRoot(t)}`; };

  const sections = [];
  const add = (id, label, html) => sections.push({ id, label, html });

  add('idea', 'The idea', `
        <p class="lead-line">${R(l.lead)}</p>
        ${(l.intuition || []).map(p => `<p>${R(p)}</p>`).join('\n        ')}
        ${l.analogy ? `<div class="analogy"><small class="kicker">In everyday terms</small><p>${R(l.analogy)}</p></div>` : ''}`);
  add('how', isModel ? 'How it works' : 'Step by step', `
        <ol class="steps">${(l.steps || []).map(s => `<li>${R(s)}</li>`).join('')}</ol>`);
  if (l.architecture) add('arch', 'The architecture', `
        <p>${R(l.archIntro || 'Hover over any part (or tap it on a phone) to see what it does.')}</p>
        <div class="arch" data-architecture="${l.architecture}" style="margin-top:18px"><noscript><p class="lab-noscript">The diagram needs JavaScript.</p></noscript></div>`);
  if (l.explainer) add('watch', 'Watch it work', `
        <p>Press play, or step through at your own pace. Each step adds one idea.</p>
        <div class="explainer" data-explainer="${l.explainer}" style="margin-top:18px"><noscript><p class="lab-noscript">The animation needs JavaScript.</p></noscript></div>`);
  if (!l.noLab) add('lab', 'Try it', `
        <p>${R(l.labIntro || 'Change the settings and watch the model respond.')}</p>
        <div class="lab" data-lab="${l.id}" data-kind="${l.kind}" style="margin-top:18px"><noscript><p class="lab-noscript">The live lab needs JavaScript.</p></noscript></div>
        ${l.tryThis && l.tryThis.length ? `<div class="try"><small class="kicker">Things to try</small><ol>${l.tryThis.map(t => `<li>${R(t)}</li>`).join('')}</ol></div>` : ''}`);
  add('maths', 'The maths', `
        <ol class="math-steps">${(l.math || []).map(m => `
          <li><h3>${R(m.h)}</h3><div class="formula">${R(m.tex)}</div><p>${R(m.p)}</p></li>`).join('')}
        </ol>`);
  if (isModel) {
    add('tuning', 'Hyperparameters', `
        <div class="table-wrap"><table class="kv">
          <thead><tr><th>Setting</th><th>What it does</th><th>Typical choice</th></tr></thead>
          <tbody>${(l.hyper || []).map(([a, b, c]) => `<tr><td><span class="hp">${R(a)}</span></td><td>${R(b)}</td><td>${R(c)}</td></tr>`).join('')}</tbody>
        </table></div>`);
    add('when', 'When to use it', `
        <div class="split2">
          <div class="box good"><h3>${icon('check')} Strengths</h3><ul>${(l.pros || []).map(x => `<li>${R(x)}</li>`).join('')}</ul></div>
          <div class="box bad"><h3>${icon('warn')} Limitations</h3><ul>${(l.cons || []).map(x => `<li>${R(x)}</li>`).join('')}</ul></div>
          <div class="box use"><h3>${icon('arrow')} Reach for it when</h3><p>${R(l.use)}</p></div>
          <div class="box avoid"><h3>${icon('back')} Think twice when</h3><p>${R(l.avoid)}</p></div>
        </div>`);
  } else {
    add('takeaways', 'Key takeaways', `
        <div class="box use"><ul>${(l.keyPoints || []).map(x => `<li>${R(x)}</li>`).join('')}</ul></div>`);
  }
  add('code', 'In code', `
        <div class="code"><div class="code-head"><span>python</span><button class="copy" type="button">${icon('code')}<span>Copy</span></button></div><pre class="no-math"><code>${highlightPython(l.code || '')}</code></pre></div>
        ${l.pitfalls && l.pitfalls.length ? `<h3 class="subhead" style="margin:34px 0 16px">Common pitfalls</h3><ul class="pitfalls">${l.pitfalls.map(p => `<li>${icon('warn')}<span>${R(p)}</span></li>`).join('')}</ul>` : ''}`);
  const metrics = isModel ? metricsSection(l, rootRel) : '';
  add('quiz', 'Check yourself', `
        <div class="quiz">${quizOrder(l).map((q, i) => `
          <div class="q" data-answer="${q.a}">
            <p><span>Q${i + 1}</span>${R(q.q)}</p>
            <div class="opts">${q.o.map((o, j) => `<button class="opt" type="button"><b>${'ABCD'[j]}</b><span>${R(o)}</span></button>`).join('')}</div>
            <div class="why" hidden><strong>Why:</strong> ${R(q.why)}</div>
          </div>`).join('')}
        </div>
        <p class="quiz-score" id="quiz-score" aria-live="polite" style="margin-top:14px"></p>`);
  const relIds = [...new Set([...(l.related || []), ...(l.concepts || []), ...(l.usedBy || [])])].filter(id => id !== l.id);
  add('related', isModel ? 'Related lessons' : 'Where it shows up', `
        <div class="related">${relIds.map(id => `<a href="${link(id)}"><small class="kicker">${find(id).planned ? 'Coming soon' : find(id).kind === 'concepts' ? 'Concept' : find(id).path.title}</small><b>${esc(find(id).short)}</b></a>`).join('')}</div>`);

  // number sections; metrics slot in before the quiz
  const parts = [];
  let n = 0;
  sections.forEach(s => {
    if (s.id === 'quiz' && metrics) { n++; parts.push({ id: 'results', label: 'On real data', html: metrics.replace('<span>08</span>', `<span>${String(n).padStart(2, '0')}</span>`), raw: true }); }
    n++;
    parts.push({ ...s, num: String(n).padStart(2, '0') });
  });
  const body = parts.map(s => (s.raw ? s.html : `
      <section class="reveal" id="${s.id}">
        <h2 class="h3"><span>${s.num}</span> ${s.label}</h2>${s.html}
      </section>`)).join('');
  const toc = parts.map((s, i) => `<li><a href="#${s.id}"><span>${String(i + 1).padStart(2, '0')}</span>${s.label}</a></li>`).join('');

  const api = isModel ? apiName(l) : '';
  const glance = isModel ? `
          <dt>Task</dt><dd>${l.task[0].toUpperCase() + l.task.slice(1)}</dd>
          <dt>Family</dt><dd>${esc(l.glance.family)}</dd>
          <dt>What it learns</dt><dd>${esc(l.glance.learns)}</dd>
          <dt>Training cost</dt><dd>${R(l.complexity[0])}</dd>
          <dt>Prediction cost</dt><dd>${R(l.complexity[1])}</dd>
          ${api ? `<dt>In code</dt><dd><code class="no-math">${esc(api).replace(/\./g, '.<wbr>')}</code></dd>` : ''}` : `
          <dt>Path</dt><dd>${esc(l.path.title)} · ${esc(l.module)}</dd>
          <dt>Level</dt><dd>${LEVELS[l.level]}</dd>
          <dt>Used by</dt><dd>${(l.usedBy || []).length} model lesson${(l.usedBy || []).length === 1 ? '' : 's'}</dd>`;

  const prereq = (l.prereq || []).length ? `<span class="prereq">Before this: ${(l.prereq || []).map(id => `<a href="${link(id)}">${esc(find(id).short)}</a>`).join(' ')}</span>` : '';

  const main = `
<div class="progress" aria-hidden="true"></div>
<article class="case-page">
  <header class="page-head lesson-head">
    <a class="back rise" style="--d:1" href="${rootRel}#curriculum">${icon('back')} All lessons</a>
    <span class="tag rise" style="--d:2"><a href="${rootRel}#path-${l.path.id}">Path ${l.path.num} · ${esc(l.path.title)}</a> / ${esc(l.module)} / Lesson ${l.pathIndex} of ${l.path.count}</span>
    <h1 class="case-title">${esc(l.title)}</h1>
    <p class="lede rise" style="--d:3">${R(l.summary)}</p>
    <div class="lesson-meta rise" style="--d:4">
      <span class="tagline">${level(l.level)}</span>
      <span class="tagline">${l.minutes} min</span>
      ${l.noLab ? '' : '<span class="tagline lab">Live lab</span>'}
      ${prereq}
    </div>
  </header>

  <div class="case-body lesson-body">
    <aside class="glance reveal">
      <h4>At a glance</h4>
      <dl>${glance}
      </dl>
      <ol class="toc">${toc}</ol>
      <button class="button ghost small complete" id="complete" type="button" aria-pressed="false">${icon('check')}<span data-label>Mark as complete</span></button>
    </aside>

    <div class="story">${body}
    </div>
  </div>

  <div class="pager" role="navigation" aria-label="Previous and next lesson">
    ${prev ? `<a href="${link(prev.id)}"><small>${icon('back')} Previous · ${esc(prev.path.title)}</small><b>${esc(prev.short)}</b></a>` : `<a href="${rootRel}#paths"><small>${icon('back')} Back</small><b>All learning paths</b></a>`}
    ${next ? `<a class="pager-next" href="${link(next.id)}"><small>Next · ${esc(next.path.title)} ${icon('next')}</small><b>${esc(next.short)}</b></a>` : `<a class="pager-next" href="${rootRel}#roadmap"><small>Finished ${icon('next')}</small><b>See what is coming next</b></a>`}
  </div>
</article>`;

  const katex = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
`;
  const labScripts = ['core', 'algos', 'models', ...(l.kind === 'concepts' ? ['concepts'] : ['sequences']), ...(l.labFile ? [l.labFile] : []), ...(l.explainer ? ['explainers'] : []), ...(l.architecture ? ['architecture'] : [])].map(f => `<script src="${rootRel}assets/labs/${f}.js?v=${VERSION}" defer></script>\n`).join('');

  return shell({
    rootRel, bodyClass: 'page-lesson', lessonId: l.id,
    title: `${plain(l.title)} · Learn · Yogesh Awate`,
    description: plain(l.summary),
    main, extraHead: katex, extraScripts: labScripts,
  });
}

function plannedPage(s) {
  const rootRel = '../../';
  const p = s.path, i = p.items.indexOf(s), prev = p.items[i - 1], next = p.items[i + 1];
  const href = t => `${rootRel}${hrefFromRoot(t)}`;
  const mates = p.items.filter(t => t.module === s.module);
  const tierNote = { Core: 'Core: written in the first pass.', Extended: 'Extended: written after the Core lessons.', Capstone: 'Capstone: ties the module together.' }[s.tier];
  const main = `
<div class="progress" aria-hidden="true"></div>
<article class="case-page">
  <header class="page-head lesson-head">
    <a class="back rise" style="--d:1" href="${rootRel}#curriculum">${icon('back')} All lessons</a>
    <span class="tag rise" style="--d:2"><a href="${rootRel}#path-${p.id}">Path ${p.num} · ${esc(p.title)}</a> / ${esc(s.module)} / Lesson ${s.pathIndex} of ${p.count}</span>
    <h1 class="case-title">${esc(s.title)}</h1>
    <p class="lede rise" style="--d:3">This lesson is planned but not written yet. When it lands it will follow the same steps as the others: the idea in plain words, ${s.lab ? 'a live lab, ' : ''}the maths, the trade-offs, code and a short quiz.</p>
    <div class="lesson-meta rise" style="--d:4">
      <span class="tagline">Planned</span><span class="tagline">${s.tier}</span>${s.lab ? '<span class="tagline lab">Live lab planned</span>' : ''}
    </div>
  </header>
  <div class="case-body lesson-body">
    <aside class="glance reveal">
      <h4>At a glance</h4>
      <dl>
        <dt>Status</dt><dd>Planned</dd>
        <dt>Path</dt><dd>${esc(p.title)} · ${esc(s.module)}</dd>
        <dt>Tier</dt><dd>${tierNote}</dd>
      </dl>
    </aside>
    <div class="story">
      <section class="reveal" id="module">
        <h2 class="h3"><span>01</span> In this module</h2>
        <ol class="soon-list">${mates.map(t => `<li${t === s ? ' class="here"' : ''}><a href="${href(t)}">${esc(t.short)}</a><em>${t.planned ? 'Planned' : 'Live'}</em></li>`).join('')}</ol>
      </section>
    </div>
  </div>
  <div class="pager" role="navigation" aria-label="Previous and next lesson">
    ${prev ? `<a href="${href(prev)}"><small>${icon('back')} Previous · ${esc(p.title)}</small><b>${esc(prev.short)}</b></a>` : `<a href="${rootRel}#path-${p.id}"><small>${icon('back')} Back</small><b>${esc(p.title)}</b></a>`}
    ${next ? `<a class="pager-next" href="${href(next)}"><small>Next · ${esc(p.title)} ${icon('next')}</small><b>${esc(next.short)}</b></a>` : `<a class="pager-next" href="${rootRel}#paths"><small>End of path ${icon('next')}</small><b>All learning paths</b></a>`}
  </div>
</article>`;
  return shell({ rootRel, bodyClass: 'page-lesson', title: `${s.title} (planned) · Learn · Yogesh Awate`, description: `${s.title}: a planned lesson in the ${p.title} path.`, main });
}

// ------------------------------------------------------------------ write everything
write('index.html', hub());
ORDER.forEach(l => write(`${l.kind}/${l.id}/index.html`, lessonPage(l)));
PLANNED.forEach(l => write(`${l.kind}/${l.id}/index.html`, plannedPage(l)));
// the combined sequences lesson was split in four; send old links to the first of them
write('models/transformers_rnn_classifier/index.html', `<!doctype html><meta charset="utf-8"><title>Sequences · Learn</title><meta http-equiv="refresh" content="0; url=../recurrent_neural_networks/"><link rel="canonical" href="../recurrent_neural_networks/"><a href="../recurrent_neural_networks/">Recurrent neural networks</a>`);
// the concepts folder had its own index page; keep the URL working
write('concepts/index.html', `<!doctype html><meta charset="utf-8"><title>Foundations · Learn</title><meta http-equiv="refresh" content="0; url=../#path-foundations"><link rel="canonical" href="../#path-foundations"><a href="../#path-foundations">Foundations</a>`);
console.log(`built index.html + ${PLANNED.length} planned pages + ${ORDER.length} lessons (${N_MODELS} models, ${N_CONCEPTS} concepts), ${Math.round(totalMinutes / 60)} h of material`);

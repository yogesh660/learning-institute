// One interactive lab per foundation concept.
(function (root) {
  'use strict';
  const { T, alpha, rng, clu2d, cluNames, reg1d, mount, animator, fmt, h } = root.Lab;
  const A = root.Algo;
  const { drawBars, drawCurve } = root.Labs.helpers;
  const labs = {};
  const clampv = (v, a, b) => Math.max(a, Math.min(b, v));

  // ------------------------------------------------------------------ shared: two score distributions
  function scores(sep, posRate, seed = 21, n = 600) {
    const R = rng(seed), out = [];
    for (let i = 0; i < n; i++) {
      const y = R() < posRate ? 1 : 0;
      const z = (y ? sep / 2 : -sep / 2) + R.gauss();
      out.push({ y, s: 1 / (1 + Math.exp(-z)) });
    }
    return out;
  }
  const cm = (S, t) => { let tp = 0, fp = 0, fn = 0, tn = 0; S.forEach(o => { const p = o.s >= t; if (p && o.y) tp++; else if (p) fp++; else if (o.y) fn++; else tn++; }); return { tp, fp, fn, tn }; };
  const ratio = (a, b) => (b ? a / b : 0);
  function histDensity(P, S, t, o = {}) {
    const bins = 40, H = [new Array(bins).fill(0), new Array(bins).fill(0)];
    S.forEach(q => { H[q.y][Math.min(bins - 1, Math.floor(q.s * bins))]++; });
    const mx = Math.max(...H[0], ...H[1], 1);
    P.setRange([0, 1], [0, mx * 1.15]);
    P.grid({ labels: true, step: 0.2, stepY: Math.max(1, Math.round(mx / 3)) });
    [0, 1].forEach(c => {
      const xs = [], lo = [], hi = [];
      H[c].forEach((v, i) => { xs.push(i / bins, (i + 1) / bins); lo.push(0, 0); hi.push(v, v); });
      P.band(xs, lo, hi, alpha(T.cls[c], 0.35));
      P.path(xs, hi, { color: T.cls[c], width: 1.4 });
    });
    P.seg(t, 0, t, mx * 1.15, { color: T.amber, width: 2 });
    P.text('threshold', P.sx(t) + 6, P.range.pt + 14, { color: T.amber, size: 10 });
    P.text('← predicted negative', P.sx(t) - 6, P.range.pt + 30, { color: T.dim, size: 10, align: 'right' });
    P.text('predicted positive →', P.sx(t) + 6, P.range.pt + 30, { color: T.dim, size: 10 });
  }

  // ------------------------------------------------------------------ data first
  labs['exploratory-data-analysis'] = el => {
    const files = { california_housing: 'MedHouseVal', titanic: 'Survived', diabetes: 'Target', mall_customers: 'Spending_Score', breast_cancer: 'Diagnosis' };
    let rows = [], cols = [], cache = {};
    const L = mount(el, {
      title: 'Live lab · real CSVs from this repository',
      main: { pad: [16, 14, 26, 44] }, side: ['Correlation with target'], sideOpts: [{ pad: [26, 10, 38, 10] }],
      controls: [
        { type: 'seg', key: 'file', label: 'Dataset', options: [['california_housing', 'Housing'], ['titanic', 'Titanic'], ['diabetes', 'Diabetes'], ['mall_customers', 'Mall'], ['breast_cancer', 'Cancer']], value: 'california_housing', span: true },
        { type: 'range', key: 'col', label: 'Column', min: 0, max: 8, step: 1, value: 4, fmt: v => (cols[v] || '…') },
        { type: 'seg', key: 'tx', label: 'Transform', options: [['none', 'none'], ['log', 'log(1 + x)']], value: 'none' },
      ],
      readouts: [{ key: 'n', label: 'Rows · missing' }, { key: 'mean', label: 'Mean / median' }, { key: 'skew', label: 'Skewness' }, { key: 'out', label: 'IQR outliers' }],
    });
    const P = L.main, S = L.side[0];
    const parse = txt => {
      const lines = txt.trim().split(/\r?\n/), head = lines[0].split(',');
      return { head, rows: lines.slice(1).map(l => l.split(',')) };
    };
    const numeric = c => rows.map(r => r[c]).filter(v => v !== '' && !isNaN(+v)).map(Number);
    const load = async () => {
      const f = L.val.file;
      try {
        if (!cache[f]) { const res = await fetch(`../../datasets/raw/${f}.csv`); if (!res.ok) throw new Error(res.status); cache[f] = parse(await res.text()); }
        rows = cache[f].rows; cols = cache[f].head;
        const inp = L.el('col').input; inp.max = cols.length - 1; if (+inp.value > cols.length - 1) L.el('col').set(0); else L.el('col').set(+inp.value);
        draw();
      } catch (e) {
        P.render = p => p.text('Could not load the CSV here. Open this page from the hosted site or a local server.', 16, 30, { color: T.muted, sans: true, size: 13 });
        P.request();
      }
    };
    const stats = v => {
      const s = [...v].sort((a, b) => a - b), n = s.length, m = A.mean(s);
      const q = p => s[Math.min(n - 1, Math.max(0, Math.floor(p * (n - 1))))];
      const sd = Math.sqrt(A.mean(s.map(x => (x - m) ** 2))) || 1e-12;
      const skew = A.mean(s.map(x => ((x - m) / sd) ** 3));
      const q1 = q(0.25), q3 = q(0.75), iqr = q3 - q1;
      return { n, m, med: q(0.5), sd, skew, lo: q1 - 1.5 * iqr, hi: q3 + 1.5 * iqr, min: s[0], max: s[n - 1] };
    };
    const draw = () => {
      const c = L.val.col; if (!cols.length) return;
      let v = numeric(c);
      const missing = rows.length - v.length;
      if (!v.length) {
        // categorical column: show counts instead
        const counts = {}; rows.forEach(r => { counts[r[c]] = (counts[r[c]] || 0) + 1; });
        const keys = Object.keys(counts).slice(0, 12);
        P.render = p => { drawBars(p, keys.map(k => counts[k]), { signed: false, labels: keys.map(k => k.slice(0, 8)), color: () => T.violet }); };
        L.set('n', `${rows.length} · 0`); L.set('mean', 'categorical'); L.set('skew', '–'); L.set('out', '–');
      } else {
        if (L.val.tx === 'log') v = v.map(x => Math.log1p(Math.max(x, 0)));
        const st = stats(v), bins = 30, w = (st.max - st.min) / bins || 1, H = new Array(bins).fill(0);
        v.forEach(x => { H[Math.min(bins - 1, Math.floor((x - st.min) / w))]++; });
        const outs = v.filter(x => x < st.lo || x > st.hi).length;
        P.render = p => {
          const pad = (st.max - st.min) * 0.04 || 1;
          p.setRange([st.min - pad, st.max + pad], [0, Math.max(...H) * 1.12]);
          p.grid({ labels: true });
          if (st.lo > st.min) p.rect(st.min - pad, 0, st.lo, Math.max(...H) * 1.12, { fill: alpha(T.pink, 0.08) });
          if (st.hi < st.max) p.rect(st.hi, 0, st.max + pad, Math.max(...H) * 1.12, { fill: alpha(T.pink, 0.08) });
          H.forEach((cnt, i) => p.rect(st.min + i * w + w * 0.06, 0, st.min + (i + 1) * w - w * 0.06, cnt, { fill: alpha(T.violet, 0.8) }));
          p.seg(st.m, 0, st.m, 1e9, { color: T.cyan, width: 1.6 }); p.seg(st.med, 0, st.med, 1e9, { color: T.amber, width: 1.6, dash: [4, 4] });
          p.text(`mean`, p.sx(st.m) + 4, p.range.pt + 12, { color: T.cyan, size: 10 }); p.text(`median`, p.sx(st.med) + 4, p.range.pt + 26, { color: T.amber, size: 10 });
          p.text(cols[c] + (L.val.tx === 'log' ? ' (log)' : ''), p.range.pl + p.range.w, p.range.pt + 12, { align: 'right', color: T.soft, size: 11 });
        };
        L.set('n', `${rows.length} · ${missing}`); L.set('mean', `${fmt.n2(st.m)} / ${fmt.n2(st.med)}`);
        L.set('skew', st.skew.toFixed(2), Math.abs(st.skew) > 1 ? 'warn' : 'good'); L.set('out', `${outs} (${(100 * outs / v.length).toFixed(1)}%)`);
      }
      // correlation of every numeric column with the target
      const tgt = cols.indexOf(files[L.val.file]);
      const tv = rows.map(r => (r[tgt] === 'Malignant' ? 1 : r[tgt] === 'Benign' ? 0 : +r[tgt]));
      const corr = cols.map((_, j) => {
        const xv = rows.map(r => +r[j]); if (xv.some(isNaN) || j === tgt) return 0;
        const mx = A.mean(xv), my = A.mean(tv); let a = 0, b = 0, d = 0;
        xv.forEach((x, i) => { a += (x - mx) * (tv[i] - my); b += (x - mx) ** 2; d += (tv[i] - my) ** 2; });
        return a / Math.sqrt(b * d || 1);
      });
      S.render = s => drawBars(s, corr, { max: 1, labels: cols.map(c => c.slice(0, 5)), color: i => (i === c ? T.amber : corr[i] >= 0 ? T.violet : T.cyan) });
      L.redraw();
    };
    L.on(k => { if (k === 'file' || k === 'reset') load(); else draw(); });
    load();
  };

  labs['feature-selection'] = el => {
    const names = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8', 'x9', 'x10'];
    const truth = new Set([0, 1, 2, 3]);
    const L = mount(el, {
      title: 'Live lab · which features would each method keep?',
      main: { pad: [26, 12, 30, 12] },
      legend: [{ c: T.green, l: 'truly useful' }, { c: T.violet, l: 'noise / redundant' }],
      controls: [{ type: 'seg', key: 'm', label: 'Method', options: [['filter', 'Filter: |correlation|'], ['lasso', 'Embedded: lasso |w|'], ['wrapper', 'Wrapper: forward selection']], value: 'filter', span: true }, { type: 'range', key: 'noise', label: 'Noise', min: 0.1, max: 1.5, step: 0.05, value: 0.4 }, { type: 'range', key: 'k', label: 'Features to keep', min: 1, max: 6, step: 1, value: 4 }],
      readouts: [{ key: 'kept', label: 'Kept' }, { key: 'hit', label: 'True features found' }, { key: 'r2', label: 'Validation R² (tree on kept)' }],
    });
    const P = L.main;
    let data = null;
    const make = () => {
      const R = rng(8), n = 260;
      const X = [], y = [];
      for (let i = 0; i < n; i++) {
        const x = names.map(() => R.gauss());
        x[5] = x[0] * 0.9 + R.gauss() * 0.3;                         // x6 is a near copy of x1
        X.push(x); y.push(1.6 * x[0] - 1.2 * x[1] + 1.4 * x[2] * x[3] + R.gauss() * L.val.noise);   // x3, x4 matter only together
      }
      data = { X, y, tr: [...Array(180).keys()], va: [...Array(80).keys()].map(i => i + 180) };
    };
    const treeR2 = feats => {
      if (!feats.length) return 0;
      const sub = x => feats.map(f => x[f]);
      const Xtr = data.tr.map(i => sub(data.X[i])), ytr = data.tr.map(i => data.y[i]);
      const f = A.forest(Xtr, ytr, { n: 12, maxDepth: 5, minLeaf: 3, rng: rng(4) });
      const yv = data.va.map(i => data.y[i]);
      return A.M.r2(yv, data.va.map(i => f.predict(sub(data.X[i]))));
    };
    const run = () => {
      const k = L.val.k; let score, kept;
      const Xtr = data.tr.map(i => data.X[i]), ytr = data.tr.map(i => data.y[i]);
      if (L.val.m === 'filter') {
        const my = A.mean(ytr);
        score = names.map((_, j) => { const xv = Xtr.map(x => x[j]), mx = A.mean(xv); let a = 0, b = 0, d = 0; xv.forEach((x, i) => { a += (x - mx) * (ytr[i] - my); b += (x - mx) ** 2; d += (ytr[i] - my) ** 2; }); return Math.abs(a / Math.sqrt(b * d)); });
        kept = score.map((s, j) => [s, j]).sort((a, b) => b[0] - a[0]).slice(0, k).map(p => p[1]);
      } else if (L.val.m === 'lasso') {
        const sol = A.enetFit(Xtr, ytr, 0.08, 1, 400);
        score = sol.w.map(Math.abs);
        kept = score.map((s, j) => [s, j]).filter(p => p[0] > 1e-6).sort((a, b) => b[0] - a[0]).slice(0, k).map(p => p[1]);
      } else {
        kept = []; score = names.map(() => 0);
        for (let step = 0; step < k; step++) {
          let best = null;
          for (let j = 0; j < names.length; j++) { if (kept.includes(j)) continue; const r2 = treeR2([...kept, j]); if (!best || r2 > best.r2) best = { j, r2 }; }
          kept.push(best.j); score[best.j] = Math.max(0.02, best.r2);
        }
      }
      P.render = p => {
        drawBars(p, score, { signed: false, labels: names, color: i => (truth.has(i) ? T.green : T.violet) });
        kept.forEach(j => p.text('kept', p.sx(j), p.sy(score[j]) - 6, { align: 'center', color: T.amber, size: 10 }));
      };
      L.set('kept', kept.map(j => names[j]).join(', '));
      const hit = kept.filter(j => truth.has(j)).length;
      L.set('hit', `${hit} of 4`, hit === 4 ? 'good' : hit <= 2 ? 'warn' : '');
      L.set('r2', treeR2(kept).toFixed(3));
      L.redraw();
    };
    L.on(k => { if (k === 'noise' || k === 'reset') make(); run(); });
    make(); run();
  };

  // ------------------------------------------------------------------ learning as optimisation
  labs['cost-vs-loss-vs-error'] = el => {
    let pred = [2.6, 1.0, 2.2, 3.4, 1.4];
    const ys = [2.0, 1.4, 2.5, 2.4, 1.6];
    const L = mount(el, {
      title: 'Live lab · drag the predictions', hint: 'Drag the cyan diamonds up and down',
      main: { x: [0.4, 5.6], y: [0, 4], pad: [14, 12, 24, 30] }, side: ['Loss per example → cost'], sideOpts: [{ pad: [26, 10, 34, 34] }],
      legend: [{ c: T.violet2, l: 'actual y' }, { c: T.cyan, l: 'prediction ŷ' }],
      controls: [{ type: 'seg', key: 'loss', label: 'Loss', options: [['sq', 'squared'], ['abs', 'absolute']], value: 'sq' }, { type: 'range', key: 'lam', label: 'Penalty λ on ‖w‖²', min: 0, max: 1, step: 0.05, value: 0 }],
      readouts: [{ key: 'err', label: 'Errors y − ŷ' }, { key: 'avg', label: 'Average loss' }, { key: 'pen', label: 'Penalty' }, { key: 'cost', label: 'Cost' }],
    });
    const wnorm = 1.3;
    const P = L.main, S = L.side[0];
    const lossOf = e => (L.val.loss === 'sq' ? e * e : Math.abs(e));
    const upd = () => {
      const e = ys.map((y, i) => y - pred[i]), l = e.map(lossOf), avg = A.mean(l), pen = L.val.lam * wnorm;
      L.set('err', e.map(v => (v >= 0 ? '+' : '') + v.toFixed(1)).join(' ')); L.set('avg', avg.toFixed(3)); L.set('pen', pen.toFixed(3)); L.set('cost', (avg + pen).toFixed(3));
      P.render = p => {
        p.grid({ labels: true, step: 1 });
        ys.forEach((y, i) => { p.seg(i + 1, y, i + 1, pred[i], { color: alpha(T.amber, 0.7), dash: [3, 3], width: 1.4 }); });
        p.points(ys.map((y, i) => [i + 1, y]), { color: T.violet2, r: 5 });
        pred.forEach((v, i) => { const c = p.ctx, x = p.sx(i + 1), y = p.sy(v); c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x + 7, y); c.lineTo(x, y + 7); c.lineTo(x - 7, y); c.closePath(); c.fillStyle = T.cyan; c.fill(); });
      };
      S.render = s => {
        const vals = [...l, avg, pen, avg + pen];
        drawBars(s, vals, { signed: false, max: Math.max(1, ...vals), labels: ['ℓ₁', 'ℓ₂', 'ℓ₃', 'ℓ₄', 'ℓ₅', 'mean', 'λR', 'cost'], color: i => (i < 5 ? T.violet : i === 5 ? T.cyan : i === 6 ? T.pink : T.amber) });
      };
      L.redraw();
    };
    let drag = -1;
    P.onDown = p => { drag = Math.round(p.x) - 1; if (drag < 0 || drag > 4) drag = -1; else { pred[drag] = clampv(p.y, 0.1, 3.9); upd(); } };
    P.onDrag = p => { if (drag >= 0) { pred[drag] = clampv(p.y, 0.1, 3.9); upd(); } };
    P.onUp = () => { drag = -1; };
    L.on(k => { if (k === 'reset') pred = [2.6, 1.0, 2.2, 3.4, 1.4]; upd(); });
    upd();
  };

  labs['loss-functions'] = el => {
    const L = mount(el, {
      title: 'Live lab · how each loss scores a mistake',
      main: { x: [-3, 3], y: [-0.2, 4.5], pad: [14, 12, 24, 30] }, side: ['Classification: loss vs margin y·f(x)'], sideOpts: [{ x: [-2.5, 2.5], y: [-0.1, 3.5], pad: [28, 10, 24, 30] }],
      legend: [{ c: T.violet, l: 'MSE' }, { c: T.cyan, l: 'MAE' }, { c: T.green, l: 'Huber' }, { c: T.amber, l: 'pinball' }],
      controls: [{ type: 'range', key: 'r', label: 'Probe residual / margin', min: -3, max: 3, step: 0.05, value: 1.5 }, { type: 'range', key: 'd', label: 'Huber δ', min: 0.2, max: 2.5, step: 0.05, value: 1 }, { type: 'range', key: 'q', label: 'Pinball τ', min: 0.05, max: 0.95, step: 0.05, value: 0.8 }],
      readouts: [{ key: 'mse', label: 'MSE · gradient' }, { key: 'hub', label: 'Huber · gradient' }, { key: 'log', label: 'Log-loss @ margin' }, { key: 'hinge', label: 'Hinge @ margin' }],
    });
    const P = L.main, S = L.side[0];
    const hub = (e, d) => (Math.abs(e) <= d ? 0.5 * e * e : d * (Math.abs(e) - 0.5 * d));
    const pin = (e, t) => Math.max(t * e, (t - 1) * e);
    P.render = p => {
      const v = L.val; p.grid({ axes: true, labels: true });
      p.fn(e => e * e, { color: T.violet, width: 2.2 }); p.fn(Math.abs, { color: T.cyan, width: 2.2 }); p.fn(e => hub(e, v.d), { color: T.green, width: 2.2 }); p.fn(e => pin(e, v.q), { color: T.amber, width: 2, dash: [6, 4] });
      p.seg(v.r, -1, v.r, 9, { color: 'rgba(255,255,255,0.3)', dash: [3, 3] });
      [[v.r * v.r, T.violet], [Math.abs(v.r), T.cyan], [hub(v.r, v.d), T.green]].forEach(([y, c]) => p.points([[v.r, y]], { color: c, r: 4.5 }));
      p.text('residual y − ŷ', p.range.pl + p.range.w, p.range.pt + p.range.h - 6, { align: 'right', color: T.dim, size: 10 });
    };
    S.render = s => {
      const v = L.val; s.grid({ axes: true, labels: true });
      s.fn(m => (m <= 0 ? 1 : 0), { color: 'rgba(255,255,255,0.5)', width: 1.6 });
      s.fn(m => Math.log1p(Math.exp(-m)) / Math.LN2, { color: T.violet, width: 2.2 });
      s.fn(m => Math.max(0, 1 - m), { color: T.cyan, width: 2.2 });
      s.fn(m => Math.exp(-m), { color: T.pink, width: 2, dash: [5, 4] });
      s.seg(v.r, -1, v.r, 9, { color: 'rgba(255,255,255,0.3)', dash: [3, 3] });
      s.text('0/1', s.sx(-2.3), s.sy(1) - 5, { color: T.soft, size: 10 }); s.text('log₂', s.sx(-2.3), s.sy(Math.log1p(Math.exp(2.3)) / Math.LN2) + 14, { color: T.violet, size: 10 });
      s.text('hinge', s.sx(-1.5), s.sy(2.5) + 14, { color: T.cyan, size: 10 }); s.text('exp', s.sx(-1.1), s.sy(3.0) - 4, { color: T.pink, size: 10 });
    };
    const upd = () => {
      const v = L.val, gh = Math.abs(v.r) <= v.d ? v.r : Math.sign(v.r) * v.d;
      L.set('mse', `${(v.r * v.r).toFixed(2)} · ${(2 * v.r).toFixed(2)}`); L.set('hub', `${hub(v.r, v.d).toFixed(2)} · ${gh.toFixed(2)}`);
      L.set('log', Math.log1p(Math.exp(-v.r)).toFixed(3)); L.set('hinge', Math.max(0, 1 - v.r).toFixed(2));
      L.redraw();
    };
    L.on(upd); upd();
  };

  // shared optimiser engine for the GD and quasi-Newton labs
  const optimisers = {
    gd: () => ({ step(x, g, lr) { return [x[0] - lr * g[0], x[1] - lr * g[1]]; } }),
    momentum: () => { const v = [0, 0]; return { step(x, g, lr) { v[0] = 0.9 * v[0] + g[0]; v[1] = 0.9 * v[1] + g[1]; return [x[0] - lr * v[0], x[1] - lr * v[1]]; } }; },
    rmsprop: () => { const s = [0, 0]; return { step(x, g, lr) { for (let i = 0; i < 2; i++) s[i] = 0.9 * s[i] + 0.1 * g[i] * g[i]; return [x[0] - lr * g[0] / (Math.sqrt(s[0]) + 1e-8), x[1] - lr * g[1] / (Math.sqrt(s[1]) + 1e-8)]; } }; },
    adam: () => { const m = [0, 0], v = [0, 0]; let t = 0; return { step(x, g, lr) { t++; const o = x.slice(); for (let i = 0; i < 2; i++) { m[i] = 0.9 * m[i] + 0.1 * g[i]; v[i] = 0.999 * v[i] + 0.001 * g[i] * g[i]; o[i] -= lr * (m[i] / (1 - 0.9 ** t)) / (Math.sqrt(v[i] / (1 - 0.999 ** t)) + 1e-8); } return o; } }; },
  };
  const optCols = { gd: T.ink, momentum: T.cyan, rmsprop: T.green, adam: T.amber };

  function contourField(P, f, lo, hi) {
    P.field((x, y) => { const v = Math.log(1 + Math.max(0, f(x, y) - lo)) / Math.log(1 + hi - lo); const t = clampv(v, 0, 1); const band = Math.abs(((t * 14) % 1) - 0.5) < 0.06 ? 30 : 0; return [40 + 100 * (1 - t), 30 + 94 * (1 - t), 90 + 165 * (1 - t), 70 + band + 60 * (1 - t)]; }, 4);
  }

  labs['gradient-descent'] = el => {
    let start = [-1.05, 0.62], runs = {}, anim = null;
    const L = mount(el, {
      title: 'Live lab · a long, narrow valley', hint: 'Click to choose a starting point',
      main: { x: [-1.3, 1.3], y: [-1, 1], equal: true, pad: [8, 8, 8, 8] }, side: ['Loss per step (log scale)'], sideOpts: [{ pad: [28, 12, 22, 40] }],
      legend: Object.entries(optCols).map(([k, c]) => ({ c, l: k === 'gd' ? 'GD' : k[0].toUpperCase() + k.slice(1) })),
      controls: [{ type: 'seg', key: 'opt', label: 'Optimiser', options: [['gd', 'GD'], ['momentum', 'Momentum'], ['rmsprop', 'RMSprop'], ['adam', 'Adam'], ['all', 'Race all four']], value: 'gd', span: true }, { type: 'range', key: 'lr', label: 'Learning rate η', min: -3, max: 0, step: 0.05, value: -1.05, log: true, fmt: fmt.sci }, { type: 'seg', key: 'surf', label: 'Surface', options: [['valley', 'Narrow valley'], ['bowl', 'Round bowl']], value: 'valley' }, { type: 'buttons', items: [{ key: 'run', label: 'Run', kind: 'light' }] }],
      readouts: [{ key: 'steps', label: 'Steps' }, { key: 'loss', label: 'Loss now' }, { key: 'state', label: 'Status' }],
    });
    const P = L.main, S = L.side[0];
    const surf = () => (L.val.surf === 'valley' ? { a: 1, b: 18, rot: 0.5 } : { a: 4, b: 4, rot: 0 });
    const f = (x, y) => { const s = surf(), c = Math.cos(s.rot), si = Math.sin(s.rot); const u = c * x + si * y, v = -si * x + c * y; return 0.5 * (s.a * u * u + s.b * v * v); };
    const grad = (x, y) => { const s = surf(), c = Math.cos(s.rot), si = Math.sin(s.rot); const u = c * x + si * y, v = -si * x + c * y; const gu = s.a * u, gv = s.b * v; return [c * gu - si * gv, si * gu + c * gv]; };
    const reset = () => { runs = {}; const keys = L.val.opt === 'all' ? Object.keys(optimisers) : [L.val.opt]; keys.forEach(k => { runs[k] = { o: optimisers[k](), path: [start.slice()], loss: [f(...start)], done: false }; }); };
    P.render = p => {
      contourField(p, f, 0, 12);
      p.cross(0, 0, T.ink, 5, 1.6);
      Object.entries(runs).forEach(([k, r]) => { p.clip(() => p.path(r.path.map(q => q[0]), r.path.map(q => q[1]), { color: optCols[k], width: 1.8 })); const e = r.path[r.path.length - 1]; if (Math.abs(e[0]) < 5 && Math.abs(e[1]) < 5) p.points([e], { color: optCols[k], r: 4 }); });
      p.points([start], { color: T.pink, r: 5 });
    };
    S.render = s => {
      const all = Object.values(runs).flatMap(r => r.loss.map(v => Math.log10(Math.max(v, 1e-8))));
      if (!all.length) return;
      const n = Math.max(...Object.values(runs).map(r => r.loss.length));
      s.setRange([0, Math.max(10, n)], [Math.max(-8, Math.min(...all)) - 0.3, Math.min(4, Math.max(...all)) + 0.3]);
      s.grid({ labels: true });
      Object.entries(runs).forEach(([k, r]) => s.clip(() => s.path(r.loss.map((_, i) => i), r.loss.map(v => Math.log10(Math.max(v, 1e-8))), { color: optCols[k], width: 1.8 })));
    };
    const status = () => {
      const r = runs[L.val.opt === 'all' ? 'gd' : L.val.opt]; if (!r) return;
      const lv = r.loss[r.loss.length - 1];
      L.set('steps', String(r.path.length - 1)); L.set('loss', isFinite(lv) && lv < 1e6 ? lv.toExponential(2) : '∞');
      L.set('state', !isFinite(lv) || lv > 1e3 ? 'diverged' : lv < 1e-5 ? 'converged' : r.done ? 'stopped' : 'running', !isFinite(lv) || lv > 1e3 ? 'warn' : lv < 1e-5 ? 'good' : '');
    };
    const go = () => {
      if (anim) anim.stop();
      reset(); L.redraw(); status();
      anim = animator(() => {
        let alive = false;
        Object.values(runs).forEach(r => {
          if (r.done) return;
          const x = r.path[r.path.length - 1], g = grad(...x), nx = r.o.step(x, g, L.val.lr), l = f(...nx);
          r.path.push(nx); r.loss.push(l);
          if (!isFinite(l) || l > 1e6 || l < 1e-9 || r.path.length > 300) r.done = true; else alive = true;
        });
        L.redraw(); status(); return alive;
      }, 40);
      anim.start();
    };
    P.onDown = p => { start = [clampv(p.x, -1.3, 1.3), clampv(p.y, -1, 1)]; go(); };
    L.button('run', go);
    L.on(k => { if (k === 'reset') start = [-1.05, 0.62]; go(); });
    go();
  };

  labs['quasi-newton-and-lbfgs'] = el => {
    let start = [-1.2, 1.0], paths = {};
    const f = (x, y) => (1 - x) ** 2 + 100 * (y - x * x) ** 2;
    const g = (x, y) => [-2 * (1 - x) - 400 * x * (y - x * x), 200 * (y - x * x)];
    const Hs = (x, y) => [[2 - 400 * (y - 3 * x * x), -400 * x], [-400 * x, 200]];
    const cols = { gd: T.ink, newton: T.cyan, bfgs: T.amber };
    const L = mount(el, {
      title: 'Live lab · the Rosenbrock banana', hint: 'Click to choose a starting point · minimum at (1, 1)',
      main: { x: [-2, 2], y: [-1, 3], equal: true, pad: [8, 8, 8, 8] }, side: ['log₁₀ f per iteration'], sideOpts: [{ pad: [28, 12, 22, 40] }],
      legend: [{ c: T.ink, l: 'gradient descent' }, { c: T.cyan, l: 'Newton' }, { c: T.amber, l: 'BFGS' }],
      controls: [{ type: 'range', key: 'max', label: 'Max iterations', min: 10, max: 2000, step: 10, value: 400 }],
      readouts: [{ key: 'gd', label: 'GD iterations' }, { key: 'newton', label: 'Newton iterations' }, { key: 'bfgs', label: 'BFGS iterations' }],
    });
    const P = L.main, S = L.side[0];
    const line = (x, d, gx) => { let t = 1; const f0 = f(...x), slope = gx[0] * d[0] + gx[1] * d[1]; for (let i = 0; i < 40; i++) { const nx = [x[0] + t * d[0], x[1] + t * d[1]]; if (f(...nx) <= f0 + 1e-4 * t * slope) return nx; t *= 0.5; } return [x[0] + t * d[0], x[1] + t * d[1]]; };
    const solve = () => {
      paths = {};
      const max = L.val.max;
      // gradient descent with backtracking
      let x = start.slice(), p = [x.slice()];
      for (let i = 0; i < max; i++) { const gx = g(...x); if (Math.hypot(...gx) < 1e-6) break; x = line(x, [-gx[0], -gx[1]], gx); p.push(x.slice()); }
      paths.gd = p;
      // damped Newton (falls back to gradient when the Hessian is not positive definite)
      x = start.slice(); p = [x.slice()];
      for (let i = 0; i < max; i++) {
        const gx = g(...x); if (Math.hypot(...gx) < 1e-6) break;
        const H = Hs(...x); let d = A.LA.solve(H, [-gx[0], -gx[1]]);
        if (d[0] * gx[0] + d[1] * gx[1] >= 0) d = [-gx[0], -gx[1]];
        x = line(x, d, gx); p.push(x.slice());
      }
      paths.newton = p;
      // BFGS on the inverse Hessian
      x = start.slice(); p = [x.slice()]; let Hi = [[1, 0], [0, 1]], gx = g(...x);
      for (let i = 0; i < max; i++) {
        if (Math.hypot(...gx) < 1e-6) break;
        const d = [-(Hi[0][0] * gx[0] + Hi[0][1] * gx[1]), -(Hi[1][0] * gx[0] + Hi[1][1] * gx[1])];
        const nx = line(x, d, gx), ng = g(...nx);
        const s = [nx[0] - x[0], nx[1] - x[1]], y = [ng[0] - gx[0], ng[1] - gx[1]], sy = s[0] * y[0] + s[1] * y[1];
        if (sy > 1e-12) {
          const r = 1 / sy, I = [[1, 0], [0, 1]];
          const V = I.map((row, a) => row.map((v, b) => v - r * s[a] * y[b]));
          const VT = I.map((row, a) => row.map((v, b) => v - r * y[a] * s[b]));
          const tmp = V.map(row => [0, 1].map(b => row[0] * Hi[0][b] + row[1] * Hi[1][b]));
          Hi = tmp.map(row => [0, 1].map(b => row[0] * VT[0][b] + row[1] * VT[1][b])).map((row, a) => row.map((v, b) => v + r * s[a] * s[b]));
        }
        x = nx; gx = ng; p.push(x.slice());
      }
      paths.bfgs = p;
      Object.keys(paths).forEach(k => { const it = paths[k].length - 1, done = f(...paths[k][it]) < 1e-8; L.set(k, `${it}${done ? '' : '+'}`, done ? 'good' : 'warn'); });
      L.redraw();
    };
    P.render = p => {
      contourField(p, f, 0, 2500);
      p.cross(1, 1, T.ink, 5, 1.6);
      Object.entries(paths).forEach(([k, q]) => { p.clip(() => p.path(q.map(z => z[0]), q.map(z => z[1]), { color: cols[k], width: 1.6 })); p.points(q.filter((_, i) => q.length < 60 || i % Math.ceil(q.length / 60) === 0), { color: cols[k], r: 2 }); });
      p.points([start], { color: T.pink, r: 5 });
    };
    S.render = s => {
      const n = Math.max(...Object.values(paths).map(q => q.length));
      s.setRange([0, Math.max(10, n)], [-10, 4]); s.grid({ labels: true });
      Object.entries(paths).forEach(([k, q]) => s.clip(() => s.path(q.map((_, i) => i), q.map(z => Math.log10(Math.max(f(...z), 1e-12))), { color: cols[k], width: 1.8 })));
    };
    P.onDown = p => { start = [clampv(p.x, -2, 2), clampv(p.y, -1, 3)]; solve(); };
    L.on(k => { if (k === 'reset') start = [-1.2, 1]; solve(); });
    solve();
  };

  labs['maximum-likelihood-estimation'] = el => {
    let flips = [];
    const L = mount(el, {
      title: 'Live lab · estimate a coin’s bias',
      main: { x: [0, 1], y: [0, 1.08], pad: [16, 14, 26, 40] },
      legend: [{ c: T.cyan, l: 'likelihood (scaled)' }, { c: T.amber, l: 'MLE' }],
      controls: [{ type: 'range', key: 'p', label: 'True bias of the coin', min: 0.05, max: 0.95, step: 0.05, value: 0.7 }, { type: 'range', key: 'probe', label: 'Probe p', min: 0.01, max: 0.99, step: 0.01, value: 0.5 }, { type: 'buttons', items: [{ key: 'f1', label: 'Flip once', kind: 'light' }, { key: 'f10', label: 'Flip 10' }, { key: 'f100', label: 'Flip 100' }, { key: 'clear', label: 'Clear' }] }],
      readouts: [{ key: 'n', label: 'Heads / flips' }, { key: 'mle', label: 'MLE p̂ = k/n' }, { key: 'll', label: 'log L at probe vs at p̂' }, { key: 'ci', label: 'Approx. 95% interval' }],
    });
    const R = rng(77), P = L.main;
    const flip = n => { for (let i = 0; i < n; i++) flips.push(R() < L.val.p ? 1 : 0); upd(); };
    const upd = () => {
      const n = flips.length, k = flips.reduce((a, b) => a + b, 0), mle = n ? k / n : NaN;
      const ll = p => k * Math.log(p) + (n - k) * Math.log(1 - p);
      L.set('n', `${k} / ${n}`); L.set('mle', n ? mle.toFixed(3) : '–');
      L.set('ll', n ? `${ll(L.val.probe).toFixed(2)} vs ${ll(Math.min(0.999, Math.max(0.001, mle))).toFixed(2)}` : '–');
      const se = n ? Math.sqrt(mle * (1 - mle) / n) : 0; L.set('ci', n ? `${Math.max(0, mle - 1.96 * se).toFixed(2)} – ${Math.min(1, mle + 1.96 * se).toFixed(2)}` : '–');
      P.render = p => {
        p.grid({ labels: true, step: 0.1, stepY: 0.25 });
        if (n) {
          const top = ll(Math.min(0.999, Math.max(0.001, mle)));
          const xs = Array.from({ length: 199 }, (_, i) => (i + 1) / 200);
          const ys = xs.map(x => Math.exp(ll(x) - top));
          p.band(xs, xs.map(() => 0), ys, alpha(T.cyan, 0.12)); p.path(xs, ys, { color: T.cyan, width: 2.2 });
          p.seg(mle, 0, mle, 1, { color: T.amber, width: 2 });
          p.points([[L.val.probe, Math.exp(ll(L.val.probe) - top)]], { color: T.pink, r: 5 });
        } else p.text('Flip the coin to see the likelihood.', p.range.pl + 12, p.range.pt + 24, { color: T.muted, sans: true, size: 13 });
        p.seg(L.val.p, 0, L.val.p, 1.08, { color: 'rgba(255,255,255,0.35)', dash: [4, 4] });
        p.text('true p', p.sx(L.val.p) + 4, p.range.pt + 12, { color: T.dim, size: 10 });
        const strip = flips.slice(-60); strip.forEach((v, i) => p.rect(i / 60, 1.03, (i + 0.8) / 60, 1.07, { fill: v ? T.cyan : T.violet }));
      };
      L.redraw();
    };
    L.button('f1', () => flip(1)); L.button('f10', () => flip(10)); L.button('f100', () => flip(100)); L.button('clear', () => { flips = []; upd(); });
    L.on(k => { if (k === 'reset' || k === 'p') flips = []; if (k === 'reset') flip(10); else upd(); });
    flip(10);
  };

  // ------------------------------------------------------------------ probability
  labs['probability-rules-and-bayes-theorem'] = el => {
    const COLS = 40, ROWS = 25, N = COLS * ROWS;
    const L = mount(el, {
      title: 'Live lab · a positive test, a base rate and the real probability',
      main: { x: [0, 1], y: [0, 1], pad: [10, 10, 10, 10] },
      side: ['P(sick | positive tests) against prevalence'], sideOpts: [{ pad: [40, 14, 30, 42] }],
      legend: [{ c: T.cyan, l: 'sick, tested positive' }, { c: T.pink, l: 'healthy, false alarm' }, { c: T.violet, l: 'sick, missed' }, { c: 'rgba(255,255,255,0.35)', l: 'healthy, negative' }],
      hint: 'Each dot is one of 1,000 people. The bright dots tested positive.',
      controls: [
        { type: 'range', key: 'prev', label: 'Prevalence (base rate)', min: -3, max: Math.log10(0.5), step: 0.01, value: Math.log10(0.01), log: true, fmt: v => (v < 0.1 ? `${(v * 100).toFixed(1)}%` : `${(v * 100).toFixed(0)}%`) },
        { type: 'range', key: 'sens', label: 'Sensitivity P(+ | sick)', min: 0.5, max: 0.99, step: 0.01, value: 0.9, fmt: v => `${(v * 100).toFixed(0)}%` },
        { type: 'range', key: 'fpr', label: 'False-positive rate P(+ | healthy)', min: 0.005, max: 0.3, step: 0.005, value: 0.08, fmt: v => `${(v * 100).toFixed(1)}%` },
        { type: 'range', key: 'tests', label: 'Independent positive tests', min: 1, max: 5, step: 1, value: 1, fmt: v => `${v}` },
        { type: 'buttons', items: [{ key: 'rare', label: 'Rare disease 0.1%' }, { key: 'screen', label: 'Screening 1%' }, { key: 'clinic', label: 'Clinic 20%', kind: 'ghost' }] },
      ],
      readouts: [{ key: 'tp', label: 'Sick and positive, per 10,000' }, { key: 'fp', label: 'Healthy and positive, per 10,000' }, { key: 'post', label: 'P(sick | positive)' }, { key: 'neg', label: 'P(sick | negative)' }],
    });
    const P = L.main, S = L.side[0];
    const lg = v => Math.log10(v);
    S.setRange([-3, lg(0.5)], [0, 1]);
    const post = (prev, sens, fpr, k) => (prev * sens ** k) / (prev * sens ** k + (1 - prev) * fpr ** k);
    const upd = () => {
      const { prev, sens, fpr } = L.val, k = Math.round(L.val.tests);
      const sick = Math.max(1, Math.round(N * prev)), healthy = N - sick;
      const sp = Math.round(sick * sens), hp = Math.round(healthy * fpr), sn = sick - sp;
      const pk = post(prev, sens, fpr, k), neg = (prev * (1 - sens)) / (prev * (1 - sens) + (1 - prev) * (1 - fpr));
      L.set('tp', (1e4 * prev * sens).toFixed(1)); L.set('fp', (1e4 * (1 - prev) * fpr).toFixed(0));
      L.set('post', `${(pk * 100).toFixed(pk < 0.1 ? 1 : 0)}%`, pk > 0.5 ? 'good' : '');
      L.set('neg', `${(neg * 100).toFixed(neg < 0.01 ? 2 : 1)}%`);
      P.render = p => {
        const cw = Math.abs(p.sx(1 / COLS) - p.sx(0)), ch = Math.abs(p.sy(1 / ROWS) - p.sy(0)), rad = Math.max(1.6, Math.min(cw, ch) * 0.36);
        const pts = [], kind = [];
        for (let i = 0; i < N; i++) {
          pts.push([((i % COLS) + 0.5) / COLS, 1 - (Math.floor(i / COLS) + 0.5) / ROWS]);
          kind.push(i < sp ? 0 : i < sp + hp ? 1 : i < sp + hp + sn ? 2 : 3);
        }
        const col = [T.cyan, T.pink, alpha(T.violet, 0.85), 'rgba(255,255,255,0.2)'];
        p.points(pts, { color: i => col[kind[i]], r: rad, stroke: 'rgba(7,7,9,0.5)' });
      };
      S.render = p => {
        const r = p.range;
        p.grid({ step: 1, stepY: 0.25 });
        const xs = Array.from({ length: 120 }, (_, i) => -3 + (i * (lg(0.5) + 3)) / 119);
        p.path(xs, xs.map(x => 10 ** x), { color: 'rgba(255,255,255,0.25)', width: 1.2, dash: [4, 4] });
        for (let j = 1; j <= 5; j++) if (j !== k) p.path(xs, xs.map(x => post(10 ** x, sens, fpr, j)), { color: 'rgba(255,255,255,0.18)', width: 1.2 });
        p.path(xs, xs.map(x => post(10 ** x, sens, fpr, k)), { color: T.cyan, width: 2.6 });
        p.seg(lg(prev), 0, lg(prev), pk, { color: alpha(T.amber, 0.6), width: 1.2, dash: [3, 3] });
        p.points([[lg(prev), pk]], { color: T.amber, r: 5.5 });
        [[-3, '0.1%'], [-2, '1%'], [-1, '10%'], [lg(0.5), '50%']].forEach(([v, t]) => p.text(t, p.sx(v), r.pt + r.h + 15, { align: v === -3 ? 'left' : v > -1 ? 'right' : 'center', size: 10, color: T.dim }));
        [[0, '0'], [0.5, '50%'], [1, '100%']].forEach(([v, t]) => p.text(t, r.pl - 6, p.sy(v) + 3, { align: 'right', size: 10, color: T.dim }));
        p.text(`${k} positive test${k > 1 ? 's' : ''}`, r.pl + 8, r.pt + 14, { size: 11, color: T.cyan });
        p.text('dashed: the prior', r.pl + r.w - 6, p.sy(0) - 8, { align: 'right', size: 10, color: T.dim });
      };
      L.redraw();
    };
    const preset = v => () => { L.el('prev').set(v); L.fire('prev'); };
    L.button('rare', preset(0.001)); L.button('screen', preset(0.01)); L.button('clinic', preset(0.2));
    L.on(upd); upd();
  };

  // ------------------------------------------------------------------ generalisation
  labs['bias-variance-tradeoff'] = el => {
    const L = mount(el, {
      title: 'Live lab · twenty training sets, one model class',
      main: { x: [-1.05, 1.05], y: [-2, 2], pad: [12, 12, 12, 12] }, side: ['Error decomposition vs degree'], sideOpts: [{ pad: [28, 12, 22, 40] }],
      legend: [{ c: 'rgba(255,255,255,0.4)', l: 'single fits' }, { c: T.cyan, l: 'average fit' }, { c: T.amber, l: 'truth' }],
      controls: [{ type: 'range', key: 'deg', label: 'Polynomial degree', min: 0, max: 12, step: 1, value: 3 }, { type: 'range', key: 'n', label: 'Points per training set', min: 10, max: 80, step: 1, value: 20 }, { type: 'range', key: 'noise', label: 'Noise σ', min: 0.05, max: 0.8, step: 0.05, value: 0.3 }],
      readouts: [{ key: 'b', label: 'Bias²' }, { key: 'v', label: 'Variance' }, { key: 'tot', label: 'Bias² + variance + σ²' }],
    });
    const truth = x => Math.sin(x * 3.1);
    const grid = Array.from({ length: 41 }, (_, i) => -1 + i * 0.05);
    const fitSet = (deg, n, nz, s) => {
      const R = rng(s), xs = Array.from({ length: n }, () => R() * 2 - 1), ys = xs.map(x => truth(x) + R.gauss() * nz);
      if (deg === 0) { const m = A.mean(ys); return () => m; }
      const B = A.polyBasis(xs, deg), w = A.ridgeFit(xs.map(x => [1, ...B.row(x)]), ys, 1e-6);
      return x => w[0] + B.row(x).reduce((s2, t, i) => s2 + t * w[i + 1], 0);
    };
    const decomp = (deg, n, nz) => {
      const fits = Array.from({ length: 20 }, (_, s) => fitSet(deg, n, nz, 100 + s));
      const P = grid.map(x => fits.map(f => clampv(f(x), -6, 6)));
      const avg = P.map(A.mean);
      const bias = A.mean(grid.map((x, i) => (avg[i] - truth(x)) ** 2)), vr = A.mean(P.map((row, i) => A.mean(row.map(v => (v - avg[i]) ** 2))));
      return { fits, avg, bias, vr };
    };
    const P = L.main, S = L.side[0];
    let curve = null, curveKey = '';
    const upd = () => {
      const v = L.val, d = decomp(v.deg, v.n, v.noise);
      L.set('b', d.bias.toFixed(3)); L.set('v', d.vr.toFixed(3)); L.set('tot', (d.bias + d.vr + v.noise ** 2).toFixed(3));
      const key = `${v.n}|${v.noise}`;
      if (key !== curveKey) { curve = Array.from({ length: 13 }, (_, k) => { const e = decomp(k, v.n, v.noise); return [e.bias, e.vr]; }); curveKey = key; }
      P.render = p => {
        p.grid({ axes: true });
        d.fits.forEach(f => p.fn(f, { color: 'rgba(255,255,255,0.16)', width: 1 }));
        p.fn(truth, { color: T.amber, width: 2, dash: [6, 4] });
        p.clip(() => p.path(grid, d.avg, { color: T.cyan, width: 2.6 }));
      };
      S.render = s => {
        const b = curve.map(c => Math.min(c[0], 1.5)), vv = curve.map(c => Math.min(c[1], 1.5)), t = curve.map((c, i) => Math.min(c[0] + c[1], 1.5));
        s.setRange([-0.5, 12.5], [0, Math.max(...t) * 1.1]); s.grid({ labels: true, step: 2 });
        const xs = curve.map((_, i) => i);
        s.path(xs, b, { color: T.amber, width: 2 }); s.path(xs, vv, { color: T.pink, width: 2 }); s.path(xs, t, { color: T.cyan, width: 2.2 });
        s.seg(v.deg, 0, v.deg, 9, { color: 'rgba(255,255,255,0.35)', dash: [3, 3] });
        s.text('bias²', s.sx(0.2), s.sy(b[0]) - 6, { color: T.amber, size: 10 }); s.text('variance', s.sx(12) - 4, s.sy(vv[12]) - 6, { color: T.pink, size: 10, align: 'right' });
      };
      L.redraw();
    };
    L.on(upd); upd();
  };

  labs.regularization = el => {
    let c = [1.3, 0.55];
    const L = mount(el, {
      title: 'Live lab · the geometry of L1 and L2', hint: 'Drag the × (the unregularised optimum)',
      main: { x: [-2, 2], y: [-1.6, 1.6], equal: true, pad: [8, 8, 8, 8] },
      legend: [{ c: T.violet2, l: 'loss contours' }, { c: T.cyan, l: 'constraint region' }, { c: T.amber, l: 'solution' }],
      controls: [{ type: 'seg', key: 'pen', label: 'Penalty', options: [['l1', 'L1 (lasso)'], ['l2', 'L2 (ridge)']], value: 'l1' }, { type: 'range', key: 't', label: 'Budget t (smaller = stronger penalty)', min: 0.1, max: 2, step: 0.02, value: 0.8 }],
      readouts: [{ key: 'w', label: 'Solution (w₁, w₂)' }, { key: 'z', label: 'Exact zeros' }, { key: 'loss', label: 'Loss increase vs OLS' }],
    });
    const Q = [[1, 0.6], [0.6, 2.2]];
    const loss = (w) => { const d = [w[0] - c[0], w[1] - c[1]]; return d[0] * (Q[0][0] * d[0] + Q[0][1] * d[1]) + d[1] * (Q[1][0] * d[0] + Q[1][1] * d[1]); };
    const norm = w => (L.val.pen === 'l1' ? Math.abs(w[0]) + Math.abs(w[1]) : Math.hypot(w[0], w[1]));
    const solve = () => {
      if (norm(c) <= L.val.t) return c.slice();
      let best = null;
      for (let i = 0; i < 4000; i++) {
        const a = (i / 4000) * Math.PI * 2;
        let w = [Math.cos(a), Math.sin(a)];
        const s = L.val.t / norm(w); w = [w[0] * s, w[1] * s];
        const l = loss(w); if (!best || l < best.l) best = { w, l };
      }
      // snap tiny coordinates to zero (the corner)
      return best.w.map(v => (Math.abs(v) < 4e-3 ? 0 : v));
    };
    const P = L.main;
    P.render = p => {
      const w = solve(), l0 = loss(w);
      p.grid({ axes: true });
      const t = L.val.t, c2 = p.ctx;
      c2.beginPath();
      if (L.val.pen === 'l1') { c2.moveTo(p.sx(t), p.sy(0)); c2.lineTo(p.sx(0), p.sy(t)); c2.lineTo(p.sx(-t), p.sy(0)); c2.lineTo(p.sx(0), p.sy(-t)); c2.closePath(); }
      else { c2.ellipse(p.sx(0), p.sy(0), Math.abs(p.sx(t) - p.sx(0)), Math.abs(p.sy(t) - p.sy(0)), 0, 0, Math.PI * 2); }
      c2.fillStyle = alpha(T.cyan, 0.14); c2.fill(); c2.strokeStyle = T.cyan; c2.lineWidth = 1.6; c2.stroke();
      [l0, l0 * 2.2 + 0.05, l0 * 4 + 0.2, l0 * 7 + 0.5].forEach((lv, i) => p.contour((x, y) => loss([x, y]), lv, { color: alpha(T.violet2, i ? 0.4 : 0.95), width: i ? 1 : 1.6 }));
      p.cross(c[0], c[1], T.ink, 7, 2.2);
      p.points([w], { color: T.amber, r: 6 });
      L.set('w', `(${w[0].toFixed(2)}, ${w[1].toFixed(2)})`); L.set('z', String(w.filter(v => v === 0).length), w.some(v => v === 0) ? 'good' : ''); L.set('loss', l0.toFixed(3));
    };
    let drag = false;
    P.onDown = p => { drag = true; c = [clampv(p.x, -1.9, 1.9), clampv(p.y, -1.5, 1.5)]; P.request(); };
    P.onDrag = p => { if (drag) { c = [clampv(p.x, -1.9, 1.9), clampv(p.y, -1.5, 1.5)]; P.request(); } };
    P.onUp = () => { drag = false; };
    L.on(k => { if (k === 'reset') c = [1.3, 0.55]; P.request(); });
  };

  labs['cross-validation'] = el => {
    const L = mount(el, {
      title: 'Live lab · rotating the hold-out',
      main: { x: [0, 1], y: [0, 1], pad: [14, 14, 14, 70] }, side: ['Validation R² per fold'], sideOpts: [{ pad: [28, 12, 22, 40] }],
      legend: [{ c: T.violet, l: 'train' }, { c: T.cyan, l: 'validate' }, { c: 'rgba(255,255,255,0.12)', l: 'unused' }],
      controls: [{ type: 'range', key: 'k', label: 'Folds K', min: 2, max: 10, step: 1, value: 5 }, { type: 'seg', key: 'scheme', label: 'Scheme', options: [['kfold', 'Shuffled K-fold'], ['ts', 'Time-series split']], value: 'kfold' }, { type: 'buttons', items: [{ key: 'shuffle', label: 'Reshuffle' }] }],
      readouts: [{ key: 'mean', label: 'Mean R²' }, { key: 'sd', label: 'Std across folds' }, { key: 'train', label: 'Avg training size' }],
    });
    let seed = 1;
    const n = 100, R0 = rng(5);
    const xs = Array.from({ length: n }, (_, i) => -1 + (2 * i) / (n - 1)), ys = xs.map(x => Math.sin(3 * x) + 0.3 * x + R0.gauss() * 0.35);
    const P = L.main, S = L.side[0];
    const upd = () => {
      const K = L.val.k, folds = [];
      if (L.val.scheme === 'kfold') {
        const idx = rng(seed).shuffle([...Array(n).keys()]);
        for (let f = 0; f < K; f++) { const va = idx.filter((_, i) => i % K === f); folds.push({ va, tr: idx.filter((_, i) => i % K !== f) }); }
      } else {
        const size = Math.floor(n / (K + 1));
        for (let f = 0; f < K; f++) { const end = size * (f + 1); folds.push({ tr: [...Array(end).keys()], va: [...Array(Math.min(size, n - end)).keys()].map(i => end + i) }); }
      }
      const scores = folds.map(fd => {
        const B = A.polyBasis(fd.tr.map(i => xs[i]), 4);
        const w = A.ridgeFit(fd.tr.map(i => [1, ...B.row(xs[i])]), fd.tr.map(i => ys[i]), 0.1);
        const pr = x => w[0] + B.row(x).reduce((s, t, j) => s + t * w[j + 1], 0);
        return A.M.r2(fd.va.map(i => ys[i]), fd.va.map(i => pr(xs[i])));
      });
      const m = A.mean(scores), sd = Math.sqrt(A.mean(scores.map(s => (s - m) ** 2)));
      L.set('mean', m.toFixed(3)); L.set('sd', sd.toFixed(3)); L.set('train', `${A.mean(folds.map(f => f.tr.length)).toFixed(0)} rows`);
      P.render = p => {
        const r = p.range, rowH = r.h / K;
        folds.forEach((fd, f) => {
          const tr = new Set(fd.tr), va = new Set(fd.va);
          for (let i = 0; i < n; i++) {
            const x0 = r.pl + (i / n) * r.w;
            p.ctx.fillStyle = va.has(i) ? alpha(T.cyan, 0.85) : tr.has(i) ? alpha(T.violet, 0.5) : 'rgba(255,255,255,0.08)';
            p.ctx.fillRect(x0 + 0.5, r.pt + f * rowH + 3, r.w / n - 1, rowH - 6);
          }
          p.text(`fold ${f + 1}`, r.pl - 10, r.pt + f * rowH + rowH / 2 + 4, { align: 'right', color: T.muted, size: 10 });
        });
        p.text(L.val.scheme === 'ts' ? 'time →' : 'rows (shuffled order) →', r.pl + r.w, r.pt + r.h + 12, { align: 'right', color: T.dim, size: 10 });
      };
      S.render = s => {
        s.setRange([0.5, K + 0.5], [Math.min(0, ...scores) - 0.05, 1.05]); s.grid({ labels: true, step: 1 });
        s.band([0.5, K + 0.5], [m - sd, m - sd], [m + sd, m + sd], alpha(T.cyan, 0.12));
        s.seg(0.5, m, K + 0.5, m, { color: T.cyan, width: 1.6 });
        s.points(scores.map((v, i) => [i + 1, v]), { color: T.amber, r: 4.5 });
      };
      L.redraw();
    };
    L.button('shuffle', () => { seed++; upd(); });
    L.on(upd); upd();
  };

  // ------------------------------------------------------------------ probability for classifiers
  labs['log-odds'] = el => {
    let p = 0.8;
    const L = mount(el, {
      title: 'Live lab · three views of the same number', hint: 'Drag along any of the three scales',
      main: { x: [0, 1], y: [0, 3], pad: [20, 30, 20, 110] },
      controls: [{ type: 'buttons', items: [{ key: 'plus', label: '+1 log-odds', kind: 'light' }, { key: 'minus', label: '−1 log-odds' }] }],
      readouts: [{ key: 'p', label: 'Probability p' }, { key: 'o', label: 'Odds p / (1 − p)' }, { key: 'z', label: 'Log-odds ln(odds)' }],
    });
    const P = L.main;
    const scales = [
      { name: 'probability', lo: 0, hi: 1, val: () => p, set: v => { p = v; }, ticks: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1] },
      { name: 'odds', lo: 0, hi: 20, val: () => p / (1 - p), set: v => { p = v / (1 + v); }, ticks: [0, 1, 2, 4, 9, 20] },
      { name: 'log-odds', lo: -5, hi: 5, val: () => Math.log(p / (1 - p)), set: v => { p = 1 / (1 + Math.exp(-v)); }, ticks: [-5, -2.2, 0, 2.2, 5] },
    ];
    const ypos = i => 2.5 - i;
    P.render = pl => {
      const r = pl.range;
      scales.forEach((s, i) => {
        const y = ypos(i), X = v => (v - s.lo) / (s.hi - s.lo);
        pl.seg(0, y, 1, y, { color: 'rgba(255,255,255,0.25)', width: 2 });
        s.ticks.forEach(t => { pl.seg(X(t), y - 0.06, X(t), y + 0.06, { color: 'rgba(255,255,255,0.35)' }); pl.text(String(t), pl.sx(X(t)), pl.sy(y) + 22, { align: 'center', color: T.dim, size: 10 }); });
        pl.text(s.name, r.pl - 14, pl.sy(y) + 4, { align: 'right', color: T.soft, size: 11 });
        const v = clampv(s.val(), s.lo, s.hi);
        pl.points([[X(v), y]], { color: [T.violet, T.cyan, T.amber][i], r: 8 });
        pl.text(fmt.n2(s.val()), pl.sx(X(v)), pl.sy(y) - 14, { align: 'center', color: T.ink, size: 12 });
      });
      for (let i = 0; i < 2; i++) pl.seg((scales[i].val() - scales[i].lo) / (scales[i].hi - scales[i].lo), ypos(i), clampv((scales[i + 1].val() - scales[i + 1].lo) / (scales[i + 1].hi - scales[i + 1].lo), 0, 1), ypos(i + 1), { color: 'rgba(255,255,255,0.18)', dash: [3, 4] });
      L.set('p', p.toFixed(3)); L.set('o', (p / (1 - p)).toFixed(3)); L.set('z', Math.log(p / (1 - p)).toFixed(3));
    };
    let active = -1;
    const setFrom = q => { if (active < 0) return; const s = scales[active]; s.set(clampv(s.lo + clampv(q.x, 0.001, 0.999) * (s.hi - s.lo), active === 1 ? 0.001 : s.lo + 1e-3, s.hi - 1e-3)); p = clampv(p, 0.0005, 0.9995); P.request(); };
    P.onDown = q => { active = [0, 1, 2].reduce((b, i) => (Math.abs(q.y - ypos(i)) < Math.abs(q.y - ypos(b)) ? i : b), 0); setFrom(q); };
    P.onDrag = setFrom; P.onUp = () => { active = -1; };
    const shift = d => { const z = Math.log(p / (1 - p)) + d; p = clampv(1 / (1 + Math.exp(-z)), 0.0005, 0.9995); P.request(); };
    L.button('plus', () => shift(1)); L.button('minus', () => shift(-1));
    L.on(k => { if (k === 'reset') p = 0.8; P.request(); });
  };

  labs['sigmoid-and-link-functions'] = el => {
    const fns = {
      sigmoid: { f: z => 1 / (1 + Math.exp(-z)), d: z => { const s = 1 / (1 + Math.exp(-z)); return s * (1 - s); }, y: [-0.1, 1.1] },
      tanh: { f: Math.tanh, d: z => 1 - Math.tanh(z) ** 2, y: [-1.15, 1.15] },
      probit: { f: z => 0.5 * (1 + erf(z / Math.SQRT2)), d: z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI), y: [-0.1, 1.1] },
      relu: { f: z => Math.max(0, z), d: z => (z > 0 ? 1 : 0), y: [-0.5, 6.2] },
      exp: { f: Math.exp, d: Math.exp, y: [-0.5, 8] },
    };
    function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
    const L = mount(el, {
      title: 'Live lab · links and activations',
      main: { x: [-6, 6], y: [-0.1, 1.1], pad: [14, 12, 24, 34] },
      legend: [{ c: T.cyan, l: 'f(z / T)' }, { c: T.pink, l: 'derivative' }],
      controls: [{ type: 'seg', key: 'fn', label: 'Function', options: [['sigmoid', 'sigmoid'], ['tanh', 'tanh'], ['probit', 'probit'], ['relu', 'ReLU'], ['exp', 'exp (log link)']], value: 'sigmoid', span: true }, { type: 'range', key: 'z', label: 'Input z', min: -6, max: 6, step: 0.1, value: 2 }, { type: 'range', key: 'T', label: 'Temperature T', min: 0.2, max: 3, step: 0.05, value: 1 }],
      readouts: [{ key: 'f', label: 'f(z / T)' }, { key: 'd', label: 'Slope at z' }, { key: 'sat', label: 'Gradient vs at z = 0' }],
    });
    const P = L.main;
    P.render = p => {
      const F = fns[L.val.fn], t = L.val.T, z = L.val.z;
      p.setRange([-6, 6], F.y); p.grid({ axes: true, labels: true });
      p.fn(x => F.d(x / t) / t, { color: T.pink, width: 1.8, dash: [5, 4] });
      p.fn(x => F.f(x / t), { color: T.cyan, width: 2.6 });
      p.seg(z, -10, z, 10, { color: 'rgba(255,255,255,0.3)', dash: [3, 3] });
      p.points([[z, F.f(z / t)]], { color: T.amber, r: 5.5 });
      const d0 = F.d(0) / t || 1e-12;
      L.set('f', F.f(z / t).toFixed(4)); L.set('d', (F.d(z / t) / t).toFixed(4));
      const ratio2 = (F.d(z / t) / t) / d0; L.set('sat', `${(ratio2 * 100).toFixed(1)}%`, ratio2 < 0.1 ? 'warn' : '');
    };
    L.on(() => P.request());
  };

  // ------------------------------------------------------------------ evaluation
  labs['regression-metrics'] = el => {
    const base = () => { const R = rng(3); return Array.from({ length: 10 }, (_, i) => { const x = -0.9 + i * 0.2; return [x, 1.4 + 0.8 * x + R.gauss() * 0.22]; }); };
    let pts = base();
    const L = mount(el, {
      title: 'Live lab · drag a point and watch the metrics', hint: 'Drag any point',
      main: { x: [-1.1, 1.1], y: [-0.4, 3.4], pad: [12, 12, 24, 30] },
      legend: [{ c: T.cyan, l: 'model ŷ = 1.4 + 0.8x' }],
      readouts: [{ key: 'mae', label: 'MAE' }, { key: 'rmse', label: 'RMSE' }, { key: 'r2', label: 'R²' }, { key: 'mape', label: 'MAPE' }],
    });
    const P = L.main, f = x => 1.4 + 0.8 * x;
    P.render = p => {
      p.grid({ axes: true, labels: true });
      p.fn(f, { color: T.cyan, width: 2.4 });
      pts.forEach(([x, y]) => p.seg(x, y, x, f(x), { color: alpha(T.amber, 0.7), dash: [3, 3] }));
      p.points(pts, { color: T.violet2, r: 5 });
      const y = pts.map(q => q[1]), pr = pts.map(q => f(q[0]));
      L.set('mae', A.M.mae(y, pr).toFixed(3)); L.set('rmse', A.M.rmse(y, pr).toFixed(3)); L.set('r2', A.M.r2(y, pr).toFixed(3));
      const mape = 100 * A.mean(y.map((v, i) => Math.abs((v - pr[i]) / (Math.abs(v) < 1e-9 ? 1e-9 : v))));
      L.set('mape', mape > 1000 ? '> 1000%' : `${mape.toFixed(1)}%`, mape > 50 ? 'warn' : '');
    };
    let drag = -1;
    P.onDown = q => { drag = pts.findIndex(t => Math.hypot(P.sx(t[0]) - q.px, P.sy(t[1]) - q.py) < 14); };
    P.onDrag = q => { if (drag >= 0) { pts[drag] = [pts[drag][0], clampv(q.y, -0.35, 3.35)]; P.request(); } };
    P.onUp = () => { drag = -1; };
    L.on(k => { if (k === 'reset') pts = base(); P.request(); });
  };

  const thresholdLab = (el, kind) => {
    const L = mount(el, {
      title: kind === 'cm' ? 'Live lab · slide the threshold' : kind === 'pr' ? 'Live lab · the precision–recall trade-off' : 'Live lab · ROC curve and AUC',
      main: { pad: [16, 12, 26, 40] }, side: [kind === 'cm' ? 'Confusion matrix' : kind === 'pr' ? 'Precision–recall curve' : 'ROC curve'],
      sideOpts: [kind === 'cm' ? { x: [0, 2], y: [0, 2], pad: [48, 12, 12, 64] } : { x: [0, 1], y: [0, 1.02], pad: [28, 12, 26, 36], equal: true }],
      legend: [{ c: T.violet, l: 'real negatives' }, { c: T.cyan, l: 'real positives' }],
      controls: [{ type: 'range', key: 't', label: 'Threshold', min: 0.01, max: 0.99, step: 0.01, value: 0.5 }, { type: 'range', key: 'sep', label: 'Class separation', min: 0, max: 5, step: 0.1, value: 2.2 }, { type: 'range', key: 'pos', label: 'Share of positives', min: 0.02, max: 0.5, step: 0.01, value: 0.3, fmt: fmt.pct }]
        .concat(kind === 'pr' ? [{ type: 'range', key: 'beta', label: 'β in F-beta', min: 0.25, max: 4, step: 0.25, value: 1 }] : []),
      readouts: kind === 'cm' ? [{ key: 'acc', label: 'Accuracy' }, { key: 'rec', label: 'Recall (TPR)' }, { key: 'prec', label: 'Precision' }, { key: 'spec', label: 'Specificity' }]
        : kind === 'pr' ? [{ key: 'prec', label: 'Precision' }, { key: 'rec', label: 'Recall' }, { key: 'f', label: 'F-β at threshold' }, { key: 'best', label: 'Best F-β threshold' }, { key: 'ap', label: 'Average precision' }]
          : [{ key: 'auc', label: 'AUC' }, { key: 'tpr', label: 'TPR at threshold' }, { key: 'fpr', label: 'FPR at threshold' }],
    });
    const P = L.main, S = L.side[0];
    const upd = () => {
      const v = L.val, Sc = scores(v.sep, v.pos), c = cm(Sc, v.t), N = Sc.length;
      P.render = p => histDensity(p, Sc, v.t);
      const ts = Array.from({ length: 101 }, (_, i) => i / 100);
      const pts = ts.map(t => cm(Sc, t));
      if (kind === 'cm') {
        L.set('acc', fmt.pct((c.tp + c.tn) / N)); L.set('rec', fmt.pct(ratio(c.tp, c.tp + c.fn))); L.set('prec', fmt.pct(ratio(c.tp, c.tp + c.fp))); L.set('spec', fmt.pct(ratio(c.tn, c.tn + c.fp)));
        S.render = s => {
          const cells = [[c.tn, 'TN', 0, 1, T.green], [c.fp, 'FP', 1, 1, T.pink], [c.fn, 'FN', 0, 0, T.pink], [c.tp, 'TP', 1, 0, T.green]];
          const mx = Math.max(...cells.map(q => q[0]), 1);
          cells.forEach(([n, lab, col, row, color]) => {
            s.rect(col + 0.03, row + 0.03, col + 0.97, row + 0.97, { fill: alpha(color, 0.08 + 0.5 * (n / mx)), stroke: 'rgba(255,255,255,0.12)' });
            s.text(String(n), s.sx(col + 0.5), s.sy(row + 0.5) + 6, { align: 'center', color: T.ink, size: 20, sans: true });
            s.text(lab, s.sx(col + 0.5), s.sy(row + 0.5) + 24, { align: 'center', color: T.muted, size: 10 });
          });
          s.text('predicted −', s.sx(0.5), s.range.pt - 8, { align: 'center', color: T.dim, size: 10 }); s.text('predicted +', s.sx(1.5), s.range.pt - 8, { align: 'center', color: T.dim, size: 10 });
          s.text('actual −', s.range.pl - 6, s.sy(1.5) + 4, { align: 'right', color: T.dim, size: 10 }); s.text('actual +', s.range.pl - 6, s.sy(0.5) + 4, { align: 'right', color: T.dim, size: 10 });
        };
      } else if (kind === 'pr') {
        const b2 = v.beta * v.beta;
        const pr = pts.map(q => [ratio(q.tp, q.tp + q.fn), q.tp + q.fp ? q.tp / (q.tp + q.fp) : 1]);
        const fb = q => { const P_ = ratio(q.tp, q.tp + q.fp), R_ = ratio(q.tp, q.tp + q.fn); return P_ + R_ ? (1 + b2) * P_ * R_ / (b2 * P_ + R_) : 0; };
        let best = 0; pts.forEach((q, i) => { if (fb(q) > fb(pts[best])) best = i; });
        let ap = 0; for (let i = 0; i < pr.length - 1; i++) ap += (pr[i][0] - pr[i + 1][0]) * pr[i][1];
        L.set('prec', ratio(c.tp, c.tp + c.fp).toFixed(3)); L.set('rec', ratio(c.tp, c.tp + c.fn).toFixed(3)); L.set('f', fb(c).toFixed(3)); L.set('best', ts[best].toFixed(2)); L.set('ap', ap.toFixed(3));
        S.render = s => {
          s.grid({ labels: true, step: 0.25 });
          s.seg(0, v.pos, 1, v.pos, { color: 'rgba(255,255,255,0.3)', dash: [4, 4] });
          s.text('random', s.sx(0.98), s.sy(v.pos) - 5, { align: 'right', color: T.dim, size: 10 });
          s.path(pr.map(q => q[0]), pr.map(q => q[1]), { color: T.cyan, width: 2.2 });
          s.points([[ratio(c.tp, c.tp + c.fn), c.tp + c.fp ? c.tp / (c.tp + c.fp) : 1]], { color: T.amber, r: 5.5 });
          s.text('recall →', s.range.pl + s.range.w, s.range.pt + s.range.h + 20, { align: 'right', color: T.dim, size: 10 });
        };
      } else {
        const roc = pts.map(q => [ratio(q.fp, q.fp + q.tn), ratio(q.tp, q.tp + q.fn)]);
        let auc = 0; for (let i = 0; i < roc.length - 1; i++) auc += (roc[i][0] - roc[i + 1][0]) * (roc[i][1] + roc[i + 1][1]) / 2;
        L.set('auc', auc.toFixed(3), auc > 0.85 ? 'good' : auc < 0.6 ? 'warn' : ''); L.set('tpr', ratio(c.tp, c.tp + c.fn).toFixed(3)); L.set('fpr', ratio(c.fp, c.fp + c.tn).toFixed(3));
        S.render = s => {
          s.grid({ labels: true, step: 0.25 });
          s.band(roc.map(q => q[0]).reverse(), roc.map(() => 0), roc.map(q => q[1]).reverse(), alpha(T.cyan, 0.12));
          s.seg(0, 0, 1, 1, { color: 'rgba(255,255,255,0.3)', dash: [4, 4] });
          s.path(roc.map(q => q[0]), roc.map(q => q[1]), { color: T.cyan, width: 2.2 });
          s.points([[ratio(c.fp, c.fp + c.tn), ratio(c.tp, c.tp + c.fn)]], { color: T.amber, r: 5.5 });
          s.text('FPR →', s.range.pl + s.range.w, s.range.pt + s.range.h + 20, { align: 'right', color: T.dim, size: 10 });
        };
      }
      L.redraw();
    };
    L.on(upd); upd();
  };
  labs['confusion-matrix'] = el => thresholdLab(el, 'cm');
  labs['precision-recall-f1'] = el => thresholdLab(el, 'pr');
  labs['roc-auc'] = el => thresholdLab(el, 'roc');

  labs['clustering-metrics'] = el => {
    const L = mount(el, {
      title: 'Live lab · silhouettes for every point',
      main: { x: [-1.3, 1.3], y: [-1, 1], equal: true, pad: [10, 10, 10, 10] }, side: ['Silhouette per point (sorted)'], sideOpts: [{ pad: [26, 10, 22, 34] }],
      controls: [{ type: 'seg', key: 'data', label: 'Dataset', options: [['blobs', 'Blobs'], ['elongated', 'Elongated'], ['moons', 'Moons'], ['noisy', 'Blobs + noise']], value: 'blobs' }, { type: 'range', key: 'k', label: 'k (k-means)', min: 2, max: 8, step: 1, value: 3 }],
      readouts: [{ key: 's', label: 'Mean silhouette' }, { key: 'db', label: 'Davies–Bouldin' }, { key: 'w', label: 'Inertia' }, { key: 'neg', label: 'Points with s < 0' }],
    });
    const P = L.main, S = L.side[0];
    const upd = () => {
      const X = clu2d[L.val.data](200, rng(6), { k: 4 }), km = A.kmeans(X, L.val.k, rng(2)), sil = A.M.silhouette(X, km.lab);
      L.set('s', sil.mean.toFixed(3), sil.mean > 0.5 ? 'good' : sil.mean < 0.25 ? 'warn' : ''); L.set('db', A.M.daviesBouldin(X, km.lab).toFixed(3)); L.set('w', km.inertia.toFixed(2)); L.set('neg', String(sil.s.filter(v => v < 0).length));
      P.render = p => { p.grid(); p.points(X, { color: i => (sil.s[i] < 0 ? T.pink : T.pal[km.lab[i] % T.pal.length]), r: i => (sil.s[i] < 0 ? 4.5 : 3.2) }); km.C.forEach((c, j) => p.cross(c[0], c[1], T.pal[j % T.pal.length], 6, 2.4)); };
      S.render = s => {
        const order = X.map((_, i) => i).sort((a, b) => km.lab[a] - km.lab[b] || sil.s[b] - sil.s[a]);
        s.setRange([0, order.length], [Math.min(-0.2, ...sil.s) - 0.02, 1]); s.grid({ axes: true, labels: true, step: 50, stepY: 0.25 });
        order.forEach((i, t) => s.rect(t, 0, t + 1, sil.s[i], { fill: alpha(sil.s[i] < 0 ? T.pink : T.pal[km.lab[i] % T.pal.length], 0.85) }));
        s.seg(0, sil.mean, order.length, sil.mean, { color: T.amber, dash: [5, 4], width: 1.4 });
      };
      L.redraw();
    };
    L.on(upd); upd();
  };

  root.Labs.concepts = labs;
})(window);

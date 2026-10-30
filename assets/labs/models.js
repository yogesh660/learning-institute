// One interactive lab per model lesson. Each entry receives the lab element and builds itself
// from the generic playgrounds below (classification, regression, clustering) or a custom view.
(function (root) {
  'use strict';
  const { T, alpha, rng, cls2d, clsNames, clu2d, cluNames, reg1d, regNames, split, flipLabels, mount, animator, fmt, reduced, h } = root.Lab;
  const A = root.Algo;
  const labs = {};
  const opts = (keys, names) => keys.map(k => [k, names[k]]);
  const pct = fmt.pct;

  // ======================================================================= playgrounds
  // ---------- 2-D binary classification
  function classify(el, cfg) {
    const datasets = cfg.data || ['blobs', 'moons', 'circles', 'xor'];
    let seed = 11, D = null;
    const controls = [{ type: 'seg', key: 'data', label: 'Dataset', options: opts(datasets, clsNames), value: cfg.defaultData || datasets[0], span: datasets.length > 4 }]
      .concat(cfg.controls || [])
      .concat(cfg.noNoise ? [] : [{ type: 'range', key: 'noise', label: 'Label noise', min: 0, max: 0.3, step: 0.05, value: 0, fmt: pct }])
      .concat([{ type: 'buttons', items: [...(cfg.buttons || []), { key: 'reseed', label: 'New sample' }] }]);
    const L = mount(el, {
      title: cfg.title, legend: [{ c: T.violet, l: 'Class 0' }, { c: T.cyan, l: 'Class 1' }, { c: T.dim, l: '○ test' }],
      hint: cfg.hint || '', main: { x: [-1.3, 1.3], y: [-1, 1], equal: true, pad: [10, 10, 10, 10] },
      side: cfg.side, sideOpts: cfg.sideOpts, controls,
      readouts: [{ key: 'train', label: 'Train accuracy' }, { key: 'test', label: 'Test accuracy' }].concat(cfg.readouts || []),
    });
    const P = L.main;
    let model = null, hover = null;
    const data = () => {
      const R = rng(seed), d = cls2d[L.val.data](cfg.n || 160, R, cfg.dataOpts || {});
      const y = flipLabels(d.y, L.val.noise || 0, rng(seed + 7));
      const s = split(d.X.length, 0.3, rng(seed + 3));
      D = { X: d.X, y, tr: s.train, te: s.test, Xtr: s.train.map(i => d.X[i]), ytr: s.train.map(i => y[i]), Xte: s.test.map(i => d.X[i]), yte: s.test.map(i => y[i]) };
    };
    const fit = () => {
      model = cfg.fit(D.Xtr, D.ytr, L.val, rng(seed + 19), D);
      const ptr = D.Xtr.map(x => model.proba(x)), pte = D.Xte.map(x => model.proba(x));
      const tr = A.M.acc(D.ytr, ptr), te = A.M.acc(D.yte, pte);
      L.set('train', pct(tr)); L.set('test', pct(te), te >= tr - 0.03 ? 'good' : te < tr - 0.1 ? 'warn' : '');
      (cfg.readouts || []).forEach(r => L.set(r.key, r.value(model, D, L.val)));
    };
    P.render = () => {
      if (!model) return;
      P.probField(null, cfg.res || 4);
      P.contour((x, y) => model.proba([x, y]), 0.5, { color: 'rgba(255,255,255,0.7)', width: 1.5 });
      if (cfg.decorate) cfg.decorate(P, model, D, L.val, hover);
      const r = cfg.pointR ? cfg.pointR(model, D) : null;
      P.points(D.Xtr, { color: i => T.cls[D.ytr[i]], r: r ? i => r(i) : 3.4 });
      P.points(D.Xte, { color: i => T.cls[D.yte[i]], hollow: true, r: 3.4 });
      if (cfg.overlay) cfg.overlay(P, model, D, L.val, hover);
    };
    // the field callback receives (x, y)
    P.probField = function (proba, res) {
      const a = T.rgb(T.violet), b = T.rgb(T.cyan);
      this.field((x, y) => { const p = model.proba([x, y]); const t = Math.abs(p - 0.5) * 2; return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p, 16 + 74 * t]; }, res);
    };
    if (cfg.onHover) {
      P.onHover = p => { hover = p; P.request(); };
      P.onLeave = () => { hover = null; P.request(); };
    }
    const all = () => { data(); fit(); L.redraw(); if (cfg.after) cfg.after(L, model, D); };
    L.on(k => { if (k === 'data' || k === 'noise' || k === 'reset') { if (k === 'reset') seed = 11; all(); } else { fit(); L.redraw(); if (cfg.after) cfg.after(L, model, D); } });
    L.button('reseed', () => { seed = Math.floor(Math.random() * 1e6); all(); });
    if (cfg.init) cfg.init(L, () => ({ model, D }), all);
    all();
    return L;
  }

  // ---------- 1-D regression
  function regress(el, cfg) {
    const datasets = cfg.data || ['sine', 'linear', 'cubic', 'step'];
    let seed = 5, D = null, model = null;
    const controls = (datasets.length > 1 ? [{ type: 'seg', key: 'data', label: 'Dataset', options: opts(datasets, regNames), value: cfg.defaultData || datasets[0] }] : [])
      .concat(cfg.controls || [])
      .concat([{ type: 'buttons', items: [...(cfg.buttons || []), { key: 'reseed', label: 'New sample' }] }]);
    const L = mount(el, {
      title: cfg.title, legend: [{ c: T.violet2, l: 'train' }, { c: T.dim, l: '○ test' }, { c: T.cyan, l: 'model' }].concat(cfg.legend || []),
      hint: cfg.hint || '', main: { x: [-1.08, 1.08], y: cfg.yr || [-1.9, 1.9], pad: [12, 12, 12, 12] },
      side: cfg.side, sideOpts: cfg.sideOpts, controls,
      readouts: [{ key: 'train', label: 'Train RMSE' }, { key: 'test', label: 'Test RMSE' }].concat(cfg.readouts || []),
    });
    const P = L.main;
    const data = () => {
      const R = rng(seed);
      let pts = reg1d[L.val.data || datasets[0]](cfg.n || 60, R, { noise: cfg.noise });
      if (cfg.transform) pts = cfg.transform(pts, L.val, R);
      const s = split(pts.length, cfg.testFrac ?? 0.33, rng(seed + 1));
      D = { pts, xtr: s.train.map(i => pts[i][0]), ytr: s.train.map(i => pts[i][1]), xte: s.test.map(i => pts[i][0]), yte: s.test.map(i => pts[i][1]) };
    };
    const fit = () => {
      model = cfg.fit(D.xtr, D.ytr, L.val, rng(seed + 9), D);
      const tr = A.M.rmse(D.ytr, D.xtr.map(model.predict)), te = A.M.rmse(D.yte, D.xte.map(model.predict));
      L.set('train', fmt.n3(tr)); L.set('test', fmt.n3(te), te > tr * 1.6 && te - tr > 0.05 ? 'warn' : '');
      (cfg.readouts || []).forEach(r => L.set(r.key, r.value(model, D, L.val)));
    };
    P.render = () => {
      if (!model) return;
      P.grid({ axes: true });
      if (cfg.under) cfg.under(P, model, D, L.val);
      P.points(D.xte.map((x, i) => [x, D.yte[i]]), { color: T.muted, hollow: true, r: 3.3 });
      P.points(D.xtr.map((x, i) => [x, D.ytr[i]]), { color: i => (cfg.pointColor ? cfg.pointColor(model, i, D) : T.violet2), r: 3.4 });
      if (!cfg.noCurve) P.fn(model.predict, { color: T.cyan, width: 2.4 });
      if (cfg.over) cfg.over(P, model, D, L.val);
    };
    const all = () => { data(); fit(); L.redraw(); };
    L.on(k => { if (k === 'data' || k === 'reset' || (cfg.dataKeys || []).includes(k)) { if (k === 'reset') seed = 5; all(); } else { fit(); L.redraw(); } });
    L.button('reseed', () => { seed = Math.floor(Math.random() * 1e6); all(); });
    if (cfg.sideRender) L.side.forEach((s, i) => { s.render = () => model && cfg.sideRender[i](s, model, D, L.val); });
    if (cfg.init) cfg.init(L, () => ({ model, D }), all, fit);
    all();
    return L;
  }

  // ---------- 2-D clustering
  function cluster(el, cfg) {
    const datasets = cfg.data || ['blobs', 'moons', 'density', 'noisy'];
    let seed = 3, X = null, res = null;
    const controls = (datasets.length > 1 ? [{ type: 'seg', key: 'data', label: 'Dataset', options: opts(datasets, cluNames), value: cfg.defaultData || datasets[0], span: datasets.length > 4 }] : [])
      .concat(cfg.controls || [])
      .concat([{ type: 'buttons', items: [...(cfg.buttons || []), { key: 'reseed', label: 'New sample' }] }]);
    const L = mount(el, {
      title: cfg.title, hint: cfg.hint || '', main: { x: [-1.3, 1.3], y: [-1, 1], equal: true, pad: [10, 10, 10, 10] },
      side: cfg.side, sideOpts: cfg.sideOpts, controls, legend: cfg.legend,
      readouts: [{ key: 'k', label: 'Clusters found' }, { key: 'sil', label: 'Silhouette' }].concat(cfg.readouts || []),
    });
    const P = L.main;
    const data = () => { X = clu2d[L.val.data || datasets[0]](cfg.n || 210, rng(seed), cfg.dataOpts || {}); if (cfg.prepare) X = cfg.prepare(X, L.val, rng(seed + 2)); };
    const run = () => {
      res = cfg.run(X, L.val, rng(seed + 5));
      const lab = res.lab;
      const k = new Set(lab.filter(l => l >= 0)).size;
      L.set('k', String(k) + (lab.some(l => l < 0) ? ` + ${lab.filter(l => l < 0).length} noise` : ''));
      L.set('sil', k > 1 ? A.M.silhouette(X, lab).mean.toFixed(3) : '–');
      (cfg.readouts || []).forEach(r => L.set(r.key, r.value(res, X, L.val)));
    };
    P.render = () => {
      if (!res) return;
      P.grid();
      if (cfg.under) cfg.under(P, res, X, L.val);
      const col = i => (res.color ? res.color(i) : res.lab[i] < 0 ? 'rgba(160,160,170,0.55)' : T.pal[res.lab[i] % T.pal.length]);
      P.points(X, { color: col, r: i => (res.radius ? res.radius(i) : res.lab[i] < 0 ? 2.2 : 3.3), hollow: res.hollow });
      if (cfg.over) cfg.over(P, res, X, L.val);
    };
    if (cfg.sideRender) L.side.forEach((s, i) => { s.render = () => res && cfg.sideRender[i](s, res, X, L.val); });
    const all = () => { data(); run(); L.redraw(); };
    L.on(k => { if (k === 'data' || k === 'reset' || (cfg.dataKeys || []).includes(k)) { if (k === 'reset') seed = 3; all(); } else { run(); L.redraw(); } });
    L.button('reseed', () => { seed = Math.floor(Math.random() * 1e6); all(); });
    const api = { L, get X() { return X; }, get res() { return res; }, set res(v) { res = v; }, rerun: run, all };
    if (cfg.init) cfg.init(api);
    all();
    return api;
  }

  // small shared drawings
  const drawBars = (S, vals, o = {}) => {
    const n = vals.length, mx = o.max || Math.max(1e-9, ...vals.map(Math.abs));
    S.setRange([-0.5, n - 0.5], o.signed === false ? [0, mx * 1.08] : [-mx * 1.1, mx * 1.1]);
    S.grid({ axes: true, step: 1 });
    vals.forEach((v, i) => {
      const zero = Math.abs(v) < 1e-9;
      S.rect(i - 0.32, 0, i + 0.32, v, { fill: zero ? 'rgba(255,255,255,0.12)' : alpha(o.color ? o.color(i) : (v >= 0 ? T.violet : T.cyan), 0.85) });
      if (zero) S.text('0', S.sx(i), S.sy(0) - 4, { align: 'center', color: T.dim, size: 9 });
    });
    if (o.labels) o.labels.forEach((l, i) => S.text(l, S.sx(i), S.range.pt + S.range.h + 14, { align: 'center', color: T.dim, size: 9 }));
  };
  const drawCurve = (S, ys, o = {}) => {
    const n = ys.length;
    if (n < 2) { S.text(o.empty || 'Press the button to start', S.range.pl + 4, S.range.pt + S.range.h / 2, { color: T.dim, size: 11 }); return; }
    const lo = o.min ?? Math.min(...ys), hi = o.max ?? Math.max(...ys);
    S.setRange([0, Math.max(1, n - 1)], [lo - (hi - lo) * 0.08 - 1e-9, hi + (hi - lo) * 0.12 + 1e-9]);
    S.grid({ labels: true });
    S.path(ys.map((_, i) => i), ys, { color: o.color || T.cyan, width: 2 });
    if (o.ys2) S.path(o.ys2.map((_, i) => i), o.ys2, { color: o.color2 || T.violet2, width: 2 });
  };
  const fmtLeaves = n => String(n);

  // ======================================================================= regression
  // OLS: drag points, closed form + optional gradient descent animation
  labs.ols_linear_regression = el => {
    let pts = [], gd = null, wb = null;
    const R0 = rng(4);
    const seedPts = () => { pts = Array.from({ length: 16 }, () => { const x = R0() * 1.8 - 0.9; return [x, 0.7 * x + 0.1 + R0.gauss() * 0.28]; }); };
    seedPts();
    const L = mount(el, {
      title: 'Live lab · drag the points', hint: 'Click to add · drag to move · double-click to remove',
      legend: [{ c: T.cyan, l: 'OLS fit' }, { c: T.amber, l: 'gradient descent' }],
      main: { x: [-1.1, 1.1], y: [-1.6, 1.6], pad: [12, 12, 12, 12] },
      side: ['Loss surface (w, b)'], sideOpts: [{ x: [-1.5, 2.5], y: [-1.5, 1.5], pad: [26, 10, 10, 10] }],
      controls: [{ type: 'range', key: 'lr', label: 'GD learning rate', min: 0.05, max: 1.2, step: 0.05, value: 0.3 }, { type: 'buttons', items: [{ key: 'gd', label: 'Run gradient descent', kind: 'light' }, { key: 'clear', label: 'Clear points' }, { key: 'seed', label: 'Random points' }] }],
      readouts: [{ key: 'w', label: 'Slope w' }, { key: 'b', label: 'Intercept b' }, { key: 'r2', label: 'R²' }, { key: 'rmse', label: 'RMSE' }],
    });
    const P = L.main, S = L.side[0];
    const ols = () => {
      const n = pts.length; if (n < 2) return { w: 0, b: n ? pts[0][1] : 0 };
      const mx = A.mean(pts.map(p => p[0])), my = A.mean(pts.map(p => p[1]));
      let sxy = 0, sxx = 0; pts.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; });
      const w = sxx > 1e-12 ? sxy / sxx : 0; return { w, b: my - w * mx };
    };
    const loss = (w, b) => A.mean(pts.map(([x, y]) => (w * x + b - y) ** 2));
    const update = () => {
      const f = ols(); wb = f;
      const pred = pts.map(p => f.w * p[0] + f.b);
      L.set('w', f.w.toFixed(3)); L.set('b', f.b.toFixed(3));
      L.set('r2', pts.length > 2 ? A.M.r2(pts.map(p => p[1]), pred).toFixed(3) : '–'); L.set('rmse', pts.length ? A.M.rmse(pts.map(p => p[1]), pred).toFixed(3) : '–');
      L.redraw();
    };
    P.render = () => {
      P.grid({ axes: true });
      const f = wb;
      P.clip(() => pts.forEach(([x, y]) => P.seg(x, y, x, f.w * x + f.b, { color: 'rgba(255,197,107,0.45)', dash: [3, 3] })));
      P.fn(x => f.w * x + f.b, { color: T.cyan, width: 2.4 });
      if (gd) P.fn(x => gd.w * x + gd.b, { color: T.amber, width: 2, dash: [6, 4] });
      P.points(pts, { color: T.violet2, r: 4.2 });
    };
    S.render = () => {
      if (pts.length < 2) return;
      const lmin = loss(wb.w, wb.b), lmax = Math.max(loss(-1.5, -1.5), loss(2.5, 1.5), loss(-1.5, 1.5), loss(2.5, -1.5));
      S.field((w, b) => { const t = Math.min(1, Math.log(1 + 40 * (loss(w, b) - lmin)) / Math.log(1 + 40 * (lmax - lmin))); const band = Math.abs(((t * 10) % 1) - 0.5) < 0.05 ? 40 : 0; return [40 + 100 * (1 - t), 30 + 94 * (1 - t), 90 + 165 * (1 - t), 60 + band + 90 * (1 - t)]; }, 4);
      S.cross(wb.w, wb.b, T.cyan, 5);
      if (gd && gd.path.length) S.path(gd.path.map(p => p[0]), gd.path.map(p => p[1]), { color: T.amber, width: 1.8 });
      S.text('w →', S.W - 34, S.H - 10, { color: T.dim, size: 10 }); S.text('b ↑', 12, 40, { color: T.dim, size: 10 });
    };
    let drag = -1, lastClick = 0;
    const near = p => pts.findIndex(q => Math.hypot(P.sx(q[0]) - p.px, P.sy(q[1]) - p.py) < 12);
    P.onDown = p => {
      const i = near(p), now = performance.now();
      if (i >= 0 && now - lastClick < 300) { pts.splice(i, 1); drag = -1; update(); lastClick = 0; return; }
      lastClick = now;
      if (i >= 0) drag = i; else { pts.push([p.x, p.y]); drag = pts.length - 1; update(); }
    };
    P.onDrag = p => { if (drag >= 0) { pts[drag] = [Math.max(-1.08, Math.min(1.08, p.x)), Math.max(-1.58, Math.min(1.58, p.y))]; gd = null; update(); } };
    P.onUp = () => { drag = -1; };
    const anim = animator(() => {
      if (!gd || pts.length < 2) return false;
      const n = pts.length; let gw = 0, gb = 0;
      pts.forEach(([x, y]) => { const e = gd.w * x + gd.b - y; gw += 2 * e * x / n; gb += 2 * e / n; });
      gd.w -= L.val.lr * gw; gd.b -= L.val.lr * gb; gd.path.push([gd.w, gd.b]);
      L.redraw();
      if (!isFinite(gd.w) || Math.abs(gd.w) > 50) { L.set('w', 'diverged', 'warn'); return false; }
      return gd.path.length < 160 && Math.hypot(gw, gb) > 1e-4;
    }, 30);
    L.button('gd', () => { gd = { w: -1.2, b: 1.2, path: [[-1.2, 1.2]] }; anim.stop(); anim.start(); });
    L.button('clear', () => { pts = []; gd = null; update(); });
    L.button('seed', () => { seedPts(); gd = null; update(); });
    L.on(k => { if (k === 'reset') { seedPts(); gd = null; update(); } });
    update();
  };

  // polynomial: degree vs train/test error, optional ridge
  labs.polynomial_regression = el => {
    const curve = { tr: [], te: [] };
    regress(el, {
      data: ['sine', 'cubic', 'wiggle'], n: 36, testFrac: 0.4, noise: 0.25, yr: [-2, 2],
      side: ['Error vs degree'], sideOpts: [{ pad: [28, 12, 22, 34] }],
      controls: [{ type: 'range', key: 'deg', label: 'Degree', min: 1, max: 15, step: 1, value: 3 }, { type: 'seg', key: 'ridge', label: 'Ridge', options: [['0', 'off'], ['1', 'λ = 0.01']], value: '0' }],
      fit(xs, ys, v) {
        const B = A.polyBasis(xs, v.deg);
        const lam = v.ridge === '1' ? 0.01 * xs.length : 1e-9;
        const w = A.ridgeFit(xs.map(x => [1, ...B.row(x)]), ys, lam);
        const predict = x => w[0] + B.row(x).reduce((s, t, i) => s + t * w[i + 1], 0);
        return { predict, w };
      },
      init(L, get) {
        const S = L.side[0];
        const recompute = () => {
          const { D } = get(); if (!D) return;
          curve.tr = []; curve.te = [];
          for (let d = 1; d <= 15; d++) {
            const B = A.polyBasis(D.xtr, d);
            const w = A.ridgeFit(D.xtr.map(x => [1, ...B.row(x)]), D.ytr, L.val.ridge === '1' ? 0.01 * D.xtr.length : 1e-9);
            const pr = x => w[0] + B.row(x).reduce((s, t, i) => s + t * w[i + 1], 0);
            curve.tr.push(A.M.rmse(D.ytr, D.xtr.map(pr))); curve.te.push(Math.min(3, A.M.rmse(D.yte, D.xte.map(pr))));
          }
        };
        S.render = () => {
          recompute();
          S.setRange([0.5, 15.5], [0, Math.min(1.6, Math.max(...curve.te) * 1.1)]);
          S.grid({ labels: true, step: 2 });
          const xs = curve.tr.map((_, i) => i + 1);
          S.path(xs, curve.tr, { color: T.violet2, width: 2 }); S.path(xs, curve.te, { color: T.cyan, width: 2 });
          S.seg(L.val.deg, 0, L.val.deg, 9, { color: 'rgba(255,255,255,0.35)', dash: [3, 3] });
          S.text('test', S.sx(15) - 4, S.sy(Math.min(curve.te[14], S.range.y1)) + 12, { align: 'right', color: T.cyan, size: 10 });
          S.text('train', S.sx(15) - 4, S.sy(curve.tr[14]) - 6, { align: 'right', color: T.violet2, size: 10 });
        };
      },
    });
  };

  // ridge / lasso / elastic net share one lab: degree-9 basis + coefficient bars
  const penalised = kind => el => regress(el, {
    data: ['sine', 'cubic', 'wiggle'], n: 22, testFrac: 0.36, noise: 0.22, yr: [-2, 2],
    side: ['Coefficients (standardised)'], sideOpts: [{ pad: [28, 10, 22, 10] }],
    controls: [{ type: 'range', key: 'lam', label: 'Penalty λ', min: -5, max: 1, step: 0.1, value: kind === 'ridge' ? -4 : -3, log: true, fmt: fmt.sci }]
      .concat(kind === 'enet' ? [{ type: 'range', key: 'mix', label: 'L1 ratio', min: 0, max: 1, step: 0.05, value: 0.5 }] : []),
    readouts: [{ key: 'nz', label: 'Non-zero terms', value: m => `${m.w.filter(v => Math.abs(v) > 1e-6).length} / 9` }, { key: 'size', label: 'Σ|w|', value: m => m.w.reduce((s, v) => s + Math.abs(v), 0).toFixed(2) }],
    fit(xs, ys, v) {
      const B = A.polyBasis(xs, 9), Z = xs.map(B.row);
      let b, w;
      if (kind === 'ridge') { const sol = A.ridgeFit(Z.map(z => [1, ...z]), ys, v.lam * xs.length); b = sol[0]; w = sol.slice(1); }
      else { const sol = A.enetFit(Z, ys, v.lam, kind === 'lasso' ? 1 : v.mix, 600); b = sol.b; w = sol.w; }
      return { w, predict: x => b + B.row(x).reduce((s, t, i) => s + t * w[i], 0) };
    },
    sideRender: [(S, m) => drawBars(S, m.w, { labels: m.w.map((_, i) => `x${i + 1}`) })],
  });
  labs.ridge_regression = penalised('ridge');
  labs.lasso_regression = penalised('lasso');
  labs.elastic_net = penalised('enet');

  labs.robust_regression = el => regress(el, {
    data: ['linear'], n: 50, noise: 0.15, yr: [-2.2, 2.2], testFrac: 0.2,
    legend: [{ c: 'rgba(255,255,255,0.45)', l: 'OLS' }, { c: T.pink, l: 'flagged outlier' }],
    controls: [{ type: 'seg', key: 'm', label: 'Method', options: [['huber', 'Huber'], ['ransac', 'RANSAC'], ['theil', 'Theil–Sen']], value: 'huber' }, { type: 'range', key: 'out', label: 'Outliers', min: 0, max: 14, step: 1, value: 7 }, { type: 'range', key: 'delta', label: 'Huber δ', min: 0.05, max: 1.5, step: 0.05, value: 0.35 }],
    dataKeys: ['out'],
    transform(pts, v, R) { const out = pts.slice(); for (let i = 0; i < v.out; i++) { const x = 0.3 + R() * 0.65; out[i] = [x, -1.3 - R() * 0.6]; } return out; },
    readouts: [{ key: 'slope', label: 'Robust slope', value: m => m.w.toFixed(3) }, { key: 'ols', label: 'OLS slope', value: m => m.ols.w.toFixed(3) }],
    fit(xs, ys, v, R) {
      const line = (X, Y, W) => { const sw = W ? W.reduce((a, b) => a + b, 0) : X.length; const mx = X.reduce((s, x, i) => s + (W ? W[i] : 1) * x, 0) / sw, my = Y.reduce((s, y, i) => s + (W ? W[i] : 1) * y, 0) / sw; let a = 0, b = 0; X.forEach((x, i) => { const w = W ? W[i] : 1; a += w * (x - mx) * (Y[i] - my); b += w * (x - mx) ** 2; }); const s = b ? a / b : 0; return { w: s, b: my - s * mx }; };
      const ols = line(xs, ys);
      let f = ols, flagged = xs.map(() => false);
      if (v.m === 'huber') {
        for (let it = 0; it < 50; it++) { const W = xs.map((x, i) => { const r = Math.abs(ys[i] - f.w * x - f.b); return r <= v.delta ? 1 : v.delta / r; }); f = line(xs, ys, W); }
        flagged = xs.map((x, i) => Math.abs(ys[i] - f.w * x - f.b) > v.delta * 2.5);
      } else if (v.m === 'ransac') {
        const thr = 0.35; let best = null;
        for (let t = 0; t < 120; t++) { const i = R.int(xs.length), j = R.int(xs.length); if (i === j || xs[i] === xs[j]) continue; const w = (ys[j] - ys[i]) / (xs[j] - xs[i]), b = ys[i] - w * xs[i]; const inl = xs.map((x, k) => Math.abs(ys[k] - w * x - b) < thr); const c = inl.filter(Boolean).length; if (!best || c > best.c) best = { c, inl }; }
        const I = xs.map((_, k) => k).filter(k => best.inl[k]); f = line(I.map(k => xs[k]), I.map(k => ys[k])); flagged = best.inl.map(v => !v);
      } else {
        const sl = []; for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) if (Math.abs(xs[j] - xs[i]) > 1e-6) sl.push((ys[j] - ys[i]) / (xs[j] - xs[i]));
        sl.sort((a, b) => a - b); const w = sl[Math.floor(sl.length / 2)]; const ints = xs.map((x, i) => ys[i] - w * x).sort((a, b) => a - b); f = { w, b: ints[Math.floor(ints.length / 2)] };
        flagged = xs.map((x, i) => Math.abs(ys[i] - f.w * x - f.b) > 0.6);
      }
      return { w: f.w, ols, flagged, predict: x => f.w * x + f.b };
    },
    pointColor: (m, i) => (m.flagged[i] ? T.pink : T.violet2),
    under: (P, m) => P.fn(x => m.ols.w * x + m.ols.b, { color: 'rgba(255,255,255,0.45)', width: 1.6, dash: [6, 5] }),
  });

  labs.bayesian_linear_regression = el => {
    let shown = 3;
    regress(el, {
      data: ['linear', 'sine'], n: 40, testFrac: 0.25, noise: 0.3, yr: [-2.2, 2.2],
      legend: [{ c: alpha(T.cyan, 0.4), l: '95% band' }],
      controls: [{ type: 'range', key: 'n', label: 'Points observed', min: 0, max: 30, step: 1, value: 3 }, { type: 'range', key: 'alpha', label: 'Prior precision α', min: -2, max: 2, step: 0.1, value: 0, log: true, fmt: fmt.sci }],
      readouts: [{ key: 'sd', label: 'Band width at x = 1', value: m => (2 * 1.96 * m.sd(1)).toFixed(2) }],
      fit(xs, ys, v, R) {
        shown = v.n; const X = xs.slice(0, v.n), Y = ys.slice(0, v.n), beta = 1 / 0.09;
        const S0 = [[v.alpha, 0], [0, v.alpha]];
        X.forEach((x, i) => { S0[0][0] += beta; S0[0][1] += beta * x; S0[1][0] += beta * x; S0[1][1] += beta * x * x; });
        const S = A.LA.inv2(S0), rhs = [0, 0]; X.forEach((x, i) => { rhs[0] += beta * Y[i]; rhs[1] += beta * x * Y[i]; });
        const m = [S[0][0] * rhs[0] + S[0][1] * rhs[1], S[1][0] * rhs[0] + S[1][1] * rhs[1]];
        const sd = x => Math.sqrt(1 / beta + S[0][0] + 2 * x * S[0][1] + x * x * S[1][1]);
        const Lc = A.LA.cholesky(S), samples = Array.from({ length: 12 }, () => { const z = [R.gauss(), R.gauss()]; return [m[0] + Lc[0][0] * z[0], m[1] + Lc[1][0] * z[0] + Lc[1][1] * z[1]]; });
        return { m, sd, samples, predict: x => m[0] + m[1] * x };
      },
      pointColor: (m, i) => (i < shown ? T.violet2 : 'rgba(180,170,255,0.18)'),
      under(P, m) {
        const xs = Array.from({ length: 81 }, (_, i) => -1.1 + i * 0.0275);
        P.band(xs, xs.map(x => m.predict(x) - 1.96 * m.sd(x)), xs.map(x => m.predict(x) + 1.96 * m.sd(x)), alpha(T.cyan, 0.12));
        m.samples.forEach(s => P.fn(x => s[0] + s[1] * x, { color: 'rgba(255,255,255,0.18)', width: 1 }));
      },
    });
  };

  labs.knn_regressor = el => {
    let hov = null;
    regress(el, {
      data: ['sine', 'step', 'wiggle'], n: 60, noise: 0.25,
      hint: 'Hover to see the neighbours',
      controls: [{ type: 'range', key: 'k', label: 'k neighbours', min: 1, max: 40, step: 1, value: 5 }, { type: 'seg', key: 'w', label: 'Weights', options: [['u', 'uniform'], ['d', 'distance']], value: 'u' }],
      fit(xs, ys, v) { const kn = A.knn(xs.map(x => [x]), ys, Math.min(v.k, xs.length), v.w === 'd'); return { kn, predict: x => kn.predict([x]) }; },
      over(P, m, D) {
        if (!hov) return;
        const nb = m.kn.near([hov]);
        nb.forEach(([, i]) => { P.seg(hov, m.predict(hov), D.xtr[i], D.ytr[i], { color: alpha(T.amber, 0.6) }); P.ring(D.xtr[i], D.ytr[i], 6, T.amber); });
        P.points([[hov, m.predict(hov)]], { color: T.amber, r: 5 });
      },
      init(L) { L.main.onHover = p => { hov = p.x; L.main.request(); }; L.main.onLeave = () => { hov = null; L.main.request(); }; },
    });
  };

  labs.support_vector_regression = el => regress(el, {
    data: ['sine', 'wiggle', 'linear'], n: 44, noise: 0.18,
    legend: [{ c: alpha(T.cyan, 0.4), l: 'ε-tube' }, { c: T.amber, l: '◯ support vector' }],
    controls: [{ type: 'range', key: 'eps', label: 'ε (tube half-width)', min: 0, max: 0.6, step: 0.02, value: 0.15 }, { type: 'range', key: 'C', label: 'C', min: -1, max: 3, step: 0.1, value: 1, log: true, fmt: fmt.sci }, { type: 'range', key: 'g', label: 'γ (RBF)', min: -0.5, max: 2, step: 0.1, value: 0.8, log: true, fmt: fmt.sci }],
    readouts: [{ key: 'sv', label: 'Support vectors', value: (m, D) => `${m.sv.length} / ${D.xtr.length}` }],
    fit(xs, ys, v) {
      // kernel SVR in its representer form, fitted by subgradient descent on the primal
      const n = xs.length, K = xs.map(a => xs.map(b => Math.exp(-v.g * (a - b) ** 2)));
      const beta = new Array(n).fill(0); let b = A.mean(ys);
      for (let it = 0; it < 900; it++) {
        const lr = 0.3 / Math.sqrt(it + 1);
        const f = K.map(row => row.reduce((s, k, j) => s + k * beta[j], 0) + b);
        const g = beta.slice(); let gb = 0;            // gradient of ½ βᵀKβ is Kβ; use β as a cheap preconditioned direction
        for (let i = 0; i < n; i++) { const r = f[i] - ys[i]; if (Math.abs(r) > v.eps) { const s = Math.sign(r) * v.C / n; g[i] += s; gb += s; } }
        for (let i = 0; i < n; i++) beta[i] -= lr * g[i] * 0.5;
        b -= lr * gb;
      }
      const predict = x => xs.reduce((s, xi, j) => s + Math.exp(-v.g * (x - xi) ** 2) * beta[j], 0) + b;
      const sv = xs.map((x, i) => (Math.abs(ys[i] - predict(x)) >= v.eps - 1e-3 ? i : -1)).filter(i => i >= 0);
      return { predict, sv };
    },
    under(P, m, D, v) {
      const xs = Array.from({ length: 101 }, (_, i) => -1.1 + i * 0.022);
      P.band(xs, xs.map(x => m.predict(x) - v.eps), xs.map(x => m.predict(x) + v.eps), alpha(T.cyan, 0.12));
    },
    over(P, m, D) { m.sv.forEach(i => P.ring(D.xtr[i], D.ytr[i], 6.5, T.amber, 1.3)); },
  });

  labs.gaussian_process_regressor = el => {
    let pts = [[-0.7, -0.4], [-0.1, 0.5], [0.55, -0.2]];
    const L = mount(el, {
      title: 'Live lab · click to add observations', hint: 'Click to add · drag to move · double-click to remove',
      legend: [{ c: T.cyan, l: 'posterior mean' }, { c: alpha(T.cyan, 0.4), l: '±2σ' }],
      main: { x: [-1.1, 1.1], y: [-2, 2], pad: [12, 12, 12, 12] },
      controls: [{ type: 'range', key: 'ell', label: 'Length scale ℓ', min: 0.05, max: 1, step: 0.01, value: 0.3 }, { type: 'range', key: 'sn', label: 'Noise σₙ', min: 0.01, max: 0.6, step: 0.01, value: 0.05 }, { type: 'range', key: 'sf', label: 'Signal σf', min: 0.3, max: 1.5, step: 0.05, value: 1 }, { type: 'buttons', items: [{ key: 'clear', label: 'Clear' }, { key: 'resample', label: 'New posterior samples' }] }],
      readouts: [{ key: 'n', label: 'Observations' }, { key: 'lml', label: 'Log marginal likelihood' }],
    });
    const P = L.main; let sseed = 1;
    P.render = () => {
      P.grid({ axes: true });
      const o = { ell: L.val.ell, sn: L.val.sn, sf: L.val.sf };
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const g = A.gp(xs, ys, o);
      const grid = Array.from({ length: 70 }, (_, i) => -1.1 + i * (2.2 / 69));
      P.band(grid, grid.map(x => g.mean(x) - 2 * g.sd(x)), grid.map(x => g.mean(x) + 2 * g.sd(x)), alpha(T.cyan, 0.13));
      try { A.gpSamples(g, xs, ys, grid, o, rng(sseed), 4).forEach(s => P.clip(() => P.path(grid, s, { color: 'rgba(255,255,255,0.22)', width: 1 }))); } catch (e) { /* ill-conditioned: skip samples */ }
      P.fn(g.mean, { color: T.cyan, width: 2.4 });
      P.points(pts, { color: T.violet2, r: 4.5 });
      L.set('n', String(pts.length));
      if (pts.length) {
        const Ld = g.L; let lml = -0.5 * ys.reduce((s, y, i) => s + y * g.alpha[i], 0) - Ld.reduce((s, r, i) => s + Math.log(r[i]), 0) - 0.5 * pts.length * Math.log(2 * Math.PI);
        L.set('lml', lml.toFixed(2));
      } else L.set('lml', '–');
    };
    let drag = -1, lastClick = 0;
    const near = p => pts.findIndex(q => Math.hypot(P.sx(q[0]) - p.px, P.sy(q[1]) - p.py) < 12);
    P.onDown = p => { const i = near(p), now = performance.now(); if (i >= 0 && now - lastClick < 300) { pts.splice(i, 1); drag = -1; P.request(); return; } lastClick = now; if (i >= 0) drag = i; else { pts.push([p.x, p.y]); drag = pts.length - 1; } P.request(); };
    P.onDrag = p => { if (drag >= 0) { pts[drag] = [Math.max(-1.08, Math.min(1.08, p.x)), Math.max(-1.9, Math.min(1.9, p.y))]; P.request(); } };
    P.onUp = () => { drag = -1; };
    L.button('clear', () => { pts = []; P.request(); });
    L.button('resample', () => { sseed++; P.request(); });
    L.on(k => { if (k === 'reset') pts = [[-0.7, -0.4], [-0.1, 0.5], [0.55, -0.2]]; P.request(); });
  };

  const treeRegLab = (extra = {}) => el => regress(el, Object.assign({
    data: ['sine', 'step', 'wiggle'], n: 70, noise: 0.2,
    controls: [{ type: 'range', key: 'depth', label: 'Max depth', min: 1, max: 10, step: 1, value: 3 }, { type: 'range', key: 'leaf', label: 'Min samples per leaf', min: 1, max: 15, step: 1, value: 2 }],
    readouts: [{ key: 'leaves', label: 'Leaves', value: m => fmtLeaves(m.t.leaves) }],
    fit(xs, ys, v) { const t = A.buildTree(xs.map(x => [x]), ys, { maxDepth: v.depth, minLeaf: v.leaf }); return { t, predict: x => A.treePredict(t, [x]) }; },
    under(P, m) { A.treeSplits(m.t).forEach(s => P.seg(s.thr, -9, s.thr, 9, { color: 'rgba(255,255,255,0.08)' })); },
  }, extra));
  labs.decision_tree_regressor = treeRegLab();

  labs.random_forest_regressor = el => regress(el, {
    data: ['sine', 'step', 'wiggle'], n: 70, noise: 0.22,
    controls: [{ type: 'range', key: 'n', label: 'Trees', min: 1, max: 60, step: 1, value: 15 }, { type: 'range', key: 'depth', label: 'Max depth', min: 1, max: 10, step: 1, value: 6 }],
    fit(xs, ys, v, R) { const f = A.forest(xs.map(x => [x]), ys, { n: v.n, maxDepth: v.depth, minLeaf: 1, rng: R }); return { f, predict: x => f.predict([x]) }; },
    under(P, m) { m.f.trees.slice(0, 20).forEach(t => P.fn(x => A.treePredict(t, [x]), { color: 'rgba(255,255,255,0.12)', width: 1 })); },
  });

  const boostReg = (kind, extraCtl, extraRead) => el => {
    let stage = null;
    regress(el, {
      data: ['sine', 'step', 'wiggle'], n: 70, noise: 0.2,
      side: ['Residuals the next tree fits'], sideOpts: [{ x: [-1.08, 1.08], y: [-1.6, 1.6], pad: [26, 10, 10, 10] }],
      controls: [{ type: 'range', key: 'n', label: 'Boosting rounds', min: 1, max: 150, step: 1, value: 25 }, { type: 'range', key: 'lr', label: 'Learning rate η', min: 0.02, max: 1, step: 0.02, value: 0.2 }].concat(extraCtl),
      buttons: [{ key: 'play', label: 'Play rounds', kind: 'light' }],
      readouts: extraRead || [],
      fit(xs, ys, v) {
        const X = xs.map(x => [x]);
        const o = { n: v.n, lr: v.lr, maxDepth: v.depth ?? 2, lambda: v.lam, gamma: v.gamma };
        if (kind === 'lgbm') { const nb = v.bins; const bins = [Array.from({ length: nb - 1 }, (_, i) => -1 + (2 * (i + 1)) / nb)]; Object.assign(o, { kind: 'leafwise', maxLeaves: v.leaves, bins, levelWise: v.grow === 'level' }); }
        if (kind === 'cat') Object.assign(o, { kind: 'oblivious', maxDepth: v.depth, lambda: v.lam });
        const b = A.boost(X, ys, o);
        const avgLeaves = A.mean(b.stages.map(s => s.tree.leaves || A.treeLeaves(s.tree).length));
        return { b, avgLeaves, predict: x => b.predict([x]) };
      },
      under(P, m) { if (m.b.stages.length > 1) P.fn(x => m.b.predict([x], m.b.stages.length - 1), { color: 'rgba(255,255,255,0.2)', width: 1.2, dash: [4, 4] }); },
      sideRender: [(S, m, D) => {
        S.grid({ axes: true });
        const res = D.xtr.map((x, i) => D.ytr[i] - m.predict(x));
        S.points(D.xtr.map((x, i) => [x, res[i]]), { color: T.amber, r: 2.6 });
      }],
      init(L, get, all, fit) {
        const anim = animator(() => { if (L.val.n >= 150) return false; L.el('n').set(L.val.n + 1); fit(); L.redraw(); return L.val.n < 150; }, 12);
        L.button('play', b => { if (anim.running) { anim.stop(); b.textContent = 'Play rounds'; } else { if (L.val.n >= 150) L.el('n').set(1); anim.start(); b.textContent = 'Pause'; } });
      },
    });
  };
  labs.gradient_boosting_regressor = boostReg('gbm', [{ type: 'range', key: 'depth', label: 'Tree depth', min: 1, max: 5, step: 1, value: 2 }]);
  labs.xgboost_regressor = boostReg('xgb', [{ type: 'range', key: 'depth', label: 'Max depth', min: 1, max: 6, step: 1, value: 3 }, { type: 'range', key: 'lam', label: 'λ (leaf L2)', min: 0, max: 30, step: 0.5, value: 1 }, { type: 'range', key: 'gamma', label: 'γ (min split gain)', min: 0, max: 2, step: 0.05, value: 0 }], [{ key: 'lv', label: 'Avg leaves / tree', value: m => m.avgLeaves.toFixed(1) }]);
  labs.lightgbm_regressor = boostReg('lgbm', [{ type: 'range', key: 'leaves', label: 'num_leaves', min: 2, max: 16, step: 1, value: 6 }, { type: 'range', key: 'bins', label: 'max_bin', min: 4, max: 64, step: 1, value: 32 }, { type: 'seg', key: 'grow', label: 'Growth', options: [['leaf', 'leaf-wise'], ['level', 'level-wise']], value: 'leaf' }], [{ key: 'lv', label: 'Avg leaves / tree', value: m => m.avgLeaves.toFixed(1) }]);
  labs.catboost_regressor = boostReg('cat', [{ type: 'range', key: 'depth', label: 'Depth (symmetric)', min: 1, max: 5, step: 1, value: 3 }, { type: 'range', key: 'lam', label: 'l2_leaf_reg', min: 0, max: 20, step: 0.5, value: 3 }], [{ key: 'lv', label: 'Leaves / tree', value: m => m.avgLeaves.toFixed(0) }]);

  // neural regression trained live
  labs.mlp_regressor = el => {
    let net = null, losses = [], epoch = 0;
    const L = regress(el, {
      data: ['wiggle', 'sine', 'step'], n: 70, noise: 0.12,
      side: ['Training loss'], sideOpts: [{ pad: [28, 12, 22, 40] }],
      controls: [{ type: 'range', key: 'h', label: 'Hidden units', min: 1, max: 32, step: 1, value: 12 }, { type: 'seg', key: 'act', label: 'Activation', options: [['relu', 'ReLU'], ['tanh', 'tanh']], value: 'tanh' }, { type: 'range', key: 'lr', label: 'Learning rate', min: -3, max: -0.5, step: 0.1, value: -1.7, log: true, fmt: fmt.sci }],
      buttons: [{ key: 'train', label: 'Train', kind: 'light' }],
      readouts: [{ key: 'ep', label: 'Epochs', value: () => String(epoch) }],
      fit(xs, ys, v, R, D) {
        if (!net || net.key !== `${v.h}|${v.act}|${D.xtr.length}|${D.xtr[0]}`) { net = A.mlp([1, v.h, 1], { rng: rng(3), act: v.act, out: 'linear' }); net.key = `${v.h}|${v.act}|${D.xtr.length}|${D.xtr[0]}`; losses = []; epoch = 0; }
        return { net, predict: x => net.predict([x]) };
      },
      under(P, m, D, v) {
        if (v.h <= 12) for (let j = 0; j < v.h; j++) P.fn(x => m.net.W[1][0][j] * m.net.hidden([x])[j] + m.net.B[1][0] / v.h, { color: 'rgba(255,255,255,0.1)', width: 1 });
      },
      sideRender: [S => drawCurve(S, losses.length ? losses : [0])],
      init(Lr, get, all, fit) {
        const anim = animator(() => {
          const { D } = get(); if (!D) return false;
          for (let s = 0; s < 6; s++) { losses.push(net.step(D.xtr.map(x => [x]), D.ytr, Lr.val.lr, 1e-5)); epoch++; }
          if (losses.length > 600) losses = losses.filter((_, i) => i % 2 === 0);
          fit(); Lr.redraw(); return epoch < 3000;
        }, 30);
        Lr.button('train', b => { if (anim.running) { anim.stop(); b.textContent = 'Train'; } else { anim.start(); b.textContent = 'Pause'; } });
        Lr.on(k => { if (k !== 'lr') { anim.stop(); const b = Lr.el('train'); if (b) b.textContent = 'Train'; } });
      },
    });
  };

  // ======================================================================= classification
  labs.logistic_regression = el => classify(el, {
    data: ['blobs', 'moons', 'circles', 'xor'],
    controls: [{ type: 'range', key: 'C', label: 'C (inverse regularisation)', min: -3, max: 2, step: 0.1, value: 0, log: true, fmt: fmt.sci }, { type: 'seg', key: 'feat', label: 'Features', options: [['lin', 'x₁, x₂'], ['quad', '+ squares & product']], value: 'lin' }, { type: 'range', key: 'tau', label: 'Threshold τ', min: 0.05, max: 0.95, step: 0.05, value: 0.5 }],
    readouts: [{ key: 'll', label: 'Test log-loss', value: (m, D) => A.M.logloss(D.yte, D.Xte.map(m.proba)).toFixed(3) }, { key: 'pr', label: 'Precision / recall @τ', value: (m, D, v) => { let tp = 0, fp = 0, fn = 0; D.Xte.forEach((x, i) => { const p = m.proba(x) >= v.tau; if (p && D.yte[i]) tp++; else if (p) fp++; else if (D.yte[i]) fn++; }); return `${tp + fp ? (tp / (tp + fp)).toFixed(2) : '–'} / ${tp + fn ? (tp / (tp + fn)).toFixed(2) : '–'}`; } }],
    fit: (X, y, v) => A.logisticFit(X, y, { C: v.C * X.length / 10, quad: v.feat === 'quad', iters: 500 }),
    decorate: (P, m, D, v) => { if (Math.abs(v.tau - 0.5) > 0.01) P.contour((a, b) => m.proba([a, b]), v.tau, { color: T.amber, width: 1.4, dash: [5, 4] }); },
  });

  const discLab = (kind, extra = {}) => el => classify(el, Object.assign({
    data: ['blobs', 'spreads', 'correlated', 'moons'],
    fit: (X, y, v) => A.discriminant(X, y, kind, { reg: v.reg, varSmoothing: 1e-3 }),
    decorate(P, m) { m.comps.forEach((c, k) => { P.ellipse(c.mu, c.C, 1, { color: alpha(T.cls[k], 0.9), width: 1.4 }); P.ellipse(c.mu, c.C, 2, { color: alpha(T.cls[k], 0.5), width: 1, dash: [4, 4] }); P.cross(c.mu[0], c.mu[1], T.cls[k], 5, 2); }); },
  }, extra));
  labs.linear_discriminant_analysis = discLab('lda');
  labs.quadratic_discriminant_analysis = discLab('qda', { defaultData: 'spreads', controls: [{ type: 'range', key: 'reg', label: 'reg_param', min: 0, max: 1, step: 0.05, value: 0 }] });
  labs.gaussian_naive_bayes = discLab('gnb', { defaultData: 'correlated' });

  labs.knn_classifier = el => classify(el, {
    data: ['blobs', 'moons', 'circles', 'xor'], defaultData: 'moons', res: 5, onHover: true,
    hint: 'Hover to see the voters',
    controls: [{ type: 'range', key: 'k', label: 'k neighbours', min: 1, max: 45, step: 2, value: 1 }, { type: 'seg', key: 'w', label: 'Weights', options: [['u', 'uniform'], ['d', 'distance']], value: 'u' }],
    fit(X, y, v) { const kn = A.knn(X, y, Math.min(v.k, X.length), v.w === 'd'); return { kn, proba: x => kn.predict(x) }; },
    overlay(P, m, D, v, hv) {
      if (!hv) return;
      const nb = m.kn.near([hv.x, hv.y]);
      nb.forEach(([, i]) => P.seg(hv.x, hv.y, D.Xtr[i][0], D.Xtr[i][1], { color: alpha(T.amber, 0.7) }));
      P.points([[hv.x, hv.y]], { color: T.amber, r: 5 });
    },
  });

  labs.support_vector_classifier = el => classify(el, {
    data: ['separable', 'blobs', 'moons', 'circles'], n: 120, res: 5,
    legend: null,
    controls: [{ type: 'seg', key: 'kernel', label: 'Kernel', options: [['linear', 'linear'], ['rbf', 'RBF']], value: 'linear' }, { type: 'range', key: 'C', label: 'C', min: -2, max: 3, step: 0.1, value: 0, log: true, fmt: fmt.sci }, { type: 'range', key: 'g', label: 'γ (RBF only)', min: -1, max: 2, step: 0.1, value: 0.5, log: true, fmt: fmt.sci }],
    readouts: [{ key: 'sv', label: 'Support vectors', value: m => String(m.s.sv.length) }],
    fit(X, y, v, R) { const s = A.svm(X, y, { kernel: v.kernel, C: v.C, gamma: v.g, rng: R }); return { s, proba: x => A.sigmoid(2.2 * s.decision(x)) }; },
    decorate(P, m) { P.contour((a, b) => m.s.decision([a, b]), 1, { color: 'rgba(255,255,255,0.4)', dash: [5, 5], width: 1 }); P.contour((a, b) => m.s.decision([a, b]), -1, { color: 'rgba(255,255,255,0.4)', dash: [5, 5], width: 1 }); },
    overlay(P, m, D) { m.s.sv.forEach(i => P.ring(D.Xtr[i][0], D.Xtr[i][1], 7, T.amber, 1.4)); },
  });

  labs.decision_tree_classifier = el => classify(el, {
    data: ['blobs', 'moons', 'xor', 'diagonal'], defaultData: 'moons',
    controls: [{ type: 'range', key: 'depth', label: 'Max depth', min: 1, max: 10, step: 1, value: 3 }, { type: 'range', key: 'leaf', label: 'Min samples per leaf', min: 1, max: 20, step: 1, value: 1 }, { type: 'seg', key: 'crit', label: 'Criterion', options: [['gini', 'Gini'], ['entropy', 'Entropy']], value: 'gini' }],
    readouts: [{ key: 'leaves', label: 'Leaves', value: m => String(m.t.leaves) }],
    fit(X, y, v) { const t = A.buildTree(X, y, { maxDepth: v.depth, minLeaf: v.leaf, criterion: v.crit }); return { t, proba: x => A.treePredict(t, x) }; },
    decorate(P, m) { const R = P.range; A.treeLeaves(m.t).forEach(l => { const b = l.box; P.rect(Math.max(b[0][0], R.x0), Math.max(b[1][0], R.y0), Math.min(b[0][1], R.x1), Math.min(b[1][1], R.y1), { stroke: 'rgba(255,255,255,0.22)' }); }); },
  });

  labs.random_forest_classifier = el => classify(el, {
    data: ['moons', 'circles', 'xor', 'spiral'], res: 5,
    controls: [{ type: 'range', key: 'n', label: 'Trees', min: 1, max: 60, step: 1, value: 1 }, { type: 'range', key: 'depth', label: 'Max depth', min: 1, max: 12, step: 1, value: 8 }],
    fit(X, y, v, R) { const f = A.forest(X, y, { n: v.n, maxDepth: v.depth, minLeaf: 1, criterion: 'gini', maxFeatures: 1, rng: R }); return { f, proba: x => f.predict(x) }; },
  });

  labs.adaboost_classifier = el => classify(el, {
    data: ['moons', 'circles', 'blobs', 'xor'],
    controls: [{ type: 'range', key: 'n', label: 'Rounds (stumps)', min: 1, max: 120, step: 1, value: 5 }],
    buttons: [{ key: 'play', label: 'Play rounds', kind: 'light' }],
    readouts: [{ key: 'alpha', label: 'Last stump’s say α', value: m => m.a.stumps[m.a.stumps.length - 1].alpha.toFixed(2) }],
    fit(X, y, v) { const a = A.adaboost(X, y, v.n); return { a, proba: x => a.proba(x) }; },
    pointR: m => { const w = m.a.weights[m.a.weights.length - 1]; const mx = Math.max(...w); return i => 2.2 + 7 * Math.sqrt(w[i] / mx); },
    init(L, get, all) {
      const anim = animator(() => { if (L.val.n >= 120) return false; L.el('n').set(L.val.n + 1); L.fire('n'); return true; }, 8);
      L.button('play', b => { if (anim.running) { anim.stop(); b.textContent = 'Play rounds'; } else { if (L.val.n >= 120) L.el('n').set(1); anim.start(); b.textContent = 'Pause'; } });
    },
  });

  labs.gradient_boosted_classifiers = el => classify(el, {
    data: ['moons', 'circles', 'xor', 'spiral'], res: 5,
    controls: [{ type: 'range', key: 'n', label: 'Rounds', min: 1, max: 150, step: 1, value: 30 }, { type: 'range', key: 'lr', label: 'Learning rate', min: 0.02, max: 1, step: 0.02, value: 0.3 }, { type: 'range', key: 'depth', label: 'Tree depth', min: 1, max: 5, step: 1, value: 2 }],
    buttons: [{ key: 'play', label: 'Play rounds', kind: 'light' }],
    readouts: [{ key: 'll', label: 'Train log-loss', value: (m, D) => A.M.logloss(D.ytr, D.Xtr.map(m.proba)).toFixed(3) }],
    fit(X, y, v) { const b = A.boost(X, y, { loss: 'log', n: v.n, lr: v.lr, maxDepth: v.depth, lambda: 1 }); return { b, proba: x => b.predict(x) }; },
    init(L) {
      const anim = animator(() => { if (L.val.n >= 150) return false; L.el('n').set(L.val.n + 2); L.fire('n'); return true; }, 10);
      L.button('play', b => { if (anim.running) { anim.stop(); b.textContent = 'Play rounds'; } else { if (L.val.n >= 149) L.el('n').set(1); anim.start(); b.textContent = 'Pause'; } });
    },
  });

  labs.stacking_voting_classifiers = el => {
    classify(el, {
      data: ['moons', 'circles', 'xor', 'blobs'], res: 5,
      controls: [{ type: 'seg', key: 'show', label: 'Show', options: [['lr', 'Logistic'], ['knn', 'k-NN'], ['tree', 'Tree'], ['hard', 'Hard vote'], ['soft', 'Soft vote'], ['stack', 'Stacking']], value: 'soft', span: true }],
      readouts: [{ key: 'base', label: 'Base test acc (LR · kNN · tree)', value: (m, D) => m.base.map(b => (A.M.acc(D.yte, D.Xte.map(b)) * 100).toFixed(0)).join(' · ') + '%' }, { key: 'meta', label: 'Stacking weights', value: m => m.meta.map(w => w.toFixed(1)).join(' · ') }],
      fit(X, y, v, R) {
        const mk = (Xs, ys) => {
          const lr = A.logisticFit(Xs, ys, { C: 10, iters: 300 });
          const kn = A.knn(Xs, ys, 9, false);
          const t = A.buildTree(Xs, ys, { maxDepth: 4, minLeaf: 3 });
          return [x => lr.proba(x), x => kn.predict(x), x => A.treePredict(t, x)];
        };
        const base = mk(X, y);
        // out-of-fold predictions for the meta learner
        const K = 5, idx = R.shuffle([...X.keys()]), oof = X.map(() => [0, 0, 0]);
        for (let f = 0; f < K; f++) {
          const te = idx.filter((_, i) => i % K === f), tr = idx.filter((_, i) => i % K !== f);
          const m = mk(tr.map(i => X[i]), tr.map(i => y[i]));
          te.forEach(i => { oof[i] = m.map(g => g(X[i])); });
        }
        // a 3-input logistic meta learner, fitted by plain gradient descent
        const w = [0, 0, 0, 0];
        for (let it = 0; it < 800; it++) {
          const g = [0, 0, 0, 0];
          oof.forEach((o, i) => { const z = w[0] + w[1] * o[0] + w[2] * o[1] + w[3] * o[2]; const e = A.sigmoid(z) - y[i]; g[0] += e; g[1] += e * o[0]; g[2] += e * o[1]; g[3] += e * o[2]; });
          for (let j = 0; j < 4; j++) w[j] -= 0.5 * g[j] / X.length;
        }
        const stack = x => { const o = base.map(b => b(x)); return A.sigmoid(w[0] + w[1] * o[0] + w[2] * o[1] + w[3] * o[2]); };
        const pick = { lr: base[0], knn: base[1], tree: base[2], hard: x => (base.filter(b => b(x) >= 0.5).length >= 2 ? 0.85 : 0.15), soft: x => (base[0](x) + base[1](x) + base[2](x)) / 3, stack }[v.show];
        return { base, meta: w.slice(1), proba: pick };
      },
    });
  };

  // perceptron: one update at a time
  labs.perceptron = el => {
    let w = [0, 0, 0], last = -1, updates = 0, cursor = 0, order = [], curD = null;
    const reset = () => { w = [0, 0, 0]; last = -1; updates = 0; cursor = 0; order = []; };
    classify(el, {
      data: ['separable', 'blobs', 'xor'], defaultData: 'separable', noNoise: true, n: 80,
      buttons: [{ key: 'play', label: 'Play', kind: 'light' }, { key: 'step', label: 'One update' }],
      readouts: [{ key: 'upd', label: 'Updates so far', value: () => String(updates) }],
      fit(X, y, v, R, D) { if (D !== curD) { reset(); curD = D; } return { proba: x => A.sigmoid(6 * (w[0] + w[1] * x[0] + w[2] * x[1])) }; },
      overlay(P, m, D) { if (last >= 0) P.ring(D.Xtr[last][0], D.Xtr[last][1], 9, T.amber, 2); },
      init(Lc, get) {
        const stepOnce = () => {
          const { D } = get(); if (!D) return false;
          if (!order.length) order = rng(updates + 1).shuffle([...D.Xtr.keys()]);
          for (let tries = 0; tries < D.Xtr.length; tries++) {
            const i = order[cursor % order.length]; cursor++;
            const yi = D.ytr[i] ? 1 : -1, x = D.Xtr[i];
            if (yi * (w[0] + w[1] * x[0] + w[2] * x[1]) <= 0) { w = [w[0] + yi, w[1] + yi * x[0], w[2] + yi * x[1]]; last = i; updates++; Lc.fire('step'); return true; }
          }
          last = -1; Lc.fire('step'); return false;     // a full pass without mistakes: converged
        };
        const play = Lc.el('play');
        const anim = animator(() => { const more = stepOnce() && updates <= 400; if (!more && play) play.textContent = 'Play'; return more; }, 8);
        Lc.button('step', () => stepOnce());
        Lc.button('play', b => { if (anim.running) { anim.stop(); b.textContent = 'Play'; } else { anim.start(); b.textContent = 'Pause'; } });
        Lc.on(k => { if (k === 'data' || k === 'reset') { anim.stop(); if (play) play.textContent = 'Play'; } });
      },
    });
  };

  // MLP classifier trained live
  labs.mlp_classifier = el => {
    let net = null, losses = [], epoch = 0;
    classify(el, {
      data: ['xor', 'moons', 'circles', 'spiral'], res: 5, n: 200,
      side: ['Training loss'], sideOpts: [{ pad: [28, 12, 22, 40] }],
      controls: [{ type: 'range', key: 'h', label: 'Hidden units per layer', min: 1, max: 24, step: 1, value: 6 }, { type: 'seg', key: 'layers', label: 'Hidden layers', options: [['1', '1'], ['2', '2']], value: '1' }, { type: 'seg', key: 'act', label: 'Activation', options: [['relu', 'ReLU'], ['tanh', 'tanh']], value: 'tanh' }, { type: 'range', key: 'lr', label: 'Learning rate', min: -3, max: -0.3, step: 0.1, value: -1.5, log: true, fmt: fmt.sci }],
      buttons: [{ key: 'train', label: 'Train', kind: 'light' }],
      readouts: [{ key: 'ep', label: 'Epochs', value: () => String(epoch) }],
      fit(X, y, v, R, D) {
        const key = `${v.h}|${v.layers}|${v.act}|${D.Xtr[0]}`;
        if (!net || net.key !== key) { const sizes = v.layers === '2' ? [2, v.h, v.h, 1] : [2, v.h, 1]; net = A.mlp(sizes, { rng: rng(9), act: v.act }); net.key = key; losses = []; epoch = 0; }
        return { proba: x => net.predict(x) };
      },
      init(L, get) {
        L.side[0].render = () => drawCurve(L.side[0], losses.length ? losses : [0.7]);
        const anim = animator(() => {
          const { D } = get(); if (!D) return false;
          for (let s = 0; s < 3; s++) { losses.push(net.step(D.Xtr, D.ytr, L.val.lr, 1e-5)); epoch++; }
          if (losses.length > 600) losses = losses.filter((_, i) => i % 2 === 0);
          L.fire('lr'); return epoch < 4000;
        }, 30);
        L.button('train', b => { if (anim.running) { anim.stop(); b.textContent = 'Train'; } else { anim.start(); b.textContent = 'Pause'; } });
        L.on(k => { if (k !== 'lr') { anim.stop(); const b = L.el('train'); if (b) b.textContent = 'Train'; } });
      },
    });
  };

  // ======================================================================= text: naive Bayes spam filter
  labs.multinomial_bernoulli_nb = el => {
    const corpus = [
      ['win a free prize now', 1], ['claim your free cash reward today', 1], ['you have won a free holiday', 1], ['urgent: claim prize, reply now', 1],
      ['free entry to win cash now', 1], ['limited offer, win big today', 1], ['cheap loans, apply now free', 1], ['congratulations you won cash', 1],
      ['meeting moved to monday morning', 0], ['can we have lunch tomorrow', 0], ['notes from the team meeting', 0], ['the report is ready for review', 0],
      ['are you free for a call today', 0], ['see you at lunch on friday', 0], ['please review the draft before monday', 0], ['thanks for the notes, call me', 0],
    ];
    const tok = s => s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
    const L = mount(el, {
      title: 'Live lab · a tiny spam filter', custom: true,
      controls: [{ type: 'seg', key: 'kind', label: 'Model', options: [['mnb', 'Multinomial'], ['bnb', 'Bernoulli']], value: 'mnb' }, { type: 'range', key: 'alpha', label: 'Smoothing α', min: -3, max: 0.5, step: 0.1, value: 0, log: true, fmt: fmt.sci }],
      readouts: [{ key: 'p', label: 'P(spam | message)' }, { key: 'verdict', label: 'Verdict' }, { key: 'vocab', label: 'Vocabulary' }],
    });
    const box = L.main; box.classList.add('lab-text');
    const input = h('input'); input.type = 'text'; input.value = 'free lunch meeting tomorrow'; input.setAttribute('aria-label', 'Message to classify');
    const toks = h('div', 'tok-row');
    const note = h('p', 'note', 'Each word shows its log-likelihood ratio, log P(word | spam) − log P(word | ham). Pink pushes toward spam, green toward ham.');
    const train = h('details', null, `<summary class="note" style="cursor:pointer">Training messages (${corpus.length})</summary><ul class="note" style="margin:8px 0 0;padding-left:18px">${corpus.map(([t, s]) => `<li>${s ? 'spam' : 'ham'} · ${t}</li>`).join('')}</ul>`);
    box.append(input, toks, note, train);
    const vocab = [...new Set(corpus.flatMap(([t]) => tok(t)))];
    const run = () => {
      const a = L.val.alpha, bern = L.val.kind === 'bnb';
      const cnt = [{}, {}], docs = [0, 0], tot = [0, 0];
      corpus.forEach(([t, s]) => { docs[s]++; const ws = bern ? [...new Set(tok(t))] : tok(t); ws.forEach(w => { cnt[s][w] = (cnt[s][w] || 0) + 1; tot[s]++; }); });
      const V = vocab.length;
      const pw = (w, c) => (bern ? ((cnt[c][w] || 0) + a) / (docs[c] + 2 * a) : ((cnt[c][w] || 0) + a) / (tot[c] + a * V));
      const words = tok(input.value);
      let s1 = Math.log(docs[1] / corpus.length), s0 = Math.log(docs[0] / corpus.length);
      const parts = [];
      if (bern) {
        const present = new Set(words);
        vocab.forEach(w => { const on = present.has(w); s1 += Math.log(on ? pw(w, 1) : 1 - pw(w, 1)); s0 += Math.log(on ? pw(w, 0) : 1 - pw(w, 0)); });
        [...present].forEach(w => parts.push([w, vocab.includes(w) ? Math.log(pw(w, 1)) - Math.log(pw(w, 0)) : 0, vocab.includes(w)]));
      } else {
        words.forEach(w => { const l1 = Math.log(pw(w, 1)), l0 = Math.log(pw(w, 0)); s1 += l1; s0 += l0; parts.push([w, l1 - l0, vocab.includes(w)]); });
      }
      const p = 1 / (1 + Math.exp(s0 - s1));
      toks.innerHTML = parts.map(([w, r, known]) => `<span class="tok ${r > 0.05 ? 'pos' : r < -0.05 ? 'neg' : ''}">${w}<em>${known ? (r > 0 ? '+' : '') + r.toFixed(2) : 'unseen'}</em></span>`).join('') || '<span class="note">Type a message above.</span>';
      L.set('p', isFinite(p) ? p.toFixed(3) : '–', p > 0.5 ? 'warn' : 'good');
      L.set('verdict', p > 0.5 ? 'spam' : 'ham', p > 0.5 ? 'warn' : 'good');
      L.set('vocab', `${vocab.length} words`);
    };
    input.addEventListener('input', run);
    L.on(run); run();
  };

  // ======================================================================= CNN: convolution explorer
  labs.convolutional_neural_networks = el => {
    const N = 12;
    const images = {
      square: (i, j) => (i >= 3 && i <= 8 && j >= 3 && j <= 8 ? 1 : 0),
      cross: (i, j) => (i === 5 || i === 6 || j === 5 || j === 6 ? 1 : 0),
      diagonal: (i, j) => (Math.abs(i - j) <= 1 ? 1 : 0),
      ring: (i, j) => { const d = Math.hypot(i - 5.5, j - 5.5); return d > 2.8 && d < 4.6 ? 1 : 0; },
      seven: (i, j) => ((i === 2 && j >= 2 && j <= 9) || (j === 9 - Math.floor((i - 2) * 0.75) && i >= 2 && i <= 10) ? 1 : 0),
    };
    const kernels = {
      vertical: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], horizontal: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
      blur: [[1, 2, 1], [2, 4, 2], [1, 2, 1]].map(r => r.map(v => v / 16)), sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], diag: [[2, -1, -1], [-1, 2, -1], [-1, -1, 2]],
    };
    let K = kernels.vertical.map(r => r.slice()), hov = null;
    const L = mount(el, {
      title: 'Live lab · convolution, ReLU and pooling', custom: true,
      controls: [{ type: 'seg', key: 'img', label: 'Input image', options: [['square', 'Square'], ['cross', 'Cross'], ['diagonal', 'Diagonal'], ['ring', 'Ring'], ['seven', '“7”']], value: 'square' }, { type: 'seg', key: 'k', label: 'Filter', options: [['vertical', 'Vertical edge'], ['horizontal', 'Horizontal edge'], ['diag', 'Diagonal'], ['blur', 'Blur'], ['sharpen', 'Sharpen']], value: 'vertical', span: true }],
      readouts: [{ key: 'in', label: 'Input' }, { key: 'fm', label: 'Feature map' }, { key: 'pool', label: 'After 2×2 pool' }, { key: 'params', label: 'Filter weights' }],
    });
    const box = L.main;
    box.classList.add('cnn-grid');
    const panel = (cap) => { const d = h('div'); d.innerHTML = `<p class="note" style="margin:0 0 8px">${cap}</p>`; const c = document.createElement('canvas'); c.style.cssText = 'width:100%;aspect-ratio:1;display:block;border-radius:10px;touch-action:none'; d.appendChild(c); box.appendChild(d); return c; };
    const cIn = panel('Input (12×12)'), cK = panel('Filter 3×3 · click to edit'), cF = panel('Feature map (10×10)'), cP = panel('ReLU + 2×2 max-pool');
    const draw = (cv, M, o = {}) => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = r.width * dpr; cv.height = r.width * dpr;
      const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = M.length, s = r.width / n;
      const mx = Math.max(1e-9, ...M.flat().map(Math.abs));
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const v = M[i][j] / mx;
        c.fillStyle = o.signed ? (v >= 0 ? alpha(T.cyan, 0.08 + 0.85 * v) : alpha(T.pink, 0.08 + 0.85 * -v)) : alpha(T.violet2, 0.06 + 0.9 * Math.max(0, v));
        c.fillRect(j * s + 0.5, i * s + 0.5, s - 1, s - 1);
        if (o.text) { c.fillStyle = T.ink; c.font = `${Math.max(9, s * 0.28)}px ${T.mono}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(+M[i][j].toFixed(2)), j * s + s / 2, i * s + s / 2); }
      }
      if (o.hi) { c.strokeStyle = T.amber; c.lineWidth = 2; c.strokeRect(o.hi[1] * s + 1, o.hi[0] * s + 1, o.hi[2] * s - 2, o.hi[2] * s - 2); }
    };
    const run = () => {
      const I = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => images[L.val.img](i, j)));
      const F = Array.from({ length: N - 2 }, (_, i) => Array.from({ length: N - 2 }, (_, j) => { let s = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s += I[i + a][j + b] * K[a][b]; return s; }));
      const Pm = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => Math.max(0, F[2 * i][2 * j], F[2 * i + 1][2 * j], F[2 * i][2 * j + 1], F[2 * i + 1][2 * j + 1])));
      draw(cIn, I, { hi: hov ? [hov[0], hov[1], 3] : null });
      draw(cK, K, { signed: true, text: true });
      draw(cF, F, { signed: true, hi: hov ? [hov[0], hov[1], 1] : null });
      draw(cP, Pm, { hi: hov ? [Math.floor(hov[0] / 2), Math.floor(hov[1] / 2), 1] : null });
      L.set('in', '12 × 12'); L.set('fm', '10 × 10'); L.set('pool', '5 × 5'); L.set('params', '9 + 1 bias');
    };
    const cellAt = (cv, e, n) => { const r = cv.getBoundingClientRect(); return [Math.floor(((e.clientY - r.top) / r.height) * n), Math.floor(((e.clientX - r.left) / r.width) * n)]; };
    cF.addEventListener('pointermove', e => { const [i, j] = cellAt(cF, e, N - 2); hov = [Math.max(0, Math.min(N - 3, i)), Math.max(0, Math.min(N - 3, j))]; run(); });
    cIn.addEventListener('pointermove', e => { const [i, j] = cellAt(cIn, e, N); hov = [Math.max(0, Math.min(N - 3, i - 1)), Math.max(0, Math.min(N - 3, j - 1))]; run(); });
    [cF, cIn].forEach(c => c.addEventListener('pointerleave', () => { hov = null; run(); }));
    cK.addEventListener('click', e => { const [i, j] = cellAt(cK, e, 3); const cycle = [-2, -1, 0, 1, 2]; const cur = Math.round(K[i][j]); K[i][j] = cycle[(cycle.indexOf(Math.max(-2, Math.min(2, cur))) + 1) % cycle.length]; run(); });
    L.on(k => { if (k === 'k' || k === 'reset') K = kernels[L.val.k].map(r => r.slice()); run(); });
    new ResizeObserver(run).observe(box);
    run();
  };

  // ======================================================================= clustering
  labs.kmeans_clustering = el => {
    let C = null, lab = null, phase = 'assign', iters = 0, wcss = [];
    const api = cluster(el, {
      data: ['blobs', 'moons', 'elongated', 'circles'], hint: 'Step alternates assignment and update',
      side: ['WCSS vs k'], sideOpts: [{ pad: [28, 12, 22, 40] }],
      controls: [{ type: 'range', key: 'k', label: 'k', min: 1, max: 8, step: 1, value: 4 }, { type: 'seg', key: 'init', label: 'Initialisation', options: [['plus', 'k-means++'], ['random', 'random']], value: 'random' }],
      buttons: [{ key: 'step', label: 'Step', kind: 'light' }, { key: 'run', label: 'Run to convergence' }, { key: 'reinit', label: 'Re-initialise' }],
      readouts: [{ key: 'w', label: 'WCSS (inertia)', value: r => r.inertia.toFixed(2) }, { key: 'it', label: 'Iterations', value: () => String(iters) }],
      run(X, v, R) {
        if (!C || C.length !== v.k || C.X !== X) { C = A.kmeansInit(X, v.k, rng(Math.floor(Math.random() * 1e6)), v.init === 'plus'); C.X = X; lab = A.assign(X, C); phase = 'update'; iters = 0; }
        return { lab, C, inertia: A.M.inertia(X, lab, C) };
      },
      over(P, r) { r.C.forEach((c, j) => P.cross(c[0], c[1], T.pal[j % T.pal.length], 7, 2.6)); },
      sideRender: [(S, r, X) => {
        if (!wcss.length || wcss.X !== X) { wcss = []; for (let k = 1; k <= 8; k++) wcss.push(A.kmeans(X, k, rng(k)).inertia); wcss.X = X; }
        S.setRange([0.5, 8.5], [0, Math.max(...wcss) * 1.08]); S.grid({ labels: true, step: 1 });
        S.path(wcss.map((_, i) => i + 1), wcss, { color: T.cyan, width: 2 });
        S.points(wcss.map((w, i) => [i + 1, w]), { color: i => (i + 1 === api.L.val.k ? T.amber : T.cyan), r: i => (i + 1 === api.L.val.k ? 5 : 3) });
      }],
    });
    const step = () => {
      const X = api.X; let moved = false;
      if (phase === 'update') { const C2 = A.update(X, lab, C); moved = C2.some((c, j) => A.dist2(c, C[j]) > 1e-12); C2.X = X; C2.forEach((c, j) => { C[j] = c; }); phase = 'assign'; }
      else { const l2 = A.assign(X, C); moved = l2.some((l, i) => l !== lab[i]); lab = l2; phase = 'update'; iters++; }
      api.rerun(); api.L.redraw(); return moved;
    };
    api.L.button('step', () => step());
    api.L.button('run', () => { let guard = 0; const anim = animator(() => { const a = step(), b = step(); return (a || b) && ++guard < 60; }, 6); anim.start(); });
    api.L.button('reinit', () => { C = null; api.rerun(); api.L.redraw(); });
  };

  labs.kmeans_plus_plus = el => {
    let C = [], X0 = null, avg = null;
    const api = cluster(el, {
      data: ['blobs', 'noisy', 'elongated'], hint: 'Heat = probability of being picked next',
      controls: [{ type: 'range', key: 'k', label: 'k', min: 2, max: 6, step: 1, value: 4 }],
      buttons: [{ key: 'seed', label: 'Seed next centre', kind: 'light' }, { key: 'restart', label: 'Start over' }, { key: 'compare', label: '20 restarts: random vs ++' }],
      readouts: [{ key: 'c', label: 'Centres chosen', value: (r, X, v) => `${C.length} / ${v.k}` }, { key: 'cmp', label: 'Mean final WCSS (random / ++)', value: () => (avg ? `${avg[0].toFixed(2)} / ${avg[1].toFixed(2)}` : 'press compare') }],
      dataOpts: { k: 4 },
      run(X) {
        if (X !== X0) { C = []; X0 = X; avg = null; }
        const lab = C.length ? A.assign(X, C) : X.map(() => 0);
        const d = C.length ? X.map(x => Math.min(...C.map(c => A.dist2(x, c)))) : X.map(() => 1);
        const tot = d.reduce((a, b) => a + b, 0);
        return { lab, prob: d.map(v => v / tot), color: i => (C.length ? alpha(T.pal[lab[i] % T.pal.length], 0.9) : T.soft), radius: i => 2.4 + (C.length ? 55 * Math.sqrt(d[i] / tot) : 0) };
      },
      over(P) { C.forEach((c, j) => P.cross(c[0], c[1], T.pal[j % T.pal.length], 8, 2.8)); },
    });
    api.L.button('seed', () => {
      const X = api.X; if (C.length >= api.L.val.k) return;
      if (!C.length) C.push(X[Math.floor(Math.random() * X.length)].slice());
      else { const d = X.map(x => Math.min(...C.map(c => A.dist2(x, c)))); let r = Math.random() * d.reduce((a, b) => a + b, 0), i = 0; while (r > d[i] && i < X.length - 1) { r -= d[i]; i++; } C.push(X[i].slice()); }
      api.rerun(); api.L.redraw();
    });
    api.L.button('restart', () => { C = []; api.rerun(); api.L.redraw(); });
    api.L.button('compare', () => {
      const X = api.X, k = api.L.val.k, res = [0, 0];
      for (let t = 0; t < 20; t++) { res[0] += A.kmeans(X, k, rng(100 + t), { plus: false }).inertia / 20; res[1] += A.kmeans(X, k, rng(100 + t), { plus: true }).inertia / 20; }
      avg = res; api.rerun(); api.L.redraw();
    });
  };

  labs.kmedoids_clustering = el => cluster(el, {
    data: ['blobs'], hint: '× k-means centre · ◯ medoid', dataOpts: { k: 3 }, n: 150,
    controls: [{ type: 'range', key: 'k', label: 'k', min: 2, max: 6, step: 1, value: 3 }, { type: 'range', key: 'out', label: 'Outliers added', min: 0, max: 20, step: 1, value: 8 }],
    dataKeys: ['out'],
    prepare(X, v, R) { const out = X.slice(); for (let i = 0; i < v.out; i++) out.push([0.95 + R() * 0.3, -0.9 + R() * 0.3]); return out; },
    readouts: [{ key: 'shift', label: 'Distance k-means centre moved toward outliers', value: r => r.shift.toFixed(3) }],
    run(X, v, R) {
      const km = A.kmeans(X, v.k, rng(1)), md = A.kmedoids(X, v.k, rng(1));
      const med = md.medoids.map(i => X[i]);
      const shift = Math.max(...km.C.map(c => Math.min(...med.map(m => Math.sqrt(A.dist2(c, m))))));
      return { lab: md.lab, km, med, shift };
    },
    over(P, r) { r.km.C.forEach(c => P.cross(c[0], c[1], T.ink, 6, 2)); r.med.forEach((m, j) => P.ring(m[0], m[1], 9, T.pal[j % T.pal.length], 2.4)); },
  });

  labs.fuzzy_c_means = el => cluster(el, {
    data: ['blobs', 'moons', 'noisy'],
    controls: [{ type: 'range', key: 'c', label: 'Clusters c', min: 2, max: 6, step: 1, value: 4 }, { type: 'range', key: 'm', label: 'Fuzzifier m', min: 1.1, max: 4, step: 0.05, value: 2 }],
    readouts: [{ key: 'unc', label: 'Points with max membership < 0.6', value: r => String(r.U.filter(u => Math.max(...u) < 0.6).length) }],
    run(X, v, R) {
      const f = A.fcm(X, v.c, v.m, R);
      const lab = f.U.map(u => u.indexOf(Math.max(...u)));
      const color = i => { const u = f.U[i]; let r = 0, g = 0, b = 0; u.forEach((w, j) => { const c = T.rgb(T.pal[j % T.pal.length]); r += w * c[0]; g += w * c[1]; b += w * c[2]; }); const s = Math.max(...u); return `rgba(${r | 0},${g | 0},${b | 0},${0.35 + 0.65 * s})`; };
      return { lab, C: f.C, U: f.U, color };
    },
    over(P, r) { r.C.forEach((c, j) => P.cross(c[0], c[1], T.pal[j % T.pal.length], 7, 2.6)); },
  });

  // agglomerative with dendrogram + cut
  const dendro = (S, merges, n, cutK, colorOf) => {
    const order = []; const kids = {};
    merges.forEach((m, t) => { kids[n + t] = [m.a, m.b]; });
    const walk = id => (id < n ? order.push(id) : (walk(kids[id][0]), walk(kids[id][1])));
    walk(n + merges.length - 1);
    const pos = {}; order.forEach((id, i) => { pos[id] = i; });
    const hmax = merges[merges.length - 1].h || 1;
    S.setRange([-1, n], [0, hmax * 1.05]);
    const cutH = cutK > 1 ? (merges[n - cutK].h + merges[n - cutK - 1 >= 0 ? n - cutK - 1 : 0].h) / 2 : hmax * 1.02;
    const ht = id => (id < n ? 0 : merges[id - n].h);
    merges.forEach((m, t) => {
      const id = n + t; pos[id] = (pos[m.a] + pos[m.b]) / 2;
      const col = m.h > cutH ? 'rgba(255,255,255,0.35)' : colorOf(m.a);
      S.seg(pos[m.a], ht(m.a), pos[m.a], m.h, { color: col, width: 1 }); S.seg(pos[m.b], ht(m.b), pos[m.b], m.h, { color: col, width: 1 }); S.seg(pos[m.a], m.h, pos[m.b], m.h, { color: col, width: 1 });
    });
    S.seg(-1, cutH, n, cutH, { color: T.amber, dash: [5, 4], width: 1.4 });
  };
  labs.agglomerative_hierarchical = el => cluster(el, {
    data: ['blobs', 'moons', 'noisy', 'elongated'], n: 120,
    side: ['Dendrogram'], sideOpts: [{ pad: [26, 8, 8, 8] }],
    controls: [{ type: 'seg', key: 'link', label: 'Linkage', options: [['ward', 'Ward'], ['complete', 'Complete'], ['average', 'Average'], ['single', 'Single']], value: 'ward' }, { type: 'range', key: 'k', label: 'Clusters (cut)', min: 1, max: 8, step: 1, value: 4 }],
    run(X, v) {
      if (!this._m || this._m.X !== X || this._m.link !== v.link) this._m = { X, link: v.link, merges: A.agglomerative(X, v.link) };
      const lab = A.cutMerges(X.length, this._m.merges, v.k);
      return { lab, merges: this._m.merges };
    },
    sideRender: [(S, r, X, v) => {
      const leafCol = {}; X.forEach((_, i) => { leafCol[i] = T.pal[r.lab[i] % T.pal.length]; });
      const n = X.length, rep = {}; r.merges.forEach((m, t) => { rep[n + t] = m.a < n ? m.a : rep[m.a]; });
      dendro(S, r.merges, n, v.k, id => leafCol[id < n ? id : rep[id]]);
    }],
  });

  labs.divisive_hierarchical = el => {
    let parts = null, tree = [];
    const api = cluster(el, {
      data: ['blobs', 'elongated', 'noisy'], dataOpts: { k: 5 },
      side: ['Split order'], sideOpts: [{ pad: [26, 10, 10, 10] }],
      buttons: [{ key: 'split', label: 'Split worst cluster', kind: 'light' }, { key: 'restart', label: 'Start over' }],
      readouts: [{ key: 'sse', label: 'Total SSE', value: r => r.sse.toFixed(2) }],
      run(X) {
        if (!parts || parts.X !== X) { parts = [X.map((_, i) => i)]; parts.X = X; tree = [{ id: 0, parent: -1, size: X.length }]; }
        const lab = new Array(X.length).fill(0); parts.forEach((p, j) => p.forEach(i => { lab[i] = j; }));
        const sse = parts.reduce((s, p) => { const P = p.map(i => X[i]); const mc = A.meanCov(P); return s + P.reduce((a, x) => a + A.dist2(x, mc.mu), 0); }, 0);
        return { lab, sse };
      },
      sideRender: [(S) => {
        S.setRange([0, 1], [0, Math.max(4, tree.length)]);
        tree.forEach((t, i) => { const w = t.size / tree[0].size; S.rect(0.5 - w / 2, tree.length - i - 0.8, 0.5 + w / 2, tree.length - i - 0.2, { fill: alpha(T.pal[t.col ?? 0], 0.55) }); S.text(`${t.size}`, S.sx(0.5), S.sy(tree.length - i - 0.5) + 4, { align: 'center', color: T.ink, size: 10 }); });
      }],
    });
    api.L.button('split', () => {
      const X = api.X; if (parts.length >= 8) return;
      let worst = 0, ws = -1;
      parts.forEach((p, j) => { const P = p.map(i => X[i]); const mc = A.meanCov(P); const s = P.reduce((a, x) => a + A.dist2(x, mc.mu), 0); if (s > ws && p.length > 2) { ws = s; worst = j; } });
      const P = parts[worst].map(i => X[i]); const km = A.kmeans(P, 2, rng(parts.length));
      const a = parts[worst].filter((_, q) => km.lab[q] === 0), b = parts[worst].filter((_, q) => km.lab[q] === 1);
      parts.splice(worst, 1, a, b);
      tree.push({ size: a.length, col: worst }, { size: b.length, col: parts.length - 1 });
      api.rerun(); api.L.redraw();
    });
    api.L.button('restart', () => { parts = null; api.rerun(); api.L.redraw(); });
  };

  labs.birch_clustering = el => cluster(el, {
    data: ['blobs', 'noisy', 'elongated'],
    controls: [{ type: 'range', key: 'thr', label: 'Threshold (max sub-cluster radius)', min: 0.03, max: 0.5, step: 0.01, value: 0.12 }, { type: 'range', key: 'k', label: 'Final clusters', min: 2, max: 6, step: 1, value: 4 }],
    readouts: [{ key: 'sub', label: 'Leaf sub-clusters', value: r => String(r.cf.length) }],
    run(X, v, R) {
      const cf = A.birch(X, v.thr);
      const k = Math.min(v.k, cf.length);
      // weighted k-means over sub-cluster centres (repeat centres by count, capped)
      const reps = []; cf.forEach((c, j) => { for (let t = 0; t < Math.min(c.n, 6); t++) reps.push(c.mu); });
      const km = A.kmeans(reps, k, R);
      const cl = A.assign(cf.map(c => c.mu), km.C);
      const lab = X.map(x => { let b = 0, bd = Infinity; cf.forEach((c, j) => { const d = A.dist2(x, c.mu); if (d < bd) { bd = d; b = j; } }); return cl[b]; });
      return { lab, cf, cl };
    },
    over(P, r) { r.cf.forEach((c, j) => P.circleData(c.mu[0], c.mu[1], Math.max(c.r, 0.012), { stroke: alpha(T.pal[r.cl[j] % T.pal.length], 0.9), width: 1.2 })); },
  });

  labs.dbscan_clustering = el => {
    let hov = null;
    const api = cluster(el, {
      data: ['moons', 'circles', 'density', 'noisy'], hint: 'Hover to see the ε-neighbourhood',
      controls: [{ type: 'range', key: 'eps', label: 'ε (radius)', min: 0.03, max: 0.4, step: 0.005, value: 0.12 }, { type: 'range', key: 'minPts', label: 'min_samples', min: 2, max: 20, step: 1, value: 5 }],
      readouts: [{ key: 'core', label: 'Core points', value: r => String(r.core.filter(Boolean).length) }],
      run(X, v) { const d = A.dbscan(X, v.eps, v.minPts); return { lab: d.lab, core: d.core, hollow: i => !d.core[i] && d.lab[i] >= 0 }; },
      over(P, r, X, v) { if (hov) { P.circleData(hov.x, hov.y, v.eps, { stroke: T.amber, width: 1.4, fill: alpha(T.amber, 0.06) }); } },
    });
    api.L.main.onHover = p => { hov = p; api.L.main.request(); };
    api.L.main.onLeave = () => { hov = null; api.L.main.request(); };
  };

  labs.hdbscan_clustering = el => cluster(el, {
    data: ['density', 'moons', 'noisy', 'blobs'], n: 180,
    controls: [{ type: 'range', key: 'mcs', label: 'min_cluster_size', min: 4, max: 40, step: 1, value: 12 }, { type: 'range', key: 'ms', label: 'min_samples', min: 2, max: 20, step: 1, value: 5 }],
    run(X, v) {
      const r = A.hdbscan(X, v.mcs, v.ms);
      return { lab: r.lab, color: i => (r.lab[i] < 0 ? 'rgba(160,160,170,0.5)' : alpha(T.pal[r.lab[i] % T.pal.length], 0.3 + 0.7 * r.prob[i])) };
    },
  });

  labs.optics_clustering = el => cluster(el, {
    data: ['density', 'blobs', 'moons', 'noisy'], n: 180,
    side: ['Reachability plot'], sideOpts: [{ pad: [26, 8, 10, 32] }],
    controls: [{ type: 'range', key: 'minPts', label: 'min_samples', min: 3, max: 20, step: 1, value: 6 }, { type: 'range', key: 'cut', label: 'Cut height ε′', min: 0.02, max: 0.4, step: 0.005, value: 0.12 }],
    run(X, v) {
      if (!this._o || this._o.X !== X || this._o.m !== v.minPts) this._o = { X, m: v.minPts, op: A.optics(X, v.minPts) };
      const lab = A.opticsCut(this._o.op, v.cut, v.minPts);
      return { lab, op: this._o.op };
    },
    sideRender: [(S, r, X, v) => {
      const o = r.op, vals = o.order.map(i => (isFinite(o.reach[i]) ? o.reach[i] : NaN));
      const mx = Math.max(0.42, ...vals.filter(isFinite));
      S.setRange([0, vals.length], [0, mx * 1.05]); S.grid({ labels: true, step: 50 });
      vals.forEach((h_, t) => { const i = o.order[t]; const val = isFinite(h_) ? h_ : mx; S.rect(t, 0, t + 1, val, { fill: r.lab[i] < 0 ? 'rgba(160,160,170,0.35)' : alpha(T.pal[r.lab[i] % T.pal.length], 0.85) }); });
      S.seg(0, v.cut, vals.length, v.cut, { color: T.amber, dash: [5, 4], width: 1.4 });
    }],
  });

  labs.mean_shift_clustering = el => {
    let pos = null, settled = false;
    const api = cluster(el, {
      data: ['blobs', 'density', 'moons'], n: 160,
      controls: [{ type: 'range', key: 'bw', label: 'Bandwidth', min: 0.05, max: 0.6, step: 0.01, value: 0.2 }],
      buttons: [{ key: 'shift', label: 'Shift', kind: 'light' }, { key: 'reset', label: 'Restart' }],
      readouts: [{ key: 'modes', label: 'Distinct modes', value: r => String(r.modes) }],
      run(X, v) {
        if (!pos || pos.X !== X || pos.bw !== v.bw) { pos = X.map(x => x.slice()); pos.X = X; pos.bw = v.bw; settled = false; }
        // merge positions closer than bw/2 into modes
        const modes = []; const lab = pos.map(p => { let j = modes.findIndex(m => A.dist2(m, p) < (v.bw / 2) ** 2); if (j < 0) { modes.push(p); j = modes.length - 1; } return j; });
        return { lab: settled ? lab : X.map(() => 0), color: settled ? null : () => T.soft, modes: settled ? modes.length : '…', pos };
      },
      over(P, r) { if (started) P.points(r.pos, { color: alpha(T.amber, 0.9), r: 1.8 }); },
    });
    let started = false;
    const anim = animator(() => {
      started = true;
      const X = api.X; let mv = 0;
      const np = A.meanShiftStep(pos, X, api.L.val.bw); np.forEach((p, i) => { mv = Math.max(mv, A.dist2(p, pos[i])); pos[i] = p; });
      if (mv < 1e-7) settled = true;
      api.rerun(); api.L.redraw(); return !settled;
    }, 20);
    api.L.button('shift', () => anim.start());
    api.L.button('reset', () => { anim.stop(); started = false; pos = null; api.rerun(); api.L.redraw(); });
  };

  labs.gaussian_mixture_models = el => {
    let comps = null, resp = null, ll = [];
    const api = cluster(el, {
      data: ['elongated', 'blobs', 'density', 'moons'],
      side: ['Log-likelihood per point'], sideOpts: [{ pad: [28, 12, 22, 40] }],
      controls: [{ type: 'range', key: 'k', label: 'Components', min: 1, max: 6, step: 1, value: 3 }, { type: 'seg', key: 'cov', label: 'Covariance', options: [['full', 'full'], ['diag', 'diag'], ['spherical', 'spherical'], ['tied', 'tied']], value: 'full' }],
      buttons: [{ key: 'em', label: 'EM step', kind: 'light' }, { key: 'run', label: 'Run EM' }, { key: 'reinit', label: 'Re-initialise' }],
      run(X, v) {
        if (!comps || comps.X !== X || comps.length !== v.k) { comps = A.gmmInit(X, v.k, rng(Math.floor(Math.random() * 1e6))); comps.forEach(c => { c.C = [[0.08, 0], [0, 0.08]]; }); comps.X = X; resp = null; ll = []; }
        const r = resp || X.map(x => { const p = comps.map(c => c.pi * A.gauss2(x, c.mu, c.C)); const s = p.reduce((a, b) => a + b, 0) || 1; return p.map(q => q / s); });
        const lab = r.map(q => q.indexOf(Math.max(...q)));
        const color = i => { const q = r[i]; let rr = 0, g = 0, b = 0; q.forEach((w, j) => { const c = T.rgb(T.pal[j % T.pal.length]); rr += w * c[0]; g += w * c[1]; b += w * c[2]; }); return `rgb(${rr | 0},${g | 0},${b | 0})`; };
        return { lab, color, comps };
      },
      over(P, r) { r.comps.forEach((c, j) => { P.ellipse(c.mu, c.C, 1, { color: T.pal[j % T.pal.length], width: 1.8 }); P.ellipse(c.mu, c.C, 2, { color: alpha(T.pal[j % T.pal.length], 0.5), width: 1, dash: [4, 4] }); }); },
      sideRender: [S => drawCurve(S, ll.length ? ll : [0])],
    });
    const step = () => { const s = A.gmmStep(api.X, comps, api.L.val.cov); const X = comps.X; comps = s.comps; comps.X = X; resp = s.resp; ll.push(s.ll); api.rerun(); api.L.redraw(); return ll.length < 2 || Math.abs(ll[ll.length - 1] - ll[ll.length - 2]) > 1e-5; };
    api.L.button('em', step);
    api.L.button('run', () => { let g = 0; animator(() => step() && ++g < 80, 10).start(); });
    api.L.button('reinit', () => { comps = null; api.rerun(); api.L.redraw(); });
  };

  labs.spectral_clustering = el => cluster(el, {
    data: ['moons', 'circles', 'blobs', 'density'], n: 150,
    side: ['Spectral embedding'], sideOpts: [{ pad: [26, 10, 10, 10], equal: true }],
    controls: [{ type: 'range', key: 'k', label: 'k', min: 2, max: 5, step: 1, value: 2 }, { type: 'range', key: 'g', label: 'Affinity γ', min: 0, max: 2.6, step: 0.05, value: 1.5, log: true, fmt: fmt.sci }],
    readouts: [{ key: 'km', label: 'k-means on raw data (silhouette)', value: (r, X, v) => A.M.silhouette(X, A.kmeans(X, v.k, rng(2)).lab).mean.toFixed(3) }],
    run(X, v, R) { const s = A.spectral(X, v.k, v.g, R); return { lab: s.lab, embed: s.embed }; },
    sideRender: [(S, r) => {
      const xs = r.embed.map(e => e[0]), ys = r.embed.map(e => e[1]);
      const pad = v => (Math.max(...v) - Math.min(...v)) * 0.1 + 1e-6;
      S.setRange([Math.min(...xs) - pad(xs), Math.max(...xs) + pad(xs)], [Math.min(...ys) - pad(ys), Math.max(...ys) + pad(ys)]);
      S.grid(); S.points(r.embed, { color: i => T.pal[r.lab[i] % T.pal.length], r: 2.6 });
    }],
  });

  labs.affinity_propagation = el => cluster(el, {
    data: ['blobs', 'noisy', 'elongated'], n: 110, dataOpts: { k: 4 },
    controls: [{ type: 'range', key: 'pref', label: 'Preference (median → minimum)', min: 0, max: 1, step: 0.05, value: 0 }, { type: 'range', key: 'damp', label: 'Damping', min: 0.5, max: 0.95, step: 0.05, value: 0.8 }],
    readouts: [{ key: 'ex', label: 'Exemplars', value: r => String(r.ex.length) }],
    run(X, v) { const a = A.affinityProp(X, v.pref, v.damp); return { lab: a.lab, ex: a.ex }; },
    under(P, r, X) { X.forEach((x, i) => { const e = X[r.ex[r.lab[i]]]; P.seg(x[0], x[1], e[0], e[1], { color: alpha(T.pal[r.lab[i] % T.pal.length], 0.25) }); }); },
    over(P, r, X) { r.ex.forEach((i, j) => P.ring(X[i][0], X[i][1], 9, T.pal[j % T.pal.length], 2.4)); },
  });

  root.Labs = root.Labs || {};
  root.Labs.models = labs;
  root.Labs.helpers = { classify, regress, cluster, drawBars, drawCurve };
})(window);

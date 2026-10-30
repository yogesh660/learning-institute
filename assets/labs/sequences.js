// Labs for the sequence lessons: RNN, GRU, LSTM and Transformer attention.
(function (root) {
  'use strict';
  const { T, alpha, rng, mount, animator, fmt } = root.Lab;
  const labs = root.Labs.models;
  const sig = z => 1 / (1 + Math.exp(-z));
  const L10 = v => Math.log10(Math.max(Math.abs(v), 1e-12));

  // ------------------------------------------------------------------ shared timeline helpers
  // a play head that reveals steps 1..T; returns the current step limit (T when idle)
  function playhead(L, T_, onTick) {
    let cur = T_, anim = null;
    const btn = () => L.el('play');
    const stop = () => { if (anim) anim.stop(); anim = null; cur = T_; const b = btn(); if (b) b.textContent = 'Play'; onTick(); };
    L.button('play', b => {
      if (anim) { stop(); return; }
      cur = 0; b.textContent = 'Stop';
      anim = animator(() => { cur++; onTick(); if (cur >= T_) { anim = null; b.textContent = 'Play'; return false; } return true; }, 5);
      anim.start();
    });
    return { get cur() { return cur; }, stop };
  }
  function drawInputs(P, xs, upto, color = T.violet) {
    xs.forEach((x, k) => { if (!x) return; P.rect(k + 1 - 0.32, 0, k + 1 + 0.32, x, { fill: alpha(color, k < upto ? 0.55 : 0.15) }); });
  }
  function drawCursor(P, cur, T_, top) {
    if (cur >= T_) return;
    P.seg(cur + 0.5, -9, cur + 0.5, 9, { color: alpha(T.amber, 0.7), dash: [4, 4], width: 1.4 });
    P.text(`t = ${cur}`, P.sx(cur + 0.5) + 6, P.sy(top) + 4, { color: T.amber, size: 10 });
  }
  function influenceBars(S, series, T_) {
    // series: [{vals: [...per step...], color}]
    S.setRange([0.5, T_ + 0.5], [-8.4, 0.4]);
    S.grid({ labels: false });
    [0, -2, -4, -6, -8].forEach(e => S.text(e ? `1e${e}` : '1', S.range.pl - 4, S.sy(e) + 3, { align: 'right', color: T.dim, size: 9 }));
    const w = 0.7 / series.length;
    series.forEach((ser, si) => ser.vals.forEach((v, k) => {
      const top = Math.max(-8.4, L10(v));
      const x0 = k + 1 - 0.35 + si * w;
      S.rect(x0, -8.4, x0 + w * 0.9, top, { fill: alpha(ser.color, 0.8) });
    }));
    S.text('step 1', S.sx(1), S.range.pt + S.range.h + 14, { align: 'center', color: T.dim, size: 9 });
    S.text(`step ${T_}`, S.sx(T_), S.range.pt + S.range.h + 14, { align: 'center', color: T.dim, size: 9 });
  }

  function sequence(kind, T_, R) {
    const xs = new Array(T_).fill(0);
    xs[0] = 1;
    if (kind === 'two') xs[Math.floor(T_ / 2)] = -1;
    if (kind === 'noisy') for (let k = 1; k < T_; k++) xs[k] = R.gauss() * 0.25;
    return xs;
  }

  // ================================================================== RNN
  labs.recurrent_neural_networks = el => {
    const N = 24;
    const L = mount(el, {
      title: 'Live lab · a one-unit RNN over 24 steps',
      main: { x: [0.5, N + 0.5], y: [-1.15, 1.75], pad: [12, 12, 22, 34] },
      side: ['How much each step still affects the end'], sideOpts: [{ pad: [28, 10, 26, 36] }],
      legend: [{ c: T.violet, l: 'input x(t)' }, { c: T.cyan, l: 'hidden state h(t)' }],
      hint: 'top row: the same cell at every step',
      controls: [
        { type: 'range', key: 'w', label: 'Recurrent weight w', min: 0, max: 1.6, step: 0.05, value: 0.8 },
        { type: 'range', key: 'u', label: 'Input weight u', min: 0.2, max: 2, step: 0.1, value: 1 },
        { type: 'seg', key: 'seq', label: 'Input sequence', options: [['one', 'one pulse'], ['two', 'two pulses'], ['noisy', 'pulse + noise']], value: 'one' },
        { type: 'buttons', items: [{ key: 'play', label: 'Play', kind: 'light' }] },
      ],
      readouts: [{ key: 'h', label: 'Final state h(24)' }, { key: 'mem', label: 'Influence of step 1 on h(24)' }, { key: 'state', label: 'What is happening' }],
    });
    const P = L.main, S = L.side[0];
    let res = null;
    const run = () => {
      const v = L.val, xs = sequence(v.seq, N, rng(4));
      const h = []; let prev = 0;
      xs.forEach(x => { prev = Math.tanh(v.w * prev + v.u * x); h.push(prev); });
      const infl = xs.map((_, k) => { let g = v.u * (1 - h[k] * h[k]); for (let t = k + 1; t < N; t++) g *= v.w * (1 - h[t] * h[t]); return g; });
      res = { xs, h, infl };
      const m = Math.abs(infl[0]);
      L.set('h', h[N - 1].toFixed(3));
      L.set('mem', m < 1e-4 ? m.toExponential(1) : m.toFixed(4), m < 0.01 ? 'warn' : m > 0.1 ? 'good' : '');
      const sat = h.filter(x => Math.abs(x) > 0.97).length;
      L.set('state', sat > 6 ? 'saturated: stuck near ±1' : m < 0.01 ? 'step 1 is forgotten' : m > 0.1 ? 'step 1 still remembered' : 'fading', sat > 6 || m < 0.01 ? 'warn' : '');
    };
    const ph = playhead(L, N, () => L.redraw());
    P.render = p => {
      if (!res) return;
      const upto = ph.cur;
      p.grid({ axes: true, step: 4, stepY: 0.5 });
      // the unrolled cells
      for (let k = 0; k < N; k++) {
        const on = k < upto, v = res.h[k];
        p.rect(k + 1 - 0.42, 1.28, k + 1 + 0.42, 1.68, { fill: on ? (v >= 0 ? alpha(T.cyan, 0.12 + 0.8 * Math.abs(v)) : alpha(T.pink, 0.12 + 0.8 * Math.abs(v))) : 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.12)' });
        if (k < N - 1) p.seg(k + 1 + 0.42, 1.48, k + 2 - 0.42, 1.48, { color: on && k + 1 < upto ? alpha(T.violet2, 0.8) : 'rgba(255,255,255,0.12)' });
      }
      drawInputs(p, res.xs, upto);
      const xs = res.h.map((_, k) => k + 1).slice(0, upto), ys = res.h.slice(0, upto);
      p.path(xs, ys, { color: T.cyan, width: 2.2 });
      p.points(xs.map((x, i) => [x, ys[i]]), { color: T.cyan, r: 3 });
      drawCursor(p, upto, N, 1.2);
    };
    S.render = s => res && influenceBars(s, [{ vals: res.infl, color: T.pink }], N);
    L.on(() => { run(); L.redraw(); });
    run(); L.redraw();
  };

  // ================================================================== GRU
  labs.gru_networks = el => {
    const N = 24;
    const L = mount(el, {
      title: 'Live lab · GRU vs plain RNN',
      main: { x: [0.5, N + 0.5], y: [-1.75, 1.2], pad: [12, 12, 22, 34] },
      side: ['Gradient reaching each step (log)'], sideOpts: [{ pad: [28, 10, 26, 36] }],
      legend: [{ c: T.violet, l: 'input' }, { c: T.cyan, l: 'GRU memory' }, { c: 'rgba(255,255,255,0.5)', l: 'plain RNN (w = 0.8)' }, { c: T.amber, l: 'update gate z' }],
      controls: [
        { type: 'range', key: 'idle', label: 'Gate when idle (z)', min: 0, max: 0.6, step: 0.01, value: 0.04 },
        { type: 'range', key: 'write', label: 'Gate when input arrives (z)', min: 0.3, max: 1, step: 0.01, value: 0.95 },
        { type: 'seg', key: 'seq', label: 'Input sequence', options: [['one', 'one pulse'], ['two', 'two pulses']], value: 'one' },
        { type: 'buttons', items: [{ key: 'play', label: 'Play', kind: 'light' }] },
      ],
      readouts: [{ key: 'gru', label: 'GRU memory at step 24' }, { key: 'rnn', label: 'RNN memory at step 24' }, { key: 'g', label: 'Gradient to step 1 (GRU / RNN)' }],
    });
    const P = L.main, S = L.side[0];
    let res = null;
    const run = () => {
      const v = L.val, xs = sequence(v.seq, N, rng(4));
      const z = xs.map(x => (Math.abs(x) > 0.05 ? v.write : v.idle));
      const h = [], ht = []; let prev = 0;
      xs.forEach((x, k) => { const c = Math.tanh(1.5 * x + 0.5 * prev); ht.push(c); prev = (1 - z[k]) * prev + z[k] * c; h.push(prev); });
      const r = []; prev = 0; xs.forEach(x => { prev = Math.tanh(0.8 * prev + x); r.push(prev); });
      const gG = xs.map((_, k) => { let g = z[k] * (1 - ht[k] ** 2) * 1.5; for (let t = k + 1; t < N; t++) g *= (1 - z[t]) + z[t] * (1 - ht[t] ** 2) * 0.5; return g; });
      const gR = xs.map((_, k) => { let g = 1 - r[k] ** 2; for (let t = k + 1; t < N; t++) g *= 0.8 * (1 - r[t] ** 2); return g; });
      res = { xs, z, h, r, gG, gR };
      L.set('gru', h[N - 1].toFixed(3), Math.abs(h[N - 1]) > 0.3 ? 'good' : 'warn');
      L.set('rnn', r[N - 1].toFixed(3), Math.abs(r[N - 1]) > 0.3 ? 'good' : 'warn');
      const f = x => (Math.abs(x) < 1e-3 ? x.toExponential(0) : x.toFixed(3));
      L.set('g', `${f(gG[0])} / ${f(gR[0])}`);
    };
    const ph = playhead(L, N, () => L.redraw());
    P.render = p => {
      if (!res) return;
      const upto = ph.cur;
      p.grid({ axes: true, step: 4, stepY: 0.5 });
      drawInputs(p, res.xs, upto);
      res.z.forEach((z, k) => p.rect(k + 1 - 0.3, -1.7, k + 1 + 0.3, -1.7 + z * 0.5, { fill: alpha(T.amber, k < upto ? 0.3 + 0.65 * z : 0.12) }));
      p.text('z', p.range.pl - 12, p.sy(-1.5), { color: T.amber, size: 10 });
      const xs = res.h.map((_, k) => k + 1).slice(0, upto);
      p.path(xs, res.r.slice(0, upto), { color: 'rgba(255,255,255,0.5)', width: 1.8, dash: [5, 4] });
      p.path(xs, res.h.slice(0, upto), { color: T.cyan, width: 2.4 });
      p.points(xs.map((x, i) => [x, res.h[i]]), { color: T.cyan, r: 2.8 });
      drawCursor(p, upto, N, 1.1);
    };
    S.render = s => res && influenceBars(s, [{ vals: res.gG, color: T.cyan }, { vals: res.gR, color: 'rgba(200,200,210,0.9)' }], N);
    L.on(() => { run(); L.redraw(); });
    run(); L.redraw();
  };

  // ================================================================== LSTM
  labs.lstm_networks = el => {
    const N = 22;
    const L = mount(el, {
      title: 'Live lab · remember a value through 20 distractors',
      main: { x: [0.5, N + 0.5], y: [-2.25, 1.35], pad: [12, 12, 22, 34] },
      legend: [{ c: T.violet, l: 'input' }, { c: T.cyan, l: 'LSTM cell state c' }, { c: 'rgba(255,255,255,0.5)', l: 'plain RNN state' }, { c: T.green, l: 'value to recall' }],
      controls: [
        { type: 'range', key: 'v', label: 'Value at step 1', min: -1, max: 1, step: 0.05, value: 0.7 },
        { type: 'range', key: 'd', label: 'Distractor strength', min: 0, max: 1, step: 0.05, value: 0.6 },
        { type: 'range', key: 'f', label: 'Forget gate f (keep)', min: 0.5, max: 1, step: 0.01, value: 1 },
        { type: 'seg', key: 'imode', label: 'Input gate i', options: [['marker', 'opens only at step 1'], ['always', 'always open']], value: 'marker' },
        { type: 'buttons', items: [{ key: 'play', label: 'Play', kind: 'light' }] },
      ],
      readouts: [{ key: 'target', label: 'Value to recall' }, { key: 'lstm', label: 'LSTM recalls' }, { key: 'rnn', label: 'Plain RNN final state' }],
    });
    const P = L.main;
    let res = null;
    const run = () => {
      const v = L.val, R = rng(9);
      const xs = Array.from({ length: N }, (_, k) => (k === 0 ? v.v : k === N - 1 ? 0 : (R() * 2 - 1) * v.d));
      const iG = xs.map((_, k) => (v.imode === 'always' ? 0.9 : k === 0 ? 0.97 : 0.02));
      const oG = xs.map((_, k) => (k === N - 1 ? 0.97 : 0.04));
      const fG = xs.map(() => v.f);
      const c = []; let cc = 0;
      xs.forEach((x, k) => { cc = fG[k] * cc + iG[k] * x; c.push(cc); });
      const r = []; let h = 0; xs.forEach(x => { h = Math.tanh(0.9 * h + x); r.push(h); });
      res = { xs, iG, oG, fG, c, r };
      const recall = c[N - 1], err = Math.abs(recall - v.v);
      L.set('target', v.v.toFixed(2));
      L.set('lstm', `${recall.toFixed(2)} (error ${err.toFixed(2)})`, err < 0.1 ? 'good' : 'warn');
      L.set('rnn', r[N - 1].toFixed(2));
    };
    const ph = playhead(L, N, () => L.redraw());
    P.render = p => {
      if (!res) return;
      const upto = ph.cur;
      p.grid({ axes: true, step: 2, stepY: 0.5 });
      p.seg(0.5, L.val.v, N + 0.5, L.val.v, { color: alpha(T.green, 0.7), dash: [6, 5], width: 1.4 });
      drawInputs(p, res.xs, upto);
      // gate strips
      [['f', res.fG, T.pink, -1.45], ['i', res.iG, T.amber, -1.8], ['o', res.oG, T.violet2, -2.15]].forEach(([lab, g, col, y]) => {
        p.text(lab, p.range.pl - 12, p.sy(y + 0.12), { color: col, size: 10 });
        g.forEach((val, k) => p.rect(k + 1 - 0.32, y, k + 1 + 0.32, y + val * 0.28, { fill: alpha(col, k < upto ? 0.3 + 0.65 * val : 0.1) }));
      });
      const xs = res.c.map((_, k) => k + 1).slice(0, upto);
      p.path(xs, res.r.slice(0, upto), { color: 'rgba(255,255,255,0.5)', width: 1.8, dash: [5, 4] });
      p.path(xs, res.c.slice(0, upto), { color: T.cyan, width: 2.6 });
      p.points(xs.map((x, i) => [x, res.c[i]]), { color: T.cyan, r: 2.8 });
      if (upto >= N) { p.ring(N, res.c[N - 1], 8, T.amber, 2); p.text('recall', p.sx(N) - 10, p.sy(res.c[N - 1]) - 12, { color: T.amber, size: 10, align: 'right' }); }
      p.text('write', p.sx(1), p.sy(1.25), { color: T.green, size: 10, align: 'center' });
      drawCursor(p, upto, N, 1.3);
    };
    L.on(() => { run(); L.redraw(); });
    run(); L.redraw();
  };

  // ================================================================== Transformer attention
  labs.transformer_networks = el => {
    // features: 0 noun, 1 animate, 2 place/thing, 3 pronoun, 4 verb, 5 adjective, 6 function word
    const V = {
      the: [0, 0, 0, 0, 0, 0, 1], a: [0, 0, 0, 0, 0, 0, 1], animal: [1, 1, 0, 0, 0, 0, 0], cat: [1, 1, 0, 0, 0, 0, 0], street: [1, 0, 1, 0, 0, 0, 0], mat: [1, 0, 1, 0, 0, 0, 0],
      did: [0, 0, 0, 0, 0.5, 0, 1], not: [0, 0, 0, 0, 0, 0, 1], cross: [0, 0, 0, 0, 1, 0, 0], sat: [0, 0, 0, 0, 1, 0, 0], on: [0, 0, 0, 0, 0, 0, 1], because: [0, 0, 0, 0, 0, 0, 1],
      it: [0, 0, 0, 1, 0, 0, 0], was: [0, 0, 0, 0, 0.5, 0, 1], tired: [0, 0, 0, 0, 0, 1, 0], wide: [0, 0, 0, 0, 0, 1, 0], soft: [0, 0, 0, 0, 0, 1, 0],
    };
    const DESCRIBES = { tired: 1, wide: 2, soft: 2 };      // which kind of noun an adjective fits (1 animate, 2 place/thing)
    const SENT = {
      tired: 'the animal did not cross the street because it was tired',
      wide: 'the animal did not cross the street because it was wide',
      soft: 'the cat sat on the mat because it was soft',
    };
    const L = mount(el, {
      title: 'Live lab · click a word to see where it looks',
      main: { x: [0, 1], y: [0, 10], pad: [8, 10, 8, 10] },
      side: ['Attention matrix (row = query)'], sideOpts: [{ x: [0, 1], y: [0, 1], pad: [56, 8, 8, 56] }],
      hint: 'Click any word',
      controls: [
        { type: 'seg', key: 's', label: 'Sentence', options: [['tired', '…because it was tired'], ['wide', '…because it was wide'], ['soft', 'the cat sat on the mat…']], value: 'tired', span: true },
        { type: 'seg', key: 'head', label: 'Head', options: [['meaning', 'meaning'], ['position', 'previous word'], ['both', 'average of both']], value: 'meaning' },
        { type: 'range', key: 'temp', label: 'Softmax temperature', min: 0.25, max: 4, step: 0.05, value: 1 },
        { type: 'seg', key: 'mask', label: 'Mask', options: [['none', 'none (encoder)'], ['causal', 'causal (decoder)']], value: 'none' },
      ],
      readouts: [{ key: 'q', label: 'Query word' }, { key: 'top', label: 'Looks most at' }, { key: 'calc', label: 'Its score → weight' }, { key: 'spread', label: 'Spread (entropy)' }],
    });
    const P = L.main, S = L.side[0];
    let words = [], A = [], Sc = [], q = -1;
    const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
    const queryVec = (i) => {
      const w = words[i], e = V[w] || [0, 0, 0, 0, 0, 0, 0];
      if (e[3]) {                                          // pronoun: look for a noun of the kind the nearby adjective describes
        const ctx = words.slice(i + 1, i + 3).find(x => DESCRIBES[x]);
        const qv = [2, 0, 0, 0, 0, 0, 0]; if (ctx) qv[DESCRIBES[ctx]] = 3; return qv;
      }
      if (e[4] === 1) return [2, 2, 0, 0, 0, 0, 0];        // verb: look for its (animate) subject
      if (e[5]) return [0.5, 0, 0, 3, 0, 0, 0];            // adjective: look for what it describes (the pronoun)
      if (e[0]) return [0, 0, 0, 0, 2.5, 0, 0];            // noun: look for its verb
      return [0, 0, 0, 0, 0, 0, 1.2];                      // function words: mostly each other
    };
    const softmax = r => { const m = Math.max(...r.filter(isFinite)); const e = r.map(v => (isFinite(v) ? Math.exp(v - m) : 0)); const z = e.reduce((a, b) => a + b, 0); return e.map(v => v / z); };
    const run = () => {
      words = SENT[L.val.s].split(' ');
      if (q < 0 || q >= words.length) q = words.indexOf('it');
      const n = words.length, t = L.val.temp;
      const meaning = words.map((_, i) => words.map((w, j) => dot(queryVec(i), V[w]) + (i === j ? 0.5 : 0)));
      const position = words.map((_, i) => words.map((_, j) => (j === i - 1 ? 3 : j === i ? 1 : -0.6 * Math.abs(i - j))));
      const mask = (i, j) => L.val.mask === 'causal' && j > i;
      const att = M => M.map((row, i) => softmax(row.map((v, j) => (mask(i, j) ? -Infinity : v / t))));
      const Am = att(meaning), Ap = att(position);
      A = L.val.head === 'meaning' ? Am : L.val.head === 'position' ? Ap : Am.map((r, i) => r.map((v, j) => (v + Ap[i][j]) / 2));
      Sc = L.val.head === 'position' ? position : meaning;
      const row = A[q];
      let top = q === 0 && n > 1 ? 1 : 0;
      row.forEach((v, j) => { if (j !== q && v > row[top]) top = j; });
      if (n === 1 || (L.val.mask === 'causal' && q === 0)) top = q;
      const H = -row.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
      L.set('q', `“${words[q]}”`);
      L.set('top', `“${words[top]}” (${Math.round(row[top] * 100)}%)`, row[top] > 0.5 ? 'good' : '');
      L.set('calc', L.val.head === 'both' ? 'avg of 2 heads' : `${(Sc[q][top] / t).toFixed(1)} → ${Math.round(row[top] * 100)}%`);
      L.set('spread', `${H.toFixed(2)} bits${H > 2.5 ? ' (diffuse)' : H < 0.6 ? ' (sharp)' : ''}`);
      L.redraw();
    };
    const xOf = (i, n) => (i + 0.5) / n;
    P.render = p => {
      const n = words.length; if (!n) return;
      const c = p.ctx, small = p.W < 520, fs = small ? 9 : 12;
      // arcs from the query to every key
      A[q].forEach((w, j) => {
        if (j === q) return;
        const x0 = p.sx(xOf(q, n)), x1 = p.sx(xOf(j, n)), y = p.sy(7.7);
        const depth = Math.min(p.sy(4.4) - y, 18 + Math.abs(x1 - x0) * 0.42);
        c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo((x0 + x1) / 2, y + depth, x1, y);
        c.strokeStyle = T.amber; c.globalAlpha = 0.12 + 0.88 * Math.min(1, w * 1.6); c.lineWidth = 0.8 + w * 10; c.stroke(); c.globalAlpha = 1;
      });
      // tokens
      words.forEach((w, i) => {
        const x = p.sx(xOf(i, n)), y = p.sy(8.6), on = i === q;
        const tw = Math.min(p.W / n - 4, c.measureText(w).width + 18);
        c.font = `500 ${fs + 1}px Manrope, system-ui, sans-serif`;
        const wd = Math.min(p.W / n - 3, c.measureText(w).width + (small ? 8 : 16));
        c.beginPath(); c.roundRect ? c.roundRect(x - wd / 2, y - 13, wd, 26, 13) : c.rect(x - wd / 2, y - 13, wd, 26);
        c.fillStyle = on ? alpha(T.amber, 0.25) : `rgba(255,255,255,${0.04 + A[q][i] * 0.25})`; c.fill();
        c.strokeStyle = on ? T.amber : 'rgba(255,255,255,0.2)'; c.lineWidth = on ? 1.6 : 1; c.stroke();
        c.fillStyle = T.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(w, x, y + 1);
        void tw;
      });
      // weight bars
      const base = p.sy(1.3), maxH = p.sy(1.3) - p.sy(4.2);
      words.forEach((_, j) => {
        const x = p.sx(xOf(j, n)), w = A[q][j], bw = Math.min(28, p.W / n * 0.55);
        c.fillStyle = j === q ? alpha(T.amber, 0.85) : alpha(T.pal[j % T.pal.length], 0.85);
        c.fillRect(x - bw / 2, base - w * maxH, bw, w * maxH);
        if (w >= 0.02) p.text(`${Math.round(w * 100)}%`, x, base - w * maxH - 5, { align: 'center', color: T.soft, size: small ? 8 : 10 });
      });
      p.seg(0, 1.3, 1, 1.3, { color: 'rgba(255,255,255,0.15)' });
      // output = blend of values
      let xx = p.sx(0.02); const ow = p.sx(0.98) - p.sx(0.02), oy = p.sy(0.75);
      A[q].forEach((w, j) => { c.fillStyle = j === q ? T.amber : T.pal[j % T.pal.length]; c.fillRect(xx, oy - 7, ow * w, 14); xx += ow * w; });
      p.text(`new “${words[q]}” = weighted mix of every word’s value`, p.sx(0.5), p.sy(0.12), { align: 'center', color: T.muted, size: small ? 9 : 11 });
    };
    S.render = s => {
      const n = words.length; if (!n) return;
      const r = s.range, cs = Math.min(r.w, r.h) / n, gx = r.pl, gy = r.pt;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          s.ctx.fillStyle = alpha(T.violet, 0.06 + 0.94 * Math.min(1, A[i][j] * 1.5));
          s.ctx.fillRect(gx + j * cs + 0.5, gy + i * cs + 0.5, cs - 1, cs - 1);
        }
        s.text(words[i].slice(0, 7), gx - 4, gy + i * cs + cs / 2 + 3, { align: 'right', color: i === q ? T.amber : T.dim, size: 9 });
      }
      s.ctx.strokeStyle = T.amber; s.ctx.lineWidth = 1.5; s.ctx.strokeRect(gx, gy + q * cs, cs * n, cs);
      for (let j = 0; j < n; j++) { s.ctx.save(); s.ctx.translate(gx + j * cs + cs / 2 + 3, gy - 4); s.ctx.rotate(-1.1); s.text(words[j].slice(0, 7), 0, 0, { color: T.dim, size: 9 }); s.ctx.restore(); }
    };
    P.onDown = pt => { const n = words.length; q = Math.max(0, Math.min(n - 1, Math.floor(pt.x * n))); run(); };
    S.onDown = pt => { const n = words.length, r = S.range, cs = Math.min(r.w, r.h) / n; const i = Math.floor((pt.py - r.pt) / cs); if (i >= 0 && i < n) { q = i; run(); } };
    L.on(k => { if (k === 's' || k === 'reset') q = SENT[L.val.s].split(' ').indexOf('it'); run(); });
    run();
  };
})(window);

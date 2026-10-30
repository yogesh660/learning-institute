// Labs for the language lessons: a byte-level BPE tokenizer and word embeddings, both trained
// from scratch in the browser. Registered with the concept labs.
(function (root) {
  'use strict';
  const { T, alpha, rng, mount, animator, h } = root.Lab;
    const labs = root.Labs.concepts = root.Labs.concepts || {};

  // ======================================================================= tokenization: byte-level BPE
  const CORPUS = `Machine learning models learn patterns from data. A model that learns too much from the training data overfits, and a model that learns too little underfits. Training a model means lowering the loss on the training data, while testing the model means measuring the loss on new data. Learning rates control how fast the model learns. The transformer is a model that reads tokens, and every token becomes a vector. Tokenizers split words into smaller pieces, so new words like unlearnable or retraining can still be read as known pieces. The lower the loss, the better the model fits the data; the lowest loss is not always the best model. Tokenization is the first step of every language model: the tokenizer reads the text, splits it into tokens, and turns every token into a number. The model never reads letters or words, only token numbers. A good tokenizer keeps common words as single tokens and splits rare words into smaller pieces, so the model can read words it has never seen before.`;
  const enc = new TextEncoder(), dec = new TextDecoder('utf-8', { fatal: true });
  // GPT-2 style pre-tokenizer: words keep their leading space; digits, punctuation and spaces are separate chunks
  const chunks = s => s.match(/ ?[A-Za-z]+| ?[0-9]+| ?[^\sA-Za-z0-9]+|\s+(?!\S)|\s+/g) || [];

  function trainBPE(text, maxMerges) {
    const counts = new Map();
    chunks(text).forEach(c => counts.set(c, (counts.get(c) || 0) + 1));
    let words = [...counts].map(([c, n]) => [Array.from(enc.encode(c)), n]);
    const merges = [], bytesOf = Array.from({ length: 256 }, (_, i) => [i]);
    for (let k = 0; k < maxMerges; k++) {
      const pc = new Map();
      words.forEach(([s, n]) => { for (let i = 0; i < s.length - 1; i++) { const key = s[i] * 65536 + s[i + 1]; pc.set(key, (pc.get(key) || 0) + n); } });
      let best = -1, bc = 1;
      pc.forEach((n, key) => { if (n > bc) { bc = n; best = key; } });
      if (best < 0) break;
      const a = Math.floor(best / 65536), b = best % 65536, id = 256 + k;
      merges.push({ a, b, id, count: bc });
      bytesOf.push([...bytesOf[a], ...bytesOf[b]]);
      words = words.map(([s, n]) => { const o = []; for (let i = 0; i < s.length; i++) { if (i < s.length - 1 && s[i] === a && s[i + 1] === b) { o.push(id); i++; } else o.push(s[i]); } return [o, n]; });
    }
    return { merges, bytesOf };
  }
  function encodeBPE(text, model, k) {
    const rank = new Map();
    for (let i = 0; i < k; i++) { const m = model.merges[i]; rank.set(m.a * 65536 + m.b, i); }
    const out = [];
    chunks(text).forEach(c => {
      let s = Array.from(enc.encode(c));
      for (;;) {
        let bestI = -1, bestR = Infinity;
        for (let i = 0; i < s.length - 1; i++) { const r = rank.get(s[i] * 65536 + s[i + 1]); if (r !== undefined && r < bestR) { bestR = r; bestI = i; } }
        if (bestI < 0) break;
        const m = model.merges[bestR];
        const o = []; for (let i = 0; i < s.length; i++) { if (i < s.length - 1 && s[i] === m.a && s[i + 1] === m.b) { o.push(m.id); i++; } else o.push(s[i]); }
        s = o;
      }
      out.push(...s);
    });
    return out;
  }
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  function show(bytes) {
    let s;
    try { s = dec.decode(new Uint8Array(bytes)); } catch (e) { return bytes.map(b => `<${b.toString(16).toUpperCase().padStart(2, '0')}>`).join(''); }
    return s.replace(/ /g, '▁').replace(/\n/g, '↵');
  }
  const tokColor = id => (id < 256 ? T.dim : T.pal[(id * 7) % T.pal.length]);

  labs.tokenization = el => {
    const model = trainBPE(CORPUS, 400);
    const MAX = model.merges.length;
    const L = mount(el, {
      title: 'Live lab · train a BPE tokenizer and use it', custom: true,
      controls: [
        { type: 'range', key: 'k', label: 'Number of merges learned', min: 0, max: MAX, step: 1, value: Math.min(60, MAX), span: true },
        { type: 'buttons', items: [{ key: 'train', label: 'Train from 0 merges', kind: 'primary' }, { key: 'step', label: '+1 merge' }] },
      ],
      readouts: [{ key: 'vocab', label: 'Vocabulary size' }, { key: 'n', label: 'Tokens in your text' }, { key: 'cpt', label: 'Characters per token' }, { key: 'corpus', label: 'Corpus: bytes → tokens' }],
    });
    const box = L.main; box.classList.add('lab-text', 'bpe');
    const input = h('textarea'); input.rows = 2; input.value = 'The tokenizer learns to read unlearnable words like remodelling, Modèle or 🙂.'; input.setAttribute('aria-label', 'Text to tokenize'); input.spellcheck = false;
    const toks = h('div', 'tok-row bpe-toks');
    const legend = h('p', 'note', 'Each chip is one token: the text piece on top (▁ marks a space), its id below. Grey chips are raw bytes (ids 0–255); coloured chips are pieces created by merges (ids 256 and up).');
    const mergesBox = h('div', 'bpe-merges');
    const corpusBox = h('details', 'bpe-corpus', '');
    box.append(input, toks, legend, mergesBox, corpusBox);

    const run = () => {
      const k = L.val.k;
      const ids = encodeBPE(input.value, model, k);
      toks.innerHTML = ids.map(id => { const b = model.bytesOf[id]; return `<span class="tok" style="border-color:${alpha(tokColor(id), 0.55)}"><b style="color:${id < 256 ? T.soft : tokColor(id)}">${esc(show(b))}</b><em>${id}</em></span>`; }).join('') || '<span class="note">Type something above.</span>';
      const last = model.merges.slice(Math.max(0, k - 8), k).reverse();
      mergesBox.innerHTML = `<small class="kicker">${k ? `Latest merges (of ${k})` : 'No merges yet: every byte is its own token'}</small>` +
        `<ol>${last.map((m, i) => `<li${i === 0 ? ' class="new"' : ''}><span class="m-n">#${m.id - 255}</span><code>${esc(show(model.bytesOf[m.a]))}</code> + <code>${esc(show(model.bytesOf[m.b]))}</code> → <code class="res">${esc(show(model.bytesOf[m.id]))}</code><span class="m-c">seen ${m.count}×</span></li>`).join('')}</ol>` +
        (k < MAX ? `<p class="note">Next merge: <code>${esc(show(model.bytesOf[model.merges[k].a]))}</code> + <code>${esc(show(model.bytesOf[model.merges[k].b]))}</code>, the most frequent remaining pair (${model.merges[k].count}×).</p>` : `<p class="note">No pair occurs twice any more: training on this corpus is finished.</p>`);
      const cids = encodeBPE(CORPUS, model, k);
      corpusBox.innerHTML = `<summary class="note">The training corpus (${CORPUS.length} characters), tokenized with ${k} merges</summary><div class="tok-flow">${cids.map(id => `<span style="background:${alpha(tokColor(id), id < 256 ? 0.08 : 0.2)}">${esc(show(model.bytesOf[id]))}</span>`).join('')}</div>`;
      const chars = [...input.value].length;
      L.set('vocab', String(256 + k));
      L.set('n', String(ids.length));
      L.set('cpt', ids.length ? (chars / ids.length).toFixed(2) : '–', chars / ids.length > 3 ? 'good' : '');
      L.set('corpus', `${enc.encode(CORPUS).length} → ${cids.length}`);
    };
    let anim = null;
    const stopAnim = () => { if (anim) anim.stop(); anim = null; const b = L.el('train'); if (b) b.textContent = 'Train from 0 merges'; };
    L.button('train', b => {
      if (anim) { stopAnim(); return; }
      L.el('k').set(0); run(); b.textContent = 'Stop';
      anim = animator(() => { const k = L.val.k + 1; if (k > MAX) { stopAnim(); return false; } L.el('k').set(k); run(); return true; }, 10);
      anim.start();
    });
    L.button('step', () => { stopAnim(); L.el('k').set(Math.min(MAX, L.val.k + 1)); run(); });
    input.addEventListener('input', run);
    L.on(key => { if (key === 'k' || key === 'reset') stopAnim(); run(); });
    run();
  };

  // ======================================================================= embeddings: GloVe-style training on a toy corpus
  const GROUPS = { royals: ['king', 'queen', 'prince', 'princess'], people: ['man', 'woman', 'boy', 'girl'], animals: ['cat', 'dog', 'kitten', 'puppy'], food: ['apple', 'mango', 'bread', 'rice'] };
  const GCOL = () => ({ royals: T.violet2, people: T.cyan, animals: T.green, food: T.amber });
  function corpus() {
    const people = { king: 'm r a', queen: 'f r a', prince: 'm r y', princess: 'f r y', man: 'm c a', woman: 'f c a', boy: 'm c y', girl: 'f c y' };
    const S = [];
    Object.entries(people).forEach(([w, f]) => {
      const [g, r, a] = f.split(' '), pr = g === 'm' ? 'he' : 'she';
      S.push(`the ${w} said ${pr} was tired`, `${pr} is the ${w}`, `the ${w} smiled and ${pr} waved`);
      if (r === 'r') S.push(`the ${w} lives in the palace`, `the ${w} wears a crown`, `the ${w} rules the kingdom`);
      else S.push(`the ${w} lives in a house`, `the ${w} walks to the market`, `the ${w} takes the bus`);
      if (a === 'a') S.push(`the ${w} works all day`, `the ${w} reads the news`); else S.push(`the ${w} plays all day`, `the ${w} goes to school`);
    });
    ['cat', 'dog', 'kitten', 'puppy'].forEach(w => {
      S.push(`the ${w} chased the ball`, `the ${w} is a pet`, `the ${w} sleeps on the rug`);
      if (w === 'kitten' || w === 'puppy') S.push(`the ${w} plays all day`, `the young ${w} is small`); else S.push(`the ${w} sleeps all day`);
      S.push(w === 'cat' || w === 'kitten' ? `the ${w} says meow` : `the ${w} says woof`);
      S.push({ cat: 'the cat climbs the tree', dog: 'the dog guards the house', kitten: 'the kitten drinks milk', puppy: 'the puppy chews a shoe' }[w]);
    });
    ['apple', 'mango', 'bread', 'rice'].forEach(w => {
      S.push(`we eat ${w} for lunch`, `the ${w} is tasty`, `buy ${w} at the market`);
      S.push(w === 'apple' || w === 'mango' ? `the ${w} is a sweet fruit` : `cook the ${w} for dinner`);
      S.push({ apple: 'the apple is red and crisp', mango: 'the mango is yellow and ripe', bread: 'bake the bread in the oven', rice: 'boil the rice in water' }[w]);
    });
    return S;
  }

  labs.embeddings = el => {
    const S = corpus(), vocab = Object.values(GROUPS).flat(), groupOf = {};
    Object.entries(GROUPS).forEach(([g, ws]) => ws.forEach(w => { groupOf[w] = g; }));
    const ctx = [...new Set(S.flatMap(s => s.split(' ')))], ci = Object.fromEntries(ctx.map((w, i) => [w, i]));
    const X = vocab.map(() => ctx.map(() => 0));
    S.forEach(s => { const ws = s.split(' '); ws.forEach((w, i) => { const vi = vocab.indexOf(w); if (vi < 0) return; ws.forEach((u, j) => { const d = Math.abs(i - j); if (d && d <= 4) X[vi][ci[u]] += 1 / d; }); }); });
    const pairs = []; X.forEach((r, i) => r.forEach((v, j) => pairs.push([i, j, Math.log(1 + v), v > 0 ? 1 : 0.15])));
    const D = 8, EPOCHS = 400, lr = 0.08;
    let W, C, bw, bc, gW, gC, gbw, gbc, epoch, losses;
    const init = seed => {
      const R = rng(seed);
      W = vocab.map(() => Array.from({ length: D }, () => R.gauss() * 0.1)); C = ctx.map(() => Array.from({ length: D }, () => R.gauss() * 0.1));
      bw = vocab.map(() => 0); bc = ctx.map(() => 0);
      gW = W.map(r => r.map(() => 1)); gC = C.map(r => r.map(() => 1)); gbw = bw.map(() => 1); gbc = bc.map(() => 1);
      epoch = 0; losses = [];
    };
    const epochStep = () => {                                   // one pass of AdaGrad over all (word, context) pairs
      let loss = 0;
      for (const [i, j, target, wgt] of pairs) {
        let dot = bw[i] + bc[j]; const wi = W[i], cj = C[j];
        for (let k = 0; k < D; k++) dot += wi[k] * cj[k];
        const g = wgt * (dot - target); loss += g * (dot - target);
        for (let k = 0; k < D; k++) { const gw = g * cj[k], gc = g * wi[k]; gW[i][k] += gw * gw; gC[j][k] += gc * gc; wi[k] -= lr * gw / Math.sqrt(gW[i][k]); cj[k] -= lr * gc / Math.sqrt(gC[j][k]); }
        gbw[i] += g * g; gbc[j] += g * g; bw[i] -= lr * g / Math.sqrt(gbw[i]); bc[j] -= lr * g / Math.sqrt(gbc[j]);
      }
      epoch++; losses.push(loss / pairs.length);
    };
    const unit = v => { const n = Math.hypot(...v) || 1; return v.map(x => x / n); };
    const cos = (a, b) => { let s = 0; a.forEach((v, k) => { s += v * b[k]; }); return s / ((Math.hypot(...a) * Math.hypot(...b)) || 1); };
    // 2-D view: metric MDS (SMACOF) on the distances between unit vectors, warm-started from the
    // previous frame so the map moves smoothly while training
    let Y = null;
    const ud = (a, b) => { const ua = unit(a), ub = unit(b); return Math.hypot(...ua.map((v, k) => v - ub[k])); };
    const project = () => {
      const n = vocab.length, Dm = W.map(a => W.map(b => ud(a, b)));
      if (!Y) { const R = rng(3); Y = vocab.map((w, i) => { const g = Object.keys(GROUPS).indexOf(groupOf[w]); return [Math.cos(g * 1.57) + R() * 0.3, Math.sin(g * 1.57) + R() * 0.3]; }); }
      for (let it = 0; it < 40; it++) {
        const Z = Y.map(() => [0, 0]);
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const dx = Y[i][0] - Y[j][0], dy = Y[i][1] - Y[j][1], d = Math.hypot(dx, dy) || 1e-6, f = Dm[i][j] / d;
          Z[i][0] += Y[j][0] + f * dx; Z[i][1] += Y[j][1] + f * dy;
        }
        Y = Z.map(z => [z[0] / (n - 1), z[1] / (n - 1)]);
      }
      const cx = Y.reduce((s, p) => s + p[0], 0) / n, cy = Y.reduce((s, p) => s + p[1], 0) / n;
      Y = Y.map(p => [p[0] - cx, p[1] - cy]);
      const m = Math.max(...Y.flat().map(Math.abs)) || 1, sc = 0.88 / m;
      const place = v => {                                        // put a new vector on the map with the others fixed
        const d = W.map(w => ud(v, w));
        let p = Y[d.indexOf(Math.min(...d))].map(x => x + 0.01);
        for (let it = 0; it < 60; it++) { let zx = 0, zy = 0; Y.forEach((q, j) => { const dx = p[0] - q[0], dy = p[1] - q[1], dd = Math.hypot(dx, dy) || 1e-6, f = d[j] / dd; zx += q[0] + f * dx; zy += q[1] + f * dy; }); p = [zx / n, zy / n]; }
        return p.map(x => x * sc);
      };
      return { P: Y.map(p => p.map(x => x * sc)), map: place };
    };
    const ANALOGY = { kq: ['king', 'man', 'woman'], pp: ['prince', 'boy', 'girl'], kd: ['kitten', 'cat', 'dog'], qm: ['queen', 'woman', 'man'] };
    const col = GCOL();
    const L = mount(el, {
      title: 'Live lab · learn word vectors from scratch',
      main: { x: [-1.15, 1.15], y: [-1.1, 1.1], pad: [10, 10, 10, 10], equal: true },
      side: ['Training loss (log scale)'], sideOpts: [{ x: [0, EPOCHS], y: [-4.6, 0.4], pad: [30, 12, 14, 12] }],
      legend: [{ c: col.royals, l: 'royals' }, { c: col.people, l: 'people' }, { c: col.animals, l: 'animals' }, { c: col.food, l: 'food' }],
      hint: 'Click a word',
      controls: [
        { type: 'seg', key: 'mode', label: 'Explore', options: [['near', 'Nearest neighbours'], ['analogy', 'Analogy (a − b + c)']], value: 'near' },
        { type: 'seg', key: 'an', label: 'Analogy', options: [['kq', 'king − man + woman'], ['pp', 'prince − boy + girl'], ['kd', 'kitten − cat + dog'], ['qm', 'queen − woman + man']], value: 'kq', span: true },
        { type: 'buttons', items: [{ key: 'train', label: 'Train', kind: 'primary' }, { key: 'rand', label: 'Random start' }] },
      ],
      readouts: [{ key: 'ep', label: 'Epoch' }, { key: 'sel', label: 'Selected word' }, { key: 'nn', label: 'Nearest (cosine)' }, { key: 'res', label: 'Analogy lands on' }],
    });
    const P = L.main, SP = L.side[0];
    let sel = vocab.indexOf('cat'), view = null, anim = null;
    const nearest = (v, exclude) => vocab.map((w, i) => [w, cos(v, W[i])]).filter(([w]) => !exclude.includes(w)).sort((a, b) => b[1] - a[1]);
    const update = () => {
      view = project();
      L.set('ep', `${epoch} / ${EPOCHS}`);
      L.set('sel', `“${vocab[sel]}”`);
      const nn = nearest(W[sel], [vocab[sel]]);
      L.set('nn', `${nn[0][0]} ${nn[0][1].toFixed(2)}, ${nn[1][0]} ${nn[1][1].toFixed(2)}`);
      const [a, b, c] = ANALOGY[L.val.an];
      const v = W[vocab.indexOf(a)].map((x, k) => x - W[vocab.indexOf(b)][k] + W[vocab.indexOf(c)][k]);
      const r = nearest(v, [a, b, c])[0];
      L.set('res', `${r[0]} (${r[1].toFixed(2)})`, r[1] > 0.8 ? 'good' : '');
      P.request(); SP.request();
    };
    P.render = () => {
      if (!view) return;
      const { P: pts, map } = view, cx = P.ctx;
      P.seg(-1.1, 0, 1.1, 0, { color: 'rgba(255,255,255,0.05)' }); P.seg(0, -1.05, 0, 1.05, { color: 'rgba(255,255,255,0.05)' });
      const arrow = (p, q, color, dash) => {
        P.seg(p[0], p[1], q[0], q[1], { color, width: 2, dash });
        const x1 = P.sx(p[0]), y1 = P.sy(p[1]), x2 = P.sx(q[0]), y2 = P.sy(q[1]), ang = Math.atan2(y2 - y1, x2 - x1);
        cx.beginPath(); cx.moveTo(x2, y2); cx.lineTo(x2 - 8 * Math.cos(ang - 0.4), y2 - 8 * Math.sin(ang - 0.4)); cx.lineTo(x2 - 8 * Math.cos(ang + 0.4), y2 - 8 * Math.sin(ang + 0.4)); cx.closePath(); cx.fillStyle = color; cx.fill();
      };
      if (L.val.mode === 'near') {
        nearest(W[sel], [vocab[sel]]).slice(0, 3).forEach(([w, s], k) => {
          const j = vocab.indexOf(w);
          P.seg(pts[sel][0], pts[sel][1], pts[j][0], pts[j][1], { color: alpha(T.amber, 0.75 - k * 0.2), width: 2.2 - k * 0.5 });
          const mx = P.sx((pts[sel][0] + pts[j][0]) / 2), my = P.sy((pts[sel][1] + pts[j][1]) / 2);
          P.text(s.toFixed(2), mx + 4, my - 4, { color: T.amber, size: 10 });
        });
      } else {
        const [a, b, c] = ANALOGY[L.val.an], ia = vocab.indexOf(a), ib = vocab.indexOf(b), ic = vocab.indexOf(c);
        const tgt = map(W[ia].map((x, k) => x - W[ib][k] + W[ic][k]));
        arrow(pts[ib], pts[ic], alpha(T.cyan, 0.9));
        arrow(pts[ia], tgt, alpha(T.amber, 0.95), [5, 4]);
        P.ring(tgt[0], tgt[1], 9, T.amber, 1.6);
        P.text(`${a} − ${b} + ${c}`, P.sx(tgt[0]) + 12, P.sy(tgt[1]) + 16, { color: T.amber, size: 10 });
      }
      const boxes = [];
      pts.forEach(([x, y], i) => {
        const w = vocab[i], c = col[groupOf[w]], on = i === sel && L.val.mode === 'near';
        P.points([[x, y]], { color: c, r: on ? 7 : 5 });
        if (on) P.ring(x, y, 11, T.amber, 1.6);
      });
      pts.forEach(([x, y], i) => {                              // labels, nudged down when they would collide
        const w = vocab[i], c = col[groupOf[w]], on = i === sel && L.val.mode === 'near';
        const lx = P.sx(x) + 9, wd = w.length * 6.4; let ly = P.sy(y) - 6;
        for (let tries = 0; tries < 6 && boxes.some(b => lx < b[0] + b[2] && lx + wd > b[0] && Math.abs(ly - b[1]) < 12); tries++) ly += 13;
        boxes.push([lx, ly, wd]);
        P.text(w, lx, ly, { color: on ? T.ink : alpha(c, 0.95), size: 11, sans: true });
      });
    };
    SP.render = () => {
      SP.grid();
      if (losses.length > 1) SP.path(losses.map((_, i) => i + 1), losses.map(l => Math.log10(Math.max(l, 1e-6))), { color: T.violet2, width: 2 });
    };
    P.onDown = p => {
      if (!view) return;
      let best = -1, bd = Infinity;
      view.P.forEach(([x, y], i) => { const d = Math.hypot(P.sx(x) - p.px, P.sy(y) - p.py); if (d < bd) { bd = d; best = i; } });
      if (bd < 40) { sel = best; if (L.val.mode !== 'near') L.el('mode').set('near'); update(); }
    };
    const stop = () => { if (anim) anim.stop(); anim = null; const b = L.el('train'); if (b) b.textContent = 'Train'; };
    L.button('train', b => {
      if (anim) { stop(); return; }
      if (epoch >= EPOCHS) init(7);
      b.textContent = 'Stop';
      anim = animator(() => { for (let k = 0; k < 3 && epoch < EPOCHS; k++) epochStep(); update(); if (epoch >= EPOCHS) { stop(); return false; } return true; }, 60);
      anim.start();
    });
    L.button('rand', () => { stop(); init(7); update(); });
    L.on(() => update());
    init(7); for (let e = 0; e < EPOCHS; e++) epochStep(); update();
  };
})(window);

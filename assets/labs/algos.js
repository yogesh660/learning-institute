// Small, readable implementations of every algorithm in the curriculum, sized for a few hundred
// points so they can retrain on every slider move. Binary labels are 0/1; 2-D inputs are [x, y].
(function (root) {
  'use strict';
  const sq = v => v * v;
  const sigmoid = z => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));
  const dist2 = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += sq(a[i] - b[i]); return s; };
  const mean = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);

  // ------------------------------------------------------------ linear algebra (small, dense)
  const LA = {
    zeros: (n, m) => Array.from({ length: n }, () => new Array(m).fill(0)),
    eye: n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))),
    // solve A x = b by Gaussian elimination with partial pivoting
    solve(A, b) {
      const n = A.length, M = A.map((r, i) => [...r, b[i]]);
      for (let c = 0; c < n; c++) {
        let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
        [M[c], M[p]] = [M[p], M[c]];
        const piv = M[c][c] || 1e-12;
        for (let r = 0; r < n; r++) {
          if (r === c) continue;
          const f = M[r][c] / piv;
          if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
        }
      }
      return M.map((r, i) => r[n] / (r[i] || 1e-12));
    },
    cholesky(A) {
      const n = A.length, L = LA.zeros(n, n);
      for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
        let s = A[i][j];
        for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
        L[i][j] = i === j ? Math.sqrt(Math.max(s, 1e-12)) : s / L[j][j];
      }
      return L;
    },
    cholSolve(L, b) {
      const n = L.length, y = new Array(n), x = new Array(n);
      for (let i = 0; i < n; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k] * y[k]; y[i] = s / L[i][i]; }
      for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k]; x[i] = s / L[i][i]; }
      return x;
    },
    inv2: m => { const d = m[0][0] * m[1][1] - m[0][1] * m[1][0] || 1e-12; return [[m[1][1] / d, -m[0][1] / d], [-m[1][0] / d, m[0][0] / d]]; },
    det2: m => m[0][0] * m[1][1] - m[0][1] * m[1][0],
  };

  function meanCov(P, w) {
    const n = P.length; let sw = 0; const mu = [0, 0];
    for (let i = 0; i < n; i++) { const wi = w ? w[i] : 1; sw += wi; mu[0] += wi * P[i][0]; mu[1] += wi * P[i][1]; }
    mu[0] /= sw || 1; mu[1] /= sw || 1;
    const C = [[0, 0], [0, 0]];
    for (let i = 0; i < n; i++) {
      const wi = w ? w[i] : 1, dx = P[i][0] - mu[0], dy = P[i][1] - mu[1];
      C[0][0] += wi * dx * dx; C[0][1] += wi * dx * dy; C[1][1] += wi * dy * dy;
    }
    C[0][0] /= sw || 1; C[0][1] /= sw || 1; C[1][1] /= sw || 1; C[1][0] = C[0][1];
    return { mu, C, n: sw };
  }
  const gauss2 = (x, mu, C) => {
    const iC = LA.inv2(C), det = Math.max(LA.det2(C), 1e-12);
    const dx = x[0] - mu[0], dy = x[1] - mu[1];
    const m = dx * (iC[0][0] * dx + iC[0][1] * dy) + dy * (iC[1][0] * dx + iC[1][1] * dy);
    return Math.exp(-0.5 * m) / (2 * Math.PI * Math.sqrt(det));
  };

  // ------------------------------------------------------------ metrics
  const M = {
    acc(y, p) { let c = 0; for (let i = 0; i < y.length; i++) c += (p[i] >= 0.5 ? 1 : 0) === y[i]; return c / (y.length || 1); },
    rmse(y, p) { return Math.sqrt(mean(y.map((v, i) => sq(v - p[i])))); },
    mae(y, p) { return mean(y.map((v, i) => Math.abs(v - p[i]))); },
    r2(y, p) { const m = mean(y); const ss = y.reduce((s, v) => s + sq(v - m), 0) || 1e-12; return 1 - y.reduce((s, v, i) => s + sq(v - p[i]), 0) / ss; },
    logloss(y, p) { return mean(y.map((v, i) => { const q = Math.min(1 - 1e-9, Math.max(1e-9, p[i])); return -(v * Math.log(q) + (1 - v) * Math.log(1 - q)); })); },
    inertia(X, lab, C) { let s = 0; for (let i = 0; i < X.length; i++) if (lab[i] >= 0) s += dist2(X[i], C[lab[i]]); return s; },
    silhouette(X, lab) {
      const ks = [...new Set(lab.filter(l => l >= 0))];
      if (ks.length < 2) return { mean: 0, s: X.map(() => 0) };
      const s = X.map((x, i) => {
        if (lab[i] < 0) return 0;
        const sums = {}, cnt = {};
        for (let j = 0; j < X.length; j++) { if (j === i || lab[j] < 0) continue; const d = Math.sqrt(dist2(x, X[j])); sums[lab[j]] = (sums[lab[j]] || 0) + d; cnt[lab[j]] = (cnt[lab[j]] || 0) + 1; }
        if (!cnt[lab[i]]) return 0;
        const a = sums[lab[i]] / cnt[lab[i]];
        let b = Infinity; for (const k of ks) if (k !== lab[i] && cnt[k]) b = Math.min(b, sums[k] / cnt[k]);
        return (b - a) / Math.max(a, b);
      });
      const valid = s.filter((_, i) => lab[i] >= 0);
      return { mean: mean(valid), s };
    },
    daviesBouldin(X, lab) {
      const ks = [...new Set(lab.filter(l => l >= 0))];
      if (ks.length < 2) return 0;
      const cen = {}, spr = {};
      for (const k of ks) { const P = X.filter((_, i) => lab[i] === k); const c = [mean(P.map(p => p[0])), mean(P.map(p => p[1]))]; cen[k] = c; spr[k] = mean(P.map(p => Math.sqrt(dist2(p, c)))); }
      return mean(ks.map(i => Math.max(...ks.filter(j => j !== i).map(j => (spr[i] + spr[j]) / Math.sqrt(dist2(cen[i], cen[j]) || 1e-12)))));
    },
  };

  // ------------------------------------------------------------ feature maps
  const polyFeat = (x, d) => { const f = [1]; for (let k = 1; k <= d; k++) f.push(Math.pow(x, k)); return f; };
  const quad2 = ([a, b]) => [1, a, b, a * a, b * b, a * b];
  const lin2 = ([a, b]) => [1, a, b];

  // ------------------------------------------------------------ linear models
  function ridgeFit(F, y, lam, penalizeFirst = false) {
    const p = F[0].length, A = LA.zeros(p, p), b = new Array(p).fill(0);
    for (let i = 0; i < F.length; i++) for (let j = 0; j < p; j++) { b[j] += F[i][j] * y[i]; for (let k = 0; k < p; k++) A[j][k] += F[i][j] * F[i][k]; }
    for (let j = penalizeFirst ? 0 : 1; j < p; j++) A[j][j] += lam;
    return LA.solve(A, b);
  }
  // standardised polynomial basis so penalties are fair across powers
  function polyBasis(xs, d) {
    const cols = [];
    for (let k = 1; k <= d; k++) { const v = xs.map(x => Math.pow(x, k)); const m = mean(v); const s = Math.sqrt(mean(v.map(t => sq(t - m)))) || 1; cols.push({ m, s }); }
    return { d, cols, row: x => cols.map((c, k) => (Math.pow(x, k + 1) - c.m) / c.s) };
  }
  // elastic net by coordinate descent on standardised features; returns intercept + weights
  function enetFit(Z, y, lam, l1, iters = 300) {
    const n = Z.length, p = Z[0].length, ym = mean(y), w = new Array(p).fill(0);
    const r = y.map(v => v - ym);
    const zz = new Array(p).fill(0);
    for (let j = 0; j < p; j++) for (let i = 0; i < n; i++) zz[j] += Z[i][j] * Z[i][j] / n;
    for (let it = 0; it < iters; it++) {
      let maxd = 0;
      for (let j = 0; j < p; j++) {
        let rho = 0;
        for (let i = 0; i < n; i++) rho += Z[i][j] * (r[i] + Z[i][j] * w[j]);
        rho /= n;
        const st = Math.sign(rho) * Math.max(Math.abs(rho) - lam * l1, 0);
        const nw = st / (zz[j] + lam * (1 - l1));
        const d = nw - w[j];
        if (d) { for (let i = 0; i < n; i++) r[i] -= Z[i][j] * d; w[j] = nw; maxd = Math.max(maxd, Math.abs(d)); }
      }
      if (maxd < 1e-7) break;
    }
    return { b: ym, w };
  }

  function logisticFit(X, y, o = {}) {
    const phi = o.quad ? quad2 : lin2, F = X.map(phi), p = F[0].length, n = F.length;
    const C = o.C ?? 1, iters = o.iters ?? 400, lr = o.lr ?? 0.5;
    const w = new Array(p).fill(0);
    for (let it = 0; it < iters; it++) {
      const g = new Array(p).fill(0);
      for (let i = 0; i < n; i++) { const e = sigmoid(dot(w, F[i])) - y[i]; for (let j = 0; j < p; j++) g[j] += e * F[i][j] / n; }
      for (let j = 1; j < p; j++) g[j] += w[j] / (C * n);
      for (let j = 0; j < p; j++) w[j] -= lr * g[j] * (o.quad ? 1.4 : 1);
    }
    return { w, proba: x => sigmoid(dot(w, phi(x))), score: x => dot(w, phi(x)) };
  }
  const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

  // ------------------------------------------------------------ generative classifiers
  function discriminant(X, y, kind, o = {}) {
    const P0 = X.filter((_, i) => !y[i]), P1 = X.filter((_, i) => y[i]);
    const g0 = meanCov(P0), g1 = meanCov(P1);
    const pi1 = P1.length / X.length;
    let C0 = g0.C, C1 = g1.C;
    if (kind === 'lda') {
      const C = [[0, 0], [0, 0]];
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) C[a][b] = (g0.C[a][b] * P0.length + g1.C[a][b] * P1.length) / X.length;
      C0 = C1 = C;
    } else if (kind === 'gnb') {
      const vs = o.varSmoothing ?? 1e-3;
      C0 = [[g0.C[0][0] + vs, 0], [0, g0.C[1][1] + vs]]; C1 = [[g1.C[0][0] + vs, 0], [0, g1.C[1][1] + vs]];
    } else if (kind === 'qda') {
      const r = o.reg ?? 0;
      const blend = C => [[(1 - r) * C[0][0] + r, (1 - r) * C[0][1]], [(1 - r) * C[1][0], (1 - r) * C[1][1] + r]];
      C0 = blend(g0.C); C1 = blend(g1.C);
    }
    const proba = x => { const a = (1 - pi1) * gauss2(x, g0.mu, C0), b = pi1 * gauss2(x, g1.mu, C1); return b / (a + b || 1e-300); };
    return { proba, comps: [{ mu: g0.mu, C: C0 }, { mu: g1.mu, C: C1 }] };
  }

  // ------------------------------------------------------------ k-NN
  function knn(X, y, k, weighted) {
    const near = q => X.map((x, i) => [dist2(q, x), i]).sort((a, b) => a[0] - b[0]).slice(0, k);
    return {
      near,
      predict(q) { let s = 0, w = 0; for (const [d, i] of near(q)) { const wi = weighted ? 1 / (Math.sqrt(d) + 1e-6) : 1; s += wi * y[i]; w += wi; } return s / w; },
    };
  }

  // ------------------------------------------------------------ trees (CART), shared by classification & regression
  // y: targets; for classification use 0/1 and criterion 'gini'/'entropy'; for regression 'mse'.
  // g/h: gradient/hessian for boosting (second-order leaf values); bins: histogram thresholds.
  function buildTree(X, y, o = {}) {
    const maxDepth = o.maxDepth ?? 4, minLeaf = o.minLeaf ?? 1, crit = o.criterion || 'mse';
    const R = o.rng, nf = X[0].length, lam = o.lambda ?? 0, gamma = o.gamma ?? 0;
    const useGH = !!o.g;
    const leafVal = idx => {
      if (useGH) { let G = 0, H = 0; for (const i of idx) { G += o.g[i]; H += o.h[i]; } return -G / (H + lam); }
      if (crit === 'mse') return mean(idx.map(i => y[i]));
      return mean(idx.map(i => y[i]));             // class-1 share
    };
    const imp = (s, s2, n) => {
      if (crit === 'mse') return s2 - (s * s) / n;
      const p = s / n;
      if (crit === 'entropy') return n * (p > 0 && p < 1 ? -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p)) : 0);
      return n * (1 - p * p - (1 - p) * (1 - p));
    };
    let leaves = 0;
    const grow = (idx, depth, box) => {
      const node = { n: idx.length, value: leafVal(idx), box };
      if (depth >= maxDepth || idx.length < 2 * minLeaf) { leaves++; return node; }
      let best = null;
      const feats = o.maxFeatures && o.maxFeatures < nf ? R.shuffle([...Array(nf).keys()]).slice(0, o.maxFeatures) : [...Array(nf).keys()];
      for (const f of feats) {
        const sorted = [...idx].sort((a, b) => X[a][f] - X[b][f]);
        if (useGH) {
          let GT = 0, HT = 0; for (const i of sorted) { GT += o.g[i]; HT += o.h[i]; }
          let GL = 0, HL = 0;
          const score = (G, H) => (G * G) / (H + lam);
          for (let k = 0; k < sorted.length - 1; k++) {
            GL += o.g[sorted[k]]; HL += o.h[sorted[k]];
            const a = X[sorted[k]][f], b = X[sorted[k + 1]][f];
            if (a === b || k + 1 < minLeaf || sorted.length - k - 1 < minLeaf) continue;
            const thr = o.bins ? snap(o.bins[f], (a + b) / 2) : (a + b) / 2;
            if (o.bins && !(thr > a && thr <= b) && !(thr >= a && thr < b)) continue;
            const gain = 0.5 * (score(GL, HL) + score(GT - GL, HT - HL) - score(GT, HT)) - gamma;
            if (!best || gain > best.gain) best = { f, thr, gain };
          }
        } else {
          let sT = 0, s2T = 0; for (const i of sorted) { sT += y[i]; s2T += y[i] * y[i]; }
          const parent = imp(sT, s2T, sorted.length);
          let sL = 0, s2L = 0;
          for (let k = 0; k < sorted.length - 1; k++) {
            const v = y[sorted[k]]; sL += v; s2L += v * v;
            const a = X[sorted[k]][f], b = X[sorted[k + 1]][f];
            if (a === b || k + 1 < minLeaf || sorted.length - k - 1 < minLeaf) continue;
            const nL = k + 1, nR = sorted.length - nL;
            const gain = parent - imp(sL, s2L, nL) - imp(sT - sL, s2T - s2L, nR);
            if (!best || gain > best.gain) best = { f, thr: (a + b) / 2, gain };
          }
        }
      }
      if (!best || best.gain <= 1e-12) { leaves++; return node; }
      const L = idx.filter(i => X[i][best.f] <= best.thr), Rr = idx.filter(i => X[i][best.f] > best.thr);
      if (!L.length || !Rr.length) { leaves++; return node; }
      const bl = box.map(r => [...r]), br = box.map(r => [...r]);
      bl[best.f][1] = best.thr; br[best.f][0] = best.thr;
      Object.assign(node, { f: best.f, thr: best.thr, gain: best.gain, left: grow(L, depth + 1, bl), right: grow(Rr, depth + 1, br) });
      return node;
    };
    const idx = o.idx || [...Array(X.length).keys()];
    const box = o.box || Array.from({ length: nf }, () => [-Infinity, Infinity]);
    const tree = grow(idx, 0, box);
    tree.leaves = leaves;
    return tree;
  }
  const snap = (bins, v) => { let best = bins[0]; for (const b of bins) if (Math.abs(b - v) < Math.abs(best - v)) best = b; return best; };
  function treePredict(t, x) { while (t.left) t = x[t.f] <= t.thr ? t.left : t.right; return t.value; }
  function treeLeaves(t, out = []) { if (!t.left) out.push(t); else { treeLeaves(t.left, out); treeLeaves(t.right, out); } return out; }
  function treeSplits(t, out = []) { if (t.left) { out.push(t); treeSplits(t.left, out); treeSplits(t.right, out); } return out; }

  // leaf-wise (best-first) tree with a leaf budget, LightGBM style; gradients with hessian 1
  function buildLeafwise(X, g, o = {}) {
    const maxLeaves = o.maxLeaves ?? 8, minLeaf = o.minLeaf ?? 3, lam = o.lambda ?? 0, bins = o.bins;
    const h = X.map(() => 1);
    const bestSplit = idx => {
      let best = null;
      for (let f = 0; f < X[0].length; f++) {
        const sorted = [...idx].sort((a, b) => X[a][f] - X[b][f]);
        let GT = 0; for (const i of sorted) GT += g[i];
        const HT = sorted.length; let GL = 0;
        for (let k = 0; k < sorted.length - 1; k++) {
          GL += g[sorted[k]];
          const a = X[sorted[k]][f], b = X[sorted[k + 1]][f];
          if (a === b || k + 1 < minLeaf || sorted.length - k - 1 < minLeaf) continue;
          let thr = (a + b) / 2;
          if (bins) { thr = snap(bins[f], thr); if (!(thr >= a && thr < b)) continue; }
          const HL = k + 1;
          const gain = 0.5 * ((GL * GL) / (HL + lam) + sq(GT - GL) / (HT - HL + lam) - (GT * GT) / (HT + lam));
          if (!best || gain > best.gain) best = { f, thr, gain };
        }
      }
      return best;
    };
    const leafV = idx => { let G = 0; for (const i of idx) G += g[i]; return -G / (idx.length + lam); };
    const rootIdx = [...Array(X.length).keys()];
    const rootNode = { idx: rootIdx, value: leafV(rootIdx), depth: 0 };
    const open = [rootNode];
    let leaves = 1;
    const levelWise = o.levelWise;
    while (leaves < maxLeaves) {
      // candidates: leaf-wise picks the best gain anywhere; level-wise only the shallowest depth
      const cands = open.filter(nd => !nd.left && nd.idx.length >= 2 * minLeaf);
      if (!cands.length) break;
      cands.forEach(nd => { if (nd.split === undefined) nd.split = bestSplit(nd.idx); });
      let pool = cands.filter(nd => nd.split && nd.split.gain > 1e-12);
      if (!pool.length) break;
      if (levelWise) { const d = Math.min(...pool.map(nd => nd.depth)); pool = pool.filter(nd => nd.depth === d); }
      pool.sort((a, b) => b.split.gain - a.split.gain);
      const nd = pool[0];
      const L = nd.idx.filter(i => X[i][nd.split.f] <= nd.split.thr), Rr = nd.idx.filter(i => X[i][nd.split.f] > nd.split.thr);
      Object.assign(nd, { f: nd.split.f, thr: nd.split.thr });
      nd.left = { idx: L, value: leafV(L), depth: nd.depth + 1 }; nd.right = { idx: Rr, value: leafV(Rr), depth: nd.depth + 1 };
      open.push(nd.left, nd.right); leaves++;
    }
    rootNode.leaves = leaves;
    return rootNode;
  }

  // oblivious (symmetric) tree: one split per level shared by every node, CatBoost style
  function buildOblivious(X, g, o = {}) {
    const depth = o.depth ?? 3, lam = o.lambda ?? 1, n = X.length;
    const splits = [];
    let codes = new Array(n).fill(0);
    for (let d = 0; d < depth; d++) {
      let best = null;
      for (let f = 0; f < X[0].length; f++) {
        const vals = [...new Set(X.map(x => x[f]))].sort((a, b) => a - b);
        const cand = []; for (let k = 0; k < vals.length - 1; k += Math.max(1, Math.floor(vals.length / 48))) cand.push((vals[k] + vals[k + 1]) / 2);
        for (const thr of cand) {
          const G = {}, H = {};
          for (let i = 0; i < n; i++) { const c = codes[i] * 2 + (X[i][f] > thr ? 1 : 0); G[c] = (G[c] || 0) + g[i]; H[c] = (H[c] || 0) + 1; }
          let s = 0; for (const c in G) s += (G[c] * G[c]) / (H[c] + lam);
          if (!best || s > best.s) best = { f, thr, s };
        }
      }
      if (!best) break;
      splits.push(best);
      codes = codes.map((c, i) => c * 2 + (X[i][best.f] > best.thr ? 1 : 0));
    }
    const G = {}, H = {};
    for (let i = 0; i < n; i++) { G[codes[i]] = (G[codes[i]] || 0) + g[i]; H[codes[i]] = (H[codes[i]] || 0) + 1; }
    const vals = {}; for (const c in G) vals[c] = -G[c] / (H[c] + lam);
    const code = x => splits.reduce((c, s) => c * 2 + (x[s.f] > s.thr ? 1 : 0), 0);
    return { splits, predict: x => vals[code(x)] || 0, leaves: Object.keys(vals).length };
  }

  // ------------------------------------------------------------ ensembles
  function forest(X, y, o) {
    const R = o.rng, trees = [];
    for (let b = 0; b < o.n; b++) {
      const idx = X.map(() => R.int(X.length));
      trees.push(buildTree(X, y, { idx, maxDepth: o.maxDepth, minLeaf: o.minLeaf || 1, criterion: o.criterion, maxFeatures: o.maxFeatures, rng: R }));
    }
    return { trees, predict: x => mean(trees.map(t => treePredict(t, x))) };
  }

  // gradient boosting: loss 'mse' (regression) or 'log' (binary classification)
  function boost(X, y, o) {
    const n = X.length, lr = o.lr ?? 0.1, loss = o.loss || 'mse';
    const base = loss === 'log' ? Math.log((mean(y) + 1e-6) / (1 - mean(y) + 1e-6)) : mean(y);
    const F = new Array(n).fill(base), stages = [];
    const history = [];
    for (let m = 0; m < o.n; m++) {
      let g, h;
      if (loss === 'log') { const p = F.map(sigmoid); g = p.map((pi, i) => pi - y[i]); h = p.map(pi => Math.max(pi * (1 - pi), 1e-6)); }
      else { g = F.map((f, i) => f - y[i]); h = F.map(() => 1); }
      let tree;
      if (o.kind === 'leafwise') tree = buildLeafwise(X, g, { maxLeaves: o.maxLeaves, minLeaf: o.minLeaf ?? 3, lambda: o.lambda ?? 0, bins: o.bins, levelWise: o.levelWise });
      else if (o.kind === 'oblivious') tree = buildOblivious(X, g, { depth: o.maxDepth, lambda: o.lambda ?? 1 });
      else tree = buildTree(X, y, { g, h, maxDepth: o.maxDepth ?? 2, minLeaf: o.minLeaf ?? 2, lambda: o.lambda ?? (loss === 'log' ? 1 : 0), gamma: o.gamma ?? 0, bins: o.bins });
      const pred = o.kind === 'oblivious' ? tree.predict : x => treePredict(tree, x);
      for (let i = 0; i < n; i++) F[i] += lr * pred(X[i]);
      stages.push({ tree, pred });
      history.push(F.slice());
    }
    const raw = (x, upto = stages.length) => { let s = base; for (let m = 0; m < upto; m++) s += lr * stages[m].pred(x); return s; };
    return { base, stages, history, raw, predict: (x, upto) => (loss === 'log' ? sigmoid(raw(x, upto)) : raw(x, upto)) };
  }

  function adaboost(X, y, nRounds) {
    const n = X.length, ys = y.map(v => (v ? 1 : -1));
    let w = new Array(n).fill(1 / n);
    const stumps = [], weights = [w.slice()];
    for (let m = 0; m < nRounds; m++) {
      let best = null;
      for (let f = 0; f < 2; f++) {
        const vals = [...new Set(X.map(x => x[f]))].sort((a, b) => a - b);
        for (let k = 0; k < vals.length - 1; k++) {
          const thr = (vals[k] + vals[k + 1]) / 2;
          for (const pol of [1, -1]) {
            let err = 0;
            for (let i = 0; i < n; i++) { const pred = (X[i][f] > thr ? 1 : -1) * pol; if (pred !== ys[i]) err += w[i]; }
            if (!best || err < best.err) best = { f, thr, pol, err };
          }
        }
      }
      const err = Math.min(Math.max(best.err, 1e-10), 1 - 1e-10);
      best.alpha = 0.5 * Math.log((1 - err) / err);
      stumps.push(best);
      let z = 0;
      w = w.map((wi, i) => { const pred = (X[i][best.f] > best.thr ? 1 : -1) * best.pol; const nw = wi * Math.exp(-best.alpha * ys[i] * pred); z += nw; return nw; });
      w = w.map(v => v / z);
      weights.push(w.slice());
    }
    const score = (x, upto = stumps.length) => { let s = 0; for (let m = 0; m < upto; m++) { const st = stumps[m]; s += st.alpha * (x[st.f] > st.thr ? 1 : -1) * st.pol; } return s; };
    return { stumps, weights, score, proba: (x, upto) => sigmoid(2 * score(x, upto)) };
  }

  // ------------------------------------------------------------ SVM (simplified SMO, Platt 1998)
  function svm(X, y, o) {
    const n = X.length, C = o.C ?? 1, tol = 1e-3, ys = y.map(v => (v ? 1 : -1));
    const gamma = o.gamma ?? 1;
    const K = o.kernel === 'rbf' ? (a, b) => Math.exp(-gamma * dist2(a, b)) : (a, b) => a[0] * b[0] + a[1] * b[1];
    const G = X.map(a => X.map(b => K(a, b)));
    const al = new Array(n).fill(0); let b = 0;
    const R = o.rng;
    const f = i => { let s = b; for (let j = 0; j < n; j++) if (al[j]) s += al[j] * ys[j] * G[j][i]; return s; };
    let passes = 0, iter = 0;
    while (passes < 6 && iter < 120) {
      let changed = 0; iter++;
      for (let i = 0; i < n; i++) {
        const Ei = f(i) - ys[i];
        if ((ys[i] * Ei < -tol && al[i] < C) || (ys[i] * Ei > tol && al[i] > 0)) {
          let j = R.int(n - 1); if (j >= i) j++;
          const Ej = f(j) - ys[j];
          const ai = al[i], aj = al[j];
          let L, H;
          if (ys[i] !== ys[j]) { L = Math.max(0, aj - ai); H = Math.min(C, C + aj - ai); } else { L = Math.max(0, ai + aj - C); H = Math.min(C, ai + aj); }
          if (L === H) continue;
          const eta = 2 * G[i][j] - G[i][i] - G[j][j];
          if (eta >= 0) continue;
          let ajn = aj - (ys[j] * (Ei - Ej)) / eta; ajn = Math.min(H, Math.max(L, ajn));
          if (Math.abs(ajn - aj) < 1e-5) continue;
          const ain = ai + ys[i] * ys[j] * (aj - ajn);
          const b1 = b - Ei - ys[i] * (ain - ai) * G[i][i] - ys[j] * (ajn - aj) * G[i][j];
          const b2 = b - Ej - ys[i] * (ain - ai) * G[i][j] - ys[j] * (ajn - aj) * G[j][j];
          b = ain > 0 && ain < C ? b1 : ajn > 0 && ajn < C ? b2 : (b1 + b2) / 2;
          al[i] = ain; al[j] = ajn; changed++;
        }
      }
      passes = changed ? 0 : passes + 1;
    }
    const sv = al.map((a, i) => (a > 1e-6 ? i : -1)).filter(i => i >= 0);
    const decision = x => { let s = b; for (const i of sv) s += al[i] * ys[i] * K(X[i], x); return s; };
    return { decision, sv, alpha: al, b };
  }

  // ------------------------------------------------------------ neural network (dense, tiny, Adam)
  function mlp(sizes, o = {}) {
    const R = o.rng, act = o.act || 'relu';
    const f = act === 'tanh' ? Math.tanh : act === 'sigmoid' ? sigmoid : z => (z > 0 ? z : 0);
    const df = act === 'tanh' ? a => 1 - a * a : act === 'sigmoid' ? a => a * (1 - a) : a => (a > 0 ? 1 : 0);
    const W = [], B = [], mW = [], vW = [], mB = [], vB = [];
    for (let l = 0; l < sizes.length - 1; l++) {
      const s = Math.sqrt(2 / sizes[l]);
      W.push(Array.from({ length: sizes[l + 1] }, () => Array.from({ length: sizes[l] }, () => R.gauss() * s)));
      B.push(new Array(sizes[l + 1]).fill(0));
      mW.push(W[l].map(r => r.map(() => 0))); vW.push(W[l].map(r => r.map(() => 0)));
      mB.push(B[l].map(() => 0)); vB.push(B[l].map(() => 0));
    }
    const out = o.out || 'sigmoid';
    let t = 0;
    const forward = x => {
      const A = [x];
      for (let l = 0; l < W.length; l++) {
        const z = W[l].map((row, j) => dot(row, A[l]) + B[l][j]);
        A.push(l === W.length - 1 ? (out === 'sigmoid' ? z.map(sigmoid) : z) : z.map(f));
      }
      return A;
    };
    const step = (X, y, lr = 0.01, l2 = 1e-4) => {
      const gW = W.map(m => m.map(r => r.map(() => 0))), gB = B.map(b => b.map(() => 0));
      let loss = 0;
      for (let i = 0; i < X.length; i++) {
        const A = forward(X[i]);
        const o_ = A[A.length - 1][0];
        loss += out === 'sigmoid' ? -(y[i] * Math.log(o_ + 1e-9) + (1 - y[i]) * Math.log(1 - o_ + 1e-9)) : 0.5 * sq(o_ - y[i]);
        let delta = [o_ - y[i]];
        for (let l = W.length - 1; l >= 0; l--) {
          for (let j = 0; j < W[l].length; j++) { gB[l][j] += delta[j]; for (let k = 0; k < W[l][j].length; k++) gW[l][j][k] += delta[j] * A[l][k]; }
          if (l > 0) delta = A[l].map((a, k) => df(a) * W[l].reduce((s, row, j) => s + row[k] * delta[j], 0));
        }
      }
      t++;
      const b1 = 0.9, b2 = 0.999, n = X.length;
      for (let l = 0; l < W.length; l++) {
        for (let j = 0; j < W[l].length; j++) {
          for (let k = 0; k < W[l][j].length; k++) {
            const g = gW[l][j][k] / n + l2 * W[l][j][k];
            mW[l][j][k] = b1 * mW[l][j][k] + (1 - b1) * g; vW[l][j][k] = b2 * vW[l][j][k] + (1 - b2) * g * g;
            W[l][j][k] -= lr * (mW[l][j][k] / (1 - Math.pow(b1, t))) / (Math.sqrt(vW[l][j][k] / (1 - Math.pow(b2, t))) + 1e-8);
          }
          const g = gB[l][j] / n;
          mB[l][j] = b1 * mB[l][j] + (1 - b1) * g; vB[l][j] = b2 * vB[l][j] + (1 - b2) * g * g;
          B[l][j] -= lr * (mB[l][j] / (1 - Math.pow(b1, t))) / (Math.sqrt(vB[l][j] / (1 - Math.pow(b2, t))) + 1e-8);
        }
      }
      return loss / n;
    };
    return { forward, step, predict: x => { const A = forward(x); return A[A.length - 1][0]; }, hidden: x => forward(x)[1], W, B };
  }

  // ------------------------------------------------------------ clustering
  function kmeansInit(X, k, R, plus = true) {
    const C = [X[R.int(X.length)].slice()];
    while (C.length < k) {
      if (!plus) { C.push(X[R.int(X.length)].slice()); continue; }
      const d = X.map(x => Math.min(...C.map(c => dist2(x, c))));
      const tot = d.reduce((s, v) => s + v, 0);
      let r = R() * tot, i = 0;
      while (r > d[i] && i < X.length - 1) { r -= d[i]; i++; }
      C.push(X[i].slice());
    }
    return C;
  }
  const assign = (X, C) => X.map(x => { let b = 0, bd = Infinity; C.forEach((c, j) => { const d = dist2(x, c); if (d < bd) { bd = d; b = j; } }); return b; });
  function update(X, lab, C) {
    return C.map((c, j) => { const P = X.filter((_, i) => lab[i] === j); return P.length ? [mean(P.map(p => p[0])), mean(P.map(p => p[1]))] : c; });
  }
  function kmeans(X, k, R, o = {}) {
    let C = o.init || kmeansInit(X, k, R, o.plus !== false), lab = assign(X, C), it = 0;
    for (; it < (o.maxIter || 100); it++) {
      const C2 = update(X, lab, C), lab2 = assign(X, C2);
      const moved = C2.some((c, j) => dist2(c, C[j]) > 1e-12);
      C = C2; lab = lab2;
      if (!moved) break;
    }
    return { C, lab, iters: it + 1, inertia: M.inertia(X, lab, C) };
  }

  function kmedoids(X, k, R) {
    const n = X.length, D = X.map(a => X.map(b => Math.sqrt(dist2(a, b))));
    let med = kmeansInit(X, k, R, true).map(c => X.findIndex(x => x[0] === c[0] && x[1] === c[1]));
    const cost = m => { let s = 0; for (let i = 0; i < n; i++) s += Math.min(...m.map(j => D[i][j])); return s; };
    let best = cost(med), improved = true, guard = 0;
    while (improved && guard++ < 20) {
      improved = false;
      // alternate: within each cluster, pick the point minimising total distance
      const lab = X.map((_, i) => med.reduce((b, j, q) => (D[i][j] < D[i][med[b]] ? q : b), 0));
      const nm = med.map((m, q) => {
        const members = lab.map((l, i) => (l === q ? i : -1)).filter(i => i >= 0);
        let bi = m, bc = Infinity;
        for (const c of members) { let s = 0; for (const i of members) s += D[i][c]; if (s < bc) { bc = s; bi = c; } }
        return bi;
      });
      const c = cost(nm);
      if (c < best - 1e-9) { best = c; med = nm; improved = true; }
    }
    const lab = X.map((_, i) => med.reduce((b, j, q) => (D[i][j] < D[i][med[b]] ? q : b), 0));
    return { medoids: med, lab, cost: best };
  }

  function fcm(X, c, m, R, iters = 80) {
    const n = X.length;
    let U = X.map(() => { const r = Array.from({ length: c }, () => R() + 0.01); const s = r.reduce((a, b) => a + b, 0); return r.map(v => v / s); });
    let C = [];
    for (let it = 0; it < iters; it++) {
      C = Array.from({ length: c }, (_, k) => {
        let sx = 0, sy = 0, sw = 0;
        for (let i = 0; i < n; i++) { const w = Math.pow(U[i][k], m); sx += w * X[i][0]; sy += w * X[i][1]; sw += w; }
        return [sx / sw, sy / sw];
      });
      const e = 2 / (m - 1);
      U = X.map(x => {
        const d = C.map(cc => Math.sqrt(dist2(x, cc)) + 1e-9);
        return d.map(dk => 1 / d.reduce((s, dj) => s + Math.pow(dk / dj, e), 0));
      });
    }
    return { C, U };
  }

  // agglomerative with Lance–Williams updates; returns merge list for a dendrogram
  function agglomerative(X, linkage) {
    const n = X.length;
    const D = X.map(a => X.map(b => Math.sqrt(dist2(a, b))));
    if (linkage === 'ward') for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) D[i][j] = D[i][j] * D[i][j];
    const active = new Set([...Array(n).keys()]), size = new Array(n).fill(1), id = [...Array(n).keys()];
    const merges = [];
    let next = n;
    while (active.size > 1) {
      let bi = -1, bj = -1, bd = Infinity;
      const arr = [...active];
      for (let a = 0; a < arr.length; a++) for (let b = a + 1; b < arr.length; b++) { const d = D[arr[a]][arr[b]]; if (d < bd) { bd = d; bi = arr[a]; bj = arr[b]; } }
      const ni = size[bi], nj = size[bj];
      for (const k of active) {
        if (k === bi || k === bj) continue;
        let d;
        const dik = D[bi][k], djk = D[bj][k], nk = size[k];
        if (linkage === 'single') d = Math.min(dik, djk);
        else if (linkage === 'complete') d = Math.max(dik, djk);
        else if (linkage === 'average') d = (ni * dik + nj * djk) / (ni + nj);
        else d = ((ni + nk) * dik + (nj + nk) * djk - nk * bd) / (ni + nj + nk);
        D[bi][k] = D[k][bi] = d;
      }
      merges.push({ a: id[bi], b: id[bj], h: linkage === 'ward' ? Math.sqrt(Math.max(bd, 0)) : bd, size: ni + nj });
      size[bi] = ni + nj; id[bi] = next++; active.delete(bj);
    }
    return merges;
  }
  function cutMerges(n, merges, k) {
    const parent = [...Array(n + merges.length).keys()];
    const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    merges.slice(0, n - k).forEach((m, t) => { parent[find(m.a)] = n + t; parent[find(m.b)] = n + t; parent[n + t] = n + t; });
    const roots = {}, lab = [];
    for (let i = 0; i < n; i++) { const r = find(i); if (!(r in roots)) roots[r] = Object.keys(roots).length; lab.push(roots[r]); }
    return lab;
  }

  function dbscan(X, eps, minPts) {
    const n = X.length, e2 = eps * eps;
    const nb = X.map(a => X.map((b, j) => (dist2(a, b) <= e2 ? j : -1)).filter(j => j >= 0));
    const core = nb.map(l => l.length >= minPts);
    const lab = new Array(n).fill(-1);
    let c = 0;
    for (let i = 0; i < n; i++) {
      if (lab[i] !== -1 || !core[i]) continue;
      const q = [i]; lab[i] = c;
      while (q.length) {
        const p = q.pop();
        if (!core[p]) continue;
        for (const j of nb[p]) if (lab[j] === -1) { lab[j] = c; q.push(j); }
      }
      c++;
    }
    return { lab, core, k: c };
  }

  function coreDist(X, k) { return X.map(a => X.map(b => Math.sqrt(dist2(a, b))).sort((p, q) => p - q)[Math.min(k, X.length - 1)]); }

  function optics(X, minPts) {
    const n = X.length, D = X.map(a => X.map(b => Math.sqrt(dist2(a, b)))), cd = coreDist(X, minPts - 1);
    const reach = new Array(n).fill(Infinity), done = new Array(n).fill(false), order = [];
    for (let s = 0; s < n; s++) {
      if (done[s]) continue;
      let cur = s;
      while (cur !== -1) {
        done[cur] = true; order.push(cur);
        for (let j = 0; j < n; j++) if (!done[j]) reach[j] = Math.min(reach[j], Math.max(cd[cur], D[cur][j]));
        let nx = -1, best = Infinity;
        for (let j = 0; j < n; j++) if (!done[j] && reach[j] < best) { best = reach[j]; nx = j; }
        cur = nx;
      }
    }
    return { order, reach, core: cd };
  }
  function opticsCut(op, eps, minSize = 4) {
    const lab = new Array(op.order.length).fill(-1); let c = -1, run = [];
    const flush = () => { if (run.length >= minSize) { c++; run.forEach(i => { lab[i] = c; }); } run = []; };
    op.order.forEach(i => {
      if (op.reach[i] > eps) { flush(); if (op.core[i] <= eps) run.push(i); }
      else run.push(i);
    });
    flush();
    return lab;
  }

  // HDBSCAN: mutual-reachability MST -> condensed tree -> excess-of-mass selection
  function hdbscan(X, minSize, minSamples) {
    const n = X.length, cd = coreDist(X, (minSamples || minSize) - 1);
    const D = (i, j) => Math.max(cd[i], cd[j], Math.sqrt(dist2(X[i], X[j])));
    // Prim's MST
    const inT = new Array(n).fill(false), best = new Array(n).fill(Infinity), from = new Array(n).fill(-1), edges = [];
    best[0] = 0;
    for (let it = 0; it < n; it++) {
      let u = -1; for (let i = 0; i < n; i++) if (!inT[i] && (u < 0 || best[i] < best[u])) u = i;
      inT[u] = true; if (from[u] >= 0) edges.push([from[u], u, best[u]]);
      for (let v = 0; v < n; v++) if (!inT[v]) { const d = D(u, v); if (d < best[v]) { best[v] = d; from[v] = u; } }
    }
    edges.sort((a, b) => a[2] - b[2]);
    // single-linkage tree
    const parent = [], kids = [], lambdaOf = [], sizeOf = [];
    const uf = [...Array(2 * n).keys()], find = i => (uf[i] === i ? i : (uf[i] = find(uf[i])));
    for (let i = 0; i < n; i++) sizeOf[i] = 1;
    let next = n;
    for (const [a, b, d] of edges) {
      const ra = find(a), rb = find(b);
      uf[ra] = next; uf[rb] = next; uf[next] = next;
      kids[next] = [ra, rb]; lambdaOf[next] = d > 0 ? 1 / d : 1e9; sizeOf[next] = sizeOf[ra] + sizeOf[rb];
      parent[ra] = next; parent[rb] = next; next++;
    }
    const rootId = next - 1;
    // condense: walk down; a split counts only if both sides >= minSize
    const clusters = [];   // {id, parent, birth, stability, points:[], children:[]}
    const pointsOf = node => { const out = []; const st = [node]; while (st.length) { const x = st.pop(); if (x < n) out.push(x); else st.push(...kids[x]); } return out; };
    const condense = (node, cid, birthLambda) => {
      const C = clusters[cid];
      const st = [node];
      while (st.length) {
        const x = st.pop();
        if (x < n) { C.fall.push([x, Math.max(birthLambda, C.birth)]); continue; }
        const [a, b] = kids[x], lam = lambdaOf[x];
        const sa = sizeOf[a], sb = sizeOf[b];
        if (sa >= minSize && sb >= minSize) {
          for (const ch of [a, b]) { const id = clusters.length; clusters.push({ parent: cid, birth: lam, fall: [], children: [] }); C.children.push(id); C.death = lam; condense(ch, id, lam); }
        } else {
          for (const [ch, s] of [[a, sa], [b, sb]]) {
            if (s >= minSize) st.push(ch);
            else for (const p of pointsOf(ch)) C.fall.push([p, lam]);
          }
        }
      }
    };
    clusters.push({ parent: -1, birth: 0, fall: [], children: [] });
    condense(rootId, 0, 0);
    // stability = sum over points (lambda_p - birth) for points falling out, plus children's mass at split
    clusters.forEach(C => {
      let s = C.fall.reduce((acc, [, l]) => acc + (Math.min(l, 1e6) - C.birth), 0);
      if (C.children.length) { const size = C.children.reduce((a, id) => a + countPts(id), 0); s += size * (C.death - C.birth); }
      C.stab = s;
    });
    function countPts(id) { const C = clusters[id]; return C.fall.length + C.children.reduce((a, c) => a + countPts(c), 0); }
    // excess of mass selection (bottom-up)
    const selected = new Set();
    const pick = id => {
      const C = clusters[id];
      if (!C.children.length) { selected.add(id); return C.stab; }
      const childSum = C.children.reduce((a, c) => a + pick(c), 0);
      if (id !== 0 && C.stab >= childSum) {
        const drop = cid => { selected.delete(cid); clusters[cid].children.forEach(drop); };
        C.children.forEach(drop); selected.add(id); return C.stab;
      }
      return childSum;
    };
    pick(0);
    if (selected.has(0) && clusters.length > 1) selected.delete(0);
    const lab = new Array(n).fill(-1), prob = new Array(n).fill(0);
    let k = 0;
    for (const id of selected) {
      const all = []; const st = [id];
      while (st.length) { const c = clusters[st.pop()]; all.push(...c.fall); st.push(...c.children); }
      const lmax = Math.max(...all.map(([, l]) => Math.min(l, 1e6)), 1e-9);
      for (const [p, l] of all) { lab[p] = k; prob[p] = Math.min(l, 1e6) / lmax; }
      k++;
    }
    return { lab, prob, k };
  }

  function meanShiftStep(P, X, bw) {
    return P.map(p => {
      let sx = 0, sy = 0, sw = 0;
      for (const x of X) { const w = Math.exp(-dist2(p, x) / (2 * bw * bw)); sx += w * x[0]; sy += w * x[1]; sw += w; }
      return [sx / sw, sy / sw];
    });
  }

  function gmmInit(X, k, R) {
    const km = kmeans(X, k, R);
    return km.C.map((c, j) => { const P = X.filter((_, i) => km.lab[i] === j); const mc = P.length > 2 ? meanCov(P) : { C: [[0.05, 0], [0, 0.05]] }; return { mu: c, C: mc.C, pi: Math.max(P.length, 1) / X.length }; });
  }
  function gmmStep(X, comps, type = 'full') {
    const n = X.length, K = comps.length;
    const resp = X.map(x => { const p = comps.map(c => c.pi * gauss2(x, c.mu, c.C)); const s = p.reduce((a, b) => a + b, 0) || 1e-300; return p.map(v => v / s); });
    let ll = 0; X.forEach(x => { ll += Math.log(comps.reduce((a, c) => a + c.pi * gauss2(x, c.mu, c.C), 0) + 1e-300); });
    const out = comps.map((_, k) => {
      const w = resp.map(r => r[k]); const mc = meanCov(X, w);
      let C = mc.C;
      if (type === 'diag') C = [[C[0][0], 0], [0, C[1][1]]];
      if (type === 'spherical') { const v = (C[0][0] + C[1][1]) / 2; C = [[v, 0], [0, v]]; }
      C = [[C[0][0] + 1e-4, C[0][1]], [C[1][0], C[1][1] + 1e-4]];
      return { mu: mc.mu, C, pi: mc.n / n };
    });
    if (type === 'tied') {
      const T = [[0, 0], [0, 0]];
      out.forEach(c => { for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) T[a][b] += c.pi * c.C[a][b]; });
      out.forEach(c => { c.C = T.map(r => r.slice()); });
    }
    return { comps: out, resp, ll: ll / n, K };
  }

  // symmetric eigendecomposition (cyclic Jacobi); fine for the ~150-point labs
  function eigSym(Ain) {
    const n = Ain.length, A = Ain.map(r => r.slice()), V = LA.eye(n);
    for (let sweep = 0; sweep < 30; sweep++) {
      let off = 0;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
      if (off < 1e-18) break;
      for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
        const apq = A[p][q];
        if (Math.abs(apq) < 1e-15) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = A[k][p], akq = A[k][q];
          A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k], aqk = A[q][k];
          A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p], vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq;
        }
      }
    }
    const vals = A.map((r, i) => r[i]);
    const order = vals.map((v, i) => i).sort((a, b) => vals[b] - vals[a]);
    return { vals: order.map(i => vals[i]), vecs: order.map(i => V.map(r => r[i])) };
  }

  // spectral embedding from the top eigenvectors of D^-1/2 W D^-1/2
  function spectral(X, k, gamma, R) {
    const n = X.length;
    const W = X.map((a, i) => X.map((b, j) => (i === j ? 0 : Math.exp(-gamma * dist2(a, b)))));
    const d = W.map(r => r.reduce((s, v) => s + v, 0) + 1e-12);
    const A = W.map((r, i) => r.map((v, j) => v / Math.sqrt(d[i] * d[j])));
    const eg = eigSym(A);
    const V = X.map((_, i) => eg.vecs.slice(0, k + 1).map(v => v[i]));
    // first k eigenvectors (the very first is ∝ sqrt(d)); normalise rows
    let E = V.map(r => r.slice(0, k));
    E = E.map(r => { const s = Math.sqrt(r.reduce((a, v) => a + v * v, 0)) || 1; return r.map(v => v / s); });
    const km = kmeansND(E, k, R);
    return { lab: km.lab, embed: V.map(r => [r[1], r[2] !== undefined ? r[2] : 0]), eig: eg.vals.slice(0, 6) };
  }
  function kmeansND(P, k, R) {
    let best = null;
    for (let t = 0; t < 6; t++) {
      let C = [P[R.int(P.length)].slice()];
      while (C.length < k) { const d = P.map(p => Math.min(...C.map(c => dist2(p, c)))); const tot = d.reduce((a, b) => a + b, 0); let r = R() * tot, i = 0; while (r > d[i] && i < P.length - 1) { r -= d[i]; i++; } C.push(P[i].slice()); }
      let lab;
      for (let it = 0; it < 60; it++) {
        lab = P.map(p => { let b = 0, bd = Infinity; C.forEach((c, j) => { const dd = dist2(p, c); if (dd < bd) { bd = dd; b = j; } }); return b; });
        C = C.map((c, j) => { const S = P.filter((_, i) => lab[i] === j); return S.length ? c.map((_, q) => mean(S.map(s => s[q]))) : c; });
      }
      const inertia = P.reduce((s, p, i) => s + dist2(p, C[lab[i]]), 0);
      if (!best || inertia < best.inertia) best = { lab, inertia };
    }
    return best;
  }

  function affinityProp(X, prefScale, damping, iters = 200) {
    const n = X.length, S = X.map(a => X.map(b => -dist2(a, b)));
    const off = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) off.push(S[i][j]);
    off.sort((a, b) => a - b);
    const med = off[Math.floor(off.length / 2)], mn = off[0];
    const pref = med + (mn - med) * prefScale;
    for (let i = 0; i < n; i++) S[i][i] = pref;
    const Rm = X.map(() => new Array(n).fill(0)), Am = X.map(() => new Array(n).fill(0));
    let ex = [], stable = 0, last = '';
    for (let it = 0; it < iters; it++) {
      for (let i = 0; i < n; i++) {
        let m1 = -Infinity, m2 = -Infinity, arg = -1;
        for (let k = 0; k < n; k++) { const v = Am[i][k] + S[i][k]; if (v > m1) { m2 = m1; m1 = v; arg = k; } else if (v > m2) m2 = v; }
        for (let k = 0; k < n; k++) { const r = S[i][k] - (k === arg ? m2 : m1); Rm[i][k] = damping * Rm[i][k] + (1 - damping) * r; }
      }
      for (let k = 0; k < n; k++) {
        let sp = 0; for (let i = 0; i < n; i++) if (i !== k) sp += Math.max(0, Rm[i][k]);
        for (let i = 0; i < n; i++) {
          const a = i === k ? sp : Math.min(0, Rm[k][k] + sp - Math.max(0, Rm[i][k]));
          Am[i][k] = damping * Am[i][k] + (1 - damping) * a;
        }
      }
      ex = []; for (let k = 0; k < n; k++) if (Rm[k][k] + Am[k][k] > 0) ex.push(k);
      const key = ex.join(','); if (key === last) stable++; else { stable = 0; last = key; }
      if (stable > 15 && ex.length) break;
    }
    if (!ex.length) ex = [0];
    const lab = X.map((_, i) => { let b = 0, bv = -Infinity; ex.forEach((k, q) => { if (S[i][k] > bv || i === k) { bv = i === k ? Infinity : S[i][k]; b = q; } }); return b; });
    return { ex, lab };
  }

  function birch(X, threshold) {
    const cf = [];
    for (const x of X) {
      let best = -1, bd = Infinity;
      cf.forEach((c, j) => { const d = dist2(x, [c.ls[0] / c.n, c.ls[1] / c.n]); if (d < bd) { bd = d; best = j; } });
      if (best >= 0) {
        const c = cf[best];
        const n = c.n + 1, ls = [c.ls[0] + x[0], c.ls[1] + x[1]], ss = c.ss + x[0] * x[0] + x[1] * x[1];
        const mu = [ls[0] / n, ls[1] / n];
        const rad = Math.sqrt(Math.max(0, ss / n - (mu[0] * mu[0] + mu[1] * mu[1])));
        if (rad <= threshold) { c.n = n; c.ls = ls; c.ss = ss; continue; }
      }
      cf.push({ n: 1, ls: [x[0], x[1]], ss: x[0] * x[0] + x[1] * x[1] });
    }
    return cf.map(c => { const mu = [c.ls[0] / c.n, c.ls[1] / c.n]; return { mu, n: c.n, r: Math.sqrt(Math.max(0, c.ss / c.n - (mu[0] * mu[0] + mu[1] * mu[1]))) }; });
  }

  // ------------------------------------------------------------ Gaussian process
  function gp(xs, ys, o) {
    const ell = o.ell, sf = o.sf ?? 1, sn = o.sn ?? 0.1;
    const k = (a, b) => sf * sf * Math.exp(-sq(a - b) / (2 * ell * ell));
    const n = xs.length;
    if (!n) return { mean: () => 0, sd: () => sf, sample: () => () => 0 };
    const K = xs.map(a => xs.map(b => k(a, b)));
    for (let i = 0; i < n; i++) K[i][i] += sn * sn + 1e-8;
    const L = LA.cholesky(K), alpha = LA.cholSolve(L, ys);
    const mean_ = x => xs.reduce((s, xi, i) => s + k(x, xi) * alpha[i], 0);
    const sd = x => {
      const ks = xs.map(xi => k(x, xi));
      const v = new Array(n); for (let i = 0; i < n; i++) { let s = ks[i]; for (let j = 0; j < i; j++) s -= L[i][j] * v[j]; v[i] = s / L[i][i]; }
      return Math.sqrt(Math.max(1e-12, sf * sf - v.reduce((s, t) => s + t * t, 0)));
    };
    return { mean: mean_, sd, k, L, alpha };
  }
  // joint posterior samples on a grid (for drawing function samples)
  function gpSamples(model, xs, ys, grid, o, R, count) {
    const k = model.k || ((a, b) => (o.sf ?? 1) ** 2 * Math.exp(-sq(a - b) / (2 * o.ell * o.ell)));
    const n = xs.length, m = grid.length;
    let mu, C;
    if (!n) { mu = grid.map(() => 0); C = grid.map(a => grid.map(b => k(a, b))); }
    else {
      const Ks = grid.map(g => xs.map(x => k(g, x)));
      mu = Ks.map(r => r.reduce((s, v, i) => s + v * model.alpha[i], 0));
      const V = Ks.map(r => { const v = new Array(n); for (let i = 0; i < n; i++) { let s = r[i]; for (let j = 0; j < i; j++) s -= model.L[i][j] * v[j]; v[i] = s / model.L[i][i]; } return v; });
      C = grid.map((a, i) => grid.map((b, j) => k(a, b) - V[i].reduce((s, t, q) => s + t * V[j][q], 0)));
    }
    for (let i = 0; i < m; i++) C[i][i] += 1e-6;
    const L = LA.cholesky(C);
    return Array.from({ length: count }, () => { const z = grid.map(() => R.gauss()); return mu.map((v, i) => v + L[i].reduce((s, l, j) => s + (j <= i ? l * z[j] : 0), 0)); });
  }

  root.Algo = {
    sigmoid, dist2, mean, LA, meanCov, gauss2, M, polyFeat, polyBasis, ridgeFit, enetFit, logisticFit, discriminant, knn,
    buildTree, treePredict, treeLeaves, treeSplits, buildLeafwise, buildOblivious, forest, boost, adaboost, svm, mlp,
    kmeansInit, assign, update, kmeans, kmedoids, fcm, agglomerative, cutMerges, dbscan, optics, opticsCut, hdbscan,
    meanShiftStep, gmmInit, gmmStep, spectral, eigSym, affinityProp, birch, gp, gpSamples, quad2,
  };
})(window);

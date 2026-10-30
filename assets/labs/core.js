// Lab core: canvas plots, seeded datasets and the control panel every lab is built from.
// No dependencies. Colours come from the page's CSS tokens so labs match the site.
(function (root) {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- theme
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const hexToRgb = h => {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const T = {};
  function loadTheme() {
    T.violet = css('--violet') || '#8c7cff';
    T.violet2 = css('--violet-2') || '#b3abff';
    T.cyan = css('--cyan') || '#56d9ff';
    T.green = css('--green') || '#74df9b';
    T.pink = css('--pink') || '#ff8fb1';
    T.amber = css('--amber') || '#ffc56b';
    T.ink = css('--ink') || '#f5f5f7';
    T.soft = css('--soft') || '#c9c9d1';
    T.muted = css('--muted') || '#9a9aa5';
    T.dim = css('--dim') || '#75757f';
    T.mono = css('--mono') || 'ui-monospace, monospace';
    T.cls = [T.violet, T.cyan];
    T.pal = [T.violet, T.cyan, T.green, T.pink, T.amber, '#7aa2ff', '#e6a3ff', '#6cf0d2', '#ffd9a0', '#9ad0ff'];
    T.rgb = c => hexToRgb(c);
  }
  loadTheme();
  const alpha = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

  // ---------------------------------------------------------------- random
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    const next = () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.gauss = () => { let u = 0, v = 0; while (u === 0) u = next(); while (v === 0) v = next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    next.int = n => Math.floor(next() * n);
    next.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    return next;
  }

  // ---------------------------------------------------------------- datasets
  // 2-D data lives in roughly x ∈ [-1.25, 1.25], y ∈ [-0.95, 0.95].
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fit2d = (X) => X.map(([x, y]) => [clamp(x, -1.3, 1.3), clamp(y, -0.98, 0.98)]);

  const cls2d = {
    blobs(n, R, o = {}) {
      const X = [], y = [], s = o.spread || 0.28;
      for (let i = 0; i < n; i++) { const c = i % 2; X.push([(c ? 0.45 : -0.45) + R.gauss() * s, (c ? -0.15 : 0.15) + R.gauss() * s]); y.push(c); }
      return { X: fit2d(X), y };
    },
    separable(n, R) {
      const X = [], y = [];
      while (X.length < n) {
        const p = [R() * 2.4 - 1.2, R() * 1.8 - 0.9];
        const d = p[0] * 0.6 + p[1] * 0.8 - 0.05;
        if (Math.abs(d) < 0.12) continue;
        X.push(p); y.push(d > 0 ? 1 : 0);
      }
      return { X, y };
    },
    moons(n, R, o = {}) {
      const X = [], y = [], nz = o.noise ?? 0.1;
      for (let i = 0; i < n; i++) {
        const c = i % 2, t = R() * Math.PI;
        const x = c ? 1 - Math.cos(t) : Math.cos(t), yy = c ? 0.5 - Math.sin(t) : Math.sin(t);
        X.push([(x - 0.5) * 0.85 + R.gauss() * nz, (yy - 0.25) * 0.95 + R.gauss() * nz]); y.push(c);
      }
      return { X: fit2d(X), y };
    },
    circles(n, R, o = {}) {
      const X = [], y = [], nz = o.noise ?? 0.07;
      for (let i = 0; i < n; i++) {
        const c = i % 2, t = R() * 2 * Math.PI, rad = c ? 0.32 : 0.8;
        X.push([Math.cos(t) * rad + R.gauss() * nz, Math.sin(t) * rad * 0.95 + R.gauss() * nz]); y.push(c);
      }
      return { X: fit2d(X), y };
    },
    xor(n, R) {
      const X = [], y = [];
      for (let i = 0; i < n; i++) {
        const a = R() * 2.2 - 1.1, b = R() * 1.7 - 0.85;
        X.push([a + R.gauss() * 0.05, b + R.gauss() * 0.05]); y.push((a > 0) !== (b > 0) ? 1 : 0);
      }
      return { X: fit2d(X), y };
    },
    spiral(n, R) {
      const X = [], y = [];
      for (let i = 0; i < n; i++) {
        const c = i % 2, t = 0.25 + R() * 1.05;
        const ang = t * 2.4 * Math.PI + c * Math.PI;
        X.push([Math.cos(ang) * t * 0.85 + R.gauss() * 0.035, Math.sin(ang) * t * 0.72 + R.gauss() * 0.035]); y.push(c);
      }
      return { X: fit2d(X), y };
    },
    spreads(n, R) {
      const X = [], y = [];
      for (let i = 0; i < n; i++) {
        const c = i % 2;
        if (c) X.push([0.15 + R.gauss() * 0.16, R.gauss() * 0.14]);
        else X.push([-0.05 + R.gauss() * 0.55, R.gauss() * 0.42]);
        y.push(c);
      }
      return { X: fit2d(X), y };
    },
    correlated(n, R) {
      const X = [], y = [];
      for (let i = 0; i < n; i++) {
        const c = i % 2, a = R.gauss() * 0.5, b = R.gauss() * 0.11;
        X.push([a * 0.8 - b * 0.6 + (c ? 0.18 : -0.18), a * 0.6 + b * 0.8 + (c ? -0.24 : 0.24)]); y.push(c);
      }
      return { X: fit2d(X), y };
    },
    diagonal(n, R) {
      const X = [], y = [];
      for (let i = 0; i < n; i++) { const p = [R() * 2.4 - 1.2, R() * 1.8 - 0.9]; X.push(p); y.push(p[1] > p[0] * 0.75 + R.gauss() * 0.08 ? 1 : 0); }
      return { X, y };
    },
  };
  const clsNames = { blobs: 'Blobs', separable: 'Separable', moons: 'Moons', circles: 'Circles', xor: 'XOR', spiral: 'Spiral', spreads: 'Different spreads', correlated: 'Correlated', diagonal: 'Diagonal' };

  function flipLabels(y, frac, R) { return y.map(v => (R() < frac ? 1 - v : v)); }

  const clu2d = {
    blobs(n, R, o = {}) {
      const k = o.k || 4;
      const C = [[-0.75, 0.45], [0.7, 0.5], [0.1, -0.5], [-0.8, -0.45], [0.85, -0.4], [0.05, 0.6]].slice(0, k);
      const X = [];
      for (let i = 0; i < n; i++) { const c = C[i % k]; X.push([c[0] + R.gauss() * 0.17, c[1] + R.gauss() * 0.15]); }
      return fit2d(X);
    },
    moons(n, R) { return cls2d.moons(n, R, { noise: 0.06 }).X; },
    circles(n, R) { return cls2d.circles(n, R, { noise: 0.05 }).X; },
    density(n, R) {
      const X = [];
      for (let i = 0; i < n; i++) {
        const c = i % 3;
        if (c === 0) X.push([-0.7 + R.gauss() * 0.07, 0.35 + R.gauss() * 0.07]);
        else if (c === 1) X.push([0.45 + R.gauss() * 0.3, 0.2 + R.gauss() * 0.28]);
        else X.push([-0.45 + R.gauss() * 0.14, -0.55 + R.gauss() * 0.12]);
      }
      return fit2d(X);
    },
    elongated(n, R) {
      const X = [];
      for (let i = 0; i < n; i++) {
        const c = i % 3, a = R.gauss() * 0.42, b = R.gauss() * 0.07;
        const ang = [0.6, -0.5, 0.05][c], cx = [-0.5, 0.55, 0.05][c], cy = [0.1, 0.25, -0.6][c];
        X.push([cx + a * Math.cos(ang) - b * Math.sin(ang), cy + a * Math.sin(ang) + b * Math.cos(ang)]);
      }
      return fit2d(X);
    },
    noisy(n, R) {
      const X = clu2d.blobs(Math.round(n * 0.85), R, { k: 3 });
      for (let i = X.length; i < n; i++) X.push([R() * 2.5 - 1.25, R() * 1.85 - 0.92]);
      return X;
    },
  };
  const cluNames = { blobs: 'Blobs', moons: 'Moons', circles: 'Circles', density: 'Varied density', elongated: 'Elongated', noisy: 'Blobs + noise' };

  // 1-D regression: x ∈ [-1, 1]
  const reg1d = {
    sine(n, R, o = {}) { const nz = o.noise ?? 0.22; return Array.from({ length: n }, () => { const x = R() * 2 - 1; return [x, Math.sin(x * 3.1) + R.gauss() * nz]; }); },
    linear(n, R, o = {}) { const nz = o.noise ?? 0.25; return Array.from({ length: n }, () => { const x = R() * 2 - 1; return [x, 0.9 * x + 0.1 + R.gauss() * nz]; }); },
    cubic(n, R, o = {}) { const nz = o.noise ?? 0.15; return Array.from({ length: n }, () => { const x = R() * 2 - 1; return [x, 1.4 * x * x * x - 0.6 * x + R.gauss() * nz]; }); },
    step(n, R, o = {}) { const nz = o.noise ?? 0.15; return Array.from({ length: n }, () => { const x = R() * 2 - 1; return [x, (x < -0.35 ? -0.7 : x < 0.3 ? 0.4 : -0.1) + 0.6 * x + R.gauss() * nz]; }); },
    wiggle(n, R, o = {}) { const nz = o.noise ?? 0.12; return Array.from({ length: n }, () => { const x = R() * 2 - 1; return [x, Math.sin(x * 5) * 0.6 + 0.4 * x + R.gauss() * nz]; }); },
  };
  const regNames = { sine: 'Sine', linear: 'Linear', cubic: 'Cubic', step: 'Steps', wiggle: 'Wiggly' };

  function split(n, frac, R) {
    const idx = R.shuffle([...Array(n).keys()]);
    const cut = Math.round(n * (1 - frac));
    return { train: idx.slice(0, cut), test: idx.slice(cut) };
  }

  // ---------------------------------------------------------------- plot
  class Plot {
    constructor(host, o = {}) {
      this.host = host;
      this.o = Object.assign({ x: [-1, 1], y: [-1, 1], pad: [14, 14, 14, 14], equal: false }, o);
      this.cv = document.createElement('canvas');
      host.appendChild(this.cv);
      this.ctx = this.cv.getContext('2d');
      this.off = document.createElement('canvas');
      this.render = () => {};
      this._queued = false;
      this.W = 0; this.H = 0;
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(host);
      this.resize();
      this._bindPointer();
    }
    resize() {
      const r = this.host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr; this.W = r.width; this.H = r.height;
      this.cv.width = Math.round(r.width * dpr); this.cv.height = Math.round(r.height * dpr);
      this.cv.style.width = r.width + 'px'; this.cv.style.height = r.height + 'px';
      this._range();
      this.request();
    }
    setRange(x, y) { this.o.x = x; this.o.y = y; this._range(); }
    _range() {
      let [x0, x1] = this.o.x, [y0, y1] = this.o.y;
      const [pt, pr, pb, pl] = this.o.pad;
      const w = this.W - pl - pr, h = this.H - pt - pb;
      if (this.o.equal && w > 0 && h > 0) {
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        const sx = (x1 - x0) / w, sy = (y1 - y0) / h, s = Math.max(sx, sy);
        x0 = cx - (w * s) / 2; x1 = cx + (w * s) / 2; y0 = cy - (h * s) / 2; y1 = cy + (h * s) / 2;
      }
      this.r = { x0, x1, y0, y1, pl, pt, w, h };
    }
    sx(x) { const r = this.r; return r.pl + ((x - r.x0) / (r.x1 - r.x0)) * r.w; }
    sy(y) { const r = this.r; return r.pt + (1 - (y - r.y0) / (r.y1 - r.y0)) * r.h; }
    ix(px) { const r = this.r; return r.x0 + ((px - r.pl) / r.w) * (r.x1 - r.x0); }
    iy(py) { const r = this.r; return r.y0 + (1 - (py - r.pt) / r.h) * (r.y1 - r.y0); }
    get range() { return this.r; }
    request() {
      if (this._queued) return;
      this._queued = true;
      requestAnimationFrame(() => { this._queued = false; if (!this.W) return; this.begin(); this.render(this); });
    }
    now() { if (!this.W) return; this.begin(); this.render(this); }
    begin() {
      const c = this.ctx;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, this.W, this.H);
      c.lineJoin = 'round'; c.lineCap = 'round';
    }
    grid(o = {}) {
      const c = this.ctx, r = this.r;
      c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 1;
      const step = o.step || niceStep((r.x1 - r.x0) / 6);
      c.beginPath();
      for (let x = Math.ceil(r.x0 / step) * step; x <= r.x1; x += step) { const px = Math.round(this.sx(x)) + 0.5; c.moveTo(px, r.pt); c.lineTo(px, r.pt + r.h); }
      const stepY = o.stepY || niceStep((r.y1 - r.y0) / 5);
      for (let y = Math.ceil(r.y0 / stepY) * stepY; y <= r.y1; y += stepY) { const py = Math.round(this.sy(y)) + 0.5; c.moveTo(r.pl, py); c.lineTo(r.pl + r.w, py); }
      c.stroke();
      if (o.axes) {
        c.strokeStyle = 'rgba(255,255,255,0.16)'; c.beginPath();
        if (r.y0 < 0 && r.y1 > 0) { const py = Math.round(this.sy(0)) + 0.5; c.moveTo(r.pl, py); c.lineTo(r.pl + r.w, py); }
        if (r.x0 < 0 && r.x1 > 0) { const px = Math.round(this.sx(0)) + 0.5; c.moveTo(px, r.pt); c.lineTo(px, r.pt + r.h); }
        c.stroke();
      }
      if (o.labels) {
        c.fillStyle = T.dim; c.font = `10px ${T.mono}`; c.textAlign = 'center'; c.textBaseline = 'top';
        for (let x = Math.ceil(r.x0 / step) * step; x <= r.x1 + 1e-9; x += step) c.fillText(fmtTick(x), this.sx(x), r.pt + r.h + 4);
        c.textAlign = 'right'; c.textBaseline = 'middle';
        for (let y = Math.ceil(r.y0 / stepY) * stepY; y <= r.y1 + 1e-9; y += stepY) c.fillText(fmtTick(y), r.pl - 5, this.sy(y));
      }
    }
    // fn(x, y) -> [r, g, b, a] (0-255); drawn on a coarse grid then smoothed
    field(fn, res = 4) {
      const r = this.r;
      const gw = Math.max(8, Math.ceil(r.w / res)), gh = Math.max(8, Math.ceil(r.h / res));
      this.off.width = gw; this.off.height = gh;
      const octx = this.off.getContext('2d');
      const img = octx.createImageData(gw, gh);
      for (let j = 0; j < gh; j++) {
        const y = r.y1 - ((j + 0.5) / gh) * (r.y1 - r.y0);
        for (let i = 0; i < gw; i++) {
          const x = r.x0 + ((i + 0.5) / gw) * (r.x1 - r.x0);
          const v = fn(x, y), k = (j * gw + i) * 4;
          img.data[k] = v[0]; img.data[k + 1] = v[1]; img.data[k + 2] = v[2]; img.data[k + 3] = v[3];
        }
      }
      octx.putImageData(img, 0, 0);
      const c = this.ctx;
      c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(this.off, r.pl, r.pt, r.w, r.h); c.restore();
    }
    // probability of class 1 -> violet/cyan wash, stronger where confident
    probField(proba, res = 4) {
      const a = T.rgb(T.violet), b = T.rgb(T.cyan);
      this.field((x, y) => {
        const p = proba(x, y);
        const t = Math.abs(p - 0.5) * 2;
        const m = p;
        return [a[0] * (1 - m) + b[0] * m, a[1] * (1 - m) + b[1] * m, a[2] * (1 - m) + b[2] * m, 18 + 70 * t];
      }, res);
    }
    contour(fn, level, style = {}) {
      // marching squares on a coarse grid; good enough for decision boundaries
      const c = this.ctx, r = this.r, n = style.res || 6;
      const gw = Math.ceil(r.w / n) + 1, gh = Math.ceil(r.h / n) + 1;
      const v = new Float32Array(gw * gh);
      for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) v[j * gw + i] = fn(this.ix(r.pl + i * n), this.iy(r.pt + j * n)) - level;
      c.strokeStyle = style.color || 'rgba(255,255,255,0.75)'; c.lineWidth = style.width || 1.4;
      if (style.dash) c.setLineDash(style.dash);
      c.beginPath();
      const lerp = (a, b) => a / (a - b);
      for (let j = 0; j < gh - 1; j++) for (let i = 0; i < gw - 1; i++) {
        const a = v[j * gw + i], b = v[j * gw + i + 1], d = v[(j + 1) * gw + i], e = v[(j + 1) * gw + i + 1];
        const x = r.pl + i * n, y = r.pt + j * n;
        const pts = [];
        if ((a > 0) !== (b > 0)) pts.push([x + lerp(a, b) * n, y]);
        if ((b > 0) !== (e > 0)) pts.push([x + n, y + lerp(b, e) * n]);
        if ((d > 0) !== (e > 0)) pts.push([x + lerp(d, e) * n, y + n]);
        if ((a > 0) !== (d > 0)) pts.push([x, y + lerp(a, d) * n]);
        if (pts.length >= 2) { c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); }
        if (pts.length === 4) { c.moveTo(pts[2][0], pts[2][1]); c.lineTo(pts[3][0], pts[3][1]); }
      }
      c.stroke(); c.setLineDash([]);
    }
    points(P, o = {}) {
      const c = this.ctx;
      for (let i = 0; i < P.length; i++) {
        const [x, y] = P[i];
        const col = typeof o.color === 'function' ? o.color(i) : (o.color || T.ink);
        const rad = typeof o.r === 'function' ? o.r(i) : (o.r || 3.2);
        if (rad <= 0) continue;
        const hollow = typeof o.hollow === 'function' ? o.hollow(i) : o.hollow;
        c.beginPath(); c.arc(this.sx(x), this.sy(y), rad, 0, Math.PI * 2);
        if (hollow) { c.strokeStyle = col; c.lineWidth = 1.4; c.stroke(); }
        else {
          c.fillStyle = col; c.fill();
          c.strokeStyle = o.stroke || 'rgba(7,7,9,0.85)'; c.lineWidth = 1; c.stroke();
        }
      }
    }
    ring(x, y, rad, color, w = 1.6) { const c = this.ctx; c.beginPath(); c.arc(this.sx(x), this.sy(y), rad, 0, Math.PI * 2); c.strokeStyle = color; c.lineWidth = w; c.stroke(); }
    circleData(x, y, rData, o = {}) {
      const c = this.ctx, rx = Math.abs(this.sx(x + rData) - this.sx(x)), ry = Math.abs(this.sy(y + rData) - this.sy(y));
      c.beginPath(); c.ellipse(this.sx(x), this.sy(y), rx, ry, 0, 0, Math.PI * 2);
      if (o.fill) { c.fillStyle = o.fill; c.fill(); }
      if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.width || 1; if (o.dash) c.setLineDash(o.dash); c.stroke(); c.setLineDash([]); }
    }
    cross(x, y, color, s = 6, w = 2.2) {
      const c = this.ctx, px = this.sx(x), py = this.sy(y);
      c.strokeStyle = '#070709'; c.lineWidth = w + 2.4;
      c.beginPath(); c.moveTo(px - s, py - s); c.lineTo(px + s, py + s); c.moveTo(px + s, py - s); c.lineTo(px - s, py + s); c.stroke();
      c.strokeStyle = color; c.lineWidth = w;
      c.beginPath(); c.moveTo(px - s, py - s); c.lineTo(px + s, py + s); c.moveTo(px + s, py - s); c.lineTo(px - s, py + s); c.stroke();
    }
    path(xs, ys, o = {}) {
      const c = this.ctx;
      c.beginPath();
      let started = false;
      for (let i = 0; i < xs.length; i++) {
        if (!isFinite(ys[i])) { started = false; continue; }
        const px = this.sx(xs[i]), py = this.sy(ys[i]);
        if (!started) { c.moveTo(px, py); started = true; } else c.lineTo(px, py);
      }
      c.strokeStyle = o.color || T.ink; c.lineWidth = o.width || 2; c.globalAlpha = o.alpha ?? 1;
      if (o.dash) c.setLineDash(o.dash);
      c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    }
    fn(f, o = {}) {
      const r = this.r, n = o.n || Math.max(60, Math.round(r.w / 2));
      const xs = [], ys = [];
      const yr = r.y1 - r.y0;
      for (let i = 0; i <= n; i++) {
        const x = r.x0 + (i / n) * (r.x1 - r.x0); let y = f(x);
        if (y > r.y1 + yr * 2 || y < r.y0 - yr * 2) y = y > 0 ? r.y1 + yr * 2 : r.y0 - yr * 2;
        xs.push(x); ys.push(y);
      }
      this.clip(() => this.path(xs, ys, o));
    }
    band(xs, lo, hi, color) {
      const c = this.ctx;
      c.beginPath();
      xs.forEach((x, i) => (i ? c.lineTo(this.sx(x), this.sy(hi[i])) : c.moveTo(this.sx(x), this.sy(hi[i]))));
      for (let i = xs.length - 1; i >= 0; i--) c.lineTo(this.sx(xs[i]), this.sy(lo[i]));
      c.closePath(); c.fillStyle = color; c.fill();
    }
    seg(x0, y0, x1, y1, o = {}) {
      const c = this.ctx;
      c.beginPath(); c.moveTo(this.sx(x0), this.sy(y0)); c.lineTo(this.sx(x1), this.sy(y1));
      c.strokeStyle = o.color || 'rgba(255,255,255,0.4)'; c.lineWidth = o.width || 1;
      if (o.dash) c.setLineDash(o.dash);
      c.stroke(); c.setLineDash([]);
    }
    rect(x0, y0, x1, y1, o = {}) {
      const c = this.ctx, px = this.sx(Math.min(x0, x1)), py = this.sy(Math.max(y0, y1));
      const w = Math.abs(this.sx(x1) - this.sx(x0)), h = Math.abs(this.sy(y1) - this.sy(y0));
      if (o.fill) { c.fillStyle = o.fill; c.fillRect(px, py, w, h); }
      if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.width || 1; c.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1); }
    }
    ellipse(mu, cov, nsd, o = {}) {
      // eigen-decomposition of a 2x2 covariance
      const a = cov[0][0], b = cov[0][1], d = cov[1][1];
      const tr = a + d, det = a * d - b * b, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
      const l1 = tr / 2 + disc, l2 = Math.max(1e-9, tr / 2 - disc);
      const ang = Math.abs(b) < 1e-12 ? (a >= d ? 0 : Math.PI / 2) : Math.atan2(l1 - a, b);
      const c = this.ctx, N = 64;
      c.beginPath();
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI * 2;
        const ex = Math.sqrt(l1) * nsd * Math.cos(t), ey = Math.sqrt(l2) * nsd * Math.sin(t);
        const x = mu[0] + ex * Math.cos(ang) - ey * Math.sin(ang), y = mu[1] + ex * Math.sin(ang) + ey * Math.cos(ang);
        i ? c.lineTo(this.sx(x), this.sy(y)) : c.moveTo(this.sx(x), this.sy(y));
      }
      if (o.fill) { c.fillStyle = o.fill; c.fill(); }
      c.strokeStyle = o.color || T.ink; c.lineWidth = o.width || 1.4;
      if (o.dash) c.setLineDash(o.dash);
      c.stroke(); c.setLineDash([]);
    }
    text(str, px, py, o = {}) {
      const c = this.ctx;
      c.font = o.font || `${o.size || 11}px ${o.sans ? 'Manrope, system-ui, sans-serif' : T.mono}`;
      c.fillStyle = o.color || T.muted; c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic';
      c.fillText(str, px, py);
    }
    clip(fn) { const c = this.ctx, r = this.r; c.save(); c.beginPath(); c.rect(r.pl, r.pt, r.w, r.h); c.clip(); fn(); c.restore(); }
    _bindPointer() {
      const cv = this.cv;
      const pos = e => { const b = cv.getBoundingClientRect(); const px = e.clientX - b.left, py = e.clientY - b.top; return { px, py, x: this.ix(px), y: this.iy(py) }; };
      let down = false;
      cv.addEventListener('pointerdown', e => { down = true; cv.setPointerCapture(e.pointerId); this.onDown && this.onDown(pos(e), e); });
      cv.addEventListener('pointermove', e => { const p = pos(e); if (down) this.onDrag && this.onDrag(p, e); else this.onHover && this.onHover(p, e); });
      cv.addEventListener('pointerup', e => { down = false; this.onUp && this.onUp(pos(e), e); });
      cv.addEventListener('pointerleave', () => { if (!down) this.onLeave && this.onLeave(); });
    }
  }
  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }
  function fmtTick(v) { const a = Math.abs(v); if (a < 1e-9) return '0'; if (a >= 1000) return v.toFixed(0); if (a >= 10) return v.toFixed(0); if (a >= 1) return v.toFixed(1).replace(/\.0$/, ''); return v.toFixed(2).replace(/0$/, ''); }

  // ---------------------------------------------------------------- mount
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const ICON_RESET = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>';

  // Greek letters must not be upper-cased by the mono label style (η would become Η)
  const sym = s => String(s).replace(/([α-ωϵℓ])/g, '<em class="sym">$1</em>');
  function mount(rootEl, spec) {
    rootEl.innerHTML = '';
    rootEl.classList.add('lab');
    const head = h('div', 'lab-head', `<small class="kicker"><i></i>${spec.title || 'Live lab · runs in your browser'}</small>`);
    const reset = h('button', 'copy', `${ICON_RESET}<span>Reset</span>`);
    reset.type = 'button';
    head.appendChild(reset);
    rootEl.appendChild(head);

    let stage = null, main = null, sides = [];
    if (spec.custom) {
      const box = h('div', 'lab-custom');
      rootEl.appendChild(box);
      main = box;
    } else {
      stage = h('div', 'lab-stage' + (spec.side && spec.side.length ? ' with-side' : ''));
      const mainBox = h('div', 'lab-main');
      if (spec.mainAspect) mainBox.style.aspectRatio = spec.mainAspect;
      stage.appendChild(mainBox);
      main = new Plot(mainBox, spec.main || {});
      if (spec.side && spec.side.length) {
        const side = h('div', 'lab-side');
        spec.side.forEach((cap, i) => {
          const box = h('div');
          box.appendChild(h('span', 'lab-cap', cap));
          side.appendChild(box);
          sides.push(new Plot(box, (spec.sideOpts && spec.sideOpts[i]) || { pad: [28, 12, 22, 34] }));
        });
        stage.appendChild(side);
      }
      rootEl.appendChild(stage);
      if (spec.legend || spec.hint) {
        const strip = h('div', 'lab-strip');
        strip.appendChild(h('div', 'lab-legend', (spec.legend || []).map(l => `<span><i style="background:${l.c}"></i>${l.l}</span>`).join('')));
        if (spec.hint) strip.appendChild(h('div', 'lab-hint', spec.hint));
        rootEl.appendChild(strip);
      }
    }

    // controls
    const val = {}, listeners = [], buttons = {};
    const ctlBox = h('div', 'lab-controls');
    const ctlEls = {};
    (spec.controls || []).forEach(ct => {
      if (ct.type === 'buttons') {
        const wrap = h('div', 'lab-actions');
        ct.items.forEach(b => {
          const btn = h('button', `button ${b.kind || 'ghost'}`, b.label);
          btn.type = 'button';
          btn.addEventListener('click', () => { const fn = buttons[b.key]; if (fn) fn(btn); });
          wrap.appendChild(btn); ctlEls[b.key] = btn;
        });
        wrap.style.gridColumn = '1 / -1';
        ctlBox.appendChild(wrap);
        return;
      }
      const box = h('div', 'ctl');
      if (ct.type === 'range') {
        const id = `c${Math.random().toString(36).slice(2, 8)}`;
        const label = h('label', null, `<span>${sym(ct.label)}</span><output></output>`);
        label.setAttribute('for', id);
        const input = h('input');
        Object.assign(input, { type: 'range', id, min: ct.min, max: ct.max, step: ct.step || 1, value: ct.value });
        const out = label.querySelector('output');
        const read = () => {
          const raw = +input.value;
          val[ct.key] = ct.log ? Math.pow(10, raw) : raw;
          out.textContent = ct.fmt ? ct.fmt(val[ct.key]) : String(val[ct.key]);
          input.style.setProperty('--fill', `${((raw - ct.min) / (ct.max - ct.min)) * 100}%`);
        };
        input.addEventListener('input', () => { read(); listeners.forEach(f => f(ct.key)); });
        read();
        box.append(label, input);
        ctlEls[ct.key] = { set(v) { input.value = ct.log ? Math.log10(v) : v; read(); }, input, def: ct.value };
      } else if (ct.type === 'seg') {
        box.appendChild(h('label', null, `<span>${sym(ct.label)}</span>`));
        const seg = h('div', 'seg');
        seg.setAttribute('role', 'group');
        seg.setAttribute('aria-label', ct.label);
        const btns = ct.options.map(([v, l]) => {
          const b = h('button', null, l); b.type = 'button'; b.dataset.v = v;
          b.addEventListener('click', () => { set(v); listeners.forEach(f => f(ct.key)); });
          seg.appendChild(b); return b;
        });
        const set = v => { val[ct.key] = v; btns.forEach(b => { const on = b.dataset.v === String(v); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); };
        set(ct.value);
        box.appendChild(seg);
        ctlEls[ct.key] = { set, def: ct.value };
      }
      const long = ct.type === 'seg' && (ct.options.length > 3 || ct.options.reduce((n, o) => n + String(o[1]).length, 0) > 26);
      if (ct.span || long) box.style.gridColumn = '1 / -1';
      ctlBox.appendChild(box);
    });
    if ((spec.controls || []).length) rootEl.appendChild(ctlBox);

    // readouts
    const ro = {};
    if (spec.readouts && spec.readouts.length) {
      const box = h('div', 'lab-readout');
      spec.readouts.forEach(r => { const d = h('div', null, `<span>${sym(r.label)}</span><b>–</b>`); ro[r.key] = d.querySelector('b'); box.appendChild(d); });
      rootEl.appendChild(box);
    }

    const api = {
      root: rootEl, main, side: sides, val, theme: T,
      on(fn) { listeners.push(fn); return api; },
      button(key, fn) { buttons[key] = fn; return api; },
      el(key) { return ctlEls[key]; },
      set(key, text, cls) { const b = ro[key]; if (!b) return; b.textContent = text; b.className = cls || ''; },
      fire(key) { listeners.forEach(f => f(key)); },
      redraw() { if (main && main.request) main.request(); sides.forEach(s => s.request()); },
    };
    reset.addEventListener('click', () => {
      Object.values(ctlEls).forEach(c => { if (c && c.set && 'def' in c) c.set(c.def); });
      if (spec.onReset) spec.onReset(api);
      listeners.forEach(f => f('reset'));
    });
    return api;
  }

  // animation helper: calls step() each frame until it returns false or stop() is called
  function animator(step, fps = 60) {
    let id = null, last = 0;
    const loop = t => {
      if (t - last >= 1000 / fps) { last = t; if (step() === false) { id = null; return; } }
      id = requestAnimationFrame(loop);
    };
    return {
      start() { if (!id) id = requestAnimationFrame(loop); },
      stop() { if (id) cancelAnimationFrame(id); id = null; },
      get running() { return !!id; },
    };
  }

  // shared formatting
  const fmt = {
    pct: v => `${(v * 100).toFixed(1)}%`,
    n2: v => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2)),
    n3: v => v.toFixed(3),
    sci: v => (v >= 0.01 && v < 1000 ? (+v.toPrecision(2)).toString() : v.toExponential(0)),
  };

  root.Lab = { T, alpha, rng, cls2d, clsNames, clu2d, cluNames, reg1d, regNames, split, flipLabels, Plot, mount, animator, fmt, reduced, loadTheme, h };
})(window);

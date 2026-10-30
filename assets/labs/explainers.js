// Animated, captioned explainers that sit above the live labs. Each one is a short sequence of
// steps drawn on a canvas in a 640 x 400 logical space; the player handles play/pause, stepping,
// scaling and reduced motion.
(function (root) {
  'use strict';
  const { T, alpha } = root.Lab;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 640, H = 400;
  const ease = t => (t < 0 ? 0 : t > 1 ? 1 : t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const clamp01 = t => Math.max(0, Math.min(1, t));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sig = z => 1 / (1 + Math.exp(-z));

  // ------------------------------------------------------------------ drawing kit (logical coords)
  function kit(c) {
    const g = {
      c,
      font(size, mono, weight) { c.font = `${weight || (mono ? 400 : 500)} ${size}px ${mono ? T.mono : 'Manrope, system-ui, sans-serif'}`; },
      text(s, x, y, o = {}) { g.font(o.size || 13, o.mono !== false && !o.sans, o.weight); c.fillStyle = o.color || T.soft; c.textAlign = o.align || 'center'; c.textBaseline = o.base || 'middle'; c.globalAlpha = o.a ?? 1; c.fillText(s, x, y); c.globalAlpha = 1; },
      rr(x, y, w, h, r, o = {}) {
        c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
        c.globalAlpha = o.a ?? 1;
        if (o.fill) { c.fillStyle = o.fill; c.fill(); }
        if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.w || 1.2; c.stroke(); }
        c.globalAlpha = 1;
      },
      line(pts, o = {}) {
        c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.strokeStyle = o.color || 'rgba(255,255,255,0.35)'; c.lineWidth = o.w || 1.4; c.globalAlpha = o.a ?? 1;
        if (o.dash) c.setLineDash(o.dash);
        c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
        if (o.arrow) { const [x1, y1] = pts[pts.length - 2], [x2, y2] = pts[pts.length - 1]; g.head(x1, y1, x2, y2, o.color, o.a); }
      },
      head(x1, y1, x2, y2, color, a = 1) {
        const ang = Math.atan2(y2 - y1, x2 - x1), s = 7;
        c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - s * Math.cos(ang - 0.45), y2 - s * Math.sin(ang - 0.45)); c.lineTo(x2 - s * Math.cos(ang + 0.45), y2 - s * Math.sin(ang + 0.45)); c.closePath();
        c.fillStyle = color || 'rgba(255,255,255,0.35)'; c.globalAlpha = a; c.fill(); c.globalAlpha = 1;
      },
      dot(x, y, r, color, a = 1) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = color; c.globalAlpha = a; c.fill(); c.globalAlpha = 1; },
      glow(x, y, r, color, a = 1) { const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, alpha(color, 0.55 * a)); gr.addColorStop(1, alpha(color, 0)); c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r); },
      ring(x, y, r, color, w = 1.6, a = 1) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.strokeStyle = color; c.lineWidth = w; c.globalAlpha = a; c.stroke(); c.globalAlpha = 1; },
      // point at fraction t along a polyline
      along(pts, t) {
        const seg = []; let tot = 0;
        for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
        let d = clamp01(t) * tot;
        for (let i = 0; i < seg.length; i++) { if (d <= seg[i]) { const f = seg[i] ? d / seg[i] : 0; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; } d -= seg[i]; }
        return pts[pts.length - 1];
      },
      // dots flowing along a path; phase in [0,1) loops with time
      flow(pts, time, o = {}) {
        const n = o.n || 4, speed = o.speed || 0.0005;
        for (let k = 0; k < n; k++) { const t = ((time * speed) + k / n) % 1; const [x, y] = g.along(pts, t); g.dot(x, y, o.r || 3, o.color || T.cyan, (o.a ?? 1) * Math.sin(Math.PI * t)); }
      },
      cellColor(v, a = 1) { return v >= 0 ? alpha(T.cyan, a * (0.1 + 0.85 * Math.min(1, v))) : alpha(T.pink, a * (0.1 + 0.85 * Math.min(1, -v))); },
    };
    return g;
  }

  // ------------------------------------------------------------------ player
  const ICON = {
    play: '<svg class="i" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>',
    pause: '<svg class="i" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
    prev: '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    next: '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
  };
  function player(el, spec) {
    el.classList.add('explainer');
    el.innerHTML = `
      <div class="ex-head"><small class="kicker"><i></i>${spec.title || 'Watch it work'}</small><span class="ex-right"><span class="ex-count"></span><button class="copy ex-full" type="button" aria-label="Full screen"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg><span>Full screen</span></button></span></div>
      <div class="ex-stage"><canvas></canvas></div>
      <div class="ex-cap" aria-live="polite"><small class="ex-part"></small><b></b><p></p></div>
      <div class="ex-ctl">
        <button class="ex-btn" data-a="prev" type="button" aria-label="Previous step">${ICON.prev}</button>
        <button class="ex-btn ex-play" data-a="play" type="button" aria-label="Pause">${ICON.pause}</button>
        <button class="ex-btn" data-a="next" type="button" aria-label="Next step">${ICON.next}</button>
        <div class="ex-dots">${spec.steps.map((s, i) => `<button type="button" data-i="${i}" aria-label="Step ${i + 1}: ${s.t}"><i></i></button>`).join('')}</div>
      </div>`;
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), g = kit(ctx);
    const cap = el.querySelector('.ex-cap'), count = el.querySelector('.ex-count'), playBtn = el.querySelector('.ex-play');
    const dots = [...el.querySelectorAll('.ex-dots button')];
    let s = 0, t0 = performance.now(), playing = !reduced, visible = false, holdUntil = 0, pausedAt = 0;
    const N = spec.steps.length;
    const setPlaying = on => {
      playing = on; playBtn.innerHTML = on ? ICON.pause : ICON.play; playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
      if (on) t0 = performance.now() - pausedAt; else pausedAt = performance.now() - t0;
    };
    const go = (i, keepPlaying) => {
      s = (i + N) % N; t0 = performance.now(); pausedAt = reduced ? 1e9 : 0;
      const st = spec.steps[s];
      cap.querySelector('.ex-part').textContent = st.part || ''; cap.querySelector('b').textContent = st.t; cap.querySelector('p').innerHTML = st.d;
      if (window.renderMath) window.renderMath(cap);
      count.textContent = `Step ${s + 1} of ${N}`;
      dots.forEach((d, j) => { d.classList.toggle('on', j === s); d.classList.toggle('done', j < s); });
      if (!keepPlaying && playing) setPlaying(true);
      if (reduced && !playing) pausedAt = 1e9;
    };
    el.querySelector('[data-a=prev]').addEventListener('click', () => { go(s - 1, true); if (!playing) pausedAt = 1e9; });
    el.querySelector('[data-a=next]').addEventListener('click', () => { go(s + 1, true); if (!playing) pausedAt = 1e9; });
    playBtn.addEventListener('click', () => setPlaying(!playing));
    const full = el.querySelector('.ex-full');
    if (!el.requestFullscreen && !el.webkitRequestFullscreen) full.hidden = true;
    full.addEventListener('click', () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (fsEl) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else {
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        Promise.resolve(req.call(el)).then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* not supported */ } }).catch(() => {});
      }
    });
    document.addEventListener('fullscreenchange', () => { full.querySelector('span').textContent = document.fullscreenElement === el ? 'Exit' : 'Full screen'; requestAnimationFrame(size); });
    dots.forEach((d, i) => d.addEventListener('click', () => { go(i, true); if (!playing) pausedAt = 1e9; }));
    let scale = 1;
    const size = () => {
      const box = cv.parentElement.getBoundingClientRect(); if (!box.width) return;
      const fsOn = (document.fullscreenElement || document.webkitFullscreenElement) === el;
      const w = fsOn ? Math.min(box.width, box.height * W / H) : box.width;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      scale = w / W;
      cv.style.width = w + 'px'; cv.style.height = (w * H / W) + 'px';
      cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    };
    new ResizeObserver(size).observe(cv.parentElement); size();
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(el);
    go(0, true);
    const frame = now => {
      if (visible && !document.hidden) {
        const st = spec.steps[s], dur = st.dur || 3200;
        const elapsed = playing ? now - t0 : pausedAt;
        const p = clamp01(elapsed / dur);
        if (playing && p >= 1) {
          if (!holdUntil) holdUntil = now + (s === N - 1 ? 3200 : 1100);
          if (now >= holdUntil) { holdUntil = 0; go(s + 1, true); }
        }
        ctx.clearRect(0, 0, W, H);
        spec.draw(g, s, p, now);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  const ex = {};

  // ================================================================== CNN (in depth)
  ex.cnn = el => {
    const IMG = ['00000000', '01111110', '00000110', '00001100', '00011000', '00110000', '00110000', '00000000'].map(r => [...r].map(Number));
    const FV = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]];
    const FH = [[-1, -1, -1], [0, 0, 0], [1, 1, 1]];
    const FD = [[-1, -1, 2], [-1, 2, -1], [2, -1, -1]];
    const conv = (I, F, st = 1, pad = 0) => {
      const n = I.length + 2 * pad, k = F.length, o = Math.floor((n - k) / st) + 1;
      const at = (i, j) => (i < pad || j < pad || i >= I.length + pad || j >= I.length + pad ? 0 : I[i - pad][j - pad]);
      return Array.from({ length: o }, (_, i) => Array.from({ length: o }, (_, j) => { let s = 0; for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) s += at(i * st + a, j * st + b) * F[a][b]; return s; }));
    };
    const relu = M => M.map(r => r.map(v => Math.max(0, v)));
    const pool = M => Array.from({ length: M.length >> 1 }, (_, i) => Array.from({ length: M.length >> 1 }, (_, j) => Math.max(M[2 * i][2 * j], M[2 * i + 1][2 * j], M[2 * i][2 * j + 1], M[2 * i + 1][2 * j + 1])));
    const FM = conv(IMG, FV), FM2 = conv(IMG, FV, 2), FMP = conv(IMG, FV, 1, 1), RL = relu(FM), PL = pool(RL);
    const MH = conv(IMG, FH), MD = conv(IMG, FD);
    // the patch used for the one-by-one walkthrough: strongest positive response
    let best = [0, 0]; FM.forEach((r, i) => r.forEach((v, j) => { if (v > FM[best[0]][best[1]]) best = [i, j]; }));
    const [BR, BC] = best;
    const fmt = v => (v === 0 ? '0' : v > 0 ? `+${v}` : `−${-v}`);
    const sgn = v => (v < 0 ? `(−${-v})` : String(v));

    // draw a matrix as rounded cells
    const grid = (g, M, x, y, cs, o = {}) => {
      const a = o.a ?? 1, scale = o.scale || Math.max(1, ...M.flat().map(Math.abs));
      M.forEach((row, i) => row.forEach((v, j) => {
        let fill = o.fill ? o.fill(v, i, j) : o.binary ? (v ? alpha(T.violet2, 0.85) : 'rgba(255,255,255,0.05)') : v === 0 ? 'rgba(255,255,255,0.05)' : g.cellColor(v / scale);
        if (o.hide && o.hide(i, j)) fill = 'rgba(255,255,255,0.03)';
        g.rr(x + j * cs + 1, y + i * cs + 1, cs - 2, cs - 2, Math.min(4, cs / 6), { fill, a });
        if (o.text !== false && !(o.hide && o.hide(i, j))) g.text(o.label ? o.label(v, i, j) : (o.binary ? String(v) : fmt(v)), x + j * cs + cs / 2, y + i * cs + cs / 2 + 1, { size: o.size || Math.max(8, Math.min(13, cs * 0.42)), color: o.binary && v ? '#14121f' : T.ink, a: a * (o.textA ?? 1) });
      }));
    };
    const frame = (g, x, y, cs, r, c, k, color = T.amber, a = 1) => g.rr(x + c * cs - 1, y + r * cs - 1, cs * k + 2, cs * k + 2, 5, { stroke: color, w: 2.3, a });
    const label = (g, s, x, y, a = 1) => g.text(s, x, y, { size: 12, color: T.muted, a });
    const note = (g, lines, x, y, a = 1, o = {}) => lines.forEach((l, i) => g.text(l, x, y + i * (o.lh || 20), { size: o.size || 13, color: o.color || T.soft, align: 'left', a, sans: !o.mono }));

    const steps = [
      { part: 'Part 1 · The input', t: 'An image is a grid of brightness values', dur: 5200,
        d: 'A grayscale image is a table of numbers, one per pixel. Cameras store 0 (black) to 255 (white); before training we usually divide by 255 so every value is between 0 and 1. This tiny 8×8 “7” has shape <strong>8 × 8 × 1</strong>: height × width × channels.' },
      { part: 'Part 1 · The input', t: 'Colour images have three channels', dur: 4400,
        d: 'A colour image stacks three such grids: red, green and blue intensity for every pixel. Its shape is <strong>H × W × 3</strong>. Everything a CNN does works on these stacks, which deeper layers call <em>channels</em> or <em>feature maps</em>.' },
      { part: 'Part 2 · One convolution', t: 'A filter is a small grid of learnable weights', dur: 4400,
        d: 'This 3×3 filter (also called a kernel) has 9 weights plus one bias. Negative on the left, positive on the right: it will produce a big number wherever the image goes from dark (left) to bright (right), a <strong>vertical edge</strong>. In a trained CNN nobody designs these weights; they are learned.' },
      { part: 'Part 2 · One convolution', t: 'Multiply each pixel by the weight on top of it', dur: 9000,
        d: 'Place the filter on a 3×3 patch of the image. Take the pixel under each weight, multiply the two, and keep a running total. Nine multiplications, one sum: this is a <strong>dot product</strong> between the patch and the filter.' },
      { part: 'Part 2 · One convolution', t: 'Add the bias and write one output pixel', dur: 4200,
        d: 'output = Σ (pixel × weight) + bias. The bias (0 here) shifts how easily the filter “fires”. The result becomes one pixel of a new image called a <strong>feature map</strong>, at the same relative position as the patch.' },
      { part: 'Part 2 · One convolution', t: 'Slide the filter over every position', dur: 7600,
        d: 'Move one pixel at a time (stride 1) and repeat. The <strong>same 9 weights</strong> are used everywhere (weight sharing), so a vertical edge is detected wherever it appears. An 8×8 image and a 3×3 filter give 6×6 positions: output size = (8 − 3) / 1 + 1 = 6.' },
      { part: 'Part 3 · Stride and padding', t: 'Stride 2: jump two pixels at a time', dur: 6400,
        d: 'With <strong>stride 2</strong> the filter skips every other position, so there are only 3 × 3 positions: ⌊(8 − 3) / 2⌋ + 1 = 3. The feature map is about half as wide and half as tall, which saves computation and downsamples the image.' },
      { part: 'Part 3 · Stride and padding', t: 'Padding: add a border of zeros', dur: 7200,
        d: 'Add one ring of zeros around the image (<strong>padding = 1</strong>). Now the filter can also centre on edge pixels and the output keeps the input size: (8 + 2·1 − 3) / 1 + 1 = 8. This is called “same” padding; without it (“valid”) every layer shrinks the image. General rule: <strong>output = ⌊(n + 2p − k) / s⌋ + 1</strong>.' },
      { part: 'Part 4 · Filters and channels', t: 'Several filters give several feature maps', dur: 6000,
        d: 'One filter finds one kind of pattern. A layer uses many: here vertical, horizontal and diagonal edge filters. Each produces its own 6×6 map, and the maps are stacked into a 6 × 6 × <strong>3</strong> output. The number of filters is the number of output channels.' },
      { part: 'Part 4 · Filters and channels', t: 'On multi-channel input, a filter has one slice per channel', dur: 6400,
        d: 'If the input has 3 channels, each filter is 3 × 3 × <strong>3</strong>: one 3×3 slice per channel. All 27 products are added together (plus one bias) into a <em>single</em> number. So a layer with 16 such filters has 16 × (27 + 1) = 448 parameters, and outputs 16 channels.' },
      { part: 'Part 5 · Non-linearity and pooling', t: 'ReLU: keep the positive evidence', dur: 5200,
        d: 'After convolution, every value goes through ReLU: max(0, x). Negative responses (here: bright-to-dark edges) become 0. This non-linearity is essential: without it, stacking convolutions would be no more powerful than a single one.' },
      { part: 'Part 5 · Non-linearity and pooling', t: 'Max-pooling: keep the strongest value in each window', dur: 7000,
        d: 'Split the map into 2×2 windows and keep the maximum of each (stride 2, no overlap). 6×6 becomes 3×3. The exact position inside each window is forgotten, which makes the network tolerant to small shifts. Average pooling would keep the mean instead.' },
      { part: 'Part 6 · Going deeper', t: 'Deeper layers see larger parts of the image', dur: 6400,
        d: 'A neuron in layer 2 looks at a 3×3 patch of layer 1, and each of those looked at a 3×3 patch of the image. So it depends on a 5×5 region of the input: its <strong>receptive field</strong>. With more layers and pooling, late neurons see whole objects, which is why depth turns edges into shapes into digits.' },
      { part: 'Part 6 · Going deeper', t: 'Flatten, combine, and classify', dur: 6800,
        d: 'The final feature maps are unrolled into one vector (<strong>flatten</strong>), a fully connected layer combines evidence from all positions, and a last layer produces one score per class. <strong>Softmax</strong> turns the scores into probabilities that sum to 1. (Probabilities shown are illustrative.)' },
      { part: 'Part 6 · Going deeper', t: 'How the filters are learned', dur: 7400,
        d: 'Training starts with random filters. For each image, the loss measures how wrong the prediction is; backpropagation computes how the loss changes with each weight: <strong>∂L/∂w = Σ (error at each output pixel × input pixel under w)</strong>. Gradient descent nudges every weight downhill, and edge detectors emerge on their own.' },
      { part: 'Part 6 · Going deeper', t: 'The whole network', dur: 6000,
        d: 'Input → [convolution → ReLU → pooling] × a few → flatten → dense → softmax. Early layers find edges, middle layers combine them into strokes and corners, late layers recognise the digit. The architecture diagram above lets you inspect each of these parts.' },
    ];

    player(el, {
      title: 'Convolution in depth, step by step', steps,
      draw(g, s, p, time) {
        const P = ease(clamp01(p * 1.4));
        // ---------- part 1
        if (s === 0) {
          const cs = 30, x = 34, y = 64;
          label(g, 'pixel values', x + 120, y - 20);
          grid(g, IMG, x, y, cs, { binary: true, size: 10, label: v => (p < 0.45 ? (v ? '255' : '0') : (v ? '1.0' : '0')) });
          const a = ease(clamp01((p - 0.1) * 3));
          note(g, ['• one number per pixel', '• camera range: 0 (black) … 255 (white)', '• divide by 255 → 0 … 1', '', 'shape = 8 × 8 × 1'], 330, 110, a, { lh: 26 });
          g.text(p < 0.45 ? 'raw 0–255' : 'normalised ÷ 255', x + 120, y + 8 * cs + 20, { size: 12, color: T.amber, a });
          return;
        }
        if (s === 1) {
          const cs = 22, cols = [T.pink, T.green, '#7aa2ff'], names = ['red', 'green', 'blue'];
          for (let c = 2; c >= 0; c--) {
            const off = ease(clamp01(p * 2)) * c * 30;
            const x = 60 + off, y = 70 + off * 0.7;
            grid(g, IMG, x, y, cs, { text: false, fill: v => alpha(cols[c], v ? 0.75 : 0.12), a: 1 });
            g.text(names[c], x + 8 * cs + 22, y + 10, { size: 11, color: cols[c], a: ease(clamp01(p * 2 - 0.6)) });
          }
          note(g, ['three grids, one per colour', 'shape = 8 × 8 × 3', '', 'later layers have many more', 'channels: 16, 32, 64 …'], 400, 130, ease(clamp01(p * 2 - 0.4)), { lh: 24 });
          return;
        }
        // ---------- part 2 layout
        const IX = 24, IY = 70, IC = 24, FX = 248, FY = 108, FC = 36, MX = 430, MY = 70, MC = 30;
        if (s === 2) {
          grid(g, IMG, IX, IY, IC, { binary: true, size: 10 });
          label(g, 'input', IX + 96, IY - 20);
          const a = ease(clamp01(p * 2));
          label(g, 'filter (3×3)', FX + 54, FY - 20, a);
          grid(g, FV, FX, FY, FC, { a, size: 14, scale: 1.4 });
          g.text('+ bias b = 0', FX + 54, FY + 3 * FC + 20, { size: 12, color: T.muted, a });
          const b = ease(clamp01(p * 2 - 0.8));
          note(g, ['left column  −1', 'middle       0', 'right column +1', '', '→ big output on', '  dark | bright edges'], 410, 120, b, { mono: true, size: 13, lh: 22 });
          return;
        }
        if (s === 3 || s === 4) {
          grid(g, IMG, IX, IY, IC, { binary: true, size: 10 });
          label(g, 'input', IX + 96, IY - 20);
          frame(g, IX, IY, IC, BR, BC, 3);
          label(g, 'filter', FX + 54, FY - 20);
          grid(g, FV, FX, FY, FC, { size: 14, scale: 1.4 });
          const k = s === 3 ? Math.min(8, Math.floor(p * 10)) : 8;
          let run = 0; const lines = [];
          for (let q = 0; q <= k; q++) {
            const a = Math.floor(q / 3), b = q % 3, v = IMG[BR + a][BC + b], w = FV[a][b];
            run += v * w; lines.push(`${v} × ${sgn(w)} = ${fmt(v * w)}`);
          }
          if (s === 3) {
            const a = Math.floor(k / 3), b = k % 3;
            const ix = IX + (BC + b) * IC + IC / 2, iy = IY + (BR + a) * IC + IC / 2, fx = FX + b * FC + FC / 2, fy = FY + a * FC + FC / 2;
            g.ring(ix, iy, IC / 2, T.ink, 2); g.ring(fx, fy, FC / 2 - 1, T.ink, 2);
            g.c.beginPath(); g.c.moveTo(ix, iy); g.c.quadraticCurveTo((ix + fx) / 2, Math.min(iy, fy) - 50, fx, fy); g.c.strokeStyle = T.amber; g.c.lineWidth = 1.6; g.c.stroke();
            lines.forEach((l, i) => g.text(l, 420, 74 + i * 22, { size: 13, align: 'left', color: i === lines.length - 1 ? T.amber : T.soft }));
            g.text(`running sum = ${fmt(run)}`, 420, 74 + 9 * 22 + 12, { size: 15, align: 'left', color: T.cyan, weight: 500 });
          } else {
            const t = ease(clamp01(p / 0.55));
            g.text(`Σ = ${fmt(run)}`, FX + 54, FY + 3 * FC + 28, { size: 16, color: T.cyan });
            g.text(`+ b (0) = ${fmt(run)}`, FX + 54, FY + 3 * FC + 50, { size: 13, color: T.muted });
            label(g, 'feature map', MX + 90, MY - 20);
            grid(g, FM, MX, MY, MC, { hide: (i, j) => !(i === BR && j === BC && p > 0.55), size: 12 });
            frame(g, MX, MY, MC, BR, BC, 1, T.amber, 0.8);
            if (p < 0.56) { const x = lerp(FX + 54, MX + BC * MC + MC / 2, t), y = lerp(FY + 3 * FC + 28, MY + BR * MC + MC / 2, t); g.dot(x, y, 7, T.cyan); g.glow(x, y, 28, T.cyan); }
            g.line([[IX + (BC + 3) * IC + 4, IY + BR * IC + 4], [MX + BC * MC - 4, MY + BR * MC + 4]], { color: T.amber, a: 0.25, dash: [3, 5] });
            g.text('same relative position', MX + 90, MY + 6 * MC + 22, { size: 11, color: T.dim });
          }
          return;
        }
        if (s === 5) {
          const pos = Math.min(35, Math.floor(p * 37)), pr = Math.floor(pos / 6), pc = pos % 6;
          grid(g, IMG, IX, IY, IC, { binary: true, size: 10 });
          label(g, 'input 8×8', IX + 96, IY - 20);
          frame(g, IX, IY, IC, pr, pc, 3);
          label(g, 'filter', FX + 54, FY - 20);
          grid(g, FV, FX, FY, FC, { size: 14, scale: 1.4 });
          label(g, 'feature map 6×6', MX + 90, MY - 20);
          grid(g, FM, MX, MY, MC, { hide: (i, j) => i * 6 + j > pos, size: 12 });
          frame(g, MX, MY, MC, pr, pc, 1);
          g.text('(8 − 3) / 1 + 1 = 6', MX + 90, MY + 6 * MC + 24, { size: 13, color: T.amber });
          g.text(`position ${pos + 1} of 36`, FX + 54, FY + 3 * FC + 26, { size: 12, color: T.muted });
          return;
        }
        // ---------- part 3
        if (s === 6) {
          const pos = Math.min(8, Math.floor(p * 10)), pr = Math.floor(pos / 3) * 2, pc = (pos % 3) * 2;
          grid(g, IMG, IX, IY, IC, { binary: true, size: 10 });
          label(g, 'input 8×8', IX + 96, IY - 20);
          for (let q = 0; q < pos; q++) frame(g, IX, IY, IC, Math.floor(q / 3) * 2, (q % 3) * 2, 3, T.amber, 0.18);
          frame(g, IX, IY, IC, pr, pc, 3);
          if (pos % 3) g.text('→ 2', IX + (pc - 1) * IC + 4, IY + pr * IC - 8, { size: 11, color: T.amber });
          label(g, 'filter, stride 2', FX + 54, FY - 20);
          grid(g, FV, FX, FY, FC, { size: 14, scale: 1.4 });
          const MC2 = 44;
          label(g, 'feature map 3×3', MX + 66, MY - 20);
          grid(g, FM2, MX, MY + 10, MC2, { hide: (i, j) => i * 3 + j > pos, size: 13 });
          frame(g, MX, MY + 10, MC2, pr / 2, pc / 2, 1);
          g.text('⌊(8 − 3) / 2⌋ + 1 = 3', MX + 66, MY + 3 * MC2 + 40, { size: 13, color: T.amber });
          g.text('stride 1 would give 6 × 6', MX + 66, MY + 3 * MC2 + 62, { size: 12, color: T.dim });
          return;
        }
        if (s === 7) {
          const pos = Math.min(63, Math.floor(p * 66)), pr = Math.floor(pos / 8), pc = pos % 8;
          const PC = 20, PXX = 22, PY = 66;
          label(g, 'input with padding = 1 (10×10)', PXX + 100, PY - 20);
          const padded = Array.from({ length: 10 }, (_, i) => Array.from({ length: 10 }, (_, j) => (i === 0 || j === 0 || i === 9 || j === 9 ? -1 : IMG[i - 1][j - 1])));
          padded.forEach((row, i) => row.forEach((v, j) => {
            const border = v < 0;
            g.rr(PXX + j * PC + 1, PY + i * PC + 1, PC - 2, PC - 2, 3, { fill: border ? 'rgba(255,255,255,0.02)' : v ? alpha(T.violet2, 0.85) : 'rgba(255,255,255,0.06)', stroke: border ? 'rgba(255,255,255,0.22)' : null, w: 1 });
            if (border) g.text('0', PXX + j * PC + PC / 2, PY + i * PC + PC / 2 + 1, { size: 9, color: T.dim });
          }));
          frame(g, PXX, PY, PC, pr, pc, 3);
          label(g, 'filter', 290, 100);
          grid(g, FV, 254, 118, 24, { size: 11, scale: 1.4 });
          const OC = 22, OX = 400, OY = 66;
          label(g, 'output 8×8 (same size)', OX + 88, OY - 20);
          grid(g, FMP, OX, OY, OC, { hide: (i, j) => i * 8 + j > pos, size: 9 });
          frame(g, OX, OY, OC, pr, pc, 1);
          g.text('(8 + 2·1 − 3) / 1 + 1 = 8', OX + 88, OY + 8 * OC + 24, { size: 13, color: T.amber });
          g.text('out = ⌊(n + 2p − k) / s⌋ + 1', 288, 300, { size: 13, color: T.cyan });
          return;
        }
        // ---------- part 4
        if (s === 8) {
          const cs = 16;
          grid(g, IMG, 20, 140, cs, { binary: true, text: false });
          label(g, 'input', 84, 124);
          const rows = [[FV, FM, 'vertical'], [FH, MH, 'horizontal'], [FD, MD, 'diagonal']];
          rows.forEach(([F, M, name], r) => {
            const a = ease(clamp01(p * 2.2 - r * 0.45)), y = 46 + r * 116;
            g.line([[152, 204], [190, y + 30]], { color: 'rgba(255,255,255,0.25)', a, arrow: true });
            grid(g, F, 194, y + 6, 16, { a, size: 8, scale: 2 });
            g.text(name, 218, y - 2, { size: 11, color: T.muted, a });
            g.line([[248, y + 30], [278, y + 30]], { color: 'rgba(255,255,255,0.35)', a, arrow: true });
            grid(g, M, 284, y, 15, { a, text: false, scale: 3 });
          });
          const sa = ease(clamp01(p * 2 - 1.2));
          [MD, MH, FM].forEach((M, k) => grid(g, M, 470 + k * 16, 120 - k * 14, 14, { a: sa, text: false, scale: 3 }));
          g.line([[378, 204], [462, 190]], { color: 'rgba(255,255,255,0.35)', a: sa, arrow: true });
          g.text('stacked: 6 × 6 × 3', 534, 250, { size: 13, color: T.amber, a: sa });
          g.text('3 filters → 3 channels', 534, 272, { size: 12, color: T.muted, a: sa });
          return;
        }
        if (s === 9) {
          const cols = [T.pink, T.green, '#7aa2ff'], wts = [1, 0.6, 0.3], cs = 15;
          for (let c = 2; c >= 0; c--) {
            const x = 30 + c * 18, y = 80 + c * 22;
            grid(g, IMG, x, y, cs, { text: false, fill: v => alpha(cols[c], v ? 0.35 + 0.5 * wts[c] : 0.1) });
            frame(g, x, y, cs, BR, BC, 3, T.amber, 0.9);
          }
          label(g, 'input: 8 × 8 × 3', 100, 60);
          for (let c = 2; c >= 0; c--) {
            const x = 250 + c * 16, y = 96 + c * 26;
            FV.forEach((row, i) => row.forEach((v, j) => g.rr(x + j * 22 + 1, y + i * 22 + 1, 20, 20, 3, { fill: alpha(cols[c], v > 0 ? 0.8 : v < 0 ? 0.35 : 0.12) })));
          }
          label(g, 'filter: 3 × 3 × 3', 314, 70);
          const t = ease(clamp01(p * 1.8));
          [0, 1, 2].forEach(c => g.flow([[130 + c * 18, 120 + c * 22], [240 + c * 16, 120 + c * 26], [480, 200]], time + c * 300, { n: 3, color: cols[c], speed: 0.0005 }));
          g.dot(480, 200, 22, '#0d0c14'); g.ring(480, 200, 22, T.cyan, 2); g.text('Σ', 480, 201, { size: 20, color: T.cyan, sans: true });
          g.text('27 products + bias', 480, 238, { size: 12, color: T.muted, a: t });
          g.line([[504, 200], [566, 200]], { color: T.cyan, arrow: true, a: t });
          g.rr(572, 186, 28, 28, 5, { fill: alpha(T.cyan, 0.7), a: t });
          g.text('1 number', 586, 230, { size: 11, color: T.muted, a: t });
          g.text('params per filter = 3·3·3 + 1 = 28', 320, 330, { size: 13, color: T.amber, a: ease(clamp01(p * 2 - 0.8)) });
          g.text('16 filters → 16 × 28 = 448 params, 16 output channels', 320, 354, { size: 12, color: T.muted, a: ease(clamp01(p * 2 - 1)) });
          return;
        }
        // ---------- part 5
        if (s === 10) {
          const cs = 32, x1 = 30, x2 = 410, y = 74, t = ease(clamp01((p - 0.25) * 1.6));
          label(g, 'feature map (before)', x1 + 96, y - 20);
          grid(g, FM, x1, y, cs, { scale: 3 });
          label(g, 'after ReLU', x2 + 96, y - 20);
          grid(g, FM.map(r => r.map(v => (v < 0 ? v * (1 - t) : v))), x2, y, cs, { scale: 3, label: v => (Math.abs(v) < 0.05 ? '0' : fmt(Math.round(v))) });
          // relu graph
          const gx = 270, gy = 190, sz = 46;
          g.line([[gx - sz, gy], [gx + sz, gy]], { color: 'rgba(255,255,255,0.25)' }); g.line([[gx, gy + sz], [gx, gy - sz]], { color: 'rgba(255,255,255,0.25)' });
          g.line([[gx - sz, gy], [gx, gy], [gx + sz, gy - sz]], { color: T.amber, w: 2.4 });
          g.text('max(0, x)', gx, gy + sz + 18, { size: 12, color: T.amber });
          g.line([[x1 + 6 * cs + 8, y + 96], [gx - sz - 6, gy - 10]], { color: 'rgba(255,255,255,0.3)', arrow: true }); g.line([[gx + sz + 6, gy - 10], [x2 - 8, y + 96]], { color: 'rgba(255,255,255,0.3)', arrow: true });
          return;
        }
        if (s === 11) {
          const cs = 34, x1 = 30, y = 66, PC2 = 52, x2 = 440, y2 = 90;
          const win = Math.min(8, Math.floor(p * 10)), wi = Math.floor(win / 3), wj = win % 3;
          label(g, 'after ReLU (6×6)', x1 + 102, y - 18);
          grid(g, RL, x1, y, cs, { scale: 3 });
          for (let q = 0; q < 9; q++) frame(g, x1, y, cs, Math.floor(q / 3) * 2, (q % 3) * 2, 2, 'rgba(255,255,255,0.18)', 1);
          frame(g, x1, y, cs, wi * 2, wj * 2, 2);
          label(g, 'max-pooled (3×3)', x2 + 78, y2 - 22);
          grid(g, PL, x2, y2, PC2, { hide: (i, j) => i * 3 + j > win, scale: 3, size: 15 });
          frame(g, x2, y2, PC2, wi, wj, 1);
          const vals = [RL[2 * wi][2 * wj], RL[2 * wi][2 * wj + 1], RL[2 * wi + 1][2 * wj], RL[2 * wi + 1][2 * wj + 1]];
          g.text(`max(${vals.join(', ')}) = ${Math.max(...vals)}`, 320, 316, { size: 14, color: T.amber });
          g.text(`average pooling would give ${(vals.reduce((a, b) => a + b, 0) / 4).toFixed(2)}`, 320, 340, { size: 12, color: T.dim });
          g.line([[x1 + (wj * 2 + 2) * cs + 4, y + (wi * 2 + 1) * cs], [x2 - 6, y2 + wi * PC2 + PC2 / 2]], { color: T.amber, a: 0.5, dash: [3, 4], arrow: true });
          return;
        }
        // ---------- part 6
        if (s === 12) {
          const cs = 21, L0 = [24, 90], L1 = [250, 111], L2 = [456, 132];
          const a1 = ease(clamp01(p * 2)), a2 = ease(clamp01(p * 2 - 0.6));
          label(g, 'input 8×8', L0[0] + 84, L0[1] - 20); label(g, 'layer 1: 6×6', L1[0] + 63, L1[1] - 20); label(g, 'layer 2: 4×4', L2[0] + 42, L2[1] - 20);
          grid(g, IMG, L0[0], L0[1], cs, { binary: true, text: false });
          grid(g, FM, L1[0], L1[1], cs, { text: false, scale: 3 });
          grid(g, conv(relu(FM), [[0, 1, 0], [1, 1, 1], [0, 1, 0]]), L2[0], L2[1], cs, { text: false, scale: 6 });
          frame(g, L2[0], L2[1], cs, 1, 1, 1, T.amber);
          g.glow(L2[0] + 1.5 * cs, L2[1] + 1.5 * cs, 34, T.amber);
          frame(g, L1[0], L1[1], cs, 1, 1, 3, T.amber, a1);
          [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([u, v]) => g.line([[L2[0] + (1 + u) * cs, L2[1] + (1 + v) * cs], [L1[0] + (1 + 3 * u) * cs, L1[1] + (1 + 3 * v) * cs]], { color: T.amber, a: a1 * 0.45 }));
          frame(g, L0[0], L0[1], cs, 1, 1, 5, T.cyan, a2);
          [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([u, v]) => g.line([[L1[0] + (1 + 3 * u) * cs, L1[1] + (1 + 3 * v) * cs], [L0[0] + (1 + 5 * u) * cs, L0[1] + (1 + 5 * v) * cs]], { color: T.cyan, a: a2 * 0.4 }));
          g.text('1 neuron  ←  3×3 in layer 1  ←  5×5 in the image', 320, 330, { size: 13, color: T.soft, a: a2 });
          g.text('receptive field grows by (k − 1) per 3×3 layer, and doubles at each pooling', 320, 354, { size: 11, color: T.dim, a: a2 });
          return;
        }
        if (s === 13) {
          const maps = [relu(MH), RL, relu(MD)].map(pool);
          const pa = ease(clamp01(p * 2.5)), la = ease(clamp01(p * 2.5 - 0.9)), ba = ease(clamp01(p * 2.5 - 1.5));
          maps.forEach((M, k) => { grid(g, M, 26, 60 + k * 100, 22, { text: false, scale: 3 }); });
          label(g, '3 pooled maps', 59, 40);
          // flatten vector
          const VX = 170, VY = 52, VC = 10.5;
          const flat = maps.flatMap(M => M.flat());
          flat.forEach((v, i) => g.rr(VX, VY + i * VC, 18, VC - 1.5, 2, { fill: v ? g.cellColor(v / 3) : 'rgba(255,255,255,0.06)', a: pa }));
          label(g, 'flatten: 27', VX + 9, VY - 14, pa);
          g.line([[100, 200], [VX - 8, 200]], { color: 'rgba(255,255,255,0.35)', arrow: true, a: pa });
          // dense nodes
          const HX = 320, hid = 6;
          for (let h = 0; h < hid; h++) {
            const hy = 80 + h * 44;
            for (let i = 0; i < flat.length; i += 3) g.line([[VX + 18, VY + i * VC + 4], [HX - 10, hy]], { color: alpha(T.violet2, 0.12), a: la, w: 0.8 });
            g.dot(HX, hy, 9, alpha(T.violet, 0.5), la); g.ring(HX, hy, 9, T.violet2, 1.2, la);
          }
          label(g, 'dense', HX, 56, la);
          // outputs
          const probs = [0.01, 0.02, 0.03, 0.04, 0.01, 0.02, 0.01, 0.80, 0.03, 0.03], OX = 450;
          probs.forEach((pr, k) => {
            const oy = 56 + k * 29;
            for (let h = 0; h < hid; h++) g.line([[HX + 10, 80 + h * 44], [OX - 26, oy + 9]], { color: alpha(T.amber, 0.1), a: ba, w: 0.8 });
            g.text(String(k), OX - 14, oy + 10, { size: 12, color: k === 7 ? T.amber : T.muted, a: ba });
            g.rr(OX, oy + 2, Math.max(2, pr * 150 * ba), 16, 3, { fill: alpha(T.amber, k === 7 ? 0.95 : 0.35) });
            if (ba > 0.5) g.text(`${Math.round(pr * 100)}%`, OX + pr * 150 + 22, oy + 10, { size: 11, color: k === 7 ? T.amber : T.dim, a: ba });
          });
          label(g, 'softmax', OX + 50, 36, ba);
          return;
        }
        if (s === 14) {
          const t = ease(clamp01(p * 1.2));
          const R0 = [[0.3, -0.6, 0.1], [0.5, 0.2, -0.4], [-0.2, 0.7, 0.3]];
          const W = R0.map((r, i) => r.map((v, j) => lerp(v, FV[i][j], t)));
          label(g, 'filter weights', 104, 64);
          grid(g, W, 50, 84, 36, { scale: 1.1, label: v => v.toFixed(1).replace('-', '−'), size: 12 });
          g.text(t < 0.15 ? 'random at the start' : t > 0.9 ? 'a vertical-edge detector' : 'being updated…', 104, 210, { size: 12, color: T.amber });
          // loss curve
          const cx0 = 280, cy0 = 70, cw = 320, ch = 150;
          g.line([[cx0, cy0], [cx0, cy0 + ch], [cx0 + cw, cy0 + ch]], { color: 'rgba(255,255,255,0.25)' });
          const pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60; if (u > t) break; pts.push([cx0 + u * cw, cy0 + ch - (ch - 12) * (0.12 + 0.88 * Math.exp(-4.2 * u) + 0.03 * Math.sin(i * 1.7))]); }
          if (pts.length > 1) g.line(pts, { color: T.pink, w: 2.2 });
          g.text('loss', cx0 - 4, cy0 - 10, { size: 11, color: T.pink, align: 'left' });
          g.text('training steps →', cx0 + cw, cy0 + ch + 16, { size: 11, color: T.dim, align: 'right' });
          note(g, ['∂L/∂w = Σ (error at output pixel × input pixel under w)', 'w ← w − η · ∂L/∂w'], 50, 280, ease(clamp01(p * 2 - 0.3)), { mono: true, size: 13, lh: 28 });
          g.text('the same weight is used at every position, so its gradient adds up contributions from all 36 positions', 50, 344, { size: 11, color: T.dim, align: 'left', a: ease(clamp01(p * 2 - 0.6)) });
          return;
        }
        if (s === 15) {
          const y0 = 170;
          const stages = [
            { x: 46, label: 'image', sub: '28×28×1', draw: (x, a) => g.rr(x - 30, y0 - 30, 60, 60, 6, { fill: alpha(T.violet2, 0.5), stroke: T.violet2, a }) },
            { x: 160, label: 'conv + ReLU', sub: 'edges', draw: (x, a) => { for (let k = 3; k >= 0; k--) g.rr(x - 26 + k * 7, y0 - 30 - k * 7, 52, 52, 5, { fill: alpha(T.cyan, 0.18 + 0.1 * k), stroke: alpha(T.cyan, 0.8), a }); } },
            { x: 272, label: 'pool + conv', sub: 'strokes', draw: (x, a) => { for (let k = 5; k >= 0; k--) g.rr(x - 18 + k * 6, y0 - 22 - k * 6, 36, 36, 4, { fill: alpha(T.cyan, 0.14 + 0.08 * k), stroke: alpha(T.cyan, 0.8), a }); } },
            { x: 384, label: 'pool + conv', sub: 'parts', draw: (x, a) => { for (let k = 7; k >= 0; k--) g.rr(x - 11 + k * 5, y0 - 14 - k * 5, 22, 22, 3, { fill: alpha(T.green, 0.14 + 0.07 * k), stroke: alpha(T.green, 0.8), a }); } },
            { x: 494, label: 'flatten + dense', sub: 'combine', draw: (x, a) => { for (let k = 0; k < 10; k++) g.rr(x - 6, y0 - 50 + k * 10, 12, 8, 2, { fill: alpha(T.amber, 0.25 + (k === 7 ? 0.6 : 0)), a }); } },
            { x: 590, label: 'softmax', sub: '“7”', draw: (x, a) => g.text('7', x, y0, { size: 36, sans: true, weight: 600, color: T.amber, a }) },
          ];
          stages.forEach((st, i) => {
            const a = ease(clamp01(p * 2.4 - i * 0.22));
            st.draw(st.x, a);
            g.text(st.label, st.x, y0 + 64, { size: 12, color: T.soft, a });
            g.text(st.sub, st.x, y0 + 82, { size: 11, color: T.dim, a });
            if (i < stages.length - 1) g.line([[st.x + 40, y0], [stages[i + 1].x - 36, y0]], { color: 'rgba(255,255,255,0.4)', a, arrow: true });
          });
          g.flow([[86, y0], [556, y0]], time, { n: 6, color: T.amber, speed: 0.00025 });
          g.text('spatial size shrinks, channels grow: from “where” to “what”', 320, 320, { size: 13, color: T.muted, a: ease(clamp01(p * 2 - 1)) });
        }
      },
    });
  };

  // ================================================================== Linear regression (in depth)
  ex.ols = el => {
    const XS = [45, 55, 62, 70, 78, 85, 95, 104, 115, 125];          // house size, m²
    const YS = [32, 41, 40, 52, 50, 61, 63, 74, 76, 88];             // price, ₹ lakh
    const N = XS.length;
    const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
    const fit = (xs, ys) => { const mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; }); const w = sxy / sxx; return { w, b: my - w * mx, mx, my, sxy, sxx }; };
    const F = fit(XS, YS);
    const rss = (w, b, xs = XS, ys = YS) => xs.reduce((s, x, i) => s + (ys[i] - (w * x + b)) ** 2, 0);
    const TSS = YS.reduce((s, y) => s + (y - F.my) ** 2, 0), RSS = rss(F.w, F.b), R2 = 1 - RSS / TSS;
    const G = { w: 0.32, b: 30 };                                     // the first, deliberately poor guess
    const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2);
    // a plot box mapping data to canvas
    const plot = (x0, y0, w, h, xr = [35, 135], yr = [20, 100]) => ({
      x0, y0, w, h,
      X: x => x0 + ((x - xr[0]) / (xr[1] - xr[0])) * w,
      Y: y => y0 + h - ((y - yr[0]) / (yr[1] - yr[0])) * h,
      axes(g, a = 1, labels = true) {
        g.line([[x0, y0 + h], [x0 + w, y0 + h]], { color: 'rgba(255,255,255,0.25)', a }); g.line([[x0, y0], [x0, y0 + h]], { color: 'rgba(255,255,255,0.25)', a });
        if (labels) { g.text('size (m²) →', x0 + w, y0 + h + 16, { size: 10, color: T.dim, align: 'right', a }); g.text('price (₹ lakh)', x0 + 2, y0 - 10, { size: 10, color: T.dim, align: 'left', a }); }
      },
      pts(g, a = 1, xs = XS, ys = YS, r = 4.5) { xs.forEach((x, i) => g.dot(this.X(x), this.Y(ys[i]), r, T.violet2, a)); },
      line(g, w_, b_, o = {}) { const xa = o.from ?? 38, xb = o.to ?? 132; g.line([[this.X(xa), this.Y(w_ * xa + b_)], [this.X(xb), this.Y(w_ * xb + b_)]], { color: o.color || T.cyan, w: o.w || 2.2, a: o.a ?? 1, dash: o.dash }); },
    });
    const note = (g, lines, x, y, a = 1, o = {}) => lines.forEach((l, i) => g.text(l, x, y + i * (o.lh || 21), { size: o.size || 13, color: (o.colors && o.colors[i]) || o.color || T.soft, align: 'left', a, sans: !o.mono }));

    const steps = [
      { part: 'Part 1 · The question', t: 'Start with data: one input, one output', dur: 4600,
        d: 'Ten flats: their size in m² (the <strong>feature</strong> x) and their price in ₹ lakh (the <strong>target</strong> y). Each row becomes one point on a scatter plot. Bigger flats tend to cost more, roughly along a straight line.' },
      { part: 'Part 1 · The question', t: 'A model is a line: ŷ = w·x + b', dur: 5200,
        d: 'Linear regression predicts with a straight line. The <strong>slope w</strong> says how much the price rises per extra m² (rise ÷ run); the <strong>intercept b</strong> is where the line crosses x = 0. Different (w, b) give different lines. Here is a first guess: w = 0.32, b = 30.' },
      { part: 'Part 2 · Measuring error', t: 'Residuals: how wrong is each prediction?', dur: 4800,
        d: 'For each flat, the line predicts ŷ. The <strong>residual</strong> e = y − ŷ is the vertical gap between the real price and the line. Points above the line have positive residuals (we under-predicted), points below are negative.' },
      { part: 'Part 2 · Measuring error', t: 'Square every residual and add them up', dur: 5200,
        d: 'Turn each residual into a literal square with side |e|: its area is e². Adding the areas gives the <strong>residual sum of squares (RSS)</strong>, one number that measures how bad the whole line is. Divide by n and you get the mean squared error.' },
      { part: 'Part 2 · Measuring error', t: 'Why squares and not just distances?', dur: 5600,
        d: 'Squares make every error positive, punish a large miss far more than a small one (an error of 10 costs 100, an error of 2 costs 4), and give a smooth loss with exactly one minimum that can be solved with algebra. The price: a single outlier can carry a lot of weight.' },
      { part: 'Part 2 · Measuring error', t: 'The best line has the smallest total area', dur: 7000,
        d: 'Now try many slopes. Each line has its own RSS (the bar chart on the right). Somewhere in between “too flat” and “too steep” is the line whose squares add up to the least: the <strong>least-squares</strong> line.' },
      { part: 'Part 3 · Finding the best line', t: 'Every (w, b) has a loss: a bowl-shaped surface', dur: 5600,
        d: 'Plot RSS for every combination of slope and intercept and you get a bowl (here seen from above as contour lines). Our first guess sits high up the side; the best line is the single lowest point at the bottom. Because the bowl has one bottom, there is exactly one best answer.' },
      { part: 'Part 3 · Finding the best line', t: 'Solve it exactly with the averages', dur: 7400,
        d: 'For one feature the bottom of the bowl has a formula. Work out how far each x and y is from its mean, then <strong>w = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)²</strong> and <strong>b = ȳ − w·x̄</strong>. That is all: no iteration, no guessing.' },
      { part: 'Part 3 · Finding the best line', t: 'The least-squares line', dur: 5000,
        d: 'This is the best line for these ten flats. It always passes through the <strong>average point</strong> (x̄, ȳ), its residuals add up to zero, and no other straight line has a smaller sum of squared residuals.' },
      { part: 'Part 3 · Finding the best line', t: 'Or walk downhill: gradient descent', dur: 7600,
        d: 'Instead of a formula, start anywhere on the bowl and repeatedly step in the steepest downhill direction: w ← w − η·∂L/∂w, b ← b − η·∂L/∂b. Watch the line (right) improve with every step until it settles on the same answer. This is how models with millions of parameters are trained.' },
      { part: 'Part 4 · Many features', t: 'More features: the design matrix', dur: 6400,
        d: 'With several inputs (size, age, distance to the metro…) the model becomes ŷ = b + w₁x₁ + w₂x₂ + …. Put the features in a matrix X, add a <strong>column of 1s</strong> for the intercept, and all predictions are one matrix product: <strong>ŷ = Xβ</strong>. Each row of X times β gives one prediction. (Numbers illustrative.)' },
      { part: 'Part 4 · Many features', t: 'The normal equation is a projection', dur: 6400,
        d: 'Setting the gradient to zero gives <strong>XᵀXβ = Xᵀy</strong>, so β = (XᵀX)⁻¹Xᵀy. Geometrically: every possible prediction Xβ lies on a flat “plane” spanned by the columns of X. The best prediction ŷ is the point on that plane closest to y, the shadow of y, and the residual e sticks out at a right angle: Xᵀe = 0.' },
      { part: 'Part 5 · Is it any good?', t: 'R²: how much better than predicting the average?', dur: 6400,
        d: 'Compare the model’s squares (RSS, right) with the squares you would get by always predicting the average price (TSS, left). <strong>R² = 1 − RSS / TSS</strong>: the share of the variation in price that the line explains. 1 is perfect, 0 is no better than the mean.' },
      { part: 'Part 5 · Is it any good?', t: 'Residual plots: look for patterns', dur: 6400,
        d: 'Plot residuals against predictions. A shapeless band around 0 is what you want. A <strong>curve</strong> means the true relationship is not straight (add a squared term or transform). A <strong>funnel</strong> means errors grow with the prediction (try a log target).' },
      { part: 'Part 5 · Is it any good?', t: 'Reading the coefficients, and their limits', dur: 6400,
        d: 'The slope is a rate: each extra m² goes with about ₹{W} lakh more. With several features it means “with everything else held fixed”. Two warnings: this is <strong>association, not causation</strong>, and the line is only trustworthy inside the range of the data; extrapolating to a 300 m² penthouse is guesswork.' },
      { part: 'Part 5 · Is it any good?', t: 'One outlier can pull the whole line', dur: 6800,
        d: 'Because errors are squared, a single extreme point far from the others (a <strong>high-leverage</strong> point) can tilt the entire line toward itself. Always plot the data; if outliers are real errors, fix them; if they are genuine, consider robust regression (Huber, RANSAC).' },
    ];
    steps[14].d = steps[14].d.replace('{W}', F.w.toFixed(2));

    player(el, {
      title: 'Linear regression in depth, step by step', steps,
      draw(g, s, p, time) {
        const P1 = plot(60, 50, 300, 260);
        // ---------- part 1
        if (s === 0) {
          const ta = 1 - ease(clamp01((p - 0.55) * 3)) * 0.65;
          g.text('size', 64, 52, { size: 11, color: T.muted, a: ta }); g.text('price', 124, 52, { size: 11, color: T.muted, a: ta });
          XS.forEach((x, i) => {
            const y = 74 + i * 25, k = ease(clamp01(p * 2.2 - i * 0.08));
            g.rr(36, y - 10, 120, 21, 5, { fill: 'rgba(255,255,255,0.04)', a: ta * k });
            g.text(String(x), 64, y + 1, { size: 12, color: T.violet2, a: ta * k }); g.text(String(YS[i]), 124, y + 1, { size: 12, color: T.amber, a: ta * k });
            const fly = ease(clamp01((p - 0.3 - i * 0.03) * 2.2));
            const P2 = plot(250, 50, 340, 270);
            if (fly > 0) { const x0 = 156, y0 = y, x1 = P2.X(x), y1 = P2.Y(YS[i]); g.dot(lerp(x0, x1, fly), lerp(y0, y1, fly), 4.5, T.violet2, fly); }
          });
          const P2 = plot(250, 50, 340, 270); P2.axes(g, ease(clamp01(p * 2 - 0.4)));
          return;
        }
        const P = plot(56, 46, 330, 280);
        if (s === 1) {
          P.axes(g); P.pts(g);
          const a = ease(clamp01(p * 2));
          P.line(g, G.w, G.b, { a, color: T.amber });
          // slope triangle
          const ta = ease(clamp01(p * 2 - 0.8));
          const xa = 70, xb = 100, ya = G.w * xa + G.b, yb = G.w * xb + G.b;
          g.line([[P.X(xa), P.Y(ya)], [P.X(xb), P.Y(ya)], [P.X(xb), P.Y(yb)]], { color: T.cyan, a: ta, dash: [4, 3] });
          g.text('run = 30 m²', (P.X(xa) + P.X(xb)) / 2, P.Y(ya) + 14, { size: 11, color: T.cyan, a: ta });
          g.text(`rise = ${f1(yb - ya)}`, P.X(xb) + 8, (P.Y(ya) + P.Y(yb)) / 2, { size: 11, color: T.cyan, a: ta, align: 'left' });
          note(g, ['ŷ = w · x + b', '', `w = ${G.w}  (slope: rise ÷ run)`, `b = ${G.b}  (intercept)`, '', 'a guess, not yet the best'], 400, 110, ease(clamp01(p * 2 - 0.4)), { mono: true, size: 12, colors: [T.ink, '', T.cyan, T.cyan, '', T.amber] });
          return;
        }
        if (s >= 2 && s <= 4) {
          P.axes(g); P.line(g, G.w, G.b, { color: T.amber });
          const res = XS.map((x, i) => YS[i] - (G.w * x + G.b));
          XS.forEach((x, i) => {
            const k = ease(clamp01(p * 2.2 - i * 0.1)), yh = G.w * x + G.b;
            if (s === 2) {
              g.line([[P.X(x), P.Y(yh)], [P.X(x), P.Y(lerp(yh, YS[i], k))]], { color: res[i] > 0 ? T.cyan : T.pink, w: 2, a: 0.9 });
              if (i % 3 === 0) g.text(`${res[i] > 0 ? '+' : ''}${f1(res[i])}`, P.X(x) + 6, P.Y((YS[i] + yh) / 2), { size: 11, align: 'left', color: res[i] > 0 ? T.cyan : T.pink, a: k });
            } else {
              const side = Math.abs(P.Y(YS[i]) - P.Y(yh)) * (s === 3 ? k : 1);
              const top = Math.min(P.Y(YS[i]), P.Y(yh));
              g.rr(x > 90 ? P.X(x) - side : P.X(x), res[i] > 0 ? P.Y(yh) - side : P.Y(yh), side, side, 2, { fill: alpha(res[i] > 0 ? T.cyan : T.pink, 0.22), stroke: alpha(res[i] > 0 ? T.cyan : T.pink, 0.8), w: 1 });
              void top;
            }
          });
          P.pts(g);
          if (s === 2) note(g, ['e = y − ŷ', '', 'above the line → e > 0', 'below the line → e < 0'], 410, 120, ease(clamp01(p * 2)), { mono: true, colors: [T.ink, '', T.cyan, T.pink] });
          if (s === 3) {
            let run = 0; const shown = Math.min(N, Math.floor(p * 2.2 * 10 / 1.9));
            res.forEach((e, i) => { if (i < shown) run += e * e; });
            note(g, ['RSS = Σ e²', ''], 410, 100, 1, { mono: true, color: T.ink });
            res.slice(0, Math.min(shown, 10)).forEach((e, i) => g.text(`${f1(e).padStart(6)}² = ${f1(e * e).padStart(6)}`, 410, 140 + i * 17, { size: 11, align: 'left', color: T.muted }));
            g.text(`RSS = ${f1(run)}`, 410, 330, { size: 16, align: 'left', color: T.amber, weight: 500 });
          }
          if (s === 4) {
            const bx = 400, by = 300, bw = 22;
            g.text('|e|', bx, 70, { size: 11, color: T.muted, align: 'left' }); g.text('e²', bx + 120, 70, { size: 11, color: T.muted, align: 'left' });
            const mx = Math.max(...res.map(e => e * e));
            res.forEach((e, i) => {
              const k = ease(clamp01(p * 1.6));
              g.rr(bx, 84 + i * 21, (Math.abs(e) / Math.sqrt(mx)) * 100 * k, 14, 3, { fill: alpha(T.violet2, 0.7) });
              g.rr(bx + 120, 84 + i * 21, ((e * e) / mx) * 100 * k, 14, 3, { fill: alpha(T.amber, 0.8) });
            });
            g.text('the biggest misses dominate the squared total', 400, by + 22, { size: 11, color: T.dim, align: 'left', a: ease(clamp01(p * 2 - 0.8)) });
            void bw;
          }
          return;
        }
        if (s === 5) {
          P.axes(g); P.pts(g);
          const slopes = Array.from({ length: 13 }, (_, k) => 0.2 + k * 0.06);
          const k = Math.min(12, Math.floor(p * 15));
          const ws = slopes[k], bs = F.my - ws * F.mx;
          XS.forEach((x, i) => { const yh = ws * x + bs, side = Math.abs(P.Y(YS[i]) - P.Y(yh)); g.rr(x > 90 ? P.X(x) - side : P.X(x), YS[i] > yh ? P.Y(yh) - side : P.Y(yh), side, side, 2, { fill: alpha(T.amber, 0.16), stroke: alpha(T.amber, 0.6), w: 1 }); });
          P.line(g, ws, bs, { color: T.amber });
          const vals = slopes.map(w => rss(w, F.my - w * F.mx)), mx = Math.max(...vals);
          const bx = 410, by = 310;
          g.text('RSS for each slope tried', 500, 60, { size: 11, color: T.muted });
          vals.forEach((v, j) => { if (j > k) return; const h = (v / mx) * 220; const best = j === vals.indexOf(Math.min(...vals)); g.rr(bx + j * 15, by - h, 11, h, 2, { fill: alpha(best ? T.green : T.amber, j === k ? 0.95 : 0.45) }); });
          g.text(`w = ${f2(ws)}   RSS = ${Math.round(rss(ws, bs))}`, 500, 340, { size: 13, color: T.amber });
          return;
        }
        // ---------- part 3
        if (s === 6 || s === 9) {
          const C = { x0: s === 6 ? 60 : 30, y0: 50, w: s === 6 ? 330 : 270, h: 270 }, wr = [0.05, 1.15], br = [-25, 50];
          const W2X = w => C.x0 + ((w - wr[0]) / (wr[1] - wr[0])) * C.w, B2Y = b => C.y0 + C.h - ((b - br[0]) / (br[1] - br[0])) * C.h;
          const lo = RSS, hi = rss(wr[1], br[1]);
          const cs = 6;
          for (let px = 0; px < C.w; px += cs) for (let py = 0; py < C.h; py += cs) {
            const w = wr[0] + ((px + cs / 2) / C.w) * (wr[1] - wr[0]), b = br[0] + ((C.h - py - cs / 2) / C.h) * (br[1] - br[0]);
            const t = clamp01(Math.log(1 + (rss(w, b) - lo) / 40) / Math.log(1 + (hi - lo) / 40));
            const band = Math.abs(((t * 9) % 1) - 0.5) < 0.07 ? 0.18 : 0;
            g.c.fillStyle = `rgba(${Math.round(140 * (1 - t) + 30)},${Math.round(124 * (1 - t) + 20)},${Math.round(255 * (1 - t) + 50)},${0.22 + 0.5 * (1 - t) + band})`;
            g.c.fillRect(C.x0 + px, C.y0 + py, cs, cs);
          }
          g.text('slope w →', C.x0 + C.w, C.y0 + C.h + 16, { size: 10, color: T.dim, align: 'right' }); g.text('intercept b ↑', C.x0, C.y0 - 10, { size: 10, color: T.dim, align: 'left' });
          g.dot(W2X(F.w), B2Y(F.b), 5, T.green); g.ring(W2X(F.w), B2Y(F.b), 10, T.green, 1.5);
          if (s === 6) {
            g.dot(W2X(G.w), B2Y(G.b), 6, T.amber); g.text('first guess', W2X(G.w) + 10, B2Y(G.b) - 10, { size: 11, color: T.amber, align: 'left' });
            g.text('best (w, b)', W2X(F.w) + 14, B2Y(F.b) + 4, { size: 11, color: T.green, align: 'left' });
            note(g, ['RSS(w, b) for every line', '', `first guess: RSS = ${Math.round(rss(G.w, G.b))}`, `bottom:      RSS = ${Math.round(RSS)}`, '', 'one bowl, one lowest point'], 410, 120, ease(clamp01(p * 2)), { mono: true, colors: [T.ink, '', T.amber, T.green, '', T.muted] });
          } else {
            // gradient descent on standardised x, mapped back to (w, b)
            const sd = Math.sqrt(F.sxx / N), steps_ = Math.floor(p * 34), lr = 0.12;
            let a = (G.w * sd), c = G.w * F.mx + G.b; const path = [[G.w, G.b]];
            for (let it = 0; it < steps_; it++) {
              let ga = 0, gc = 0;
              XS.forEach((x, i) => { const z = (x - F.mx) / sd, e = a * z + c - YS[i]; ga += 2 * e * z / N; gc += 2 * e / N; });
              a -= lr * ga; c -= lr * gc; const w = a / sd; path.push([w, c - w * F.mx]);
            }
            g.line(path.map(([w, b]) => [W2X(w), B2Y(b)]), { color: T.amber, w: 1.6 });
            path.forEach(([w, b], k) => g.dot(W2X(w), B2Y(b), k === path.length - 1 ? 5 : 2.2, T.amber));
            const [cw, cb] = path[path.length - 1];
            const P3 = plot(350, 50, 260, 270);
            P3.axes(g, 1, false); P3.pts(g, 1, XS, YS, 3.6); P3.line(g, F.w, F.b, { color: T.green, a: 0.35, dash: [5, 4], w: 1.4 }); P3.line(g, cw, cb, { color: T.amber });
            g.text(`step ${path.length - 1}   RSS = ${Math.round(rss(cw, cb))}`, 480, 344, { size: 12, color: T.amber });
          }
          return;
        }
        if (s === 7) {
          const a = ease(clamp01(p * 1.5));
          const cols = ['x', 'y', 'x − x̄', 'y − ȳ', '(x−x̄)(y−ȳ)', '(x−x̄)²'], cx = [40, 92, 150, 222, 306, 400];
          cols.forEach((c, j) => g.text(c, cx[j] + 22, 44, { size: 11, color: T.muted, a }));
          XS.forEach((x, i) => {
            const dx = x - F.mx, dy = YS[i] - F.my, k = ease(clamp01(p * 2 - i * 0.06));
            [x, YS[i], dx, dy, dx * dy, dx * dx].forEach((v, j) => g.text(j < 2 ? String(v) : f1(v), cx[j] + 22, 66 + i * 20, { size: 11, color: j === 4 ? T.cyan : j === 5 ? T.violet2 : T.soft, a: k }));
          });
          const sa = ease(clamp01(p * 2 - 1));
          g.line([[40, 266], [470, 266]], { color: 'rgba(255,255,255,0.2)', a: sa });
          g.text(`x̄ = ${f1(F.mx)}`, 62, 282, { size: 11, color: T.ink, a: sa }); g.text(`ȳ = ${f1(F.my)}`, 114, 282, { size: 11, color: T.ink, a: sa });
          g.text(`Σ = ${f1(F.sxy)}`, cx[4] + 22, 282, { size: 12, color: T.cyan, a: sa }); g.text(`Σ = ${f1(F.sxx)}`, cx[5] + 22, 282, { size: 12, color: T.violet2, a: sa });
          const fa = ease(clamp01(p * 2 - 1.3));
          g.text(`w = ${f1(F.sxy)} / ${f1(F.sxx)} = ${f2(F.w)}`, 320, 318, { size: 15, color: T.cyan, a: fa });
          g.text(`b = ${f1(F.my)} − ${f2(F.w)} × ${f1(F.mx)} = ${f2(F.b)}`, 320, 344, { size: 15, color: T.amber, a: fa });
          return;
        }
        if (s === 8) {
          P.axes(g); P.pts(g);
          P.line(g, F.w, F.b, { color: T.green, a: ease(clamp01(p * 2)) });
          P.line(g, G.w, G.b, { color: T.amber, a: 0.3, dash: [5, 4], w: 1.4 });
          const ca = ease(clamp01(p * 2 - 0.6));
          g.line([[P.X(F.mx), P.Y(20)], [P.X(F.mx), P.Y(F.my)]], { color: T.ink, a: ca * 0.3, dash: [3, 3] }); g.line([[P.X(35), P.Y(F.my)], [P.X(F.mx), P.Y(F.my)]], { color: T.ink, a: ca * 0.3, dash: [3, 3] });
          g.ring(P.X(F.mx), P.Y(F.my), 9, T.ink, 2, ca); g.text('(x̄, ȳ)', P.X(F.mx) + 12, P.Y(F.my) + 16, { size: 11, color: T.ink, a: ca, align: 'left' });
          note(g, [`ŷ = ${f2(F.w)} · x ${F.b < 0 ? '−' : '+'} ${f2(Math.abs(F.b))}`, '', `RSS: ${Math.round(rss(G.w, G.b))} (guess) → ${Math.round(RSS)}`, `Σ residuals = ${f2(XS.reduce((sm, x, i) => sm + YS[i] - (F.w * x + F.b), 0))}`, 'passes through (x̄, ȳ)'], 410, 120, ease(clamp01(p * 2 - 0.3)), { mono: true, colors: [T.green, '', T.amber, T.muted, T.muted] });
          return;
        }
        // ---------- part 4
        if (s === 10) {
          const rows = [[1, 72, 8], [1, 95, 15], [1, 58, 3], [1, 110, 22], [1, 84, 10]], beta = [12, 0.62, -0.35];
          const cs = 34, X0 = 40, Y0 = 92, k = Math.min(4, Math.floor(p * 6));
          g.text('X  (1s · size · age)', X0 + 51, Y0 - 24, { size: 11, color: T.muted });
          rows.forEach((r, i) => r.forEach((v, j) => { g.rr(X0 + j * cs + 1, Y0 + i * cs + 1, cs - 2, cs - 2, 4, { fill: j === 0 ? alpha(T.amber, 0.35) : alpha(T.cyan, 0.18), stroke: i === k ? T.amber : null }); g.text(String(v), X0 + j * cs + cs / 2, Y0 + i * cs + cs / 2 + 1, { size: 12, color: T.ink }); }));
          g.text('×', X0 + 3 * cs + 18, Y0 + 2.5 * cs, { size: 18, color: T.muted });
          const BX = X0 + 3 * cs + 38;
          g.text('β', BX + 24, Y0 - 24, { size: 11, color: T.muted });
          beta.forEach((v, i) => { g.rr(BX, Y0 + i * cs + 1 + cs, 48, cs - 2, 4, { fill: alpha(T.violet, 0.25) }); g.text(String(v), BX + 24, Y0 + (i + 1) * cs + cs / 2 + 1, { size: 12, color: T.ink }); });
          g.text('=', BX + 66, Y0 + 2.5 * cs, { size: 18, color: T.muted });
          const YX = BX + 86;
          g.text('ŷ', YX + 30, Y0 - 24, { size: 11, color: T.muted });
          rows.forEach((r, i) => { const v = r.reduce((sm, x, j) => sm + x * beta[j], 0); if (i <= k) { g.rr(YX, Y0 + i * cs + 1, 60, cs - 2, 4, { fill: alpha(T.green, i === k ? 0.4 : 0.18) }); g.text(f2(v), YX + 30, Y0 + i * cs + cs / 2 + 1, { size: 12, color: T.ink }); } });
          const r = rows[k];
          g.text(`row ${k + 1}:  1×${beta[0]} + ${r[1]}×${beta[1]} + ${r[2]}×(${beta[2]}) = ${f2(r.reduce((sm, x, j) => sm + x * beta[j], 0))}`, 320, 300, { size: 13, color: T.amber });
          g.text('n rows × (p + 1) columns   ·   one weight per column', 320, 330, { size: 11, color: T.dim });
          return;
        }
        if (s === 11) {
          const a = ease(clamp01(p * 2));
          const O = [150, 270], u = [170, -20], v = [70, -70];
          const pl = [[O[0], O[1]], [O[0] + u[0] * 1.6, O[1] + u[1] * 1.6], [O[0] + u[0] * 1.6 + v[0] * 1.6, O[1] + u[1] * 1.6 + v[1] * 1.6], [O[0] + v[0] * 1.6, O[1] + v[1] * 1.6]].map(([x, y]) => [x - 60, y + 20]);
          g.c.beginPath(); pl.forEach(([x, y], i) => (i ? g.c.lineTo(x, y) : g.c.moveTo(x, y))); g.c.closePath(); g.c.fillStyle = alpha(T.violet, 0.14 * a + 0.04); g.c.fill(); g.c.strokeStyle = alpha(T.violet2, 0.5); g.c.stroke();
          g.text('all possible Xβ (column space of X)', 250, 318, { size: 11, color: T.violet2, a });
          const yhat = [O[0] + 180, O[1] - 66], yv = [yhat[0], yhat[1] - 150 * ease(clamp01(p * 1.6))];
          g.line([O, [O[0] + u[0] * 0.9, O[1] + u[1] * 0.9]], { color: alpha(T.cyan, 0.7), arrow: true }); g.text('x₁', O[0] + u[0] * 0.9 + 10, O[1] + u[1] * 0.9 + 8, { size: 12, color: T.cyan });
          g.line([O, [O[0] + v[0] * 0.9, O[1] + v[1] * 0.9]], { color: alpha(T.cyan, 0.7), arrow: true }); g.text('1s', O[0] + v[0] * 0.9 - 10, O[1] + v[1] * 0.9 - 6, { size: 12, color: T.cyan });
          g.line([O, [yhat[0], yv[1]]], { color: T.amber, w: 2.2, arrow: true }); g.text('y (actual prices)', yhat[0] + 8, yv[1] - 4, { size: 12, color: T.amber, align: 'left' });
          const sa = ease(clamp01(p * 2 - 0.7));
          g.line([O, yhat], { color: T.green, w: 2.2, arrow: true, a: sa }); g.text('ŷ = Xβ', yhat[0] + 10, yhat[1] + 14, { size: 12, color: T.green, align: 'left', a: sa });
          g.line([yhat, [yhat[0], yv[1] + 6]], { color: T.pink, dash: [4, 3], a: sa, w: 1.8 }); g.text('e = y − ŷ', yhat[0] - 8, (yhat[1] + yv[1]) / 2, { size: 12, color: T.pink, align: 'right', a: sa });
          g.rr(yhat[0], yhat[1] - 10, 10, 10, 0, { stroke: T.pink, a: sa });
          note(g, ['XᵀX β = Xᵀy', 'β = (XᵀX)⁻¹ Xᵀy', '', 'residual ⟂ every column:', 'Xᵀ e = 0'], 440, 90, ease(clamp01(p * 2 - 1)), { mono: true, colors: [T.ink, T.ink, '', T.muted, T.pink] });
          return;
        }
        // ---------- part 5
        if (s === 12) {
          const L = plot(36, 60, 250, 230), R = plot(350, 60, 250, 230);
          const a = ease(clamp01(p * 2));
          [L, R].forEach(Q => { Q.axes(g, 1, false); });
          L.line(g, 0, F.my, { color: T.muted, dash: [5, 4] }); R.line(g, F.w, F.b, { color: T.green });
          XS.forEach((x, i) => {
            [[L, F.my, T.pink], [R, F.w * x + F.b, T.cyan]].forEach(([Q, yh, col]) => { const side = Math.abs(Q.Y(YS[i]) - Q.Y(yh)) * a; g.rr(x > 90 ? Q.X(x) - side : Q.X(x), YS[i] > yh ? Q.Y(yh) - side : Q.Y(yh), side, side, 2, { fill: alpha(col, 0.18), stroke: alpha(col, 0.7), w: 1 }); });
          });
          L.pts(g, 1, XS, YS, 3.6); R.pts(g, 1, XS, YS, 3.6);
          g.text(`predict the mean: TSS = ${Math.round(TSS)}`, 161, 44, { size: 12, color: T.pink });
          g.text(`the line: RSS = ${Math.round(RSS)}`, 475, 44, { size: 12, color: T.cyan });
          const ra = ease(clamp01(p * 2 - 0.9));
          g.text(`R² = 1 − ${Math.round(RSS)} / ${Math.round(TSS)} = ${R2.toFixed(3)}`, 320, 334, { size: 16, color: T.amber, a: ra });
          g.text(`the line explains ${Math.round(R2 * 100)}% of the variation in price`, 320, 358, { size: 12, color: T.muted, a: ra });
          return;
        }
        if (s === 13) {
          const panels = [['good: random band', (u, R0) => R0() * 2 - 1], ['curve: missing non-linearity', u => (u - 0.5) * (u - 0.5) * 9 - 0.7 + (Math.sin(u * 40) * 0.15)], ['funnel: unequal variance', (u, R0) => (R0() * 2 - 1) * (0.15 + u * 1.4)]];
          panels.forEach(([title, fn], k) => {
            const a = ease(clamp01(p * 2.2 - k * 0.4)), x0 = 26 + k * 205, y0 = 80, w = 180, h = 200;
            let seed = 7 + k; const R0 = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
            g.rr(x0, y0, w, h, 10, { fill: 'rgba(255,255,255,0.03)', stroke: 'rgba(255,255,255,0.12)', a });
            g.line([[x0 + 8, y0 + h / 2], [x0 + w - 8, y0 + h / 2]], { color: 'rgba(255,255,255,0.3)', dash: [4, 3], a });
            for (let i = 0; i < 40; i++) { const u = i / 39, r = fn(u, R0); g.dot(x0 + 12 + u * (w - 24), y0 + h / 2 - r * (h / 2 - 16), 2.8, k === 0 ? T.green : k === 1 ? T.amber : T.pink, a); }
            g.text(title, x0 + w / 2, y0 + h + 22, { size: 12, color: k === 0 ? T.green : k === 1 ? T.amber : T.pink, a });
            g.text('residual', x0 + 8, y0 - 8, { size: 10, color: T.dim, align: 'left', a }); g.text('prediction →', x0 + w - 6, y0 + h - 8, { size: 10, color: T.dim, align: 'right', a });
          });
          return;
        }
        if (s === 14) {
          const Q = plot(56, 46, 300, 270, [35, 320], [0, 210]);
          Q.axes(g); Q.pts(g, 1, XS, YS, 3.6);
          Q.line(g, F.w, F.b, { color: T.green, from: 40, to: 130 });
          const ea = ease(clamp01(p * 2 - 0.6));
          Q.line(g, F.w, F.b, { color: T.pink, from: 130, to: 310, dash: [6, 5], a: ea });
          g.rr(Q.X(40), Q.Y(205), Q.X(130) - Q.X(40), Q.Y(0) - Q.Y(205), 0, { fill: alpha(T.green, 0.05), a: 1 });
          g.text('range of the data', (Q.X(40) + Q.X(130)) / 2, Q.Y(205) + 14, { size: 10, color: T.green });
          g.text('300 m²?', Q.X(300), Q.Y(F.w * 300 + F.b) - 14, { size: 12, color: T.pink, a: ea });
          note(g, [`slope ${f2(F.w)}: +₹${f2(F.w)} lakh per m²`, `→ +₹${f1(F.w * 10)} lakh per 10 m²`, '', 'association, not causation', 'valid only inside the data'], 386, 110, ease(clamp01(p * 2)), { mono: true, size: 12, colors: [T.green, T.green, '', T.amber, T.pink] });
          return;
        }
        if (s === 15) {
          const t = ease(clamp01((p - 0.15) * 1.6));
          const xs = XS.concat([150]), ys = YS.concat([lerp(102, 30, t)]);
          const Q = plot(56, 46, 330, 280, [35, 160], [10, 110]);
          Q.axes(g); Q.pts(g, 1, XS, YS);
          g.dot(Q.X(150), Q.Y(ys[N]), 6, T.pink); g.ring(Q.X(150), Q.Y(ys[N]), 11, T.pink, 1.5);
          const F2 = fit(xs, ys);
          Q.line(g, F.w, F.b, { color: T.green, a: 0.4, dash: [5, 4], w: 1.4, to: 158 });
          Q.line(g, F2.w, F2.b, { color: T.amber, to: 158 });
          g.text('outlier', Q.X(150) - 8, Q.Y(ys[N]) + 22, { size: 11, color: T.pink });
          note(g, [`slope without it: ${f2(F.w)}`, `slope with it:    ${f2(F2.w)}`, '', 'one point, far out on x,', 'tilts the whole line'], 410, 120, 1, { mono: true, colors: [T.green, T.amber, '', T.muted, T.muted] });
        }
      },
    });
  };

  // ================================================================== RNN
  ex.rnn = el => {
    const words = ['the', 'film', 'was', 'not', 'very', 'good'];
    const w = 0.7, X0 = 34, DX = 100, CW = 72, CY = 184, CH = 54;
    const cx = k => X0 + k * DX;
    player(el, {
      title: 'Watch an RNN read a sentence',
      steps: [
        { t: 'An RNN reads one word at a time', d: 'Each word arrives as a vector (an embedding). The network has to build up an understanding as it goes, left to right.', dur: 2600 },
        { t: 'Each step mixes the new word with the memory so far', d: 'The cell takes the current word $x_t$ and the previous memory $h_{t-1}$ and produces a new memory $h_t = \\tanh(W_h h_{t-1} + W_x x_t)$.', dur: 3200 },
        { t: 'The same cell is reused at every step', d: 'These are not six different networks: it is one cell with one set of weights, applied six times. That is why an RNN can read sequences of any length.', dur: 5200 },
        { t: 'The memory is a blend of everything read so far', d: 'Each bar shows what the memory $h_t$ is made of. Every new word adds its own colour on top of what came before.', dur: 3600 },
        { t: 'But older words fade away', d: 'Each step multiplies the old memory by the recurrent weight (here 0.7). After five steps, “the” has shrunk to $0.7^5 \\approx 17\\%$ of its original strength, and keeps falling.', dur: 4000 },
        { t: 'Training has the same problem: vanishing gradients', d: 'To learn, the error signal must travel backwards through every step, and it is multiplied by about the same factor each time. By the time it reaches the start it is tiny, so early words barely influence learning.', dur: 4400 },
        { t: 'The last memory is used for the answer', d: 'To classify the sentence (for example, sentiment), a small output layer reads the final memory $h_6$. GRUs and LSTMs keep the same loop but add gates so important words do not fade.', dur: 4000 },
      ],
      draw(g, s, p, time) {
        const reached = s === 0 ? 0 : s === 1 ? 1 : s === 2 ? Math.min(6, 1 + Math.floor(p * 5.99)) : 6;
        // words and input arrows
        words.forEach((wd, k) => {
          const a = s === 0 ? ease(clamp01(p * 2 - k * 0.15)) : 1;
          g.rr(cx(k) + 6, 316, CW - 12, 30, 15, { fill: alpha(T.pal[k], 0.18), stroke: alpha(T.pal[k], 0.8), a });
          g.text(wd, cx(k) + CW / 2, 331, { size: 13, color: T.ink, a, sans: true });
          g.text(`x${k + 1}`, cx(k) + CW / 2, 362, { size: 10, color: T.dim, a });
          g.line([[cx(k) + CW / 2, 314], [cx(k) + CW / 2, CY + CH + 4]], { color: alpha(T.pal[k], 0.7), a: a * (k < reached || s === 0 ? 1 : 0.25), arrow: true });
        });
        // cells
        for (let k = 0; k < 6; k++) {
          const on = k < reached;
          const active = (s === 1 && k === 0) || (s === 2 && k === reached - 1);
          if (active) g.glow(cx(k) + CW / 2, CY + CH / 2, 70, T.violet, 0.9);
          g.rr(cx(k), CY, CW, CH, 10, { fill: on ? 'rgba(140,124,255,0.22)' : 'rgba(255,255,255,0.04)', stroke: on ? T.violet2 : 'rgba(255,255,255,0.18)', w: active ? 2 : 1.2 });
          g.text('RNN', cx(k) + CW / 2, CY + CH / 2 - 6, { size: 12, color: on ? T.ink : T.dim, weight: 500 });
          g.text('cell', cx(k) + CW / 2, CY + CH / 2 + 10, { size: 10, color: T.dim });
          if (k < 5) {
            const a = k + 1 < reached ? 1 : 0.25;
            g.line([[cx(k) + CW + 2, CY + CH / 2], [cx(k + 1) - 3, CY + CH / 2]], { color: T.violet2, a, arrow: true, w: 1.6 });
            g.text(`h${k + 1}`, cx(k) + CW + (DX - CW) / 2, CY + CH / 2 - 12, { size: 10, color: T.violet2, a });
          }
        }
        g.line([[2, CY + CH / 2], [cx(0) - 3, CY + CH / 2]], { color: T.violet2, a: 0.6, arrow: true });
        g.text('h0', 12, CY + CH / 2 - 12, { size: 10, color: T.violet2, a: 0.6 });
        // pulse travelling
        if (s === 1) { const t = ease(p); const [x, y] = t < 0.5 ? [cx(0) + CW / 2, lerp(314, CY + CH / 2, t * 2)] : [lerp(cx(0) + CW / 2, cx(1) - 4, (t - 0.5) * 2), CY + CH / 2]; g.dot(x, y, 6, T.pal[0]); g.glow(x, y, 22, T.pal[0]); }
        if (s === 2) {
          const x = lerp(cx(0) + CW / 2, cx(5) + CW / 2, ease(p)); g.dot(x, CY + CH / 2, 5, T.amber); g.glow(x, CY + CH / 2, 26, T.amber);
          const ba = ease(clamp01((p - 0.5) * 3));
          g.line([[cx(0), CY - 14], [cx(5) + CW, CY - 14]], { color: T.amber, a: ba * 0.8 });
          g.line([[cx(0), CY - 20], [cx(0), CY - 8]], { color: T.amber, a: ba * 0.8 }); g.line([[cx(5) + CW, CY - 20], [cx(5) + CW, CY - 8]], { color: T.amber, a: ba * 0.8 });
          g.text('one cell, same weights W, reused at every step', 320, CY - 30, { size: 12, color: T.amber, a: ba });
        }
        // memory composition bars
        if (s >= 3 && s <= 4) {
          const ba = s === 3 ? ease(p) : 1;
          for (let k = 0; k < 6; k++) {
            const raw = Array.from({ length: k + 1 }, (_, j) => Math.pow(w, k - j));
            const tot = raw.reduce((a, b) => a + b, 0);
            let y = CY - 16;
            const BH = 100;
            raw.forEach((r, j) => {
              const h = (r / tot) * BH * (s === 3 ? clamp01(p * 1.6 - k * 0.1) : 1);
              const hi = s === 4 && j === 0;
              g.rr(cx(k) + 18, y - h, CW - 36, Math.max(0, h - 1), 2, { fill: alpha(T.pal[j], hi ? 0.95 : s === 4 ? 0.35 : 0.8), a: ba });
              y -= h;
            });
            if (s === 4) {
              const share = Math.pow(w, k);
              g.text(`${Math.round(share * 100)}%`, cx(k) + CW / 2, CY - 128, { size: 12, color: T.pal[0], a: ease(clamp01(p * 3 - k * 0.3)) });
            }
          }
          g.text(s === 4 ? 'strength of “the” left in the memory (×0.7 per step)' : 'what each memory h is made of', 320, 26, { size: 12, color: T.muted, a: ba });
        }
        // backward gradient
        if (s === 5) {
          const t = ease(p), x = lerp(cx(5) + CW / 2, cx(0) + CW / 2, t);
          const strength = Math.pow(w, t * 5);
          const gy = CY - 40;
          g.dot(x, gy, 2 + 9 * strength, T.pink); g.glow(x, gy, 10 + 30 * strength, T.pink);
          g.line([[cx(5) + CW / 2, gy], [x + 10, gy]], { color: T.pink, a: 0.35, dash: [3, 4] });
          g.text(`gradient strength ${Math.round(strength * 100)}%`, x, gy - 26, { size: 12, color: T.pink });
          g.text('← error signal travelling back in time', 320, 40, { size: 12, color: T.muted });
        }
        // output
        if (s === 6) {
          const a = ease(p);
          g.line([[cx(5) + CW / 2, CY - 2], [cx(5) + CW / 2, 104]], { color: T.green, a, arrow: true, w: 1.8 });
          g.rr(cx(5) - 34, 50, CW + 68, 52, 10, { fill: alpha(T.green, 0.12), stroke: T.green, a });
          g.text('output layer', cx(5) + CW / 2, 66, { size: 11, color: T.dim, a });
          g.text('sentiment: negative', cx(5) + CW / 2, 86, { size: 13, color: T.green, a, sans: true, weight: 600 });
          g.text('needs “not” (step 4) to survive until step 6', cx(2) + 40, 76, { size: 12, color: T.muted, a });
          g.flow([[cx(0) + CW / 2, CY + CH / 2], [cx(5) + CW / 2, CY + CH / 2], [cx(5) + CW / 2, 104]], time, { n: 5, color: T.green, speed: 0.0004, a });
        }
      },
    });
  };

  // ================================================================== GRU
  ex.gru = el => {
    // geometry
    const HW = 112, MIX = [440, HW], RB = [190, 214], ZB = [290, 214], CB = [370, 214], BW = 58, BH = 36, XM = [228, 160], BUS = 284;
    player(el, {
      title: 'Inside a GRU cell',
      steps: [
        { t: 'A GRU is an RNN cell with two gates', d: 'Memory flows along the top line, from the previous state $h_{t-1}$ to the new state $h_t$. The new input $x_t$ comes in from below. Two small gates decide how the two meet.', dur: 3600 },
        { t: 'Reset gate r: how much past to use', d: 'The reset gate (a sigmoid, between 0 and 1) scales the old memory before it is used to propose new content. With r ≈ 0 the proposal ignores the past, which helps start a fresh thought.', dur: 3800 },
        { t: 'Candidate h̃: a proposal for new memory', d: 'A tanh layer combines the new input with the reset-scaled memory into a candidate $\\tilde h_t$. Nothing is written yet; it is only a suggestion.', dur: 3600 },
        { t: 'Update gate z: keep or replace', d: 'The update gate mixes the two: $h_t = (1 - z)\\,h_{t-1} + z\\,\\tilde h_t$. With z ≈ 0 the old memory passes through; with z ≈ 1 it is replaced by the candidate.', dur: 5200 },
        { t: 'The trick: write rarely, keep the rest', d: 'Over a sentence, z opens (bright bars) only when something worth remembering arrives and stays near 0 otherwise. The memory line stays flat between writes, so information and gradients survive many steps.', dur: 5600 },
      ],
      draw(g, s, p, time) {
        const hi = k => (k === s ? 1 : s === 0 || s === 4 ? 0.85 : 0.35);
        const dim = s === 4 ? 1 - 0.85 * ease(clamp01(p * 3)) : 1;
        // cell outline
        g.rr(140, 64, 380, 250, 18, { fill: 'rgba(255,255,255,0.025)', stroke: 'rgba(255,255,255,0.16)', a: dim });
        g.text('GRU cell', 168, 82, { size: 11, color: T.dim, align: 'left', a: dim });
        // memory highway
        g.line([[20, HW], [MIX[0] - 16, HW]], { color: T.violet2, w: 2.2, a: dim });
        g.line([[MIX[0] + 16, HW], [620, HW]], { color: T.violet2, w: 2.2, arrow: true, a: dim });
        g.text('h(t−1)', 40, HW - 16, { size: 12, color: T.violet2, a: dim });
        g.text('h(t)', 604, HW - 16, { size: 12, color: T.violet2, a: dim });
        if (s === 0) g.flow([[20, HW], [620, HW]], time, { n: 6, color: T.violet2, speed: 0.00035 });
        // x input and bus
        g.line([[160, 384], [160, BUS], [CB[0] + BW / 2, BUS]], { color: T.green, a: dim * (s === 1 || s === 2 || s === 3 ? 0.9 : 0.6) });
        g.text('x(t)', 160, 372, { size: 12, color: T.green, a: dim, align: 'left' });
        [RB, ZB, CB].forEach(b => g.line([[b[0] + BW / 2, BUS], [b[0] + BW / 2, b[1] + BH + 2]], { color: T.green, a: dim * 0.6, arrow: true }));
        // reset path: highway -> x node -> candidate
        g.line([[XM[0], HW], [XM[0], XM[1] - 12]], { color: T.violet2, a: dim * hi(1), arrow: true });
        g.line([[RB[0] + BW / 2, RB[1]], [XM[0], XM[1] + 12]], { color: T.amber, a: dim * hi(1), arrow: true });
        g.line([[XM[0] + 12, XM[1]], [CB[0] + BW / 2, XM[1]], [CB[0] + BW / 2, CB[1] - 2]], { color: T.violet2, a: dim * Math.max(hi(1), hi(2)), arrow: true });
        g.ring(XM[0], XM[1], 12, T.amber, 1.6, dim * hi(1)); g.text('×', XM[0], XM[1] + 1, { size: 14, color: T.amber, a: dim * hi(1) });
        // update path: z box -> mix ; candidate -> mix
        g.line([[ZB[0] + BW / 2, ZB[1]], [ZB[0] + BW / 2, 182], [MIX[0] - 6, 182], [MIX[0] - 6, MIX[1] + 15]], { color: T.amber, a: dim * hi(3), arrow: true });
        g.line([[CB[0] + BW, CB[1] + BH / 2], [MIX[0] + 8, CB[1] + BH / 2], [MIX[0] + 8, MIX[1] + 15]], { color: T.cyan, a: dim * Math.max(hi(2), hi(3)), arrow: true });
        // boxes
        const box = (b, label, sub, color, k) => {
          if (s === k) g.glow(b[0] + BW / 2, b[1] + BH / 2, 60, color);
          g.rr(b[0], b[1], BW, BH, 8, { fill: alpha(color, 0.16), stroke: color, a: dim * hi(k), w: s === k ? 2 : 1.2 });
          g.text(label, b[0] + BW / 2, b[1] + BH / 2 - 5, { size: 13, color: T.ink, a: dim * hi(k), sans: true, weight: 600 });
          g.text(sub, b[0] + BW / 2, b[1] + BH / 2 + 10, { size: 10, color: T.dim, a: dim * hi(k) });
        };
        box(RB, 'r', 'σ reset', T.amber, 1);
        box(ZB, 'z', 'σ update', T.amber, 3);
        box(CB, 'h̃', 'tanh', T.cyan, 2);
        // mix node with dial
        const z = s === 3 ? 0.5 - 0.5 * Math.cos(time * 0.0016) : s === 4 ? 0.1 : 0.3;
        if (s === 3) g.glow(MIX[0], MIX[1], 50, T.amber);
        g.dot(MIX[0], MIX[1], 15, '#0d0c14', dim); g.ring(MIX[0], MIX[1], 15, T.amber, 1.8, dim * hi(3));
        g.c.beginPath(); g.c.arc(MIX[0], MIX[1], 15, -Math.PI / 2, -Math.PI / 2 + z * Math.PI * 2); g.c.strokeStyle = T.amber; g.c.lineWidth = 4; g.c.globalAlpha = dim * hi(3); g.c.stroke(); g.c.globalAlpha = 1;
        g.text('mix', MIX[0], MIX[1] + 1, { size: 10, color: T.ink, a: dim });
        if (s === 1) { g.flow([[XM[0], HW], [XM[0], XM[1]], [CB[0] + BW / 2, XM[1]], [CB[0] + BW / 2, CB[1]]], time, { n: 4, color: T.violet2, speed: 0.0006 }); g.text('r = 0.6 → use 60% of the old memory', 330, 344, { size: 12, color: T.amber }); }
        if (s === 2) { g.flow([[160, 384], [160, BUS], [CB[0] + BW / 2, BUS], [CB[0] + BW / 2, CB[1] + BH]], time, { n: 4, color: T.green, speed: 0.0006 }); g.flow([[CB[0] + BW, CB[1] + BH / 2], [MIX[0] + 8, CB[1] + BH / 2], [MIX[0] + 8, MIX[1] + 15]], time, { n: 3, color: T.cyan, speed: 0.0007 }); }
        if (s === 3) {
          const col = `rgb(${Math.round(lerp(179, 86, z))},${Math.round(lerp(171, 217, z))},255)`;
          g.flow([[MIX[0] + 16, HW], [620, HW]], time, { n: 5, color: col, speed: 0.0005, r: 4 });
          g.text(`z = ${z.toFixed(2)}`, MIX[0], 60, { size: 13, color: T.amber });
          g.text(z < 0.3 ? 'keep the old memory' : z > 0.7 ? 'replace with the candidate' : 'blend old and new', MIX[0], 42, { size: 12, color: T.soft });
        }
        // timeline
        if (s === 4) {
          const a = ease(p), words = ['the', 'cat', ',', 'which', 'was', 'very', 'old', ',', 'slept'];
          const zs = [0.9, 0.95, 0.05, 0.08, 0.04, 0.06, 0.1, 0.04, 0.5];
          const x0 = 40, dx = 64, top = 300;
          g.rr(20, 200, 600, 192, 14, { fill: '#0b0b10', stroke: 'rgba(255,255,255,0.14)' });
          g.text('update gate z over a sentence', 320, 220, { size: 12, color: T.muted, a });
          let mem = 0; const pts = [];
          words.forEach((wd, k) => {
            mem = (1 - zs[k]) * mem + zs[k] * (k === 1 ? 1 : k === 0 ? 0.5 : 0.4);
            pts.push([x0 + k * dx + 20, top - mem * 34]);
            const show = clamp01(p * 1.4 - k * 0.07);
            g.rr(x0 + k * dx + 12, 362 - zs[k] * 40, 16, zs[k] * 40, 3, { fill: alpha(T.amber, 0.25 + 0.7 * zs[k]), a: a * show });
            g.text(wd, x0 + k * dx + 20, 374, { size: 11, color: T.soft, a: a * show });
          });
          g.line(pts.slice(0, Math.max(2, Math.ceil(p * 1.4 * pts.length))), { color: T.cyan, w: 2, a });
          g.text('memory', 34, top - 34, { size: 10, color: T.cyan, a, align: 'left' });
          g.text('z', 26, 345, { size: 11, color: T.amber, a, align: 'left' });
        }
      },
    });
  };

  // ================================================================== LSTM
  ex.lstm = el => {
    const BELT = 104, BUS = 318, FX = 200, IX = 272, CX = 336, OX = 410, BY = 236, BW = 52, BH = 38, PLUS = [304, BELT], IMUL = [304, 176], TANH = [470, 170], OMUL = [470, 252];
    player(el, {
      title: 'Inside an LSTM cell',
      steps: [
        { t: 'Two lines run through every LSTM cell', d: 'The top line is the <strong>cell state</strong> $c$: long-term memory, a conveyor belt through time. The bottom line carries the <strong>hidden state</strong> $h$ (what the cell shows) together with the new input $x_t$.', dur: 4000 },
        { t: 'Forget gate f: what to erase', d: 'For each memory slot, a sigmoid outputs a number between 0 (erase) and 1 (keep). The belt is multiplied by it.', dur: 3800 },
        { t: 'Input gate i and candidate c̃: what to write', d: 'A tanh layer proposes new content $\\tilde c_t$; the input gate decides how much of it to let in.', dur: 3800 },
        { t: 'Memory is updated by addition', d: '$c_t = f \\cdot c_{t-1} + i \\cdot \\tilde c_t$. Because the belt is only scaled and added to, never squashed through a tanh at every step, information and gradients can travel a long way.', dur: 4200 },
        { t: 'Output gate o: what to reveal', d: 'A squashed copy of the memory, $\\tanh(c_t)$, is multiplied by the output gate to give $h_t$. The cell can hold something without showing it until it is needed.', dur: 3800 },
        { t: 'Across time: write once, hold, read later', d: 'To remember a value through 20 distractors, the input gate opens once at the start, the forget gate stays near 1, and the output gate opens at the end. The lab below lets you break each of these.', dur: 6400 },
      ],
      draw(g, s, p, time) {
        const fade = s === 5 ? 1 - ease(clamp01(p * 3)) * 0.8 : 1;
        const hi = k => fade * (k === s || s === 0 ? 1 : 0.32);
        // cell outline
        g.rr(120, 58, 420, 290, 18, { fill: 'rgba(255,255,255,0.025)', stroke: 'rgba(255,255,255,0.16)', a: fade });
        g.text('LSTM cell', 146, 76, { size: 11, color: T.dim, align: 'left', a: fade });
        // belt
        const beltA = fade * (s === 0 || s === 3 ? 1 : 0.6);
        g.line([[20, BELT], [FX - 13, BELT]], { color: T.cyan, w: 2.6, a: beltA });
        g.line([[FX + 13, BELT], [PLUS[0] - 13, BELT]], { color: T.cyan, w: 2.6, a: beltA });
        g.line([[PLUS[0] + 13, BELT], [620, BELT]], { color: T.cyan, w: 2.6, a: beltA, arrow: true });
        g.text('c(t−1)', 42, BELT - 16, { size: 12, color: T.cyan, a: fade }); g.text('c(t)', 604, BELT - 16, { size: 12, color: T.cyan, a: fade });
        if (s === 0 || s === 3) g.flow([[20, BELT], [620, BELT]], time, { n: 7, color: T.cyan, speed: 0.00035, r: 3.5, a: fade });
        // bus
        g.line([[20, BUS], [OX + BW / 2, BUS]], { color: T.violet2, w: 2, a: fade * 0.8 });
        g.text('h(t−1)', 42, BUS + 16, { size: 12, color: T.violet2, a: fade });
        g.line([[150, 392], [150, BUS]], { color: T.green, w: 1.8, a: fade * 0.8 });
        g.text('x(t)', 160, 382, { size: 12, color: T.green, a: fade, align: 'left' });
        if (s === 0) g.flow([[20, BUS], [OX + BW / 2, BUS]], time, { n: 5, color: T.violet2, speed: 0.0004 });
        // gate boxes
        const box = (x, label, sub, color, k) => {
          if (k === s) g.glow(x + BW / 2, BY + BH / 2, 56, color);
          g.line([[x + BW / 2, BUS], [x + BW / 2, BY + BH + 2]], { color: 'rgba(255,255,255,0.4)', a: hi(k) });
          g.rr(x, BY, BW, BH, 8, { fill: alpha(color, 0.16), stroke: color, a: hi(k), w: k === s ? 2 : 1.2 });
          g.text(label, x + BW / 2, BY + BH / 2 - 6, { size: 14, color: T.ink, a: hi(k), sans: true, weight: 600 });
          g.text(sub, x + BW / 2, BY + BH / 2 + 10, { size: 10, color: T.dim, a: hi(k) });
        };
        box(FX - BW / 2, 'f', 'σ forget', T.pink, 1);
        box(IX - BW / 2, 'i', 'σ input', T.amber, 2);
        box(CX - BW / 2, 'c̃', 'tanh', T.green, 2);
        box(OX - BW / 2, 'o', 'σ output', T.violet2, 4);
        // operator nodes
        const node = (pt, sym, color, a) => { g.dot(pt[0], pt[1], 13, '#0d0c14', a); g.ring(pt[0], pt[1], 13, color, 1.8, a); g.text(sym, pt[0], pt[1] + 1, { size: 14, color, a }); };
        g.line([[FX, BY], [FX, BELT + 14]], { color: T.pink, a: hi(1), arrow: true });
        node([FX, BELT], '×', T.pink, hi(1));
        g.line([[IX, BY], [IX, IMUL[1] + 8], [IMUL[0] - 12, IMUL[1]]], { color: T.amber, a: hi(2) });
        g.line([[CX, BY], [CX, IMUL[1] + 8], [IMUL[0] + 12, IMUL[1]]], { color: T.green, a: hi(2) });
        node(IMUL, '×', T.amber, hi(2));
        g.line([[IMUL[0], IMUL[1] - 13], [PLUS[0], PLUS[1] + 14]], { color: T.amber, a: Math.max(hi(2), hi(3)), arrow: true });
        node(PLUS, '+', T.cyan, Math.max(hi(2), hi(3)));
        g.line([[TANH[0], BELT], [TANH[0], TANH[1] - 14]], { color: T.cyan, a: hi(4), arrow: true });
        node(TANH, 't', T.cyan, hi(4)); g.text('tanh', TANH[0] + 30, TANH[1], { size: 10, color: T.dim, a: hi(4) });
        g.line([[TANH[0], TANH[1] + 13], [OMUL[0], OMUL[1] - 14]], { color: T.cyan, a: hi(4), arrow: true });
        g.line([[OX + BW / 2, BY + BH / 2], [OMUL[0] - 14, OMUL[1]]], { color: T.violet2, a: hi(4), arrow: true });
        node(OMUL, '×', T.violet2, hi(4));
        g.line([[OMUL[0], OMUL[1] + 13], [OMUL[0], BUS + 22], [620, BUS + 22]], { color: T.violet2, w: 2, a: hi(4), arrow: true });
        g.text('h(t)', 604, BUS + 38, { size: 12, color: T.violet2, a: fade });
        // per-step animation
        if (s === 1) {
          const f = 0.55 + 0.45 * Math.sin(time * 0.002);
          g.text(`f = ${f.toFixed(2)}`, FX, 46, { size: 13, color: T.pink });
          g.text(f > 0.8 ? 'keep' : f < 0.35 ? 'erase' : 'partly forget', FX, 28, { size: 12, color: T.soft });
          g.flow([[20, BELT], [FX, BELT]], time, { n: 4, color: T.cyan, speed: 0.0006, r: 4 });
          g.flow([[FX, BELT], [PLUS[0], BELT]], time, { n: 3, color: T.cyan, speed: 0.0006, r: 4, a: f });
        }
        if (s === 2) {
          g.flow([[CX, BY], [CX, IMUL[1] + 8], [IMUL[0], IMUL[1]], [PLUS[0], PLUS[1]]], time, { n: 3, color: T.green, speed: 0.0006, r: 3.5 });
          g.text('i = 0.9: let the new content in', IX + 30, 46, { size: 12, color: T.amber });
        }
        if (s === 3) {
          const a = ease(clamp01(p * 2));
          g.rr(196, 20, 260, 40, 10, { fill: 'rgba(86,217,255,0.08)', stroke: alpha(T.cyan, 0.6), a });
          g.text('c(t) = f · c(t−1) + i · c̃', 326, 40, { size: 14, color: T.cyan, a });
        }
        if (s === 4) g.flow([[TANH[0], BELT], [TANH[0], OMUL[1]], [OMUL[0], BUS + 22], [620, BUS + 22]], time, { n: 4, color: T.violet2, speed: 0.0005, r: 3.5 });
        // timeline
        if (s === 5) {
          const a = ease(clamp01((p - 0.15) * 2.5));
          const n = 12, x0 = 70, dx = 46, cY = 140;
          g.rr(16, 22, 608, 370, 16, { fill: '#0b0b10', stroke: 'rgba(255,255,255,0.14)', a: ease(clamp01(p * 4)) });
          const inp = ['0.7', '·', '·', '·', '·', '·', '·', '·', '·', '·', '·', '?'];
          const fv = Array(n).fill(0.98), iv = inp.map((v, k) => (k === 0 ? 0.95 : 0.03)), ov = inp.map((v, k) => (k === n - 1 ? 0.95 : 0.05));
          let c = 0; const pts = [];
          const shown = Math.ceil(clamp01((p - 0.15) * 1.6) * n);
          for (let k = 0; k < n; k++) {
            const x = x0 + k * dx;
            c = fv[k] * c + iv[k] * (k === 0 ? 0.7 : (k % 3 - 1) * 0.6);
            pts.push([x, cY + 70 - c * 90]);
            const sa = a * (k < shown ? 1 : 0.15);
            g.text(k === 0 ? 'value' : k === n - 1 ? 'recall' : 'noise', x, 80, { size: 9, color: T.dim, a: sa });
            g.text(inp[k] === '·' ? '~' : inp[k], x, 96, { size: 13, color: k === 0 ? T.green : k === n - 1 ? T.amber : T.dim, a: sa });
            [[fv[k], T.pink, 0], [iv[k], T.amber, 1], [ov[k], T.violet2, 2]].forEach(([v, col, r]) => g.rr(x - 14 + r * 10, 330 - v * 70, 8, v * 70, 2, { fill: alpha(col, 0.3 + 0.65 * v), a: sa }));
          }
          g.line(pts.slice(0, Math.max(2, shown)), { color: T.cyan, w: 2.4, a });
          g.line([[x0 - 10, cY + 70 - 0.7 * 0.95 * 90], [x0 + (n - 1) * dx + 10, cY + 70 - 0.7 * 0.95 * 90]], { color: T.green, dash: [4, 4], a: a * 0.5 });
          g.text('cell state c', 40, 116, { size: 10, color: T.cyan, align: 'left', a });
          [['f', T.pink], ['i', T.amber], ['o', T.violet2]].forEach(([l, col], r) => g.text(l, 36 + r * 12, 344, { size: 10, color: col, a }));
          g.text('gates per step', 108, 344, { size: 10, color: T.dim, a, align: 'left' });
        }
      },
    });
  };

  // ================================================================== Transformer / attention
  ex.attention = el => {
    const toks = ['the', 'animal', 'crossed', 'because', 'it', 'was', 'tired'];
    const n = toks.length, X = k => 52 + k * 89, TY = 46, Q = 4;
    const softmax = r => { const m = Math.max(...r), e = r.map(v => Math.exp(v - m)), z = e.reduce((a, b) => a + b, 0); return e.map(v => v / z); };
    // illustrative scores for the "meaning" head (row = query, column = key)
    const S = [
      [1.5, 1.2, 0.2, 0, 0.2, 0, 0], [0.4, 1.6, 1.0, 0.1, 0.3, 0.1, 0.6], [0.2, 2.2, 1.2, 0.3, 0.4, 0.1, 0.1], [0.1, 0.4, 1.4, 1.2, 0.9, 0.3, 0.4],
      [0.1, 3.0, 0.4, 0.2, 1.4, 0.3, 1.1], [0.1, 0.6, 0.3, 0.3, 1.8, 1.0, 0.9], [0.1, 1.6, 0.2, 0.3, 1.5, 0.8, 1.2],
    ];
    const A = S.map(softmax);
    const P = toks.map((_, i) => softmax(toks.map((__, j) => (j === i - 1 ? 2.5 : j === i ? 1.2 : -Math.abs(i - j) * 0.6))));
    player(el, {
      title: 'Watch self-attention, step by step',
      steps: [
        { t: 'Every word becomes a vector, plus its position', d: 'Each token is turned into an embedding (a list of numbers). A position code is added, because attention on its own has no idea of word order.', dur: 3000 },
        { t: 'Each word makes a query, a key and a value', d: 'Three learned projections of the same vector. <strong>Query</strong>: what am I looking for? <strong>Key</strong>: what do I contain? <strong>Value</strong>: what will I pass on if someone looks at me?', dur: 3800 },
        { t: 'Compare one query with every key', d: 'Take the query of “it” and compute a dot product with the key of every word (scaled by $1/\\sqrt{d}$). A high score means a good match. Distance does not matter: “animal” is as easy to reach as “was”.', dur: 4200 },
        { t: 'Softmax turns scores into weights', d: 'The scores become attention weights that are positive and sum to 1. Here “it” puts most of its attention on “animal”. (These numbers are illustrative.)', dur: 3600 },
        { t: 'Blend the values', d: 'The new representation of “it” is the weighted average of all value vectors: mostly “animal”, a little of everything else. The word now carries the meaning of what it refers to.', dur: 4200 },
        { t: 'Every word does this at once', d: 'All rows are computed in parallel: one matrix multiplication, no step-by-step loop. That is why Transformers train so fast on GPUs. Each row of this grid is one word’s attention.', dur: 4600 },
        { t: 'Many heads, many layers', d: 'Several heads run side by side with their own projections: one might track meaning (left), another simply looks at the previous word (right). Blocks of attention + feed-forward layers are stacked many times to build a Transformer.', dur: 5600 },
      ],
      draw(g, s, p, time) {
        const fadeRow = s >= 5 ? 1 - ease(clamp01(p * 3)) * (s === 5 ? 0.75 : 0) : 1;
        const rowA = s >= 6 ? 0.25 : fadeRow;
        // tokens
        toks.forEach((t, k) => {
          const a = (s === 0 ? ease(clamp01(p * 2.2 - k * 0.12)) : 1) * rowA;
          const isQ = k === Q && s >= 2 && s <= 4;
          if (isQ) g.glow(X(k), TY, 46, T.amber, 0.8);
          g.rr(X(k) - 38, TY - 15, 76, 30, 15, { fill: isQ ? alpha(T.amber, 0.22) : 'rgba(255,255,255,0.06)', stroke: isQ ? T.amber : 'rgba(255,255,255,0.22)', a });
          g.text(t, X(k), TY + 1, { size: 13, color: T.ink, a, sans: true });
          if (s <= 1) {
            const ea = s === 0 ? clamp01(p * 2 - 0.5) : 1;
            for (let d = 0; d < 4; d++) { const v = Math.sin(k * 1.7 + d * 2.1); g.rr(X(k) - 20 + d * 10, 92 - Math.abs(v) * 22, 8, Math.abs(v) * 22, 2, { fill: alpha(v > 0 ? T.violet2 : T.pink, 0.8), a: a * ea }); }
            g.text(`+ pos ${k + 1}`, X(k), 106, { size: 10, color: T.dim, a: a * ea });
          }
        });
        // Q K V tiles
        const QY = 146;
        if (s >= 1 && s <= 4) {
          toks.forEach((_, k) => {
            const a = (s === 1 ? ease(clamp01(p * 2 - k * 0.1)) : 1) * fadeRow;
            [['q', T.amber, -24], ['k', T.cyan, 0], ['v', T.green, 24]].forEach(([l, col, dx]) => {
              const on = s === 1 || (l === 'q' && k === Q && s <= 3) || (l === 'k' && (s === 2 || s === 3)) || (l === 'v' && s === 4);
              g.rr(X(k) + dx - 9, QY - 9, 18, 18, 4, { fill: alpha(col, on ? 0.6 : 0.18), stroke: alpha(col, on ? 1 : 0.4), a });
              g.text(l, X(k) + dx, QY + 1, { size: 10, color: on ? '#101018' : T.dim, a });
            });
            if (s === 1) g.line([[X(k), 116], [X(k), QY - 12]], { color: 'rgba(255,255,255,0.25)', a, arrow: true });
          });
        }
        // scores
        if (s === 2 || s === 3) {
          toks.forEach((_, k) => {
            const t = s === 2 ? ease(clamp01(p * 1.8 - k * 0.12)) : 1;
            const x0 = X(Q) - 24, x1 = X(k);
            const cy = QY + 46 + Math.abs(k - Q) * 10;
            g.c.beginPath(); g.c.moveTo(x0, QY + 10); g.c.quadraticCurveTo((x0 + x1) / 2, cy, x1, QY + 10);
            g.c.strokeStyle = T.amber; g.c.lineWidth = s === 3 ? 1 + A[Q][k] * 9 : 1.2; g.c.globalAlpha = (s === 3 ? 0.25 + A[Q][k] : 0.6) * t; g.c.stroke(); g.c.globalAlpha = 1;
            g.text(S[Q][k].toFixed(1), x1, QY + 30, { size: 11, color: T.amber, a: t * (s === 2 ? 1 : 0.5) });
          });
          g.text('score = q(it) · k / √d', 320, 214, { size: 12, color: T.muted, a: s === 2 ? ease(p) : 0.6 });
        }
        if (s === 3 || s === 4) {
          toks.forEach((_, k) => {
            const t = s === 3 ? ease(clamp01(p * 1.6 - 0.2)) : 1;
            const hgt = A[Q][k] * 110 * t;
            g.rr(X(k) - 16, 350 - hgt, 32, hgt, 4, { fill: alpha(T.pal[k], 0.85), a: fadeRow });
            g.text(`${Math.round(A[Q][k] * 100)}%`, X(k), 350 - hgt - 12, { size: 12, color: T.ink, a: t * fadeRow });
          });
          g.text('attention weights of “it” (sum to 100%)', 320, 374, { size: 12, color: T.muted, a: fadeRow });
        }
        if (s === 4) {
          // values flow into the new "it"
          const ox = 556, oy = 196;
          toks.forEach((_, k) => g.flow([[X(k) + 24, QY + 10], [ox, oy]], time + k * 120, { n: 2, color: T.pal[k], speed: 0.0006, r: 2 + A[Q][k] * 6 }));
          g.rr(ox - 34, oy - 18, 68, 36, 8, { fill: '#0e0d16', stroke: T.amber });
          let x = ox - 30; A[Q].forEach((w, k) => { g.rr(x, oy - 8, 60 * w, 16, 2, { fill: T.pal[k] }); x += 60 * w; });
          g.text('new “it”', ox, oy + 30, { size: 11, color: T.amber });
        }
        // full matrix
        const grid = (M, gx, gy, cs, title, prog, a) => {
          g.text(title, gx + (cs * n) / 2, gy - 56, { size: 12, color: T.soft, a });
          for (let i = 0; i < n; i++) {
            g.text(toks[i], gx - 6, gy + i * cs + cs / 2, { size: 10, color: T.dim, align: 'right', a });
            for (let j = 0; j < n; j++) {
              const on = i * n + j < prog * n * n;
              g.rr(gx + j * cs + 1, gy + i * cs + 1, cs - 2, cs - 2, 3, { fill: on ? alpha(T.violet, 0.08 + 0.92 * Math.min(1, M[i][j] * 1.6)) : 'rgba(255,255,255,0.03)', a });
            }
          }
          for (let j = 0; j < n; j++) { g.c.save(); g.c.translate(gx + j * cs + cs / 2, gy - 8); g.c.rotate(-0.7); g.text(toks[j], 0, 0, { size: 10, color: T.dim, align: 'left', a }); g.c.restore(); }
        };
        if (s === 5) grid(A, 250, 150, 30, 'attention matrix: row = query, column = key', ease(clamp01((p - 0.2) * 1.6)), ease(clamp01((p - 0.1) * 3)));
        if (s === 6) {
          const a = ease(clamp01(p * 2));
          grid(A, 90, 150, 24, 'head 1: meaning', 1, a);
          grid(P, 330, 150, 24, 'head 2: previous word', 1, a);
          const sx = 548, sa = ease(clamp01((p - 0.35) * 2));
          for (let k = 3; k >= 0; k--) g.rr(sx - 36 + k * 6, 160 + k * 26, 72, 22, 6, { fill: alpha(k % 2 ? T.cyan : T.violet, 0.25), stroke: alpha(k % 2 ? T.cyan : T.violet, 0.9), a: sa });
          g.text('attention', sx + 2, 171, { size: 10, color: T.ink, a: sa }); g.text('feed-forward', sx + 8, 197, { size: 10, color: T.ink, a: sa });
          g.text('× N layers', sx + 6, 290, { size: 13, color: T.amber, a: sa });
        }
      },
    });
  };

  // ================================================================== Tokenization: byte-pair encoding
  ex.bpe = el => {
    const WORDS = [['low', 5], ['lower', 2], ['newest', 6], ['widest', 3]];
    // run BPE on the classic toy corpus; "_" marks the end of a word
    const states = [WORDS.map(([w, n]) => [[...w, '_'], n])], merges = [], pairCounts = [];
    for (let k = 0; k < 10; k++) {
      const cur = states[k], pc = new Map();
      cur.forEach(([s, n]) => { for (let i = 0; i < s.length - 1; i++) { const key = s[i] + ' ' + s[i + 1]; pc.set(key, (pc.get(key) || 0) + n); } });
      pairCounts.push([...pc].sort((a, b) => b[1] - a[1]));
      let best = null, bc = 0; pc.forEach((n, key) => { if (n > bc) { bc = n; best = key; } });
      const [a, b] = best.split(' ');
      merges.push([a, b, bc]);
      states.push(cur.map(([s, n]) => { const o = []; for (let i = 0; i < s.length; i++) { if (i < s.length - 1 && s[i] === a && s[i + 1] === b) { o.push(a + b); i++; } else o.push(s[i]); } return [o, n]; }));
    }
    const BASE = ['_', 'd', 'e', 'i', 'l', 'n', 'o', 'r', 's', 't', 'w'];
    const VOCAB = [...BASE, ...merges.map(([a, b]) => a + b)];
    // encode "lowest" step by step with the learned merges
    const encSteps = [[...'lowest', '_']];
    merges.forEach(([a, b]) => { const s = encSteps[encSteps.length - 1]; if (!s.some((x, i) => x === a && s[i + 1] === b)) return; const o = []; for (let i = 0; i < s.length; i++) { if (i < s.length - 1 && s[i] === a && s[i + 1] === b) { o.push(a + b); i++; } else o.push(s[i]); } encSteps.push(o); encSteps[encSteps.length - 1].rule = a + ' + ' + b; });
    const colorOf = s => (s.length === 1 ? 'rgba(255,255,255,0.5)' : T.pal[(VOCAB.indexOf(s) * 3) % T.pal.length]);
    const chipW = s => 12 + 8.4 * s.length;
    const chip = (g, x, y, s, a = 1, o = {}) => {
      const w = chipW(s), c = o.color || colorOf(s);
      if (o.glow) g.glow(x + w / 2, y, 30, T.amber, a);
      g.rr(x, y - 13, w, 26, 7, { fill: alpha(c === 'rgba(255,255,255,0.5)' ? '#ffffff' : c, s.length === 1 ? 0.06 : 0.2), stroke: o.glow ? T.amber : (s.length === 1 ? 'rgba(255,255,255,0.25)' : alpha(c, 0.8)), a });
      g.text(s, x + w / 2, y + 1, { size: 12, color: T.ink, a });
      return w;
    };
    const row = (g, syms, x, y, a = 1, o = {}) => { let cx = x; syms.forEach((s, i) => { cx += chip(g, cx, y, s, a, { glow: o.hl && o.hl(s, i) }) + 4; }); return cx; };
    const words = (g, k, a = 1, o = {}) => {
      states[k].forEach(([s, n], i) => {
        const y = (o.y || 92) + i * 50;
        g.text(`${n}×`, (o.x || 44), y, { size: 12, color: T.amber, align: 'right', a });
        row(g, s, (o.x || 44) + 14, y, a, { hl: o.hl });
      });
    };
    const note = (g, lines, x, y, a = 1, o = {}) => lines.forEach((l, i) => g.text(l, x, y + i * (o.lh || 20), { size: o.size || 12.5, color: (o.colors && o.colors[i]) || o.color || T.soft, align: 'left', a, sans: !o.mono }));
    const fade = p => ease(clamp01(p * 2.5));

    const steps = [
      { part: 'Part 1 · Why tokens?', t: 'A model only reads numbers', dur: 4200,
        d: 'A neural network multiplies and adds numbers; it cannot read letters. Before anything else, text must be cut into pieces called <strong>tokens</strong>, and every token is replaced by its number (its <strong>id</strong>) in a fixed vocabulary. The program that does this is the <strong>tokenizer</strong>.' },
      { part: 'Part 1 · Why tokens?', t: 'Characters, words or something in between?', dur: 6000,
        d: '<strong>Characters</strong>: tiny vocabulary, nothing is ever unknown, but sequences get very long. <strong>Whole words</strong>: short sequences, but a gigantic vocabulary, and any word not seen in training becomes [UNK]. <strong>Subwords</strong> are the compromise: common words stay whole, rare words are built from common pieces.' },
      { part: 'Part 2 · Learning the pieces (training)', t: 'Start from single characters', dur: 4800,
        d: 'A toy corpus with four words and their counts. Split every word into characters, with <strong>_</strong> marking the end of a word. The starting vocabulary is just the 11 distinct symbols.' },
      { part: 'Part 2 · Learning the pieces (training)', t: 'Count every neighbouring pair', dur: 5600,
        d: 'Go through the corpus and count each pair of adjacent symbols, weighted by how often the word occurs. “e s” appears in newest (6×) and widest (3×): 9 times in total, tied for the most. Ties are broken by whichever pair was seen first.' },
      { part: 'Part 2 · Learning the pieces (training)', t: 'Merge the winner into a new token', dur: 5200,
        d: '“e” + “s” becomes one symbol <strong>es</strong>, everywhere it occurs. The vocabulary grows by one, and merge #1 is written down. Then the pairs are counted again on the new segmentation.' },
      { part: 'Part 2 · Learning the pieces (training)', t: 'Repeat, repeat, repeat', dur: 6400,
        d: 'The next winners are <strong>es + t → est</strong> and <strong>est + _ → est_</strong>, then <strong>l + o</strong> and <strong>lo + w</strong>. Every merge builds on earlier ones, so pieces grow from letters into syllables and whole words.' },
      { part: 'Part 2 · Learning the pieces (training)', t: 'The ordered list of merges is the tokenizer', dur: 5600,
        d: 'After 10 merges, the frequent word “low” is one token and “newest” is “new” + “est_”. Real tokenizers stop at a target vocabulary size: GPT-2 learned <strong>50,000 merges</strong>. The merge list and the vocabulary are saved and never change again.' },
      { part: 'Part 3 · Using the tokenizer', t: 'Encode a word it has never seen', dur: 7000,
        d: '“lowest” was not in the corpus. Split it into characters and replay the merges <strong>in the order they were learned</strong>, applying each one wherever it fits. It ends up as two known pieces, <strong>low</strong> + <strong>est_</strong>: no [UNK] needed.' },
      { part: 'Part 3 · Using the tokenizer', t: 'Pieces become ids', dur: 5000,
        d: 'Each final piece is looked up in the vocabulary to get its integer id. These ids are all the model ever receives; the next step, the <strong>embedding</strong> layer, turns each id into a vector.' },
      { part: 'Part 4 · Real tokenizers', t: 'Byte-level BPE: nothing is ever unknown', dur: 6400,
        d: 'GPT-2, GPT-4 and Llama 3 run BPE on <strong>bytes</strong> of UTF-8 text, not characters. The 256 byte values are the starting vocabulary, so accents, emoji and every script can always be encoded. GPT-2’s vocabulary: 256 bytes + 50,000 merges + 1 end-of-text token = <strong>50,257</strong>.' },
      { part: 'Part 4 · Real tokenizers', t: 'Why some text costs more tokens', dur: 6400,
        d: 'A Devanagari letter takes 3 bytes in UTF-8, so “नमस्ते” is 18 bytes. If the tokenizer saw little Hindi during training, few of those bytes were merged and the word costs many tokens, while a common English word is often one. More tokens means a fuller context window, slower generation and a higher API bill.' },
      { part: 'Part 4 · Real tokenizers', t: 'Tokenizer quirks you will meet', dur: 6800,
        d: 'Spaces belong to the token that follows, so “Hello” and “ Hello” have different ids. Long numbers are cut into uneven chunks, which makes arithmetic harder. And a word like “strawberry” arrives as a few pieces, not letters, which is why counting its r’s is surprisingly hard for an LLM. (Splits shown are examples.)' },
    ];
    player(el, {
      title: 'Tokenization and BPE, step by step',
      steps,
      draw(g, s, p, time) {
        const a = fade(p);
        if (s === 0) {
          g.rr(40, 150, 220, 56, 12, { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.2)', a });
          g.text('“Transformers read tokens”', 150, 179, { size: 14, color: T.ink, sans: true, a });
          g.line([[272, 178], [348, 178]], { color: T.amber, a: ease(clamp01(p * 2 - 0.4)), arrow: true, w: 2 });
          g.text('tokenizer', 310, 162, { size: 11, color: T.amber, a: ease(clamp01(p * 2 - 0.4)) });
          const ids = ['8291', '364', '1100', '16326'], pieces = ['Transform', 'ers', ' read', ' tokens'];
          pieces.forEach((pc, i) => {
            const t = ease(clamp01(p * 2.4 - 1 - i * 0.15));
            g.rr(364 + i * 66, 150, 60, 56, 8, { fill: alpha(T.pal[i], 0.16), stroke: alpha(T.pal[i], 0.8), a: t });
            g.text(pc.replace(' ', '▁'), 394 + i * 66, 168, { size: 10.5, color: T.ink, a: t });
            g.text(ids[i], 394 + i * 66, 190, { size: 12, color: T.amber, a: t });
          });
          g.text('pieces and ids are illustrative', 494, 224, { size: 10, color: T.dim, a: ease(clamp01(p * 2 - 1)) });
          note(g, ['The model never sees letters,', 'only a list of integers.'], 40, 290, ease(clamp01(p * 2 - 1.1)), { size: 15, colors: [T.soft, T.cyan] });
        }
        if (s === 1) {
          const rows = [
            ['characters', [...'unbelievably'], 'vocabulary ≈ 100s', 'sequence: long', T.cyan],
            ['whole words', ['[UNK]'], 'vocabulary: millions', 'unseen word → [UNK]', T.pink],
            ['subwords', ['un', 'believ', 'ably'], 'vocabulary ≈ 30k–200k', 'sequence: short', T.green],
          ];
          rows.forEach(([name, toks, v, q, c], i) => {
            const t = ease(clamp01(p * 2.2 - i * 0.35)), y = 90 + i * 100;
            g.text(name, 40, y - 26, { size: 12, color: c, align: 'left', a: t });
            let x = 40; toks.forEach(tk => { const w = 12 + 8.4 * tk.length; g.rr(x, y - 13, w, 26, 7, { fill: alpha(c, 0.14), stroke: alpha(c, 0.7), a: t }); g.text(tk, x + w / 2, y + 1, { size: 12, color: T.ink, a: t }); x += w + 4; });
            g.text(`${toks.length} token${toks.length > 1 ? 's' : ''}`, 440, y - 8, { size: 12, color: T.soft, align: 'left', a: t });
            g.text(v, 440, y + 10, { size: 10.5, color: T.muted, align: 'left', a: t });
            g.text(q, 440, y + 26, { size: 10.5, color: T.muted, align: 'left', a: t });
          });
          g.text('the word: “unbelievably”', 40, 32, { size: 12, color: T.dim, align: 'left', a });
        }
        if (s === 2) {
          words(g, 0, a);
          g.text('vocabulary', 470, 70, { size: 12, color: T.muted, a });
          BASE.forEach((ch, i) => { const t = ease(clamp01(p * 2 - 0.3 - i * 0.05)); const x = 420 + (i % 4) * 34, y = 104 + Math.floor(i / 4) * 36; g.rr(x, y - 13, 28, 26, 7, { fill: 'rgba(255,255,255,0.06)', stroke: 'rgba(255,255,255,0.25)', a: t }); g.text(ch, x + 14, y + 1, { size: 12, color: T.ink, a: t }); });
          g.text('11 symbols', 470, 230, { size: 12, color: T.amber, a: ease(clamp01(p * 2 - 1)) });
        }
        if (s === 3) {
          const top = pairCounts[0].slice(0, 8), maxN = top[0][1];
          words(g, 0, 1, { hl: (sym, i) => false });
          g.text('pair counts', 520, 66, { size: 12, color: T.muted, a });
          top.forEach(([pr, n], i) => {
            const t = ease(clamp01(p * 1.8 - i * 0.08)), y = 92 + i * 30, best = i === 0;
            g.text(pr, 448, y, { size: 12, color: best ? T.amber : T.soft, align: 'right', a: t });
            g.rr(458, y - 9, (n / maxN) * 120 * t, 18, 4, { fill: alpha(best ? T.amber : T.violet2, best ? 0.9 : 0.5) });
            g.text(String(n), 584, y, { size: 12, color: best ? T.amber : T.muted, align: 'left', a: t });
          });
          // underline every "e s" in the words
          if (p > 0.55) states[0].forEach(([sy], wi) => { let x = 58; sy.forEach((c, i) => { const w = chipW(c); if (c === 'e' && sy[i + 1] === 's') g.rr(x - 3, 92 + wi * 50 - 17, w + chipW('s') + 10, 34, 9, { stroke: T.amber, w: 1.6, a: ease(clamp01((p - 0.55) * 4)) }); x += w + 4; }); });
        }
        if (s === 4) {
          const k = p < 0.35 ? 0 : 1, t = p < 0.35 ? 1 : ease(clamp01((p - 0.35) * 3));
          words(g, k, k ? t : 1, { hl: s2 => k === 1 && s2 === 'es' });
          g.rr(400, 90, 200, 70, 12, { fill: alpha(T.amber, 0.08), stroke: alpha(T.amber, 0.6), a });
          g.text('merge #1', 500, 108, { size: 11, color: T.muted, a });
          g.text('e + s → es', 500, 134, { size: 16, color: T.amber, a });
          g.text(`vocabulary: 11 → ${11 + k}`, 500, 196, { size: 12, color: T.soft, a: t });
        }
        if (s === 5) {
          const raw = p * 5.2, k = 1 + Math.min(4, Math.floor(raw)), t = k === 5 ? ease(clamp01((raw - 4) * 2)) : ease(clamp01((raw % 1) * 2));
          words(g, k, 1, { hl: s2 => s2 === merges[k - 1][0] + merges[k - 1][1] });
          g.text('merges so far', 500, 66, { size: 12, color: T.muted });
          merges.slice(0, k).forEach(([a1, b1, n], i) => {
            const y = 94 + i * 28, last = i === k - 1;
            g.text(`#${i + 1}  ${a1} + ${b1} → ${a1 + b1}`, 420, y, { size: 12, color: last ? T.amber : T.soft, align: 'left', a: last ? t : 1 });
            g.text(`${n}×`, 600, y, { size: 11, color: T.dim, align: 'right', a: last ? t : 1 });
          });
        }
        if (s === 6) {
          words(g, 10, 1);
          g.text('the tokenizer = this ordered list', 500, 50, { size: 11.5, color: T.amber, a });
          merges.forEach(([a1, b1], i) => {
            const t = ease(clamp01(p * 2.4 - i * 0.07)), y = 76 + i * 25;
            g.text(`#${String(i + 1).padStart(2, ' ')}  ${a1} + ${b1} → ${a1 + b1}`, 420, y, { size: 11.5, color: T.soft, align: 'left', a: t });
          });
          g.text('vocabulary: 11 + 10 = 21', 44, 310, { size: 12.5, color: T.cyan, align: 'left', a: ease(clamp01(p * 2 - 0.8)) });
        }
        if (s === 7) {
          const n = encSteps.length, k = Math.min(n - 1, Math.floor(p * (n + 0.6)));
          g.text('encode “lowest” (not in the corpus)', 40, 34, { size: 12, color: T.muted, align: 'left' });
          for (let i = 0; i <= k; i++) {
            const y = 70 + i * 44, t = i === k ? ease(clamp01((p * (n + 0.6)) % 1 * 2.5)) : 1;
            const end = row(g, encSteps[i], 40, y, i === k ? t : 0.55);
            if (i) g.text(`apply  ${encSteps[i].rule}`, Math.max(end + 16, 250), y, { size: 11.5, color: i === k ? T.amber : T.dim, align: 'left', a: t });
            else g.text('start: characters', 250, y, { size: 11.5, color: T.dim, align: 'left' });
          }
          if (k === n - 1) g.text('→ 2 tokens, both known', 40, 70 + (k + 1) * 44, { size: 13, color: T.green, align: 'left', a: ease(clamp01((p - 0.85) * 6)) });
        }
        if (s === 8) {
          g.text('vocabulary (piece → id)', 40, 40, { size: 12, color: T.muted, align: 'left', a });
          VOCAB.forEach((v, i) => {
            const x = 40 + (i % 3) * 112, y = 74 + Math.floor(i / 3) * 34, on = v === 'low' || v === 'est_';
            g.rr(x, y - 13, 104, 26, 7, { fill: on ? alpha(T.amber, 0.2) : 'rgba(255,255,255,0.04)', stroke: on ? T.amber : 'rgba(255,255,255,0.14)', a });
            g.text(v, x + 10, y + 1, { size: 12, color: T.ink, align: 'left', a });
            g.text(String(i), x + 94, y + 1, { size: 11, color: on ? T.amber : T.dim, align: 'right', a });
          });
          const t = ease(clamp01(p * 2 - 0.6));
          row(g, ['low', 'est_'], 420, 120, t);
          g.line([[456, 140], [456, 182]], { color: T.amber, a: t, arrow: true }); g.line([[510, 140], [510, 182]], { color: T.amber, a: t, arrow: true });
          g.rr(426, 190, 56, 30, 7, { fill: alpha(T.cyan, 0.15), stroke: T.cyan, a: t }); g.text(String(VOCAB.indexOf('low')), 454, 206, { size: 14, color: T.ink, a: t });
          g.rr(482, 190, 56, 30, 7, { fill: alpha(T.cyan, 0.15), stroke: T.cyan, a: t }); g.text(String(VOCAB.indexOf('est_')), 510, 206, { size: 14, color: T.ink, a: t });
          g.text('“lowest” → [15, 13]', 480, 252, { size: 13, color: T.cyan, a: t });
          g.text('→ embedding layer', 480, 280, { size: 11.5, color: T.muted, a: ease(clamp01(p * 2 - 1.1)) });
        }
        if (s === 9) {
          const bytes = [['M', '4D'], ['o', '6F'], ['d', '64'], ['è', 'C3 A8'], ['l', '6C'], ['e', '65'], [' ', '20'], ['🙂', 'F0 9F 99 82']];
          g.text('“Modèle 🙂” as UTF-8 bytes', 40, 40, { size: 12, color: T.muted, align: 'left', a });
          let x = 40;
          bytes.forEach(([ch, hx], i) => {
            const t = ease(clamp01(p * 2.2 - i * 0.1)), parts = hx.split(' '), w = parts.length * 30 + (parts.length - 1) * 3;
            g.text(ch === ' ' ? '▁' : ch, x + w / 2, 76, { size: 15, color: T.ink, a: t, sans: true });
            parts.forEach((b, j) => { g.rr(x + j * 33, 94, 30, 26, 6, { fill: alpha(parts.length > 1 ? T.amber : T.violet2, 0.16), stroke: alpha(parts.length > 1 ? T.amber : T.violet2, 0.7), a: t }); g.text(b, x + j * 33 + 15, 108, { size: 11, color: T.ink, a: t }); });
            x += w + 10;
          });
          g.text('one character can be 1 to 4 bytes', 40, 146, { size: 11.5, color: T.dim, align: 'left', a });
          const t2 = ease(clamp01(p * 2 - 0.8));
          const seg = [['256 byte tokens', 256, T.violet2], ['50,000 merges', 50000, T.cyan], ['1 special', 1, T.amber]];
          g.text('GPT-2 vocabulary = 50,257 tokens', 40, 200, { size: 13, color: T.soft, align: 'left', a: t2 });
          let bx = 40; seg.forEach(([lab, n, c], i) => { const w = Math.max(8, (n / 50257) * 560); g.rr(bx, 216, w * t2, 26, 4, { fill: alpha(c, 0.6) }); g.text(lab, i === 1 ? 320 : i === 2 ? 600 : 40, 262 + (i === 2 ? 18 : 0), { size: 11, color: c, align: i === 1 ? 'center' : i === 2 ? 'right' : 'left', a: t2 }); bx += w; });
          note(g, ['Every possible input is some sequence of bytes,', 'so it can always be encoded.'], 40, 318, ease(clamp01(p * 2 - 1.2)), { size: 13, colors: [T.soft, T.green] });
        }
        if (s === 10) {
          const t1 = ease(clamp01(p * 2)), t2 = ease(clamp01(p * 2 - 0.7));
          g.text('English, a common word', 40, 50, { size: 12, color: T.muted, align: 'left', a: t1 });
          g.rr(40, 66, 90, 30, 7, { fill: alpha(T.green, 0.18), stroke: T.green, a: t1 }); g.text('▁hello', 85, 82, { size: 13, color: T.ink, a: t1 });
          g.text('1 token (typical)', 150, 82, { size: 12, color: T.green, align: 'left', a: t1 });
          g.text('Hindi “नमस्ते”: 6 characters, 18 bytes', 40, 140, { size: 12, color: T.muted, align: 'left', a: t2 });
          const hx = ['E0 A4 A8', 'E0 A4 AE', 'E0 A4 B8', 'E0 A5 8D', 'E0 A4 A4', 'E0 A5 87'], chars = ['न', 'म', 'स', '्', 'त', 'े'];
          hx.forEach((h3, i) => h3.split(' ').forEach((b, j) => { const tt = ease(clamp01(p * 2.4 - 1 - i * 0.08)); const x = 40 + i * 96 + j * 30; g.rr(x, 166, 27, 24, 5, { fill: alpha(T.pink, 0.14), stroke: alpha(T.pink, 0.6), a: tt }); g.text(b, x + 13.5, 179, { size: 10, color: T.ink, a: tt }); if (j === 1) g.text(chars[i], x + 13.5, 208, { size: 16, color: T.soft, a: tt, sans: true }); }));
          g.text('worst case: up to 18 tokens if few of these bytes were ever merged', 40, 246, { size: 12, color: T.pink, align: 'left', a: ease(clamp01(p * 2 - 1.2)) });
          note(g, ['Same meaning, many more tokens: less fits in the context window,', 'generation is slower and API costs are higher.'], 40, 300, ease(clamp01(p * 2 - 1.4)), { size: 13 });
        }
        if (s === 11) {
          const panels = [
            ['leading spaces', [['Hello'], ['▁Hello']], 'two different tokens, two ids', T.cyan],
            ['numbers', [['123', '45', '678']], 'chunks do not follow place value', T.amber],
            ['spelling', [['str', 'aw', 'berry']], 'the model sees pieces, not letters', T.pink],
          ];
          panels.forEach(([h1, rowsP, sub, c], i) => {
            const t = ease(clamp01(p * 2 - i * 0.3)), y = 60 + i * 110;
            g.text(h1, 40, y, { size: 12.5, color: c, align: 'left', a: t });
            rowsP.forEach((r, j) => { let x = 40 + j * 150; r.forEach(tk => { const w = 14 + 8.6 * tk.length; g.rr(x, y + 18, w, 28, 7, { fill: alpha(c, 0.15), stroke: alpha(c, 0.7), a: t }); g.text(tk, x + w / 2, y + 33, { size: 12.5, color: T.ink, a: t }); x += w + 4; }); });
            g.text(sub, 340, y + 33, { size: 12, color: T.soft, align: 'left', a: t });
          });
          g.text('example splits, for illustration', 600, 384, { size: 10, color: T.dim, align: 'right', a });
        }
      },
    });
  };

  // ================================================================== Embeddings and positional encoding
  ex.embed = el => {
    const VOC = ['the', 'cat', 'dog', 'sat', 'on', 'mat', 'king', 'queen'];
    const R = (() => { let a = 11; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
    const E = VOC.map(() => Array.from({ length: 4 }, () => +(R() * 2 - 1).toFixed(2)));
    // a hand-made 2-D picture of an embedding space (directions chosen so the analogy is exact)
    const MAP = {
      cat: [96, 118, 'animals'], dog: [150, 96, 'animals'], kitten: [104, 172, 'animals'], puppy: [160, 156, 'animals'],
      apple: [96, 300, 'food'], mango: [150, 286, 'food'], bread: [222, 318, 'food'], rice: [262, 296, 'food'],
      man: [390, 104, 'people'], woman: [500, 104, 'people'], boy: [400, 162, 'people'], girl: [510, 162, 'people'],
      king: [410, 246, 'royals'], queen: [520, 246, 'royals'], prince: [420, 304, 'royals'], princess: [530, 304, 'royals'],
    };
    const GC = { animals: T.green, food: T.amber, people: T.cyan, royals: T.violet2 };
    const START = Object.fromEntries(Object.keys(MAP).map(w => [w, [60 + R() * 520, 60 + R() * 290]]));
    const note = (g, lines, x, y, a = 1, o = {}) => lines.forEach((l, i) => g.text(l, x, y + i * (o.lh || 20), { size: o.size || 12.5, color: (o.colors && o.colors[i]) || o.color || T.soft, align: 'left', a, sans: !o.mono }));
    const fade = p => ease(clamp01(p * 2.5));
    const cell = (g, x, y, w, h, v, a = 1, o = {}) => { g.rr(x, y, w, h, 3, { fill: o.fill || g.cellColor(v), stroke: o.stroke, w: o.sw, a }); if (o.label !== false) g.text(o.text ?? (Math.abs(v) < 0.005 ? '0' : v.toFixed(o.dp ?? 2)), x + w / 2, y + h / 2 + 1, { size: o.size || 10, color: T.ink, a }); };
    const space = (g, pos, a = 1, o = {}) => {
      Object.entries(MAP).forEach(([w, [x0, y0, grp]]) => {
        const [x, y] = pos ? pos(w) : [x0, y0], c = GC[grp], dim = o.only && !o.only.includes(w);
        g.dot(x, y, 5, c, a * (dim ? 0.25 : 1));
        g.text(w, x + 9, y - 9, { size: 11, color: c, align: 'left', a: a * (dim ? 0.25 : 1), sans: true });
      });
    };
    const ORI = [320, 390];
    const cosOf = (u, v) => { const a1 = [MAP[u][0] - ORI[0], MAP[u][1] - ORI[1]], b1 = [MAP[v][0] - ORI[0], MAP[v][1] - ORI[1]]; return (a1[0] * b1[0] + a1[1] * b1[1]) / (Math.hypot(...a1) * Math.hypot(...b1)); };
    const PE = (t, i, d = 32) => { const f = 1 / Math.pow(10000, (2 * Math.floor(i / 2)) / d); return i % 2 ? Math.cos(t * f) : Math.sin(t * f); };

    const steps = [
      { part: 'Part 1 · From ids to vectors', t: 'One-hot vectors: every word equally far apart', dur: 5600,
        d: 'The simplest way to give a network an id is a <strong>one-hot</strong> vector: all zeros except a 1 at the id’s position. With GPT-2’s vocabulary that is 50,257 numbers per token. Worse, the dot product of any two different one-hot vectors is 0, so “cat” is no closer to “dog” than to “queen”.' },
      { part: 'Part 1 · From ids to vectors', t: 'An embedding is a lookup table', dur: 5600,
        d: 'Multiply a one-hot vector by a weight matrix E (vocabulary × d) and every row but one is multiplied by 0: the result is simply <strong>row id of E</strong>. So frameworks skip the multiplication and look the row up. E is the embedding table; its rows are learned.' },
      { part: 'Part 1 · From ids to vectors', t: 'A sentence becomes a matrix', dur: 4800,
        d: 'Look up one row per token and stack them: T tokens give a <strong>T × d</strong> matrix. Here T = 3 and d = 4; GPT-2 small uses d = 768, and its table holds 50,257 × 768 ≈ 38.6 million numbers.' },
      { part: 'Part 2 · Meaning as geometry', t: 'Similar words end up close together', dur: 5200,
        d: 'After training, words used in similar ways sit near each other: animals in one region, food in another, people and royals elsewhere. (A 2-D sketch; real embeddings live in hundreds of dimensions and are projected down to be drawn.)' },
      { part: 'Part 2 · Meaning as geometry', t: 'Similarity is the angle between vectors', dur: 5600,
        d: '<strong>Cosine similarity</strong> = u·v / (|u||v|): 1 when two vectors point the same way, 0 at right angles, −1 opposite. “cat” and “dog” point almost the same way; “cat” and “queen” do not. Search engines and RAG systems rank documents with exactly this number.' },
      { part: 'Part 2 · Meaning as geometry', t: 'How the space is learned', dur: 7200,
        d: 'Every row starts as random noise. During training, the loss gradient nudges the rows of words that appear in similar contexts in similar directions (“you shall know a word by the company it keeps”), and the clusters form on their own. The lab below this animation does exactly that, live.' },
      { part: 'Part 2 · Meaning as geometry', t: 'Directions can carry meaning', dur: 6000,
        d: 'The step from <em>man</em> to <em>woman</em> is roughly the same arrow as from <em>king</em> to <em>queen</em>, so <strong>king − man + woman ≈ queen</strong>. Such regularities emerge from word statistics; they hold for some relations, fail for others, and also absorb the biases of the training text.' },
      { part: 'Part 3 · Where is each word?', t: 'Attention cannot see word order', dur: 5600,
        d: 'Self-attention compares every token with every other token, but nothing in that comparison says who came first. “dog bites man” and “man bites dog” contain the same three vectors, so without extra information a Transformer would treat them identically.' },
      { part: 'Part 3 · Where is each word?', t: 'Sinusoidal positional encoding', dur: 6400,
        d: 'The original Transformer adds a fixed pattern for each position: dimension pairs are sine and cosine waves of different wavelengths. Early dimensions flip quickly from token to token, late ones change slowly, like the hands of a clock. Every position gets a unique fingerprint, and a shift by k positions is the same rotation everywhere.' },
      { part: 'Part 3 · Where is each word?', t: 'Token vector + position vector', dur: 5200,
        d: 'The input to the first Transformer block is the sum of the token’s embedding and its position’s vector. The same word at position 1 and position 3 now gives two different inputs. GPT-2 and BERT learn their position vectors instead; Llama-style models rotate queries and keys by a position-dependent angle (RoPE).' },
      { part: 'Part 4 · Beyond the input layer', t: 'Static vectors become contextual', dur: 6400,
        d: 'The input embedding of “bank” is the same in “the river bank” and “the bank loan”. Attention layers mix in the surrounding words, so after a few layers the two vectors move apart, one towards water, one towards money. These <strong>contextual</strong> vectors are what the rest of the model works with.' },
      { part: 'Part 4 · Beyond the input layer', t: 'Sentence embeddings power semantic search', dur: 6000,
        d: 'Models trained for similarity pool the contextual vectors of a whole sentence into one vector. Embed every document once, embed the question, and return the documents with the highest cosine similarity. This is the retrieval step of retrieval-augmented generation (RAG). It matches meaning, not exact words.' },
    ];
    player(el, {
      title: 'Embeddings, step by step',
      steps,
      draw(g, s, p, time) {
        const a = fade(p);
        if (s === 0) {
          g.text('vocabulary', 90, 40, { size: 11, color: T.muted, a });
          VOC.forEach((w, i) => g.text(`${i}  ${w}`, 50, 70 + i * 34, { size: 12, color: T.soft, align: 'left', a }));
          [['cat', 1, T.green, 230], ['dog', 2, T.cyan, 310]].forEach(([w, id, c, x], k) => {
            const t = ease(clamp01(p * 2.2 - k * 0.4));
            g.text(`“${w}”`, x + 15, 40, { size: 12, color: c, a: t });
            VOC.forEach((_, i) => cell(g, x, 56 + i * 34, 30, 28, i === id ? 1 : 0, t, { fill: i === id ? alpha(c, 0.75) : 'rgba(255,255,255,0.05)', text: i === id ? '1' : '0', size: 11 }));
          });
          const t3 = ease(clamp01(p * 2 - 1));
          g.text('cat · dog = 0', 420, 140, { size: 15, color: T.amber, align: 'left', a: t3 });
          g.text('cat · queen = 0', 420, 170, { size: 15, color: T.amber, align: 'left', a: t3 });
          note(g, ['Every pair is equally', 'unrelated, and each vector', 'is as long as the vocabulary', '(50,257 for GPT-2).'], 420, 220, t3, { size: 12.5 });
        }
        if (s === 1) {
          const id = 1, sweep = clamp01(p * 1.6 - 0.2);
          g.text('one-hot “cat”', 70, 44, { size: 11, color: T.green, a });
          VOC.forEach((w, i) => { cell(g, 40 + i * 30, 60, 26, 26, 0, a, { fill: i === id ? alpha(T.green, 0.75) : 'rgba(255,255,255,0.05)', text: i === id ? '1' : '0' }); g.text(w, 53 + i * 30, 98, { size: 8.5, color: T.dim, a }); });
          g.text('×', 110, 112, { size: 18, color: T.muted, a });
          g.text('E  (8 × 4)', 250, 112, { size: 11, color: T.muted, a });
          E.forEach((r, i) => {
            const on = i === id;
            g.text(VOC[i], 142, 134 + i * 30, { size: 10.5, color: on ? T.green : T.dim, align: 'right', a });
            r.forEach((v, j) => cell(g, 150 + j * 50, 120 + i * 30, 46, 26, v, a * (sweep > 0.3 && !on ? 0.3 : 1), { stroke: on && sweep > 0.3 ? T.amber : undefined, sw: 1.6 }));
          });
          if (sweep > 0.3) {
            const t = ease(clamp01((sweep - 0.3) * 2.5));
            g.line([[352, 163], [420, 163]], { color: T.amber, a: t, arrow: true });
            E[id].forEach((v, j) => cell(g, 428 + j * 44, 150, 40, 26, v, t, { stroke: T.amber, sw: 1.2 }));
            g.text('embedding of “cat”', 512, 196, { size: 11, color: T.amber, a: t });
          }
          g.text('only row 1 survives the multiplication → just read row 1', 40, 384, { size: 12, color: T.soft, align: 'left', a: ease(clamp01(p * 2 - 1)) });
        }
        if (s === 2) {
          const sent = [['the', 0], ['cat', 1], ['sat', 3]];
          sent.forEach(([w, id], k) => {
            const t = ease(clamp01(p * 2.2 - k * 0.3)), y = 120 + k * 56;
            g.rr(40, y - 15, 70, 30, 8, { fill: 'rgba(255,255,255,0.05)', stroke: 'rgba(255,255,255,0.25)', a: t });
            g.text(w, 75, y + 1, { size: 13, color: T.ink, a: t, sans: true });
            g.text(`id ${id}`, 150, y + 1, { size: 12, color: T.amber, a: t });
            g.line([[190, y], [240, y]], { color: 'rgba(255,255,255,0.3)', a: t, arrow: true });
            E[id].forEach((v, j) => cell(g, 252 + j * 52, y - 15, 48, 30, v, t));
          });
          const t2 = ease(clamp01(p * 2 - 1));
          g.rr(246, 96, 220, 176, 10, { stroke: T.cyan, w: 1.4, a: t2 });
          g.text('T × d = 3 × 4', 356, 300, { size: 14, color: T.cyan, a: t2 });
          note(g, ['GPT-2 small:', 'T × 768 per sentence,', 'table 50,257 × 768'], 490, 150, t2, { size: 12.5, colors: [T.muted, T.soft, T.soft] });
        }
        if (s === 3) space(g, null, a);
        if (s === 4) {
          space(g, null, 0.35);
          const t = ease(clamp01(p * 2 - 0.2));
          const vec = (w, c) => { g.line([ORI, [MAP[w][0], MAP[w][1]]], { color: c, w: 2.2, a: t, arrow: true }); };
          g.dot(ORI[0], ORI[1], 3, T.ink, t);
          vec('cat', T.green); vec('dog', T.green); vec('queen', T.violet2);
          g.rr(196, 22, 236, 64, 10, { fill: '#0e0d16', stroke: 'rgba(255,255,255,0.15)', a: t });
          g.text(`cos(cat, dog)   = ${cosOf('cat', 'dog').toFixed(2)}`, 210, 44, { size: 12.5, color: T.green, align: 'left', a: t });
          g.text(`cos(cat, queen) = ${cosOf('cat', 'queen').toFixed(2)}`, 210, 66, { size: 12.5, color: T.violet2, align: 'left', a: ease(clamp01(p * 2 - 0.7)) });
          g.text('angles measured from the origin of this sketch', 620, 384, { size: 10, color: T.dim, align: 'right', a });
        }
        if (s === 5) {
          const q = ease(clamp01((p - 0.12) / 0.75));
          space(g, w => { const j = Math.sin(time * 0.004 + w.length) * 3 * (1 - q); return [lerp(START[w][0], MAP[w][0], q) + j, lerp(START[w][1], MAP[w][1], q) + j]; }, 1);
          g.text(q < 0.05 ? 'random start' : q < 0.98 ? `training… ${Math.round(q * 100)}%` : 'trained', 620, 384, { size: 12, color: q < 0.98 ? T.amber : T.green, align: 'right' });
        }
        if (s === 6) {
          space(g, null, 1, { only: ['man', 'woman', 'king', 'queen'] });
          const t1 = ease(clamp01(p * 2.4)), t2 = ease(clamp01(p * 2.4 - 0.8)), t3 = ease(clamp01(p * 2.4 - 1.6));
          const m = MAP.man, w = MAP.woman, k = MAP.king, qn = MAP.queen;
          g.line([[m[0], m[1]], [lerp(m[0], w[0], t1), lerp(m[1], w[1], t1)]], { color: T.cyan, w: 2.4, arrow: t1 > 0.1 });
          g.text('man → woman', (m[0] + w[0]) / 2, m[1] + 22, { size: 11, color: T.cyan, a: t1 });
          g.line([[m[0], m[1]], [lerp(m[0], k[0], t2), lerp(m[1], k[1], t2)]], { color: 'rgba(255,255,255,0.35)', w: 1.6, dash: [4, 4], a: t2, arrow: t2 > 0.1 });
          g.line([[k[0], k[1]], [lerp(k[0], k[0] + w[0] - m[0], t3), lerp(k[1], k[1] + w[1] - m[1], t3)]], { color: T.amber, w: 2.4, arrow: t3 > 0.1 });
          if (t3 > 0.9) { g.ring(qn[0], qn[1], 13, T.amber, 1.8, ease(clamp01((p - 0.75) * 5))); g.text('king − man + woman ≈ queen', 330, 370, { size: 14, color: T.amber, a: ease(clamp01((p - 0.75) * 5)) }); }
        }
        if (s === 7) {
          const vecs = { dog: [0.8, -0.3, 0.5, 0.1], bites: [-0.2, 0.9, -0.4, 0.3], man: [0.3, 0.2, -0.7, 0.8] };
          [['dog bites man', 60], ['man bites dog', 360]].forEach(([sen, x], k) => {
            const t = ease(clamp01(p * 2.2 - k * 0.4));
            g.text(`“${sen}”`, x + 100, 60, { size: 14, color: T.ink, a: t, sans: true });
            sen.split(' ').forEach((w, i) => { g.text(w, x + 20, 104 + i * 44, { size: 11, color: T.muted, align: 'left', a: t }); vecs[w].forEach((v, j) => cell(g, x + 70 + j * 34, 90 + i * 44, 30, 28, v, t, { label: false })); });
          });
          const t3 = ease(clamp01(p * 2 - 1));
          g.text('=', 320, 160, { size: 30, color: T.amber, a: t3 });
          note(g, ['Same three vectors, just listed in a different order.', 'Attention treats its input as a set, so both get the same result.'], 60, 300, t3, { size: 13, colors: [T.soft, T.amber] });
        }
        if (s === 8) {
          const NP = 32, ND = 32, cs = 7.4, x0 = 360, y0 = 70, rev = clamp01(p * 1.5);
          g.text('position →', x0 + 4, y0 - 12, { size: 10.5, color: T.dim, align: 'left', a });
          g.text('dimension ↓', x0 + 240, y0 - 12, { size: 10.5, color: T.dim, align: 'right', a });
          for (let t = 0; t < NP; t++) for (let i = 0; i < ND; i++) { if (t > rev * NP) continue; g.rr(x0 + t * cs, y0 + i * cs, cs - 0.8, cs - 0.8, 1, { fill: g.cellColor(PE(t, i) * 0.9) }); }
          [[0, T.cyan], [8, T.amber], [20, T.pink]].forEach(([i, c], k) => {
            const yb = 80 + k * 92, t2 = ease(clamp01(p * 2 - k * 0.25));
            g.text(`dimension ${i}`, 40, yb - 8, { size: 11, color: c, align: 'left', a: t2 });
            const pts = []; for (let t = 0; t <= 31; t += 0.25) pts.push([40 + t * 8.6, yb + 30 - PE(t, i) * 24]);
            g.line(pts, { color: c, w: 1.8, a: t2 });
            g.line([[40, yb + 30], [310, yb + 30]], { color: 'rgba(255,255,255,0.12)', a: t2 });
            g.line([[x0 - 4, y0 + i * cs + cs / 2], [x0 - 14, y0 + i * cs + cs / 2]], { color: c, w: 2, a: t2 });
          });
          g.text('PE(t, 2i) = sin(t / 10000^(2i/d)),  PE(t, 2i+1) = cos(…)', 320, 384, { size: 11.5, color: T.soft, a: ease(clamp01(p * 2 - 0.8)) });
        }
        if (s === 9) {
          const tok = [0.6, -0.4, 0.2, 0.7, -0.5, 0.3], posv = t => tok.map((_, i) => +(PE(t, i, 6) * 0.5).toFixed(2));
          [[1, 70], [3, 230]].forEach(([pos, y], k) => {
            const t = ease(clamp01(p * 2.2 - k * 0.5)), pv = posv(pos), sum = tok.map((v, i) => v + pv[i]);
            g.text(`“dog” at position ${pos}`, 40, y - 18, { size: 12, color: T.ink, align: 'left', a: t, sans: true });
            tok.forEach((v, i) => cell(g, 40 + i * 30, y, 28, 26, v, t, { label: false }));
            g.text('+', 236, y + 13, { size: 18, color: T.muted, a: t });
            pv.forEach((v, i) => cell(g, 256 + i * 30, y, 28, 26, v, t, { label: false, stroke: alpha(T.amber, 0.7), sw: 1 }));
            g.text('=', 452, y + 13, { size: 18, color: T.muted, a: t });
            sum.forEach((v, i) => cell(g, 470 + i * 26, y, 24, 26, v, t, { label: false }));
            g.text('token embedding', 130, y + 44, { size: 10.5, color: T.dim, a: t });
            g.text(`position ${pos} vector`, 346, y + 44, { size: 10.5, color: T.amber, a: t });
            g.text('input to block 1', 548, y + 44, { size: 10.5, color: T.cyan, a: t });
          });
          g.text('same word, different position → different input', 320, 370, { size: 13, color: T.green, a: ease(clamp01(p * 2 - 1.2)) });
        }
        if (s === 10) {
          const q = ease(clamp01((p - 0.25) / 0.6));
          [['water', 470, 90, T.cyan], ['river', 530, 130, T.cyan], ['money', 430, 330, T.amber], ['loan', 566, 306, T.amber]].forEach(([w, x, y, c]) => { g.dot(x, y, 4, c, 0.8); g.text(w, x + 8, y - 8, { size: 11, color: c, align: 'left', sans: true }); });
          [['“the river bank”', T.cyan, [500, 120]], ['“the bank loan”', T.amber, [500, 284]]].forEach(([sen, c, tgt], k) => {
            const y = 120 + k * 150;
            g.text(sen, 40, y - 30, { size: 13, color: T.ink, align: 'left', sans: true });
            [0.5, -0.3, 0.7, 0.1].forEach((v, i) => cell(g, 40 + i * 30, y - 12, 28, 26, v, 1, { label: false }));
            g.text('input: identical', 40, y + 30, { size: 10.5, color: T.dim, align: 'left' });
            const sx = 300, sy = 205, x = lerp(sx, tgt[0], q), yy = lerp(sy, tgt[1], q);
            g.line([[sx, sy], [x, yy]], { color: c, w: 2, a: 0.8, arrow: q > 0.05 });
            g.dot(x, yy, 6, c);
          });
          g.dot(300, 205, 6, T.ink); g.text('“bank” before attention', 286, 228, { size: 11, color: T.soft, align: 'right' });
          g.text(q < 0.98 ? 'through the attention layers…' : 'two different contextual vectors', 620, 384, { size: 11.5, color: T.amber, align: 'right' });
        }
        if (s === 11) {
          const docs = [['Reset your password from the login page', 520, 110, 0.93], ['Change the email linked to your account', 470, 170, 0.71], ['Our office opening hours', 150, 300, 0.12], ['Refund policy for annual plans', 260, 320, 0.21]];
          const qx = 560, qy = 150, t = ease(clamp01(p * 2.2));
          docs.forEach(([d, x, y], i) => { g.dot(x, y, 5, T.violet2, a); g.text(d, x + (x > 400 ? -10 : 10), y - 12, { size: 10.5, color: T.soft, align: x > 400 ? 'right' : 'left', a, sans: true }); });
          g.dot(qx, qy, 6, T.amber, t); g.glow(qx, qy, 26, T.amber, t);
          g.text('query: “how do I recover my login?”', 620, 210, { size: 11, color: T.amber, align: 'right', a: t, sans: true });
          docs.forEach(([d, x, y, c], i) => { const tt = ease(clamp01(p * 2.2 - 0.8 - i * 0.12)); g.line([[qx, qy], [x, y]], { color: alpha(T.amber, 0.15 + c * 0.6), w: 1 + c * 2, a: tt }); });
          const t3 = ease(clamp01(p * 2 - 1.2));
          g.rr(36, 26, 268, 112, 10, { fill: '#0e0d16', stroke: 'rgba(255,255,255,0.15)', a: t3 });
          g.text('ranked by cosine similarity', 50, 46, { size: 11, color: T.muted, align: 'left', a: t3 });
          docs.slice().sort((x, y) => y[3] - x[3]).forEach(([d, , , c], i) => g.text(`${c.toFixed(2)}  ${d.slice(0, 26)}${d.length > 26 ? '…' : ''}`, 50, 70 + i * 18, { size: 10.5, color: i === 0 ? T.green : T.soft, align: 'left', a: t3 }));
          g.text('scores illustrative', 620, 384, { size: 10, color: T.dim, align: 'right', a });
        }
      },
    });
  };

  // ================================================================== Transformer (GPT-style), in depth
  ex.transformer = el => {
    const toks = ['The', 'animal', 'crossed', 'because', 'it'], n = toks.length, Q = 4;
    const softmax = r => { const m = Math.max(...r.filter(isFinite)), e = r.map(v => (isFinite(v) ? Math.exp(v - m) : 0)), z = e.reduce((a, b) => a + b, 0); return e.map(v => v / z); };
    const R = (() => { let a = 5; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
    const vec = k => Array.from({ length: k }, () => +(R() * 2 - 1).toFixed(2));
    const EMB = toks.map(() => vec(8)), POS = toks.map((_, t) => Array.from({ length: 8 }, (_, i) => +(0.45 * (i % 2 ? Math.cos(t / Math.pow(10, i / 4)) : Math.sin(t / Math.pow(10, (i - 0) / 4)))).toFixed(2)));
    const X = EMB.map((e, t) => e.map((v, i) => v + POS[t][i]));
    const Qv = toks.map(() => vec(4)), Kv = toks.map(() => vec(4)), Vv = toks.map(() => vec(4));
    // illustrative scores (already divided by √d), row = query, column = key
    const S = [
      [2.0, 0.6, 0.1, 0, 0.2], [0.8, 2.0, 0.6, 0.1, 0.3], [0.3, 2.4, 1.2, 0.2, 0.3], [0.2, 0.6, 1.6, 1.4, 0.8], [0.3, 3.0, 0.5, 0.2, 1.2],
    ];
    const A = S.map(softmax);
    const causal = S.map((r, i) => softmax(r.map((v, j) => (j > i ? -Infinity : v))));
    const PREV = toks.map((_, i) => softmax(toks.map((__, j) => (j === i - 1 ? 2.6 : j === i ? 1 : j > i ? -Infinity : -1))));
    const FIRST = toks.map((_, i) => softmax(toks.map((__, j) => (j === 0 ? 2.2 : j > i ? -Infinity : 0))));
    const note = (g, lines, x, y, a = 1, o = {}) => lines.forEach((l, i) => g.text(l, x, y + i * (o.lh || 20), { size: o.size || 12.5, color: (o.colors && o.colors[i]) || o.color || T.soft, align: 'left', a, sans: !o.mono }));
    const fade = p => ease(clamp01(p * 2.5));
    const cells = (g, v, x, y, cw, ch, a = 1, o = {}) => v.forEach((val, i) => g.rr(o.vertical ? x : x + i * (cw + 2), o.vertical ? y + i * (ch + 2) : y, cw, ch, 2.5, { fill: o.color ? alpha(o.color, 0.12 + 0.75 * Math.min(1, Math.abs(val))) : g.cellColor(val), stroke: o.stroke, a }));
    const TX = k => 70 + k * 125, TY = 40;
    const tokenRow = (g, a = 1, hl = -1, y = TY) => toks.forEach((t, k) => {
      const on = k === hl;
      if (on) g.glow(TX(k), y, 44, T.amber, 0.8 * a);
      g.rr(TX(k) - 46, y - 15, 92, 30, 15, { fill: on ? alpha(T.amber, 0.22) : 'rgba(255,255,255,0.06)', stroke: on ? T.amber : 'rgba(255,255,255,0.22)', a });
      g.text(t, TX(k), y + 1, { size: 13, color: T.ink, a, sans: true });
    });
    const grid = (g, M, x0, y0, cs, a = 1, o = {}) => {
      if (o.title) g.text(o.title, x0 + (cs * n) / 2, y0 - (o.labels ? 40 : 12), { size: 11.5, color: o.tc || T.soft, a });
      for (let i = 0; i < n; i++) {
        if (o.labels) g.text(toks[i], x0 - 6, y0 + i * cs + cs / 2, { size: 10, color: T.dim, align: 'right', a });
        for (let j = 0; j < n; j++) {
          const masked = o.mask && j > i, v = M[i][j], show = o.prog === undefined || i * n + j < o.prog * n * n;
          g.rr(x0 + j * cs + 1, y0 + i * cs + 1, cs - 2, cs - 2, 3, { fill: masked ? 'rgba(255,255,255,0.03)' : show ? alpha(o.color || T.violet, 0.08 + 0.92 * Math.min(1, v * 1.5)) : 'rgba(255,255,255,0.03)', a });
          if (masked && o.cross) g.text('−∞', x0 + j * cs + cs / 2, y0 + i * cs + cs / 2 + 1, { size: 9, color: T.dim, a });
          else if (o.nums && show) g.text(v.toFixed(2).replace(/^0/, ''), x0 + j * cs + cs / 2, y0 + i * cs + cs / 2 + 1, { size: 9, color: T.ink, a });
        }
      }
      if (o.labels) for (let j = 0; j < n; j++) { g.c.save(); g.c.translate(x0 + j * cs + cs / 2, y0 - 6); g.c.rotate(-0.7); g.text(toks[j], 0, 0, { size: 10, color: T.dim, align: 'left', a }); g.c.restore(); }
    };

    const steps = [
      { part: 'Part 1 · Text in', t: 'Text becomes tokens, tokens become ids', dur: 4800,
        d: 'The prompt is cut into tokens by the tokenizer and each token is replaced by its id. GPT-2 has 50,257 possible tokens and reads at most 1,024 at once (its <strong>context window</strong>). Our example: five tokens, and the model must predict the sixth.' },
      { part: 'Part 1 · Text in', t: 'Embedding + position = the input matrix X', dur: 5600,
        d: 'Each id selects a row of the embedding table (a vector of d numbers; d = 768 in GPT-2 small) and a position vector is added. The result is a matrix <strong>X</strong> with one row per token: T × d. Everything after this point is matrix arithmetic on X.' },
      { part: 'Part 2 · Self-attention, one head', t: 'Every token makes a query, a key and a value', dur: 6000,
        d: 'Three learned weight matrices project each token’s vector: <strong>q = x W<sub>Q</sub></strong> (what am I looking for?), <strong>k = x W<sub>K</sub></strong> (what do I offer?), <strong>v = x W<sub>V</sub></strong> (what do I pass on?). In GPT-2 each head projects 768 numbers down to 64.' },
      { part: 'Part 2 · Self-attention, one head', t: 'Score: compare one query with every key', dur: 5600,
        d: 'For the token “it”, take its query and compute a dot product with the key of every token, itself included. A large score means “this token has what I am looking for”. Distance does not matter: “animal” is three tokens back and gets the top score.' },
      { part: 'Part 2 · Self-attention, one head', t: 'Scale by √d, then softmax', dur: 6000,
        d: 'Scores are divided by √d<sub>k</sub> (√64 = 8) so they do not grow with the vector size, then <strong>softmax</strong> turns them into weights that are positive and add up to 1. Without the scaling, large scores make the softmax almost one-hot and training stalls. (Numbers here are illustrative.)' },
      { part: 'Part 2 · Self-attention, one head', t: 'Blend the values', dur: 6000,
        d: 'The output for “it” is the weighted sum of all value vectors: about 73% of “animal”, a little of everything else. The token “it” now carries information about what it refers to. That is the whole trick of attention.' },
      { part: 'Part 2 · Self-attention, one head', t: 'All tokens at once: softmax(QKᵀ/√d)·V', dur: 6800,
        d: 'Stack all queries into Q, all keys into K and all values into V. One matrix product <strong>QKᵀ</strong> gives every score at once (a T × T grid), a row-wise softmax gives the attention matrix, and multiplying by V gives every output. No loop over time steps, which is why GPUs train Transformers so fast. The cost: T² scores.' },
      { part: 'Part 2 · Self-attention, one head', t: 'The causal mask: no peeking at the future', dur: 5600,
        d: 'A text generator must predict each token from the tokens <em>before</em> it. So scores above the diagonal are set to −∞ before the softmax, and their weights become exactly 0. Each row now spreads its attention over the past only. Encoder models such as BERT skip the mask and look both ways.' },
      { part: 'Part 3 · Multi-head attention', t: 'Many heads look for different things', dur: 6400,
        d: 'GPT-2 small runs <strong>12 heads</strong> side by side, each with its own W<sub>Q</sub>, W<sub>K</sub>, W<sub>V</sub> of size 768 × 64. Different heads learn different patterns, for example linking a pronoun to its noun, looking at the previous token, or resting on the first token. The 12 outputs (12 × 64 = 768) are concatenated and mixed by one more matrix, W<sub>O</sub>.' },
      { part: 'Part 4 · The rest of the block', t: 'Residual connections: add, don’t replace', dur: 5600,
        d: 'Attention’s output is <strong>added</strong> to its input: x + Attention(LN(x)). The original vector flows straight through on a “residual stream”, and each layer only writes a correction onto it. This direct path lets gradients reach the bottom of a deep stack, so dozens of blocks can be trained.' },
      { part: 'Part 4 · The rest of the block', t: 'Layer normalisation', dur: 5600,
        d: 'Before each sub-layer, every token’s vector is rescaled to mean 0 and standard deviation 1, then stretched and shifted by two learned vectors γ and β. This keeps the numbers in a stable range however deep the network is. GPT-2 normalises before each sub-layer (“pre-norm”).' },
      { part: 'Part 4 · The rest of the block', t: 'The feed-forward network, one token at a time', dur: 6000,
        d: 'Attention moves information <em>between</em> tokens. The feed-forward network then processes each token <em>on its own</em>: 768 → 3,072 → 768 with a GELU non-linearity in between. It holds about two-thirds of each block’s 7.1 million weights and is often described as where much of the model’s stored knowledge lives.' },
      { part: 'Part 4 · The rest of the block', t: 'Stack the block 12 times', dur: 6000,
        d: 'One block = LN → attention → add → LN → feed-forward → add. GPT-2 small stacks <strong>12</strong> identical-shaped blocks (each with its own weights); larger models use dozens. The vector of every token is refined on the way up: lower layers tend to capture local and syntactic patterns, higher layers more abstract ones.' },
      { part: 'Part 5 · Text out', t: 'From the last vector to the next token', dur: 6400,
        d: 'Take the final vector at the last position, normalise it, and multiply by the transposed embedding table: one score (<strong>logit</strong>) for each of the 50,257 tokens. Softmax turns them into probabilities for the next token. GPT-2 reuses (ties) the embedding matrix here, so there are no extra weights. (Probabilities illustrative.)' },
      { part: 'Part 5 · Text out', t: 'Generation: sample, append, repeat', dur: 6400,
        d: 'Pick a token from those probabilities (the <strong>temperature</strong> sharpens or flattens them), append it to the input and run the model again for the next one. Text is produced one token per forward pass. A <strong>KV cache</strong> keeps the keys and values of earlier tokens so each new step does not recompute them.' },
      { part: 'Part 5 · Text out', t: 'Training: predict every next token at once', dur: 6400,
        d: 'For training, the target sequence is the input shifted by one. Thanks to the causal mask, every position predicts its own next token in the same forward pass, and the loss is the average <strong>cross-entropy</strong>, −log p(correct token). Backpropagation then updates all 124 million weights a little, over billions of tokens.' },
    ];
    player(el, {
      title: 'Inside a Transformer, step by step',
      steps,
      draw(g, s, p, time) {
        const a = fade(p);
        if (s === 0) {
          g.rr(150, 60, 340, 44, 12, { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.2)', a });
          g.text('“The animal crossed because it …”', 320, 83, { size: 14, color: T.ink, a, sans: true });
          const t = ease(clamp01(p * 2 - 0.4));
          g.line([[320, 112], [320, 150]], { color: T.amber, a: t, arrow: true });
          g.text('tokenizer', 360, 132, { size: 11, color: T.amber, a: t, align: 'left' });
          tokenRow(g, t, -1, 178);
          ['464', '5044', '12606', '780', '340'].forEach((id, k) => { const tt = ease(clamp01(p * 2.4 - 1.1 - k * 0.1)); g.line([[TX(k), 198], [TX(k), 226]], { color: 'rgba(255,255,255,0.3)', a: tt, arrow: true }); g.rr(TX(k) - 30, 232, 60, 28, 7, { fill: alpha(T.cyan, 0.15), stroke: T.cyan, a: tt }); g.text(id, TX(k), 247, { size: 13, color: T.ink, a: tt }); });
          g.text('ids illustrative', 620, 280, { size: 10, color: T.dim, align: 'right', a });
          g.text('? next token', 320, 330, { size: 15, color: T.amber, a: ease(clamp01(p * 2 - 1.3)) });
        }
        if (s === 1) {
          g.text('embedding', 170, 32, { size: 11, color: T.muted, a }); g.text('position', 362, 32, { size: 11, color: T.amber, a }); g.text('x = row of X', 548, 32, { size: 11, color: T.cyan, a });
          toks.forEach((t, k) => {
            const tt = ease(clamp01(p * 2.2 - k * 0.15)), y = 56 + k * 56;
            g.text(t, 50, y + 10, { size: 12, color: T.ink, align: 'right', a: tt, sans: true });
            cells(g, EMB[k], 70, y, 22, 20, tt);
            g.text('+', 268, y + 10, { size: 16, color: T.muted, a: tt });
            cells(g, POS[k], 282, y, 18, 20, tt, { stroke: alpha(T.amber, 0.6) });
            g.text('=', 454, y + 10, { size: 16, color: T.muted, a: tt });
            cells(g, X[k], 470, y, 18, 20, tt);
          });
          const t2 = ease(clamp01(p * 2 - 1.1));
          g.rr(462, 46, 170, 274, 10, { stroke: T.cyan, w: 1.4, a: t2 });
          g.text('X: T × d  (here 5 × 8, GPT-2: T × 768)', 620, 352, { size: 12, color: T.cyan, align: 'right', a: t2 });
        }
        if (s === 2) {
          tokenRow(g, 0.35);
          const k = Q, y0 = 110;
          g.text('x(it)', 73, y0 - 16, { size: 11, color: T.ink, a });
          cells(g, X[k], 60, y0, 26, 16, a, { vertical: true });
          [['W_Q', 'q', T.amber, Qv[k]], ['W_K', 'k', T.cyan, Kv[k]], ['W_V', 'v', T.green, Vv[k]]].forEach(([wn, ln, c, out], i) => {
            const t = ease(clamp01(p * 2.4 - 0.3 - i * 0.3)), y = 104 + i * 92;
            g.line([[94, y0 + 70], [212, y + 22]], { color: alpha(c, 0.5), a: t, arrow: true });
            for (let r = 0; r < 8; r++) for (let cc = 0; cc < 4; cc++) g.rr(222 + cc * 13, y + r * 6, 11, 5, 1, { fill: alpha(c, 0.15 + 0.6 * ((r * 7 + cc * 3 + i) % 5) / 5), a: t });
            g.text(wn.replace('_', ' '), 248, y - 10, { size: 11, color: c, a: t });
            g.line([[282, y + 24], [320, y + 24]], { color: alpha(c, 0.6), a: t, arrow: true });
            cells(g, out, 330, y + 12, 26, 24, t, { color: c });
            g.text(`${ln}(it)`, 460, y + 24, { size: 13, color: c, align: 'left', a: t });
          });
          note(g, ['8 numbers in, 4 out here;', 'GPT-2: 768 in, 64 out per head'], 396, 360, ease(clamp01(p * 2 - 1.2)), { size: 11.5, colors: [T.muted, T.muted] });
        }
        if (s === 3 || s === 4) {
          tokenRow(g, 1, Q);
          const QY = 96;
          toks.forEach((_, k) => {
            g.rr(TX(k) + 14 - 9, QY - 9, 18, 18, 4, { fill: alpha(T.cyan, 0.6), stroke: T.cyan });
            g.text('k', TX(k) + 14, QY + 1, { size: 10, color: '#101018' });
            if (k === Q) { g.rr(TX(k) - 14 - 9, QY - 9, 18, 18, 4, { fill: alpha(T.amber, 0.7), stroke: T.amber }); g.text('q', TX(k) - 14, QY + 1, { size: 10, color: '#101018' }); }
          });
          toks.forEach((_, k) => {
            const t = s === 3 ? ease(clamp01(p * 1.8 - k * 0.12)) : 1, x0 = TX(Q) - 14, x1 = TX(k) + 14, cy = QY + 40 + Math.abs(k - Q) * 14;
            g.c.beginPath(); g.c.moveTo(x0, QY + 10); g.c.quadraticCurveTo((x0 + x1) / 2, cy, x1, QY + 10);
            g.c.strokeStyle = T.amber; g.c.lineWidth = s === 4 ? 1 + A[Q][k] * 9 : 1.3; g.c.globalAlpha = (s === 4 ? 0.2 + A[Q][k] * 0.8 : 0.6) * t; g.c.stroke(); g.c.globalAlpha = 1;
          });
          if (s === 3) {
            toks.forEach((_, k) => { const t = ease(clamp01(p * 1.8 - k * 0.12)); g.text(`${(S[Q][k] * 8).toFixed(1)}`, TX(k), 196, { size: 15, color: T.amber, a: t }); });
            g.text('q(it) · k(each token)', 320, 236, { size: 12, color: T.muted, a });
            note(g, ['“animal” scores highest, even though', 'it is three tokens away.'], 40, 300, ease(clamp01(p * 2 - 1)), { size: 13 });
          } else {
            const t = ease(clamp01(p * 1.6 - 0.1));
            toks.forEach((_, k) => {
              g.text(`${(S[Q][k] * 8).toFixed(1)} → ÷8 → ${S[Q][k].toFixed(2)}`, TX(k), 196, { size: 11, color: T.muted, a });
              const hgt = A[Q][k] * 130 * t;
              g.rr(TX(k) - 18, 360 - hgt, 36, hgt, 4, { fill: alpha(T.pal[k], 0.85) });
              g.text(`${Math.round(A[Q][k] * 100)}%`, TX(k), 350 - hgt, { size: 13, color: T.ink, a: t });
            });
            g.text('softmax → weights that sum to 100%', 320, 384, { size: 12, color: T.soft, a: t });
          }
        }
        if (s === 5) {
          tokenRow(g, 0.6, Q);
          const ox = 540, oy = 250;
          toks.forEach((_, k) => {
            const y = 100;
            cells(g, Vv[k], TX(k) - 30, y, 13, 18, 1, { color: T.green });
            g.text(`× ${A[Q][k].toFixed(2)}`, TX(k), 140, { size: 11, color: T.green });
            g.flow([[TX(k), 152], [ox, oy - 26]], time + k * 140, { n: 2, color: T.pal[k], speed: 0.0006, r: 1.5 + A[Q][k] * 6 });
          });
          const out = [0, 1, 2, 3].map(i => Vv.reduce((s2, v, k) => s2 + A[Q][k] * v[i], 0));
          g.rr(ox - 76, oy - 22, 152, 44, 10, { fill: '#0e0d16', stroke: T.amber });
          cells(g, out, ox - 64, oy - 10, 29, 20, 1, { color: T.amber });
          g.text('new vector for “it”', ox, oy + 40, { size: 12, color: T.amber });
          let x = 40; A[Q].forEach((w, k) => { g.rr(x, 320, 400 * w, 22, 3, { fill: alpha(T.pal[k], 0.85) }); if (w > 0.08) g.text(toks[k], x + 200 * w, 332, { size: 11, color: '#101018' }); x += 400 * w; });
          g.text('what “it” is now made of', 40, 300, { size: 11, color: T.muted, align: 'left' });
        }
        if (s === 6) {
          const t1 = ease(clamp01(p * 3)), t2 = ease(clamp01(p * 3 - 0.8)), t3 = ease(clamp01(p * 3 - 1.6));
          const mat = (rows, cols, x, y, cw, ch, c, a1, lab) => { for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) g.rr(x + j * cw, y + i * ch, cw - 2, ch - 2, 2, { fill: alpha(c, 0.25 + 0.4 * (((i * 3 + j * 5) % 4) / 4)), a: a1 }); g.text(lab, x + (cols * cw) / 2, y - 12, { size: 12, color: c, a: a1 }); };
          mat(5, 4, 30, 90, 18, 22, T.amber, t1, 'Q  (T × d)');
          g.text('×', 118, 145, { size: 18, color: T.muted, a: t1 });
          mat(4, 5, 136, 102, 22, 18, T.cyan, t1, 'Kᵀ  (d × T)');
          g.text('=', 260, 145, { size: 18, color: T.muted, a: t2 });
          grid(g, S.map(r => r.map(v => v / 3)), 280, 90, 22, t2, { title: 'scores (T × T)', tc: T.soft, color: T.pink });
          g.text('softmax', 422, 132, { size: 11, color: T.muted, a: t3 }); g.line([[400, 145], [450, 145]], { color: 'rgba(255,255,255,0.35)', a: t3, arrow: true });
          grid(g, A, 462, 90, 22, t3, { title: 'attention A', tc: T.violet2 });
          g.text('then  A × V  →  one new vector per token', 320, 260, { size: 13, color: T.soft, a: t3 });
          g.text('softmax( QKᵀ / √d ) · V', 320, 310, { size: 18, color: T.ink, a: t3 });
          g.text('T² scores: doubling the context quadruples this work', 320, 350, { size: 11.5, color: T.pink, a: ease(clamp01(p * 2 - 1.3)) });
        }
        if (s === 7) {
          const t = ease(clamp01(p * 2 - 0.2));
          grid(g, A, 70, 110, 40, 1 - t * 0.6, { labels: true, title: 'without mask (encoder, e.g. BERT)', nums: true });
          grid(g, causal, 380, 110, 40, t, { labels: true, title: 'causal mask (decoder, e.g. GPT)', mask: true, cross: true, nums: true, color: T.cyan });
          g.text('each row still sums to 1, over the past only', 420, 340, { size: 12, color: T.cyan, a: t });
        }
        if (s === 8) {
          const t = ease(clamp01(p * 2.2));
          grid(g, causal, 50, 90, 26, t, { title: 'head 1: pronoun → noun', mask: true, color: T.violet });
          grid(g, PREV, 240, 90, 26, ease(clamp01(p * 2.2 - 0.3)), { title: 'head 2: previous token', mask: true, color: T.cyan });
          grid(g, FIRST, 430, 90, 26, ease(clamp01(p * 2.2 - 0.6)), { title: 'head 3: first token', mask: true, color: T.green });
          g.text('… 12 heads in GPT-2 small', 320, 248, { size: 12, color: T.muted, a: t });
          const t3 = ease(clamp01(p * 2 - 1));
          for (let i = 0; i < 12; i++) g.rr(80 + i * 40, 282, 38, 22, 3, { fill: alpha(T.pal[i % T.pal.length], 0.55), a: t3 });
          g.text('concatenate: 12 × 64 = 768', 320, 324, { size: 12, color: T.soft, a: t3 });
          g.line([[320, 336], [320, 356]], { color: 'rgba(255,255,255,0.35)', a: t3, arrow: true });
          g.text('× W_O  (768 × 768)  →  attention output', 320, 372, { size: 12, color: T.amber, a: t3 });
        }
        if (s === 9) {
          const X0 = 120, top = 360, bot = 30;
          g.line([[X0, top], [X0, bot]], { color: alpha(T.cyan, 0.6), w: 6 });
          g.text('residual stream', X0 - 18, 200, { size: 11, color: T.cyan, align: 'right' });
          [[290, 'LN → attention', T.amber], [150, 'LN → feed-forward', T.green]].forEach(([y, lab, c], i) => {
            const t = ease(clamp01(p * 2.2 - i * 0.5));
            g.line([[X0, y + 50], [X0 + 90, y + 50], [X0 + 90, y + 34]], { color: alpha(c, 0.7), w: 2, a: t });
            g.rr(X0 + 40, y - 6, 210, 40, 10, { fill: alpha(c, 0.14), stroke: c, a: t });
            g.text(lab, X0 + 145, y + 14, { size: 12.5, color: T.ink, a: t });
            g.line([[X0 + 250, y + 14], [X0 + 290, y + 14], [X0 + 290, y - 30], [X0 + 12, y - 30]], { color: alpha(c, 0.7), w: 2, a: t, arrow: true });
            g.ring(X0, y - 30, 11, c, 2, t); g.text('+', X0, y - 29, { size: 16, color: c, a: t });
            g.flow([[X0, y + 50], [X0 + 90, y + 50], [X0 + 90, y + 34]], time + i * 300, { n: 2, color: c, speed: 0.0007 });
            g.flow([[X0 + 250, y + 14], [X0 + 290, y + 14], [X0 + 290, y - 30], [X0 + 12, y - 30]], time + i * 300, { n: 3, color: c, speed: 0.0005 });
          });
          g.flow([[X0, top], [X0, bot]], time, { n: 6, color: T.cyan, speed: 0.0004, r: 3.5 });
          g.text('x', X0, top + 18, { size: 13, color: T.cyan }); g.text('to the next block', X0, bot - 14, { size: 11, color: T.cyan });
          note(g, ['h = x + Attn(LN(x))', 'y = h + FFN(LN(h))', '', 'each sub-layer adds', 'a correction;', 'nothing is overwritten'], 446, 90, a, { size: 12, mono: true, colors: [T.amber, T.green, T.soft, T.soft, T.soft, T.soft] });
        }
        if (s === 10) {
          const v = [2.4, -0.6, 1.8, 3.1, -1.4, 0.9, 2.2, -0.2], mu = v.reduce((x, y) => x + y, 0) / v.length, sd = Math.sqrt(v.reduce((x, y) => x + (y - mu) ** 2, 0) / v.length);
          const nv = v.map(x => (x - mu) / sd), t = ease(clamp01((p - 0.2) * 2));
          const base = 230, sc = 40;
          g.line([[40, base], [600, base]], { color: 'rgba(255,255,255,0.2)' });
          v.forEach((x, i) => {
            const val = lerp(x, nv[i], t), bx = 70 + i * 66;
            g.rr(bx, val >= 0 ? base - val * sc : base, 40, Math.abs(val) * sc, 4, { fill: alpha(val >= 0 ? T.cyan : T.pink, 0.75) });
          });
          g.line([[40, base - lerp(mu, 0, t) * sc], [600, base - lerp(mu, 0, t) * sc]], { color: T.amber, dash: [5, 4], w: 1.4 });
          g.text(`mean ${lerp(mu, 0, t).toFixed(2)}   std ${lerp(sd, 1, t).toFixed(2)}`, 600, 40, { size: 13, color: T.amber, align: 'right' });
          g.text('(x − mean) / std,  then × γ + β (learned)', 320, 372, { size: 13, color: T.soft, a: ease(clamp01(p * 2 - 0.8)) });
        }
        if (s === 11) {
          const L1 = [...Array(6)].map((_, i) => [120, 90 + i * 44]), L2 = [...Array(14)].map((_, i) => [320, 44 + i * 23]), L3 = [...Array(6)].map((_, i) => [520, 90 + i * 44]);
          const t = ease(clamp01(p * 2));
          L1.forEach(a1 => L2.forEach(b => g.line([a1, b], { color: alpha(T.violet2, 0.12), w: 1, a: t })));
          L2.forEach(a1 => L3.forEach(b => g.line([a1, b], { color: alpha(T.green, 0.12), w: 1, a: ease(clamp01(p * 2 - 0.5)) })));
          L1.forEach(([x, y]) => g.dot(x, y, 7, T.violet2)); L2.forEach(([x, y], i) => g.dot(x, y, 6, alpha(T.amber, 0.4 + 0.6 * Math.abs(Math.sin(i * 1.7 + time * 0.002))), t)); L3.forEach(([x, y]) => g.dot(x, y, 7, T.green, ease(clamp01(p * 2 - 0.5))));
          g.text('768', 120, 370, { size: 13, color: T.violet2 }); g.text('3,072  (GELU)', 320, 384, { size: 13, color: T.amber, a: t }); g.text('768', 520, 370, { size: 13, color: T.green, a: ease(clamp01(p * 2 - 0.5)) });
          const gx = 588, gy = 316; const pts = []; for (let z = -3; z <= 3; z += 0.1) pts.push([gx + z * 12, gy + 26 - (z * 0.5 * (1 + Math.tanh(0.7978845608 * (z + 0.044715 * z ** 3)))) * 9]);
          g.line(pts, { color: T.amber, w: 1.8, a: t }); g.text('GELU', gx, gy + 46, { size: 10, color: T.amber, a: t });
          g.text('same weights for every token', 120, 50, { size: 11, color: T.muted, a });
        }
        if (s === 12) {
          const bx = 230, bw = 180, bh = 22;
          for (let L = 0; L < 12; L++) {
            const y = 340 - L * 26, t = ease(clamp01(p * 2.4 - L * 0.06));
            g.rr(bx, y, bw, bh, 6, { fill: alpha(L % 2 ? T.violet : T.cyan, 0.16), stroke: alpha(L % 2 ? T.violet : T.cyan, 0.7), a: t });
            g.text(`block ${L + 1}`, bx + bw / 2, y + bh / 2 + 1, { size: 10.5, color: T.ink, a: t });
          }
          const lvl = Math.min(11.99, ((time * 0.0012) % 14)), yy = 340 - Math.min(11, lvl) * 26 + 11;
          g.glow(bx - 30, yy, 18, T.amber); g.dot(bx - 30, yy, 5, T.amber);
          const mix = Math.min(1, lvl / 11), vv = X[Q].map((x0, i) => lerp(x0, [0.2, 0.9, -0.3, 0.6, 0.1, -0.7, 0.8, 0.4][i], mix));
          cells(g, vv, 40, yy - 9, 16, 18);
          g.text('vector of “it”', 108, yy - 22, { size: 10.5, color: T.amber });
          note(g, ['inside each block:', 'LN → attention → add', 'LN → feed-forward → add', '', '7.1 M weights per block', '× 12 = 85 M'], 440, 120, a, { size: 12, colors: [T.muted, T.amber, T.green, T.soft, T.soft, T.soft] });
          g.text('lower layers: more local patterns   ·   higher layers: more abstract', 320, 384, { size: 11, color: T.dim, a });
        }
        if (s === 13) {
          const cand = [['was', 0.38], ['is', 0.12], ['had', 0.07], ['did', 0.05], ['seemed', 0.04], ['wanted', 0.03]];
          g.text('final vector (last position)', 110, 40, { size: 11, color: T.amber, a });
          cells(g, [0.2, 0.9, -0.3, 0.6, 0.1, -0.7, 0.8, 0.4], 40, 52, 16, 18, a);
          const t = ease(clamp01(p * 2 - 0.3));
          g.text('LN, then × Eᵀ  (768 × 50,257)', 110, 100, { size: 12, color: T.soft, a: t });
          g.line([[110, 112], [110, 140]], { color: 'rgba(255,255,255,0.35)', a: t, arrow: true });
          for (let i = 0; i < 60; i++) { const v = Math.abs(Math.sin(i * 12.9898) * 0.6) + (i === 7 ? 0.9 : 0); g.rr(40 + i * 3.8, 200 - v * 50, 2.6, v * 50, 1, { fill: alpha(T.violet2, 0.6), a: t }); }
          g.text('50,257 logits', 150, 220, { size: 11, color: T.muted, a: t });
          const t2 = ease(clamp01(p * 2 - 0.9));
          g.text('softmax → probability of the next token', 470, 40, { size: 12, color: T.soft, a: t2 });
          cand.forEach(([w, pr], i) => {
            const y = 70 + i * 40;
            g.text(`“${w}”`, 380, y + 11, { size: 13, color: i ? T.soft : T.green, align: 'right', a: t2, sans: true });
            g.rr(392, y, pr * 480 * t2, 22, 4, { fill: alpha(i ? T.violet2 : T.green, 0.8) });
            g.text(`${Math.round(pr * 100)}%`, 400 + pr * 480 * t2, y + 11, { size: 11, color: T.ink, align: 'left', a: t2 });
          });
          g.text('… and 50,251 more, adding up to 100%', 392, 318, { size: 11, color: T.dim, align: 'left', a: t2 });
        }
        if (s === 14) {
          const seq = [...toks, 'was', 'tired', '.'], k = Math.min(3, Math.floor(p * 3.6));
          seq.slice(0, 5 + k).forEach((w, i) => {
            const x = 50 + i * 72, gen = i >= 5, t = gen && i === 4 + k ? ease(clamp01((p * 3.6) % 1 * 2)) : 1;
            g.rr(x, 80, 66, 30, 15, { fill: gen ? alpha(T.green, 0.2) : 'rgba(255,255,255,0.06)', stroke: gen ? T.green : 'rgba(255,255,255,0.22)', a: t });
            g.text(w, x + 33, 96, { size: 12.5, color: T.ink, a: t, sans: true });
          });
          g.rr(150, 160, 340, 60, 12, { fill: alpha(T.violet, 0.12), stroke: T.violet });
          g.text('Transformer (12 blocks)', 320, 190, { size: 13, color: T.ink });
          g.flow([[320, 116], [320, 156]], time, { n: 3, color: T.cyan, speed: 0.0012 });
          g.flow([[490, 190], [590, 190], [590, 96], [565, 96]], time, { n: 3, color: T.green, speed: 0.0008 });
          g.text('sample', 600, 150, { size: 11, color: T.green, align: 'right' });
          note(g, ['one forward pass per new token', 'temperature < 1: safer, more repetitive', 'temperature > 1: more varied, more mistakes', 'KV cache: reuse earlier keys and values'], 150, 270, a, { size: 12.5, colors: [T.soft, T.muted, T.muted, T.cyan] });
        }
        if (s === 15) {
          const inp = [...toks, 'was'], tgt = ['animal', 'crossed', 'because', 'it', 'was', 'tired'], lp = [2.9, 4.1, 2.2, 1.3, 0.97, 1.8];
          inp.forEach((w, i) => {
            const x = 40 + i * 98, t = ease(clamp01(p * 2.2 - i * 0.1));
            g.rr(x, 70, 90, 28, 14, { fill: 'rgba(255,255,255,0.06)', stroke: 'rgba(255,255,255,0.22)', a: t });
            g.text(w, x + 45, 85, { size: 12, color: T.ink, a: t, sans: true });
            g.line([[x + 45, 102], [x + 45, 142]], { color: alpha(T.amber, 0.5), a: t, arrow: true });
            g.rr(x, 148, 90, 28, 14, { fill: alpha(T.green, 0.15), stroke: alpha(T.green, 0.8), a: t });
            g.text(tgt[i], x + 45, 163, { size: 12, color: T.ink, a: t, sans: true });
            const h2 = lp[i] * 22 * ease(clamp01(p * 2 - 0.7));
            g.rr(x + 30, 326 - h2, 30, h2, 4, { fill: alpha(T.pink, 0.7) });
            g.text(lp[i].toFixed(1), x + 45, 316 - h2, { size: 10.5, color: T.pink, a: ease(clamp01(p * 2 - 0.9)) });
          });
          g.text('input', 30, 56, { size: 11, color: T.muted, align: 'left', a }); g.text('target = input shifted by one', 30, 194, { size: 11, color: T.green, align: 'left', a });
          g.text('−log p(target) at each position (illustrative)', 30, 348, { size: 11, color: T.pink, align: 'left', a: ease(clamp01(p * 2 - 0.7)) });
          g.text(`loss = average = ${(lp.reduce((x, y) => x + y, 0) / lp.length).toFixed(2)}`, 610, 378, { size: 14, color: T.amber, align: 'right', a: ease(clamp01(p * 2 - 1.1)) });
        }
      },
    });
  };

  // ================================================================== Bayes' theorem in natural frequencies
  ex.bayes = el => {
    const R = root.Lab.rng(5), COLS = 50, GX = 45, GY = 64, C = 11;
    // 1,000 people: 10 sick (9 test positive), 990 healthy (79 test positive)
    const idx = Array.from({ length: 990 }, (_, i) => i + 10);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const rank = new Map(idx.slice(0, 79).map((v, i) => [v, i]));
    const kindOf = i => (i < 9 ? 'tp' : i < 10 ? 'fn' : rank.has(i) ? 'fp' : 'tn');
    const GREY = 'rgba(255,255,255,0.38)';
    const dots = (g, s, p) => {
      const e = ease(p), n = s === 0 ? Math.floor(e * 1000) : 1000;
      const fade = s < 4 ? 1 : s === 4 ? 1 - 0.88 * e : 0.12;
      for (let i = 0; i < n; i++) {
        const x = GX + ((i % COLS) + 0.5) * C, y = GY + (Math.floor(i / COLS) + 0.5) * C, k = kindOf(i);
        let col = GREY, a = 1, r = 3.5;
        const sick = s > 1 || (s === 1 && i < e * 10);
        if (i < 10 && sick) { col = T.amber; r = 4.2; }
        if (k === 'tp' && (s > 2 || (s === 2 && i < e * 9))) col = T.cyan;
        if (k === 'fp' && (s > 3 || (s === 3 && rank.get(i) < e * 79))) { col = T.pink; r = 4; }
        if (k === 'tn' || k === 'fn') a = fade;
        g.dot(x, y, r, col, a);
      }
    };
    const bar = (g, x, base, w, h, color, label, value, a = 1) => {
      const hh = Math.max(h, 3); g.rr(x - w / 2, base - hh, w, hh, Math.min(5, hh / 2), { fill: alpha(color, 0.35), stroke: color, a });
      g.text(label, x, base + 18, { size: 12, color: T.soft, a });
      g.text(value, x, base - h - 13, { size: 14, color: T.ink, a });
    };
    const steps = [
      { part: 'Part 1 · Natural frequencies', t: 'Start with 1,000 people', dur: 3800,
        d: 'Probabilities are easier to feel as counts of people. Picture <strong>1,000 people</strong>, each one a dot. We are about to screen them for a disease, but nobody knows yet who is sick.' },
      { part: 'Part 1 · Natural frequencies', t: 'Only 1% are sick', dur: 3200,
        d: 'The disease is rare: the <strong>prevalence</strong> (the base rate, your prior) is 1%. That makes <strong>10 sick</strong> people and 990 healthy ones. Hold on to that small number.' },
      { part: 'Part 1 · Natural frequencies', t: 'The test catches 90% of the sick', dur: 3400,
        d: 'The test\'s <strong>sensitivity</strong>, P(positive | sick), is 90%. So <strong>9 of the 10</strong> sick people test positive (cyan) and one is missed (amber).' },
      { part: 'Part 1 · Natural frequencies', t: 'It also flags 8% of the healthy', dur: 4000,
        d: 'No test is perfect. The <strong>false-positive rate</strong>, P(positive | healthy), is 8%. Of 990 healthy people about <strong>79</strong> are flagged by mistake (pink). They look exactly like the 9 real cases.' },
      { part: 'Part 1 · Natural frequencies', t: 'Look only at the positives', dur: 3400,
        d: 'You tested positive. That removes everyone who tested negative from the picture. What is left is <strong>9 + 79 = 88</strong> people, and the question is how many of them are really sick.' },
      { part: 'Part 1 · Natural frequencies', t: '9 out of 88', dur: 3600,
        d: 'Only <strong>9 of the 88</strong> positives are sick: about <strong>10.2%</strong>. The test is 90% sensitive, yet a positive result is far more likely to be a false alarm, because the healthy crowd is so much bigger than the sick one.' },
      { part: 'Part 2 · The formula', t: 'The same sum, written as Bayes\' theorem', dur: 5200,
        d: 'Divide the sick people who test positive by everyone who tests positive. In probabilities: <strong>posterior = likelihood × prior / evidence</strong>. The denominator adds up both ways to be positive, which is exactly the 88.' },
      { part: 'Part 2 · The formula', t: 'The base rate decides', dur: 4200,
        d: 'Keep the same test (90% sensitive, 8% false positives) and change only the prevalence. A positive result means about <strong>1%</strong> when the disease is very rare and about <strong>92%</strong> when half the people are sick. Same test, very different answer.' },
      { part: 'Part 2 · The formula', t: 'A second positive test', dur: 4600,
        d: 'Evidence accumulates. Today\'s posterior becomes tomorrow\'s prior: after one positive the chance is 10.2%, after a second independent positive it is about <strong>56%</strong>. Each positive multiplies the odds by 0.90 / 0.08 = 11.25.' },
    ];
    player(el, {
      title: 'Watch it work · Bayes\' theorem with 1,000 people', steps,
      draw(g, s, p) {
        const e = ease(p);
        if (s < 6) g.text('Illustrative example: 1% sick · test catches 90% · 8% false alarms', GX, 26, { size: 11, color: T.dim, align: 'left' });
        if (s <= 5) dots(g, s, p);
        const cap = (a, b, colA) => { g.text(a, 320, 322, { size: 17, color: colA || T.ink, sans: true, weight: 600, a: s === 0 ? e : 1 }); if (b) g.text(b, 320, 352, { size: 13, color: T.muted, sans: true }); };
        if (s === 0) cap('1,000 people', 'nobody knows yet who is sick');
        if (s === 1) cap('1% are sick: 10 people', '990 are healthy', T.amber);
        if (s === 2) cap('9 of the 10 sick test positive', 'sensitivity 90% · one sick person is missed', T.cyan);
        if (s === 3) cap('79 of the 990 healthy test positive', 'false-positive rate 8% · these are false alarms', T.pink);
        if (s === 4) cap('Positive tests: 9 + 79 = 88 people', 'everyone else fades away');
        if (s === 5) {
          const x0 = 120, W2 = 400, y = 312, wt = W2 * 9 / 88 * e;
          g.rr(x0, y, W2, 22, 5, { stroke: 'rgba(255,255,255,0.2)' });
          g.rr(x0, y, wt, 22, 5, { fill: alpha(T.cyan, 0.5), stroke: T.cyan });
          g.rr(x0 + W2 * 9 / 88, y, (W2 - W2 * 9 / 88) * e, 22, 5, { fill: alpha(T.pink, 0.3), stroke: T.pink, a: e });
          g.text('9 sick', x0 + W2 * 4.5 / 88, y + 38, { size: 12, color: T.cyan, a: e });
          g.text('79 healthy (false alarms)', x0 + W2 * 48.5 / 88, y + 38, { size: 12, color: T.pink, a: e });
          g.text('9 / 88 ≈ 10.2% of positives are really sick', 320, 380, { size: 16, color: T.ink, sans: true, weight: 600, a: e });
        }
        if (s === 6) {
          const L = [
            ['P(sick | +)  =  P(+ | sick) × P(sick) / P(+)', T.ink, 16, 62],
            ['=  0.90 × 0.01  /  (0.90 × 0.01 + 0.08 × 0.99)', T.soft, 16, 118],
            ['=  0.009 / 0.0882', T.soft, 16, 174],
            ['≈  0.102   (10.2%)', T.amber, 22, 232],
          ];
          L.forEach(([t, c, sz, y], i) => g.text(t, 320, y, { size: sz, color: c, a: clamp01(p * 5 - i * 1.1) }));
          g.text('numerator: sick people who test positive (9 in 1,000)', 320, 296, { size: 12.5, color: T.cyan, sans: true, a: clamp01(p * 5 - 3.6) });
          g.text('denominator: everyone who tests positive (88 in 1,000)', 320, 322, { size: 12.5, color: T.muted, sans: true, a: clamp01(p * 5 - 4) });
        }
        if (s === 7) {
          const base = 322, X = [110, 240, 370, 500], pr = ['0.1%', '1%', '10%', '50%'], po = [0.0111, 0.102, 0.5556, 0.9184];
          g.text('Same test, different base rate: P(sick | positive)', 320, 30, { size: 13, color: T.soft, sans: true });
          po.forEach((v, i) => bar(g, X[i], base, 74, 220 * v * e, i === 1 ? T.amber : T.cyan, pr[i], `${(v * 100).toFixed(v < 0.1 ? 1 : 1)}%`, clamp01(p * 3 - i * 0.4)));
          g.text('prevalence of the disease', 320, 372, { size: 12, color: T.dim, sans: true });
        }
        if (s === 8) {
          const base = 322, X = [150, 320, 490], po = [0.01, 0.102, 0.5611], lab = ['before any test', 'after 1 positive', 'after 2 positives'];
          g.text('Each independent positive multiplies the odds by 0.90 / 0.08 = 11.25', 320, 30, { size: 13, color: T.soft, sans: true });
          po.forEach((v, i) => bar(g, X[i], base, 90, 220 * v * ease(clamp01(p * 2.2 - i * 0.55)), T.cyan, lab[i], `${(v * 100).toFixed(i === 0 ? 0 : 1)}%`, clamp01(p * 3 - i * 0.6)));
          [[0, 1], [1, 2]].forEach(([i, j], n) => {
            const a2 = clamp01(p * 3 - 1 - n * 0.8);
            g.line([[X[i] + 56, 296], [X[j] - 56, 296]], { color: T.violet, arrow: true, a: a2 });
            g.text('× 11.25 odds', (X[i] + X[j]) / 2, 280, { size: 11, color: T.violet, a: a2 });
          });
          g.text('assumes the two tests err independently', 320, 382, { size: 11, color: T.dim, sans: true });
        }
      },
    });
  };

  root.Labs = root.Labs || {};
  root.Labs.explainers = ex;
})(window);

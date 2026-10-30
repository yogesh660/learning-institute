// Learn: hub catalogue, progress, lesson niceties. site.js (the portfolio's own script) already
// handles the nav, reveals, counters and the card spotlight; this file only adds what Learn needs.
// Every page still reads fine without it.
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DATA = window.LEARN || null;

  // ----- progress, kept in this browser only
  const KEY = 'learn.done.v1';
  const store = {
    get() { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { return new Set(); } },
    set(s) { try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch (e) { /* private mode: progress just isn't kept */ } },
  };

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ----- KaTeX, if the CDN loaded
  window.renderMath = function (el) {
    if (typeof window.renderMathInElement !== 'function') return;
    window.renderMathInElement(el || document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false },
      ],
      ignoredClasses: ['no-math'],
      throwOnError: false,
    });
  };

  // ======================================================================= hub
  function hub() {
    const done = store.get();
    const byId = Object.fromEntries(DATA.lessons.map(l => [l.id, l]));

    // path progress + continue link
    document.querySelectorAll('[data-path-progress]').forEach(el => {
      const path = DATA.paths.find(p => p.id === el.dataset.pathProgress), ids = path.lessons;
      const n = ids.filter(id => done.has(id)).length;
      el.querySelector('.meter i').style.setProperty('--p', `${ids.length ? (n / ids.length) * 100 : 0}%`);
      const total = ids.length + path.planned;
      el.querySelector('[data-progress-text]').textContent = n ? `${n} of ${ids.length} done${path.planned ? ` · ${path.planned} planned` : ''}` : (path.planned ? `${ids.length ? `${ids.length} live · ` : ''}${path.planned} planned` : `${total} lessons`);
      const next = ids.find(id => !done.has(id));
      const start = el.closest('.path-card') && el.closest('.path-card').querySelector('[data-start]');
      if (start && n && next) { start.href = byId[next].href; start.querySelector('[data-start-label]').textContent = 'Continue path'; }
    });
    document.querySelectorAll('.lesson-row').forEach(r => r.classList.toggle('is-done', done.has(r.dataset.id)));

    const cont = document.getElementById('continue');
    if (cont && done.size) {
      const order = DATA.paths.flatMap(p => p.lessons);
      const next = order.find(id => !done.has(id));
      if (next) {
        cont.href = byId[next].href;
        cont.querySelector('[data-label]').textContent = `Continue: ${byId[next].short}`;
      }
      const total = document.getElementById('done-count');
      if (total) total.textContent = `${done.size} of ${order.length} lessons done in this browser`;
    }

    // on phones the syllabus is long: keep only each path's first module open
    if (window.matchMedia('(max-width: 760px)').matches) {
      document.querySelectorAll('.syl-path').forEach(p => p.querySelectorAll('.module').forEach((m, i) => { if (i) m.open = false; }));
    }

    // catalogue: task filter, level filter, search
    const input = document.getElementById('q');
    const syllabus = document.getElementById('syllabus');
    const results = document.getElementById('results');
    const note = document.getElementById('result-note');
    if (!input || !syllabus) return;
    let task = 'all', level = 'all';
    const lessons = DATA.lessons.map(l => ({ ...l, hay: `${l.title} ${l.short} ${l.summary} ${l.keywords} ${l.module} ${l.pathTitle}`.toLowerCase() }));

    const card = l => `
      <a class="case-card spot in" href="${l.href}">
        <div class="row"><small>${esc(l.pathTitle)} · ${esc(l.module)}</small></div>
        <h3>${esc(l.title)}</h3>
        <p>${esc(l.summary)}</p>
        <div class="path-meta" style="margin-top:auto">${l.planned ? `<span>Planned</span><span>${esc(l.tier)}</span>` : `<span>${['', 'Beginner', 'Intermediate', 'Advanced'][l.level]}</span><span>${l.minutes} min</span>`}${done.has(l.id) ? '<span style="color:var(--green)">Done</span>' : ''}</div>
      </a>`;

    const apply = () => {
      const q = input.value.trim().toLowerCase();
      const terms = q.split(/\s+/).filter(Boolean);
      const hit = l => (task === 'all' || l.task === task) && (level === 'all' || String(l.level) === level) && terms.every(t => l.hay.includes(t));
      const filtering = terms.length || level !== 'all';
      if (!filtering) {
        // syllabus view: hide whole paths that do not match the task
        syllabus.hidden = false; results.hidden = true;
        syllabus.querySelectorAll('.syl-path').forEach(p => { p.hidden = task !== 'all' && !p.dataset.tasks.split(' ').includes(task); });
        syllabus.querySelectorAll('.lesson-row').forEach(r => { r.hidden = task !== 'all' && r.dataset.task !== task; });
        syllabus.querySelectorAll('.module').forEach(m => { m.hidden = ![...m.querySelectorAll('.lesson-row')].some(r => !r.hidden); });
        const n = lessons.filter(hit).length;
        note.textContent = task === 'all' ? `All ${lessons.length} lessons, in learning order` : `${n} lessons, in learning order`;
        return;
      }
      const list = lessons.filter(hit);
      syllabus.hidden = true; results.hidden = false;
      results.innerHTML = list.map(card).join('') || '<p class="empty">Nothing matches that yet. Try a broader word such as “tree”, “kernel” or “loss”.</p>';
      note.textContent = `${list.length} ${list.length === 1 ? 'lesson' : 'lessons'} found`;
    };

    const go = fn => () => { if (document.startViewTransition && !reduced) document.startViewTransition(fn); else fn(); };
    // only the filter buttons: syllabus rows carry data-task / data-level too
    const taskBtns = [...document.querySelectorAll('button[data-task]')], levelBtns = [...document.querySelectorAll('button[data-level]')];
    taskBtns.forEach(b => b.addEventListener('click', go(() => {
      task = b.dataset.task;
      taskBtns.forEach(x => x.classList.toggle('on', x === b));
      apply();
    })));
    levelBtns.forEach(b => b.addEventListener('click', go(() => {
      level = b.dataset.level === level ? 'all' : b.dataset.level;
      levelBtns.forEach(x => x.classList.toggle('on', x.dataset.level === level));
      apply();
    })));
    let t;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(apply, 90); });
    document.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement !== input && !/input|textarea/i.test(document.activeElement.tagName)) {
        e.preventDefault(); input.focus(); input.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      }
      if (e.key === 'Escape' && document.activeElement === input) { input.value = ''; apply(); input.blur(); }
    });
    const fromHash = location.hash.match(/^#task-(\w+)/);
    if (fromHash) { const b = document.querySelector(`[data-task="${fromHash[1]}"]`); if (b) b.click(); }
    apply();
  }

  // hero: two classes drifting while a soft boundary rotates through them
  function heroCanvas() {
    const cv = document.getElementById('hero-canvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    const off = document.createElement('canvas');
    const octx = off.getContext('2d');
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
    const pts = [];
    for (let i = 0; i < 140; i++) {
      const c = i % 2;
      pts.push({ c, x: (c ? 0.62 : 0.38) + gauss() * 0.12, y: 0.5 + gauss() * 0.16, ph: rnd() * 6.28, sp: 0.4 + rnd() * 0.6 });
    }
    const size = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      off.width = 64; off.height = Math.max(24, Math.round(64 * H / Math.max(W, 1)));
    };
    const draw = time => {
      const t = time / 1000;
      const ang = Math.sin(t * 0.18) * 0.7 + 0.15;
      const nx = Math.cos(ang), ny = Math.sin(ang);
      const cx = 0.5 + Math.sin(t * 0.23) * 0.04, cy = 0.5;
      const img = octx.createImageData(off.width, off.height);
      for (let j = 0; j < off.height; j++) for (let i = 0; i < off.width; i++) {
        const u = i / off.width, v = j / off.height;
        const z = ((u - cx) * nx + (v - cy) * ny) * 9;
        const p = 1 / (1 + Math.exp(-z));
        const k = (j * off.width + i) * 4;
        img.data[k] = 140 * (1 - p) + 86 * p; img.data[k + 1] = 124 * (1 - p) + 217 * p; img.data[k + 2] = 255;
        const edge = Math.exp(-z * z * 0.35);
        img.data[k + 3] = 20 + 34 * Math.abs(p - 0.5) * 2 + 60 * edge;
      }
      octx.putImageData(img, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      const r = Math.min(W, H) * 0.46;
      const g = ctx.createRadialGradient(W / 2, H / 2, r * 0.2, W / 2, H / 2, r * 1.15);
      g.addColorStop(0, '#000'); g.addColorStop(1, 'transparent');
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, W, H);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.restore();
      // boundary line
      ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
      ctx.beginPath();
      const L = Math.max(W, H);
      ctx.moveTo(cx * W - ny * L, cy * H + nx * L); ctx.lineTo(cx * W + ny * L, cy * H - nx * L);
      ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, r * 0.95, 0, 6.29); ctx.clip();
      ctx.beginPath(); ctx.moveTo(cx * W - ny * L, cy * H + nx * L); ctx.lineTo(cx * W + ny * L, cy * H - nx * L); ctx.stroke();
      ctx.restore(); ctx.setLineDash([]);
      for (const p of pts) {
        const x = (p.x + Math.sin(t * p.sp + p.ph) * 0.012) * W;
        const y = (p.y + Math.cos(t * p.sp * 0.8 + p.ph) * 0.012) * H;
        const d = Math.hypot(x - W / 2, y - H / 2) / r;
        if (d > 1.05) continue;
        const z = ((x / W - cx) * nx + (y / H - cy) * ny);
        const wrong = (z > 0 ? 1 : 0) !== p.c;
        ctx.globalAlpha = Math.max(0, 1 - d * d * 0.7);
        ctx.fillStyle = p.c ? '#56d9ff' : '#8c7cff';
        ctx.beginPath(); ctx.arc(x, y, wrong ? 3.6 : 2.6, 0, 6.29); ctx.fill();
        if (wrong) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
    };
    size();
    let visible = true;
    new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(cv);
    window.addEventListener('resize', () => { size(); if (reduced) draw(4000); });
    if (reduced) { draw(4000); return; }
    const loop = time => { if (visible && !document.hidden) draw(time); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  // ======================================================================= lesson
  function lesson() {
    const id = document.body.dataset.lesson;
    // on-this-page: highlight the section in view
    const links = [...document.querySelectorAll('.toc a')];
    if (links.length) {
      const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
      const spy = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          links.forEach(a => a.classList.remove('on'));
          const a = map.get(e.target.id); if (a) a.classList.add('on');
        });
      }, { rootMargin: '-35% 0px -60% 0px' });
      map.forEach((a, sid) => { const s = document.getElementById(sid); if (s) spy.observe(s); });
    }

    // mark complete
    const btn = document.getElementById('complete');
    if (btn && id) {
      const paint = () => {
        const on = store.get().has(id);
        btn.classList.toggle('is-done', on);
        btn.setAttribute('aria-pressed', String(on));
        btn.querySelector('[data-label]').textContent = on ? 'Completed' : 'Mark as complete';
      };
      btn.addEventListener('click', () => {
        const s = store.get();
        if (s.has(id)) s.delete(id); else s.add(id);
        store.set(s); paint();
      });
      paint();
    }

    // copy code
    document.querySelectorAll('.copy').forEach(b => b.addEventListener('click', () => {
      const pre = b.closest('.code').querySelector('pre');
      const label = b.querySelector('span');
      const ok = () => { label.textContent = 'Copied'; setTimeout(() => { label.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(pre.innerText).then(ok, () => {});
    }));

    document.querySelectorAll('[data-architecture]').forEach(el => {
      const fn = window.Labs && window.Labs.architectures && window.Labs.architectures[el.dataset.architecture];
      if (fn) { try { fn(el); } catch (e) { console.error(e); } }
    });

    // explainers: start them as they approach the viewport too
    document.querySelectorAll('[data-explainer]').forEach(el => {
      const start = () => {
        const fn = window.Labs && window.Labs.explainers && window.Labs.explainers[el.dataset.explainer];
        if (!fn) { el.innerHTML = '<p class="lab-noscript">This animation could not load.</p>'; return; }
        try { fn(el); } catch (e) { console.error(e); }
      };
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '300px 0px' });
        io.observe(el);
      } else start();
    });

    // labs start when they come near the viewport, so a long page stays light
    document.querySelectorAll('[data-lab]').forEach(el => {
      const start = () => {
        const reg = window.Labs && window.Labs[el.dataset.kind];
        const fn = reg && reg[el.dataset.lab];
        if (!fn) { el.innerHTML = '<p class="lab-noscript">This lab could not load. Check your connection and refresh.</p>'; return; }
        try { fn(el); } catch (e) { console.error(e); el.innerHTML = '<p class="lab-noscript">This lab could not start in your browser.</p>'; }
      };
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '500px 0px' });
        io.observe(el);
      } else start();
    });

    // quiz
    const quiz = document.querySelector('.quiz');
    if (quiz) {
      let right = 0, answered = 0;
      const total = quiz.querySelectorAll('.q').length;
      const score = document.getElementById('quiz-score');
      quiz.querySelectorAll('.q').forEach(q => {
        const ans = +q.dataset.answer;
        const opts = [...q.querySelectorAll('.opt')];
        opts.forEach((o, i) => o.addEventListener('click', () => {
          opts.forEach((x, j) => { x.disabled = true; if (j === ans) x.classList.add('right'); });
          if (i !== ans) o.classList.add('wrong'); else right++;
          answered++;
          const why = q.querySelector('.why'); why.hidden = false;
          if (score) score.textContent = answered === total ? `You got ${right} of ${total}` : `${answered} of ${total} answered`;
        }));
      });
    }
  }

  // KaTeX is loaded with defer; render once it is there
  const mathReady = () => window.renderMath();
  if (document.readyState === 'complete') mathReady(); else window.addEventListener('load', mathReady);

  if (document.body.classList.contains('page-learn')) { hub(); heroCanvas(); }
  if (document.body.dataset.lesson) lesson();
})();

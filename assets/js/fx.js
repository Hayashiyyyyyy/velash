/* VE:LASH FX (all pages): page transitions, split + decode titles, shutter reveals,
   scroll progress, parallax depth, velocity skew, magnetic buttons, hover decode */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(min-width: 901px) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const GL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>';
  const rnd = () => GL[(Math.random() * GL.length) | 0];

  /* ---------- page transition veil ---------- */
  const veil = document.createElement('div');
  veil.className = 'veil';
  veil.setAttribute('aria-hidden', 'true');
  veil.innerHTML = '<i class="veil-a"></i><i class="veil-b"></i><img class="veil-logo" src="assets/img/logo-white.webp" alt=""><span class="veil-bar"></span>';
  document.body.append(veil);
  let arrived = false;
  if (!reduce && sessionStorage.getItem('velash-nav')) {
    sessionStorage.removeItem('velash-nav');
    arrived = true;
    veil.className = 'veil is-cover';
    requestAnimationFrame(() => requestAnimationFrame(() => { veil.className = 'veil is-out'; }));
  }
  addEventListener('pageshow', (e) => { if (e.persisted) veil.className = 'veil'; });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || reduce) return;
    const href = a.getAttribute('href');
    if (!href || a.target === '_blank' || href.startsWith('#') || /^(https?:|mailto:|tel:)/.test(href) || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    sessionStorage.setItem('velash-nav', '1');
    veil.className = 'veil is-in';
    setTimeout(() => { location.href = href; }, 720);
  });

  /* ---------- decode effect (random glyphs settle into the real text) ---------- */
  function decodeChars(chars, stagger = 24, dur = 380) {
    if (reduce || !chars.length) return;
    chars.forEach((c) => { c.style.width = c.getBoundingClientRect().width + 'px'; });
    const t0 = performance.now();
    (function f(now) {
      let done = true;
      const el = now - t0;
      chars.forEach((c, i) => {
        const o = c.dataset.c;
        if (el >= i * stagger + dur) { if (c.textContent !== o) c.textContent = o; }
        else { done = false; if (o.trim()) c.textContent = rnd(); }
      });
      if (done) chars.forEach((c) => { c.style.width = ''; });
      else requestAnimationFrame(f);
    })(t0);
  }
  // whole-string decode for small mono text (labels, links)
  function decodeText(el, dur = 520) {
    if (reduce || el.children.length || el._busy) return;
    const o = el.textContent; el._busy = true;
    const t0 = performance.now();
    (function f(now) {
      const p = clamp((now - t0) / dur);
      const n = Math.floor(o.length * p);
      el.textContent = o.slice(0, n) + o.slice(n).replace(/\S/g, rnd);
      if (p < 1) requestAnimationFrame(f); else { el.textContent = o; el._busy = false; }
    })(t0);
  }

  /* ---------- split titles into masked chars ---------- */
  function split(el) {
    const chars = []; let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span'); w.className = 'wd';
            [...part].forEach((ch) => {
              const s = document.createElement('span');
              s.className = 'ch'; s.textContent = ch; s.dataset.c = ch; s.style.setProperty('--i', i++);
              w.append(s); chars.push(s);
            });
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    el.classList.add('split');
    el._chars = chars;
  }
  const titles = [...document.querySelectorAll('.section-title, .look-text h3, .viewer-info h2')]
    .filter((el) => !el.closest('.zoom-copy'));
  titles.forEach(split);
  const labels = [...document.querySelectorAll('.section-label')].filter((el) => !el.children.length);

  const play = (el) => {
    el.classList.add('in');
    if (el._chars) setTimeout(() => decodeChars(el._chars), 120);
    else decodeText(el);
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { play(e.target); io.unobserve(e.target); }
  }), { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
  titles.concat(labels).forEach((el) => {
    if (el.closest('.page-hero')) setTimeout(() => play(el), arrived ? 480 : 150);
    else io.observe(el);
  });

  /* ---------- shutter reveal for imagery ---------- */
  document.querySelectorAll('.product-card').forEach((c, i) => {
    const d = (i % 3) * 0.12 + 's';
    c.style.transitionDelay = d;
    const m = c.querySelector('.product-media'); if (m) m.style.transitionDelay = d;
  });
  const wipes = [...document.querySelectorAll('.look-card, .look-split .big, .look-side > img, .product-media, .viewer-stage')];
  // (a fully clipped element never "intersects", so position is checked on scroll instead of IntersectionObserver)
  let pending = [];
  wipes.forEach((el) => { el.classList.add('wipe'); if (reduce) el.classList.add('in'); else pending.push(el); });
  const checkWipes = () => {
    if (!pending.length) return;
    pending = pending.filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.9 && r.bottom > 0) { el.classList.add('in'); return false; }
      return true;
    });
  };

  /* ---------- scroll progress line ---------- */
  const prog = document.createElement('div');
  prog.className = 'scroll-prog'; prog.setAttribute('aria-hidden', 'true');
  document.body.append(prog);

  /* ---------- scroll-driven: progress, sub-page hero exit, parallax depth ---------- */
  const pageHero = document.querySelector('.page-hero');
  const para = fine && !reduce ? [
    ...[...document.querySelectorAll('.look-card:not(.contain) img, .look-split .big img')].map((el) => ({ el, kind: 'img' })),
    ...[...document.querySelectorAll('.look-card')].map((el, i) => ({ el, kind: 'card', s: [0, 46, -34][i % 3] })),
  ] : [];
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${clamp(scrollY / Math.max(1, max))})`;
    checkWipes();
    if (pageHero) pageHero.style.setProperty('--ph', clamp(scrollY / (pageHero.offsetHeight * 0.9)).toFixed(4));
    for (const p of para) {
      const r = p.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      const d = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      p.el.style.translate = p.kind === 'img' ? `0 ${(d * -7).toFixed(2)}%` : `0 ${(d * p.s).toFixed(1)}px`;
    }
  }
  let q = false;
  addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; onScroll(); }); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- velocity skew on grids (desktop) ---------- */
  const skews = fine && !reduce ? [...document.querySelectorAll('.look-grid, .product-grid')] : [];
  if (skews.length) {
    let lastY = scrollY, v = 0;
    (function loop() {
      const raw = window.lenis ? window.lenis.velocity : scrollY - lastY;
      lastY = scrollY;
      v += (raw - v) * 0.12;
      const s = clamp(v * 0.06, -2.2, 2.2);
      const t = Math.abs(s) > 0.01 ? `skewY(${s.toFixed(3)}deg)` : '';
      skews.forEach((el) => { if (el.style.transform !== t) el.style.transform = t; });
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- magnetic buttons + hover decode (desktop) ---------- */
  if (fine && !reduce) {
    document.querySelectorAll('.add-btn, .section-link, .submit-btn, .t-buy, .cart-btn, .news-filter button').forEach((b) => {
      const base = getComputedStyle(b).transition;
      b.style.transition = (base && base !== 'all 0s ease 0s' ? base + ', ' : '') + 'translate .6s cubic-bezier(.16,1,.3,1)';
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1)}px`;
      });
      b.addEventListener('pointerleave', () => { b.style.translate = '0 0'; });
    });
    document.querySelectorAll('.site-nav .nl, .section-link, .footer-nav a, .t-buy, a.add-btn, .cart-btn, .news-cat').forEach((el) => {
      el.addEventListener('mouseenter', () => decodeText(el, 420));
    });
  }
})();

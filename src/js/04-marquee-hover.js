/* VE:LASH FX 2: scroll-velocity marquees, cursor-following news preview, 3D hover tilt, card spotlight */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const fine = matchMedia('(min-width: 901px) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- scroll velocity (shared) ---------- */
  let vel = 0, lastY = scrollY;
  (function sample() {
    const raw = window.lenis ? window.lenis.velocity : scrollY - lastY;
    lastY = scrollY;
    vel = lerp(vel, raw, 0.15);
    requestAnimationFrame(sample);
  })();

  /* ---------- marquees driven by scroll: faster when scrolling, reverse when scrolling up ---------- */
  const tracks = [...document.querySelectorAll('.tape .marquee-track, .marquee .marquee-track')];
  if (tracks.length) {
    document.documentElement.classList.add('js-marquee');
    const items = tracks.map((el, i) => ({ el, x: 0, dir: el.closest('.tape-b') ? 1 : -1, w: 0, vis: true }));
    const measure = () => items.forEach((it) => { it.w = it.el.scrollWidth / 2; });
    measure(); addEventListener('resize', measure); addEventListener('load', measure);
    const io = new IntersectionObserver((es) => es.forEach((e) => { const it = items.find((i) => i.el === e.target); if (it) it.vis = e.isIntersecting; }));
    items.forEach((it) => io.observe(it.el));
    let flip = 1, last = performance.now();
    (function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (Math.abs(vel) > 0.4) flip = vel > 0 ? 1 : -1;
      const speed = 60 + Math.min(900, Math.abs(vel) * 38);   // px per second
      items.forEach((it) => {
        if (!it.vis || !it.w) return;
        it.x += it.dir * flip * speed * dt;
        if (it.x <= -it.w) it.x += it.w;
        if (it.x > 0) it.x -= it.w;
        it.el.style.transform = `translate3d(${it.x.toFixed(2)}px,0,0)`;
      });
      requestAnimationFrame(loop);
    })(last);
  }

  if (!fine) return;

  /* ---------- news: floating photo preview that follows the cursor ---------- */
  const PREVIEW = {
    RELEASE: 'hoodie-flat-front-640.webp', LOOKBOOK: 'hoodie-look-night-640.webp',
    'POP UP': 'classic-tee-look-duo-640.webp', INFO: 'heart-tee-look2-640.webp',
  };
  const rows = [...document.querySelectorAll('.news-item')];
  if (rows.length) {
    const pv = document.createElement('div');
    pv.className = 'news-preview'; pv.setAttribute('aria-hidden', 'true');
    pv.innerHTML = '<img alt="">';
    document.body.append(pv);
    const img = pv.querySelector('img');
    let tx = 0, ty = 0, x = 0, y = 0, on = false, running = false;
    const run = () => {
      const px = x;
      x = lerp(x, tx, 0.14); y = lerp(y, ty, 0.14);
      const rot = Math.max(-14, Math.min(14, (x - px) * 0.9));
      pv.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot.toFixed(2)}deg)`;
      if (on || Math.abs(tx - x) > 0.5) requestAnimationFrame(run); else running = false;
    };
    rows.forEach((r) => {
      r.addEventListener('mouseenter', (e) => {
        const cat = (r.querySelector('.news-cat') || {}).textContent || 'INFO';
        img.src = 'assets/img/' + (PREVIEW[cat.trim()] || PREVIEW.INFO);
        if (!on) { x = tx = e.clientX; y = ty = e.clientY; }
        on = true; pv.classList.add('show');
        if (!running) { running = true; requestAnimationFrame(run); }
      });
      r.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
      r.addEventListener('mouseleave', () => { on = false; pv.classList.remove('show'); });
    });
  }

  /* ---------- 3D tilt toward the cursor on imagery ---------- */
  document.querySelectorAll('.look-card, .look-split .big, .t-media').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (el.classList.contains('reveal') && !el.classList.contains('in')) return;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1000px) rotateX(${(-ny * 7).toFixed(2)}deg) rotateY(${(nx * 9).toFixed(2)}deg) scale(1.015)`;
      el.style.setProperty('--mx', `${((nx + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${((ny + 0.5) * 100).toFixed(1)}%`);
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- spotlight that follows the cursor across cards ---------- */
  document.querySelectorAll('.news-item, .contact-info dl, .product-card, .t-card').forEach((el) => {
    el.classList.add('spot');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--sx', `${e.clientX - r.left}px`);
      el.style.setProperty('--sy', `${e.clientY - r.top}px`);
    });
  });
})();

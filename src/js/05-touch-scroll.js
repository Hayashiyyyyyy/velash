/* VE:LASH FX 3 (phones / touch): auto-hiding header, scroll-driven 3D rise for cards,
   photo depth, coverflow product rail, tap ripples, device-tilt for the 3D logo */
(() => {
  const touch = matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!touch || reduce) return;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- header hides on scroll down, returns on scroll up ---------- */
  const header = document.querySelector('.site-header');
  let lastY = scrollY, acc = 0;

  /* ---------- scroll-driven 3D rise + photo depth ---------- */
  const rise = [...document.querySelectorAll('.look-card, .product-card, .news-item, .look-split .big, .look-side > img, .contact-info dl, .viewer-stage')];
  const depth = [...document.querySelectorAll('.look-card:not(.contain) img, .look-split .big img')];

  function frame() {
    const y = scrollY, dy = y - lastY; lastY = y;
    if (header && !document.body.classList.contains('menu-open')) {
      acc = (Math.sign(dy) === Math.sign(acc) ? acc : 0) + dy;
      if (y < 80 || acc < -24) header.classList.remove('is-hidden');
      else if (acc > 30) header.classList.add('is-hidden');
    }
    const H = innerHeight;
    for (const el of rise) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > H + 40) continue;
      // 0 when the element's top is at the bottom edge, 1 once it reaches 62% of the screen height
      const p = clamp((H - r.top) / (H * 0.38));
      const e = 1 - Math.pow(1 - p, 3);
      el.style.rotate = `x ${((1 - e) * 22).toFixed(2)}deg`;
      el.style.scale = (0.9 + e * 0.1).toFixed(4);
      el.style.transformOrigin = '50% 100%';
    }
    for (const img of depth) {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > H) continue;
      const d = (r.top + r.height / 2 - H / 2) / H;
      img.style.translate = `0 ${(d * -9).toFixed(2)}%`;
    }
  }
  let q = false;
  addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; frame(); }); } }, { passive: true });
  frame();

  /* ---------- coverflow on the swipeable product rail ---------- */
  const rail = document.getElementById('track-rail');
  if (rail) {
    const cards = [...rail.children];
    const flow = () => {
      const c = innerWidth / 2;
      cards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const d = clamp((r.left + r.width / 2 - c) / innerWidth, -1, 1);
        card.style.transform = `perspective(900px) rotateY(${(-d * 28).toFixed(2)}deg) scale(${(1 - Math.abs(d) * 0.12).toFixed(3)})`;
        card.style.opacity = (1 - Math.abs(d) * 0.45).toFixed(3);
      });
    };
    rail.addEventListener('scroll', () => requestAnimationFrame(flow), { passive: true });
    addEventListener('resize', flow);
    flow();
  }

  /* ---------- device tilt steers the 3D logo (Android; no permission prompt) ---------- */
  if (document.getElementById('hero-canvas') && typeof DeviceOrientationEvent !== 'undefined' && !DeviceOrientationEvent.requestPermission) {
    let base = null, pending = null;
    addEventListener('deviceorientation', (ev) => {
      if (ev.gamma == null || ev.beta == null) return;
      if (!base) base = { g: ev.gamma, b: ev.beta };
      pending = ev;
    });
    (function push() {
      if (pending && scrollY < innerHeight) {
        const nx = clamp((pending.gamma - base.g) / 25, -1, 1);
        const ny = clamp((pending.beta - base.b) / 25, -1, 1);
        dispatchEvent(new PointerEvent('pointermove', { clientX: (nx + 1) / 2 * innerWidth, clientY: (ny + 1) / 2 * innerHeight }));
        pending = null;
      }
      requestAnimationFrame(push);
    })();
  }
})();

/* VE:LASH FX 4 (desktop polish): sliding nav indicator, auto-hiding header, ambient cursor light,
   page-hero mouse depth, collection film strip (horizontal scroll scene) */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(min-width: 901px) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- collection film strip: vertical scroll -> horizontal motion (desktop), swipe (phones) ---------- */
  const film = document.getElementById('film');
  const rail = document.getElementById('film-rail');
  if (film && rail) {
    const items = [...rail.children];
    const now = document.getElementById('film-now');
    const bar = document.getElementById('film-bar');
    let over = 0;
    const pinned = () => fine && !reduce;
    const measure = () => {
      if (!pinned()) { film.style.height = ''; over = 0; rail.style.transform = ''; return; }
      over = Math.max(0, rail.scrollWidth - innerWidth + 64);
      film.style.height = `${innerHeight + over}px`;
    };
    measure(); addEventListener('resize', measure); addEventListener('load', measure);
    const update = () => {
      let p;
      if (over) {
        const r = film.getBoundingClientRect();
        p = clamp(-r.top / Math.max(1, film.offsetHeight - innerHeight));
        rail.style.transform = `translate3d(${(-p * over).toFixed(1)}px,0,0)`;
      } else {
        p = clamp(rail.scrollLeft / Math.max(1, rail.scrollWidth - rail.clientWidth));
      }
      if (bar) bar.style.transform = `scaleX(${p})`;
      // each frame: depth by distance from screen centre + inner image drift
      let best = 0, bestD = 9;
      items.forEach((it, i) => {
        const r = it.getBoundingClientRect();
        const d = (r.left + r.width / 2 - innerWidth / 2) / innerWidth;
        if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
        if (reduce) return;
        it.style.setProperty('--fd', clamp(1 - Math.abs(d) * 1.4).toFixed(3));
        const img = it.querySelector('img');
        if (img) img.style.translate = `${(d * -12).toFixed(2)}% 0`;
      });
      if (now) now.textContent = String(best + 1).padStart(2, '0');
    };
    addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    rail.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    addEventListener('resize', update);
    update();
  }

  if (!fine || reduce) return;

  /* ---------- sliding nav indicator ---------- */
  const nav = document.getElementById('site-nav');
  if (nav) {
    const pill = document.createElement('i');
    pill.className = 'nav-pill'; pill.setAttribute('aria-hidden', 'true');
    nav.prepend(pill);
    const links = [...nav.querySelectorAll(':scope > a')];
    const current = links.find((a) => a.getAttribute('aria-current') === 'page');
    const moveTo = (a, show = true) => {
      if (!a) { pill.style.opacity = 0; return; }
      pill.style.opacity = show ? 1 : 0;
      pill.style.width = `${a.offsetWidth}px`;
      pill.style.transform = `translateX(${a.offsetLeft}px)`;
    };
    nav.classList.add('has-pill');
    links.forEach((a) => a.addEventListener('mouseenter', () => { nav.classList.add('hovering'); moveTo(a); }));
    nav.addEventListener('mouseleave', () => { nav.classList.remove('hovering'); moveTo(current, !!current); });
    addEventListener('load', () => moveTo(current, !!current));
    addEventListener('resize', () => moveTo(current, !!current));
    moveTo(current, !!current);
  }

  /* ---------- header tucks away on scroll down, returns on scroll up ---------- */
  const header = document.querySelector('.site-header');
  let lastY = scrollY, acc = 0;
  addEventListener('scroll', () => {
    const y = scrollY, dy = y - lastY; lastY = y;
    acc = (Math.sign(dy) === Math.sign(acc) ? acc : 0) + dy;
    if (y < 120 || acc < -30) header.classList.remove('is-hidden');
    else if (acc > 60) header.classList.add('is-hidden');
  }, { passive: true });

  /* ---------- ambient light that follows the cursor across the background ---------- */
  const glow = document.createElement('div');
  glow.className = 'ambient'; glow.setAttribute('aria-hidden', 'true');
  document.body.prepend(glow);
  let tx = innerWidth / 2, ty = innerHeight / 3, x = tx, y = ty;
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });

  /* ---------- page hero: title and floor shift with the mouse ---------- */
  const ph = document.querySelector('.page-hero');
  let hx = 0, hy = 0, mx = 0, my = 0;
  if (ph) addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });

  (function loop() {
    x = lerp(x, tx, 0.08); y = lerp(y, ty, 0.08);
    glow.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    if (ph && scrollY < ph.offsetHeight) {
      hx = lerp(hx, mx, 0.07); hy = lerp(hy, my, 0.07);
      ph.style.setProperty('--hx', `${(hx * -36).toFixed(2)}px`);
      ph.style.setProperty('--hy', `${(hy * -18).toFixed(2)}px`);
      ph.style.setProperty('--fx', `${(hx * 60).toFixed(2)}px`);
    }
    requestAnimationFrame(loop);
  })();
})();

/* VE:LASH touch extras: swipe-rail pagination dots, hold-to-warp light rings, light haptics */
(() => {
  const touch = matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  if (!touch) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

  /* ---------- pagination dots for swipe rails ---------- */
  ['track-rail', 'film-rail'].forEach((id) => {
    const rail = document.getElementById(id);
    if (!rail) return;
    const n = rail.children.length;
    const dots = document.createElement('div');
    dots.className = 'rail-dots'; dots.setAttribute('aria-hidden', 'true');
    dots.innerHTML = '<i></i>'.repeat(n);
    rail.after(dots);
    const ds = [...dots.children];
    const upd = () => {
      const c = rail.scrollLeft + rail.clientWidth / 2;
      let best = 0, bd = 1e9;
      [...rail.children].forEach((el, i) => { const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - c); if (d < bd) { bd = d; best = i; } });
      ds.forEach((d, i) => d.classList.toggle('on', i === best));
    };
    let lastBest = -1;
    rail.addEventListener('scroll', () => requestAnimationFrame(() => {
      upd();
      const b = ds.findIndex((d) => d.classList.contains('on'));
      if (b !== lastBest) { if (lastBest !== -1) buzz(4); lastBest = b; }
    }), { passive: true });
    upd();
  });

  /* ---------- hold-to-warp: light rings spread from the finger ---------- */
  const hero = document.querySelector('.hero');
  if (hero && !reduce) {
    let timer = 0;
    hero.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a,button')) return;
      buzz(10);
      const spawn = () => {
        const r = document.createElement('span');
        r.className = 'warp-ring';
        r.style.left = `${e.clientX}px`; r.style.top = `${e.clientY - hero.getBoundingClientRect().top}px`;
        hero.append(r);
        r.addEventListener('animationend', () => r.remove());
      };
      spawn(); clearInterval(timer); timer = setInterval(spawn, 260);
    });
    const stop = () => clearInterval(timer);
    addEventListener('pointerup', stop); addEventListener('pointercancel', stop);
  }

  /* ---------- light haptics on taps ---------- */
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.add-btn, .section-link, .t-buy, .submit-btn, .fab-store, .news-filter button, .menu-btn, .size-pick button, .color-pick button')) buzz(6);
  }, { passive: true });
})();

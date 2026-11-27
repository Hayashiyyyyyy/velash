/* VE:LASH FX 6: HUD readouts (live Tokyo time / signal), footer clock, back-to-top progress ring (desktop) */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(min-width: 901px) and (pointer: fine)').matches;
  const tyo = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Tokyo', hour12: false });

  /* ---------- live readouts ---------- */
  const times = [...document.querySelectorAll('.hud-time')];
  const sig = document.querySelector('.hud-sig');
  const foot = document.querySelector('.footer-bottom');
  let ft = null;
  if (foot) {
    ft = document.createElement('span');
    ft.className = 'ft-clock';
    foot.insertBefore(ft, foot.lastElementChild);
  }
  const tick = () => {
    const t = tyo();
    times.forEach((el) => { el.textContent = `TYO ${t}`; });
    if (ft) ft.innerHTML = `<i></i>TOKYO ${t}`;
    if (sig && !reduce) sig.textContent = `SIG ${(96 + Math.random() * 3.8).toFixed(1)}%`;
  };
  tick(); setInterval(tick, 1000);

  /* ---------- back to top with circular scroll progress (desktop) ---------- */
  if (!fine) return;
  const btn = document.createElement('button');
  btn.className = 'to-top';
  btn.setAttribute('aria-label', 'ページの先頭へ戻る');
  btn.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="tt-bg" cx="24" cy="24" r="21"/><circle class="tt-fg" cx="24" cy="24" r="21"/></svg><span>↑</span>';
  document.body.append(btn);
  const fg = btn.querySelector('.tt-fg');
  const C = 2 * Math.PI * 21;
  fg.style.strokeDasharray = C;
  const upd = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = Math.min(1, scrollY / Math.max(1, max));
    fg.style.strokeDashoffset = (C * (1 - p)).toFixed(1);
    btn.classList.toggle('show', scrollY > innerHeight * 0.8);
  };
  addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
  upd();
  btn.addEventListener('click', () => {
    if (window.lenis) window.lenis.scrollTo(0, { duration: 1.6 });
    else scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

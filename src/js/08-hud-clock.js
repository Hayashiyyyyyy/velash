/* VE:LASH HUD readouts (live Tokyo time / signal) + footer clock */
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

})();

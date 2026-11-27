/* zine hero: paper pieces drift slightly with the mouse (desktop only) */
(() => {
  const stage = document.getElementById('zine-stage');
  if (!stage || !matchMedia('(pointer: fine) and (min-width: 901px)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = [...stage.querySelectorAll('[data-depth]')];
  let raf = 0;
  stage.addEventListener('pointermove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      els.forEach((el) => {
        const d = +el.dataset.depth;
        el.style.setProperty('--px', `${x * d}px`);
        el.style.setProperty('--py', `${y * d}px`);
      });
    });
  });
})();

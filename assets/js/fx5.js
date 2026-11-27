/* VE:LASH FX 5 (phones): app-style bottom dock, swipe-rail pagination dots,
   hold-to-warp light rings, light haptics */
(() => {
  const touch = matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  if (!touch) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

  /* ---------- bottom dock ---------- */
  const page = document.body.dataset.page;
  const I = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    look: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="m3.5 16 5-5 4 4 3-3 5 5"/><circle cx="15.5" cy="8.5" r="1.5"/></svg>',
    shop: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    store: '<svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg>',
  };
  const items = [
    ['index.html', 'Home', 'home', I.home],
    ['collection.html', 'Look', 'collection', I.look],
    ['shop.html', 'Shop', 'shop', I.shop],
    [BASE_URL, 'Store', 'store', I.store],
  ];
  const dock = document.createElement('nav');
  dock.className = 'dock';
  dock.setAttribute('aria-label', 'クイックナビ');
  dock.innerHTML = '<i class="dock-pill" aria-hidden="true"></i>' + items.map(([href, label, key, icon]) =>
    `<a href="${href}"${key === 'store' ? ' target="_blank" rel="noopener" class="is-store"' : ''}${key === page ? ' aria-current="page"' : ''}>${icon}<span>${label}</span></a>`).join('');
  document.body.append(dock);
  document.body.classList.add('has-dock');
  const pill = dock.querySelector('.dock-pill');
  const place = () => {
    const a = dock.querySelector('a[aria-current="page"]');
    if (!a) { pill.style.opacity = 0; return; }
    pill.style.opacity = 1;
    pill.style.width = `${a.offsetWidth}px`;
    pill.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  addEventListener('load', place); addEventListener('resize', place); requestAnimationFrame(place);
  dock.addEventListener('pointerdown', (e) => {
    const a = e.target.closest('a'); if (!a || a.classList.contains('is-store')) return;
    pill.style.opacity = 1; pill.style.width = `${a.offsetWidth}px`; pill.style.transform = `translateX(${a.offsetLeft}px)`;
  });
  // show after the first screen on the top page, immediately elsewhere
  const showDock = () => dock.classList.toggle('show', page !== 'home' || scrollY > innerHeight * 0.4);
  addEventListener('scroll', showDock, { passive: true }); showDock();

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
    if (e.target.closest('.add-btn, .section-link, .t-buy, .submit-btn, .fab-store, .news-filter button, .menu-btn, .size-pick button, .color-pick button, .dock a')) buzz(6);
  }, { passive: true });
})();

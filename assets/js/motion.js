/* VE:LASH motion: smooth scroll + scroll-scrubbed scenes (statement / product track / zoom lookbook) */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width: 901px) and (pointer: fine)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (x) => 1 - Math.pow(1 - x, 3);

  /* ---------- smooth inertial scroll (desktop only; touch keeps native scrolling) ---------- */
  if (!reduce && desktop.matches && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    window.lenis = lenis;
  }

  // progress of a tall section while its sticky child is pinned: 0 at pin start, 1 at pin end
  const pinProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, el.offsetHeight - innerHeight));
  };

  const scenes = [];

  /* ---------- SCENE: statement, word-by-word highlight ---------- */
  const stmt = document.getElementById('statement');
  const stmtText = document.getElementById('statement-text');
  if (stmt && stmtText) {
    // wrap every word (keeping <em> emphasis) in a span
    const words = [];
    const walk = (node, em) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const s = document.createElement('span');
            s.className = 'w' + (em ? ' em' : '');
            s.textContent = part;
            frag.append(s); words.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          walk(n, em || n.tagName === 'EM');
        }
      });
    };
    walk(stmtText, false);
    scenes.push(() => {
      const p = reduce ? 1 : clamp(pinProgress(stmt) * 1.25);
      const lit = p * words.length;
      words.forEach((w, i) => w.style.setProperty('--o', clamp(lit - i).toFixed(3)));
    });
  }

  /* ---------- SCENE: horizontal product track ---------- */
  const track = document.getElementById('track');
  const rail = document.getElementById('track-rail');
  const bar = document.getElementById('track-bar');
  if (track && rail && typeof PRODUCTS !== 'undefined') {
    rail.innerHTML = PRODUCTS.map((p, i) => `
      <article class="t-card">
        <a class="t-media${p.photo ? ' is-photo' : ''}" href="${p.url || 'shop.html'}"${p.url ? ' target="_blank" rel="noopener"' : ''}>
          <img decoding="async" src="${IMG}${p.img}" srcset="${IMG}${p.img.replace('.webp', '-640.webp')} 640w, ${IMG}${p.img} ${p.w}w" sizes="(max-width: 900px) 78vw, 34vw" alt="${p.name} ${p.color}">
          ${p.hover ? `<img class="t-hover" decoding="async" src="${IMG}${p.hover.replace('.webp', '-640.webp')}" alt="">` : ''}
          ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
        </a>
        <div class="t-info">
          <span class="t-num">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="t-name">${p.name}</h3>
          <p class="t-meta"><span>${p.color}</span><span>${fmtPrice(p.price)}</span></p>
          ${p.url ? `<a class="t-buy" href="${p.url}" target="_blank" rel="noopener">Buy on BASE ↗</a>` : '<span class="t-buy is-disabled">Coming soon</span>'}
        </div>
      </article>`).join('');

    let overflow = 0;
    const measure = () => {
      if (!desktop.matches || reduce) { track.style.height = ''; overflow = 0; rail.style.transform = ''; return; }
      overflow = Math.max(0, rail.scrollWidth - innerWidth + 64);
      track.style.height = `${innerHeight + overflow}px`;
    };
    addEventListener('resize', measure);
    addEventListener('load', measure);
    measure();
    const cards = [...rail.children];
    scenes.push(() => {
      if (!overflow) {
        if (bar) bar.style.transform = `scaleX(${clamp(rail.scrollLeft / Math.max(1, rail.scrollWidth - rail.clientWidth))})`;
        return;
      }
      const p = pinProgress(track);
      rail.style.transform = `translate3d(${-p * overflow}px,0,0)`;
      if (bar) bar.style.transform = `scaleX(${p})`;
      // cards lean in slightly as they pass the centre of the screen
      cards.forEach((c) => {
        const r = c.getBoundingClientRect();
        const d = clamp(Math.abs(r.left + r.width / 2 - innerWidth / 2) / innerWidth, 0, 1);
        c.style.setProperty('--k', (1 - d).toFixed(3));
      });
    });
    rail.addEventListener('scroll', () => requestAnimationFrame(run), { passive: true });
  }

  /* ---------- run all scenes on scroll / resize ---------- */
  let queued = false;
  function run() { queued = false; scenes.forEach((s) => s()); }
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  run();
})();

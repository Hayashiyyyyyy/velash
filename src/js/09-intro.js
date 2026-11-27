/* VE:LASH opening sequence (index only, once per browser session) */
(function () {
  const intro = document.getElementById('intro');
  if (!intro) return;
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finish = () => {
    if (body.classList.contains('intro-done')) return;
    body.classList.add('intro-done');
    dispatchEvent(new Event('velash:intro-done'));
  };

  if (sessionStorage.getItem('velash-intro') || reduce) {
    intro.remove();
    finish();
    return;
  }

  body.classList.add('intro-lock');
  const countEl = document.getElementById('intro-count');
  const barEl = document.getElementById('intro-bar');
  const textEl = document.getElementById('intro-text');
  const finalText = textEl.textContent;
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>=:';

  const DURATION = 2200;
  let loaded = document.readyState === 'complete';
  addEventListener('load', () => { loaded = true; });
  const t0 = performance.now();
  let leaving = false;

  function frame(now) {
    if (leaving) return;
    const p = Math.min(1, (now - t0) / DURATION);
    const eased = 1 - Math.pow(1 - p, 3);
    const n = Math.floor(eased * 100);
    countEl.textContent = String(n).padStart(3, '0');
    barEl.style.transform = `scaleX(${eased})`;

    // scramble text: letters settle from left to right
    const settled = Math.floor(finalText.length * Math.min(1, p * 1.3));
    textEl.textContent = finalText.split('').map((ch, i) =>
      ch === ' ' || i < settled ? ch : glyphs[(Math.random() * glyphs.length) | 0]
    ).join('');

    if (p >= 1 && (loaded || now - t0 > DURATION + 2500)) { leave(); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function leave() {
    if (leaving) return;
    leaving = true;
    textEl.textContent = finalText;
    countEl.textContent = '100';
    barEl.style.transform = 'scaleX(1)';
    intro.classList.add('leave');
    setTimeout(finish, 350);
    setTimeout(() => {
      intro.remove();
      body.classList.remove('intro-lock');
    }, 1500);
    sessionStorage.setItem('velash-intro', '1');
  }

  document.getElementById('intro-skip').addEventListener('click', leave);
})();

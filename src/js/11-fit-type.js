/* VE:LASH phones: poster-size headings that always fit — shrink each one only as much as needed */
(() => {
  const mq = matchMedia('(max-width: 900px)');
  const SEL = '.hero-copy, .section-title, .look-text h3, .zoom-copy .section-title';
  const fit = () => {
    document.querySelectorAll(SEL).forEach((el) => {
      el.style.fontSize = '';
      if (!mq.matches) return;
      let size = parseFloat(getComputedStyle(el).fontSize);
      let guard = 40;
      while (el.scrollWidth > el.clientWidth + 1 && size > 22 && guard--) {
        size *= 0.96;
        el.style.setProperty('font-size', size.toFixed(1) + 'px', 'important');
      }
    });
  };
  let t = 0;
  const later = () => { clearTimeout(t); t = setTimeout(fit, 80); };
  fit();
  addEventListener('resize', later);
  addEventListener('load', fit);
  if (document.fonts) document.fonts.ready.then(fit);
})();

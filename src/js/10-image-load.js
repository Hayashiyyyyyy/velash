/* VE:LASH: fade product images in once decoded (avoids blank white boxes while loading) */
(() => {
  const mark = (img) => {
    if (img.classList.contains('is-loaded')) return;
    const done = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
  };
  const scan = () => document.querySelectorAll('.product-media .tilt img, .t-media img:first-child').forEach(mark);
  scan();
  // product grids / rails are rendered from JS: watch for new images
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();

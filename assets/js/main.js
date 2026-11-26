/* VE:LASH prototype - shared UI (header / footer / cart / effects) */

const IMG = 'assets/img/';

const PRODUCTS = [
  { id: 'sweat-black', name: 'Graffiti Logo Crew Sweat', color: 'Black', img: 'sweat-black.webp', price: null, badge: 'NEW', swatch: '#111' },
  { id: 'sweat-navy',  name: 'Graffiti Logo Crew Sweat', color: 'Navy',  img: 'sweat-navy.webp',  price: null, badge: 'NEW', swatch: '#1b2340' },
  { id: 'sweat-pink',  name: 'Graffiti Logo Crew Sweat', color: 'Pink',  img: 'sweat-pink.webp',  price: null, badge: 'NEW', swatch: '#f2a6c8' },
  { id: 'tee-manifesto', name: 'Manifesto Tee', color: 'Black', img: 'look-tee.webp', price: null, swatch: '#111', photo: true },
  { id: 'tee-heart', name: 'Heart Camo Tee', color: 'White', img: 'look-street.webp', price: null, swatch: '#f4f4f4', photo: true },
];

const fmtPrice = (p) => (p == null ? 'PRICE TBA' : '¥' + p.toLocaleString('ja-JP'));

/* ---------- header / footer / cart ---------- */
function renderChrome() {
  const page = document.body.dataset.page;
  const nav = [
    ['index.html', 'Home', 'home'],
    ['collection.html', 'Collection', 'collection'],
    ['shop.html', 'Shop', 'shop'],
    ['news.html', 'News', 'news'],
    ['contact.html', 'Contact', 'contact'],
  ];
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <a class="brand" href="index.html" aria-label="VE:LASH home"><img class="brand-logo" src="${IMG}logo-white.webp" alt="VE:LASH"></a>
    <nav class="site-nav" id="site-nav">
      <i class="nav-sweep" aria-hidden="true"></i>
      <i class="nav-grid" aria-hidden="true"></i>
      <p class="nav-head" aria-hidden="true"><span>// NAVIGATION</span><span>VE:LASH</span></p>
      ${nav.map(([href, label, key], i) => `<a href="${href}" style="--i:${i}"${key === page ? ' aria-current="page"' : ''}><span class="nl" data-text="${label}">${label}</span></a>`).join('')}
      <div class="nav-foot">
        <div class="nav-social"><a href="#">Instagram</a><a href="#">TikTok</a><a href="#">X</a></div>
        <div class="nav-tape" aria-hidden="true"><div class="marquee-track"><span>MERRY CHRISTMAS ✶ BREAK THROUGH THE ORDINARY ✶ VE:LASH HOLIDAY ✶&nbsp;</span><span>MERRY CHRISTMAS ✶ BREAK THROUGH THE ORDINARY ✶ VE:LASH HOLIDAY ✶&nbsp;</span></div></div>
      </div>
    </nav>
    <div style="display:flex;gap:20px;align-items:center">
      <button class="cart-btn" id="cart-open">CART (<span id="cart-count">0</span>)</button>
      <button class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="site-nav">MENU</button>
    </div>`;
  document.body.prepend(header);
  const onScroll = () => header.classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="footer-top">
      <div>
        <p class="section-label" style="margin-bottom:12px">Newsletter</p>
        <form class="newsletter" onsubmit="event.preventDefault();this.querySelector('input').value='';this.querySelector('button').textContent='THANKS';">
          <input type="email" required placeholder="your@email.com" aria-label="メールアドレス">
          <button type="submit">JOIN</button>
        </form>
      </div>
      <div class="footer-nav">
        <ul><li>SITE</li><li><a href="index.html">Home</a></li><li><a href="collection.html">Collection</a></li><li><a href="shop.html">Shop</a></li><li><a href="news.html">News</a></li><li><a href="contact.html">Contact</a></li></ul>
        <ul><li>SOCIAL</li><li><a href="#">Instagram</a></li><li><a href="#">TikTok</a></li><li><a href="#">X</a></li></ul>
      </div>
    </div>    <div class="footer-bottom"><span>&copy; VE:LASH</span><span>BREAK THROUGH THE ORDINARY</span></div>`;
  document.body.append(footer);

  const drawer = document.createElement('aside');
  drawer.className = 'cart-drawer';
  drawer.id = 'cart';
  drawer.setAttribute('aria-label', 'カート');
  drawer.innerHTML = `
    <div class="cart-head"><span>CART</span><button id="cart-close">CLOSE</button></div>
    <div class="cart-items" id="cart-items"></div>
    <div class="cart-foot">
      <div class="cart-total"><span>SUBTOTAL</span><span id="cart-total">-</span></div>
      <button class="add-btn" onclick="alert('試作版のため決済には進みません。Shopify連携後にチェックアウトへ遷移します。')">CHECKOUT</button>
      <p class="cart-note">* 試作版です。本番ではShopifyのカート・決済に接続します。</p>
    </div>`;
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  document.body.append(drawer, scrim);

  const open = () => { drawer.classList.add('open'); scrim.classList.add('show'); };
  const close = () => { drawer.classList.remove('open'); scrim.classList.remove('show'); };
  document.getElementById('cart-open').onclick = open;
  document.getElementById('cart-close').onclick = close;
  scrim.onclick = close;
  window.openCart = open;

  const menuBtn = document.getElementById('menu-btn');
  const siteNav = document.getElementById('site-nav');
  const setMenu = (isOpen) => {
    siteNav.classList.toggle('open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
    menuBtn.setAttribute('aria-expanded', isOpen);
    menuBtn.textContent = isOpen ? 'CLOSE' : 'MENU';
  };
  menuBtn.onclick = () => setMenu(!siteNav.classList.contains('open'));
  siteNav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
}

/* ---------- cart (localStorage) ---------- */
const CART_KEY = 'velash-cart';
const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '[]');
const setCart = (c) => { localStorage.setItem(CART_KEY, JSON.stringify(c)); renderCart(); };

function addToCart(id, size = 'M') {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  const cart = getCart();
  const line = cart.find((l) => l.id === id && l.size === size);
  if (line) line.qty++; else cart.push({ id, size, qty: 1 });
  setCart(cart);
  window.openCart();
}
window.addToCart = addToCart;

function renderCart() {
  const cart = getCart();
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = count;
  const wrap = document.getElementById('cart-items');
  if (!wrap) return;
  if (!cart.length) { wrap.innerHTML = '<p class="cart-empty">カートは空です。</p>'; document.getElementById('cart-total').textContent = '-'; return; }
  wrap.innerHTML = cart.map((l, i) => {
    const p = PRODUCTS.find((x) => x.id === l.id);
    return `<div class="cart-line">
      <img loading="lazy" decoding="async" src="${IMG}${p.img}" alt="">
      <div>${p.name}<small>${p.color} / ${l.size} / x${l.qty}</small></div>
      <button data-rm="${i}" aria-label="削除" style="font-family:var(--mono);font-size:11px">REMOVE</button>
    </div>`;
  }).join('');
  wrap.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { const c = getCart(); c.splice(+b.dataset.rm, 1); setCart(c); });
  const allPriced = cart.every((l) => PRODUCTS.find((x) => x.id === l.id).price != null);
  document.getElementById('cart-total').textContent = allPriced
    ? fmtPrice(cart.reduce((s, l) => s + PRODUCTS.find((x) => x.id === l.id).price * l.qty, 0))
    : 'TBA';
}

/* ---------- product grid ---------- */
function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = PRODUCTS.map((p) => `
    <article class="product-card reveal">
      <div class="product-media">
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
        <div class="tilt"><img loading="lazy" decoding="async" src="${IMG}${p.img}" srcset="${IMG}${p.img.replace('.webp', '-640.webp')} 640w, ${IMG}${p.img} ${p.photo ? 1000 : 1200}w" sizes="(max-width: 900px) 50vw, 33vw" alt="${p.name} ${p.color}" ${p.photo ? 'style="object-fit:cover;padding:0"' : ''}></div>
        <div class="shine"></div>
      </div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <div class="product-row"><span>${p.color}</span><span>${fmtPrice(p.price)}</span></div>
        <div class="product-row"><div class="swatches"><i style="background:${p.swatch}"></i></div><span>S / M / L / XL</span></div>
        <button class="add-btn" onclick="addToCart('${p.id}')">Add to cart</button>
      </div>
    </article>`).join('');

  // 3D tilt on hover
  grid.querySelectorAll('.product-media').forEach((m) => {
    const tilt = m.querySelector('.tilt');
    m.addEventListener('pointermove', (e) => {
      const r = m.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 16}deg) scale(1.04)`;
      m.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
      m.style.setProperty('--my', `${(y + 0.5) * 100}%`);
    });
    m.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  });
}

/* ---------- CSS 3D ring carousel ---------- */
function initRing() {
  const stage = document.getElementById('ring-stage');
  if (!stage) return;
  const ring = stage.querySelector('.ring');
  const items = [...PRODUCTS, ...PRODUCTS.slice(0, 3)];
  const n = items.length;
  const w = ring.offsetWidth;
  const radius = Math.round((w / 2) / Math.tan(Math.PI / n)) + 60;
  ring.innerHTML = items.map((p, i) => `
    <a class="ring-item" href="shop.html" style="transform:rotateY(${(360 / n) * i}deg) translateZ(${radius}px)">
      <img loading="lazy" decoding="async" src="${IMG}${p.img.replace('.webp', '-640.webp')}" alt="${p.name}" style="${p.photo ? '' : 'object-fit:contain;padding:10%'}">
      <span class="cap"><span>${p.name.toUpperCase()}</span><span>${p.color.toUpperCase()}</span></span>
    </a>`).join('');

  let rot = 0, vel = 0.12, dragging = false, lastX = 0, moved = 0;
  stage.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lastX = e.clientX; stage.classList.add('dragging'); stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
    vel = dx * 0.25; rot += vel;
  });
  const end = () => { dragging = false; stage.classList.remove('dragging'); };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('click', (e) => { if (moved > 6) e.preventDefault(); }, true);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  visibleLoop(stage, () => {
    if (!dragging) { vel += (0.12 - vel) * 0.02; if (!reduce) rot += vel; }
    ring.style.transform = `translateZ(${-radius}px) rotateX(-6deg) rotateY(${rot}deg)`;
  });
}

/* run an animation loop only while the element is on screen */
function visibleLoop(el, step) {
  let on = false, raf = 0;
  const run = () => { step(); raf = requestAnimationFrame(run); };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { on = true; run(); }
    else if (!e.isIntersecting && on) { on = false; cancelAnimationFrame(raf); }
  }).observe(el);
}

/* ---------- 3D garment viewer (shop) ---------- */
function initViewer() {
  const stage = document.getElementById('viewer-stage');
  if (!stage) return;
  const garment = stage.querySelector('.garment');
  const imgs = garment.querySelectorAll('img');
  let ry = -20, rx = 0, vy = 0.25, dragging = false, lx = 0, ly = 0;
  stage.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    vy = (e.clientX - lx) * 0.5; ry += vy;
    rx = Math.max(-20, Math.min(20, rx - (e.clientY - ly) * 0.2));
    lx = e.clientX; ly = e.clientY;
  });
  stage.addEventListener('pointerup', () => { dragging = false; });
  visibleLoop(stage, () => {
    if (!dragging) { vy += (0.25 - vy) * 0.03; ry += vy; rx *= 0.96; }
    garment.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  });

  let size = 'M', current = 'sweat-black';
  document.querySelectorAll('.color-pick button').forEach((b) => b.onclick = () => {
    document.querySelectorAll('.color-pick button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true');
    current = b.dataset.id;
    const p = PRODUCTS.find((x) => x.id === current);
    imgs.forEach((im) => im.src = IMG + p.img);
    document.getElementById('viewer-color').textContent = p.color.toUpperCase();
  });
  document.querySelectorAll('.size-pick button').forEach((b) => b.onclick = () => {
    document.querySelectorAll('.size-pick button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true');
    size = b.textContent.trim();
  });
  document.getElementById('viewer-add').onclick = () => addToCart(current, size);
}

/* ---------- reveal on scroll ---------- */
function initReveal() {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}

/* ---------- contact form (prototype) ---------- */
function initForm() {
  const f = document.getElementById('contact-form');
  if (!f) return;
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('form-msg').textContent = '送信ありがとうございました（試作版のため実際には送信されません）。';
    f.reset();
  });
}

/* ---------- ambient background layer ---------- */
function initBackdrop() {
  const bd = document.createElement('div');
  bd.className = 'backdrop';
  bd.setAttribute('aria-hidden', 'true');
  bd.innerHTML = '<i class="blob b1"></i><i class="blob b2"></i><i class="grid"></i><i class="snow s1"></i><i class="snow s2"></i>';
  document.body.prepend(bd);
}

/* ---------- huge background words: scroll parallax ---------- */
function initParallax() {
  const words = [...document.querySelectorAll('.bg-word')];
  if (!words.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let queued = false;
  const update = () => {
    queued = false;
    words.forEach((w) => {
      const r = w.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2);
      w.style.transform = `translate3d(${p * +w.dataset.speed}px,0,0)`;
    });
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

/* ---------- news category filter ---------- */
function initNewsFilter() {
  const btns = document.querySelectorAll('.news-filter button');
  if (!btns.length) return;
  btns.forEach((b) => b.onclick = () => {
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    document.querySelectorAll('#news-list .news-item').forEach((it) => {
      it.hidden = b.dataset.cat !== 'ALL' && it.dataset.cat !== b.dataset.cat;
    });
  });
}

renderChrome();
initBackdrop();
initParallax();
initNewsFilter();
renderProductGrid();
renderCart();
initRing();
initViewer();
initReveal();
initForm();

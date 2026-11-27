/* VE:LASH 3D garment viewer (shop)
   Each product photo is cut out of its background (white studio or asphalt), cleaned to the single
   largest shape, then "inflated" into a closed rounded volume (thick body, thin sleeves/edges) and lit
   like a studio shot. Products with a back photo show the real back; others get plain fabric.
   Tabs switch product, colour dots switch the sweat colour, drag to rotate. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MODELS = {
  'hoodie':      { img: 'hoodie-flat-front.webp', back: 'hoodie-flat-back.webp', mode: 'dark', fabric: 0x18181b, depth: 0.5,
                   name: 'VE:LASH Full-Zip<br>Hoodie', price: '¥9,000', sizes: ['S', 'M', 'L'], url: 'https://velash.base.shop/items/142651814',
                   desc: '胸に大きくVE:LASHロゴ、袖と背面にもロゴを配したフルジップパーカー。' },
  'heart-tee':   { img: 'heart-tee.webp', mode: 'white', thr: 249, fabric: 0xeeeeee, depth: 0.28,
                   name: 'VE:LASH Heart Logo<br>T-Shirt', price: '¥4,500', sizes: ['S', 'M', 'L'], url: 'https://velash.base.shop/items/156145271',
                   desc: '迷彩柄のハートロゴを胸に配したホワイトTシャツ。' },
  'classic-tee': { img: 'classic-tee.webp', mode: 'white', thr: 235, fabric: 0x161617, depth: 0.28,
                   name: 'VE:LASH Classic<br>T-Shirt', price: '¥4,500', sizes: ['S', 'M', 'L'], url: 'https://velash.base.shop/items/156146666',
                   desc: 'ブランドのマニフェストを全面にプリントしたブラックTシャツ。' },
  'sweat-black': { img: 'sweat-black.webp', mode: 'white', thr: 200, fabric: 0x161618, depth: 0.42, sweat: true },
  'sweat-navy':  { img: 'sweat-navy.webp', mode: 'white', thr: 200, fabric: 0x1c2442, depth: 0.42, sweat: true },
  'sweat-pink':  { img: 'sweat-pink.webp', mode: 'white', thr: 200, fabric: 0xe7a3c3, depth: 0.42, sweat: true },
};
const SWEAT = { name: 'Graffiti Logo<br>Crew Sweat', price: 'COMING SOON', sizes: ['S', 'M', 'L', 'XL'], desc: 'タギングをモチーフにした立体刺繍ロゴのクルーネックスウェット。近日発売予定。' };

const stage = document.getElementById('viewer-stage');
if (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { renderer = null; }
  if (renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.className = 'garment3d';
    stage.append(renderer.domElement);
    stage.classList.add('is-3d');

    const scene = new THREE.Scene();
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0.05, 6.4);
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2.5, 3, 4);
    const fill = new THREE.DirectionalLight(0xbfd8ff, 0.7); fill.position.set(-3, 1, 2);
    const rim = new THREE.DirectionalLight(0xff2f8e, 2.4); rim.position.set(-2, 1.5, -4);
    const rim2 = new THREE.DirectionalLight(0x7fd8ff, 1.4); rim2.position.set(3, -1, -3);
    const back = new THREE.DirectionalLight(0xffffff, 1.2); back.position.set(0, 2, -5);
    scene.add(key, fill, rim, rim2, back, new THREE.AmbientLight(0xffffff, 0.25));
    const group = new THREE.Group();
    scene.add(group);

    const W = 3.4;
    const SEG = matchMedia('(max-width: 900px)').matches ? 110 : 170;
    let meshes = [];
    const cache = new Map();
    const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'assets/img/' + src; });

    /* ---- cut-out mask + smoothed distance field ---- */
    function analyse(img, m) {
      const S = 512, h = Math.round(S * img.height / img.width);
      const c = document.createElement('canvas'); c.width = S; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, S, h);
      const d = g.getImageData(0, 0, S, h).data;
      const isBg = m.mode === 'dark'
        ? (i) => (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 3 > 66
        : (i) => { const r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2]; return r >= m.thr && gg >= m.thr && b >= m.thr && Math.max(r, gg, b) - Math.min(r, gg, b) < 22; };
      const N = S * h, bg = new Uint8Array(N), stack = [];
      for (let x = 0; x < S; x++) stack.push(x, (h - 1) * S + x);
      for (let y = 0; y < h; y++) stack.push(y * S, y * S + S - 1);
      while (stack.length) {
        const i = stack.pop();
        if (bg[i] || !isBg(i)) continue;
        bg[i] = 1;
        const x = i % S, y = (i / S) | 0;
        if (x > 0) stack.push(i - 1); if (x < S - 1) stack.push(i + 1);
        if (y > 0) stack.push(i - S); if (y < h - 1) stack.push(i + S);
      }
      // keep only the largest garment shape (drops asphalt specks and stray marks)
      const lab = new Int32Array(N); let best = 0, bestN = 0, cur = 0;
      for (let s0 = 0; s0 < N; s0++) {
        if (bg[s0] || lab[s0]) continue;
        cur++; let n = 0; stack.push(s0); lab[s0] = cur;
        while (stack.length) {
          const i = stack.pop(); n++;
          const x = i % S, y = (i / S) | 0;
          const nb = [x > 0 ? i - 1 : -1, x < S - 1 ? i + 1 : -1, y > 0 ? i - S : -1, y < h - 1 ? i + S : -1];
          for (const j of nb) if (j >= 0 && !bg[j] && !lab[j]) { lab[j] = cur; stack.push(j); }
        }
        if (n > bestN) { bestN = n; best = cur; }
      }
      for (let i = 0; i < N; i++) if (!bg[i] && lab[i] !== best) bg[i] = 1;
      // fill holes fully enclosed by the garment (e.g. dark speckle gaps inside)
      // (pixels marked bg only via flood fill are already border-connected, so nothing to do)
      // chamfer distance
      const dist = new Float32Array(N);
      for (let i = 0; i < N; i++) dist[i] = bg[i] ? 0 : 1e6;
      const A1 = 1, A2 = 1.414;
      for (let y = 0; y < h; y++) for (let x = 0; x < S; x++) {
        const i = y * S + x; let v = dist[i];
        if (x > 0) v = Math.min(v, dist[i - 1] + A1);
        if (y > 0) { v = Math.min(v, dist[i - S] + A1); if (x > 0) v = Math.min(v, dist[i - S - 1] + A2); if (x < S - 1) v = Math.min(v, dist[i - S + 1] + A2); }
        dist[i] = v;
      }
      for (let y = h - 1; y >= 0; y--) for (let x = S - 1; x >= 0; x--) {
        const i = y * S + x; let v = dist[i];
        if (x < S - 1) v = Math.min(v, dist[i + 1] + A1);
        if (y < h - 1) { v = Math.min(v, dist[i + S] + A1); if (x < S - 1) v = Math.min(v, dist[i + S + 1] + A2); if (x > 0) v = Math.min(v, dist[i + S - 1] + A2); }
        dist[i] = v;
      }
      for (let pass = 0; pass < 2; pass++) {
        const src = dist.slice();
        for (let y = 1; y < h - 1; y++) for (let x = 1; x < S - 1; x++) {
          const i = y * S + x; if (bg[i]) continue;
          dist[i] = (src[i] * 4 + src[i - 1] + src[i + 1] + src[i - S] + src[i + S]) / 8;
        }
      }
      let max = 1, x0 = S, x1 = 0, y0 = h, y1 = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < S; x++) {
        const i = y * S + x; if (bg[i]) continue;
        if (dist[i] > max) max = dist[i];
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      const mc = document.createElement('canvas'); mc.width = S; mc.height = h;
      const mg = mc.getContext('2d'); const md = mg.createImageData(S, h);
      for (let i = 0; i < N; i++) { const v = bg[i] ? 0 : 255; md.data[i * 4] = md.data[i * 4 + 1] = md.data[i * 4 + 2] = v; md.data[i * 4 + 3] = 255; }
      mg.putImageData(md, 0, 0);
      return { S, h, dist, max, mask: mc, box: { x0: x0 / S, x1: x1 / S, y0: y0 / h, y1: y1 / h } };
    }

    // colour texture with the background (and its halo) repainted in the fabric colour
    function colourTex(img, A, fabric) {
      const cw = Math.min(1400, img.width), ch = Math.round(cw * img.height / img.width);
      const c = document.createElement('canvas'); c.width = cw; c.height = ch;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, cw, ch);
      const d = g.getImageData(0, 0, cw, ch);
      const f = new THREE.Color(fabric), fr = Math.round(f.r * 255), fg = Math.round(f.g * 255), fb = Math.round(f.b * 255);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const mx = Math.min(A.S - 1, Math.round(x / cw * (A.S - 1))), my = Math.min(A.h - 1, Math.round(y / ch * (A.h - 1)));
        if (A.dist[my * A.S + mx] < 2.2) { const k = (y * cw + x) * 4; d.data[k] = fr; d.data[k + 1] = fg; d.data[k + 2] = fb; }
      }
      g.putImageData(d, 0, 0);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
      return t;
    }

    async function prepare(id) {
      if (cache.has(id)) return cache.get(id);
      const m = MODELS[id];
      const img = await loadImg(m.img);
      const A = analyse(img, m);
      const out = { m, A, front: colourTex(img, A, m.fabric), mask: new THREE.CanvasTexture(A.mask) };
      if (m.back) {
        const bimg = await loadImg(m.back);
        const B = analyse(bimg, m);
        out.B = B; out.backTex = colourTex(bimg, B, m.fabric);
        out.backTex.channel = 1;
      }
      cache.set(id, out);
      return out;
    }

    let token = 0;
    async function show(id) {
      const my = ++token;
      const P = await prepare(id);
      if (my !== token) return;
      const { m, A } = P;
      meshes.forEach((x) => { group.remove(x); x.geometry.dispose(); x.material.dispose(); });
      meshes = [];
      const H = W * A.h / A.S;
      const sample = (u, v) => {
        const x = Math.min(A.S - 1, Math.max(0, Math.round(u * (A.S - 1))));
        const y = Math.min(A.h - 1, Math.max(0, Math.round((1 - v) * (A.h - 1))));
        return Math.min(1, A.dist[y * A.S + x] / (A.max * 0.7));
      };
      const side = (sign) => {
        const geo = new THREE.PlaneGeometry(W, H, SEG, Math.round(SEG * A.h / A.S));
        const pos = geo.attributes.position, uv = geo.attributes.uv;
        const uv1 = new Float32Array(uv.count * 2);
        for (let i = 0; i < pos.count; i++) {
          const u0 = uv.getX(i), v0 = uv.getY(i);
          const t = sample(u0, v0);
          const s = Math.max(0, (t - 0.07) / 0.93);
          pos.setZ(i, sign * m.depth * Math.sqrt(s * (2 - s)));
          if (P.B) {
            // map the front silhouette's box onto the back photo's box, mirrored (seen from behind)
            const nu = (u0 - A.box.x0) / Math.max(1e-3, A.box.x1 - A.box.x0);
            const ny = ((1 - v0) - A.box.y0) / Math.max(1e-3, A.box.y1 - A.box.y0);
            uv1[i * 2] = P.B.box.x0 + (1 - nu) * (P.B.box.x1 - P.B.box.x0);
            uv1[i * 2 + 1] = 1 - (P.B.box.y0 + ny * (P.B.box.y1 - P.B.box.y0));
          }
        }
        if (P.B) geo.setAttribute('uv1', new THREE.BufferAttribute(uv1, 2));
        if (sign < 0) {
          const idx = geo.index.array;
          for (let k = 0; k < idx.length; k += 3) { const tmp = idx[k]; idx[k] = idx[k + 2]; idx[k + 2] = tmp; }
          geo.index.needsUpdate = true;
        }
        geo.computeVertexNormals();
        let mat;
        if (sign > 0) mat = new THREE.MeshStandardMaterial({ map: P.front, alphaMap: P.mask, alphaTest: 0.5, roughness: 0.86 });
        else if (P.backTex) mat = new THREE.MeshStandardMaterial({ map: P.backTex, alphaMap: P.mask, alphaTest: 0.5, roughness: 0.88 });
        else mat = new THREE.MeshStandardMaterial({ color: m.fabric, alphaMap: P.mask, alphaTest: 0.5, roughness: 0.9 });
        return new THREE.Mesh(geo, mat);
      };
      meshes = [side(1), side(-1)];
      meshes.forEach((x) => group.add(x));
      // fit: scale so the garment's bounding box fills the stage nicely
      const bw = (A.box.x1 - A.box.x0) * W, bh = (A.box.y1 - A.box.y0) * H;
      fit = 2.9 / Math.max(bw, bh * 0.92);
      const cx = ((A.box.x0 + A.box.x1) / 2 - 0.5) * W, cy = (0.5 - (A.box.y0 + A.box.y1) / 2) * H;
      meshes.forEach((x) => { x.position.set(-cx, -cy, 0); });
      pop = 0;
    }

    /* ---- UI: product tabs, colours, sizes, buy link ---- */
    const $ = (id) => document.getElementById(id);
    const setInfo = (id) => {
      const m = MODELS[id], info = m.sweat ? SWEAT : m;
      if ($('viewer-name')) $('viewer-name').innerHTML = info.name;
      if ($('viewer-price')) $('viewer-price').textContent = info.price;
      if ($('viewer-desc')) $('viewer-desc').textContent = info.desc;
      if ($('viewer-colors')) $('viewer-colors').hidden = !m.sweat;
      if ($('viewer-sizes')) $('viewer-sizes').innerHTML = info.sizes.map((s, i) => `<button aria-pressed="${i === 1}">${s}</button>`).join('');
      const buy = $('viewer-buy');
      if (buy) {
        if (info.url) { buy.href = info.url; buy.textContent = 'Buy on BASE ↗'; buy.classList.remove('is-disabled'); buy.removeAttribute('aria-disabled'); }
        else { buy.removeAttribute('href'); buy.textContent = 'Coming soon'; buy.classList.add('is-disabled'); buy.setAttribute('aria-disabled', 'true'); }
      }
    };
    document.addEventListener('click', (e) => {
      const s = e.target.closest('#viewer-sizes button');
      if (s) s.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === s)));
    });
    document.querySelectorAll('.viewer-tabs [data-model]').forEach((t) => t.addEventListener('click', () => {
      document.querySelectorAll('.viewer-tabs [data-model]').forEach((x) => x.setAttribute('aria-selected', String(x === t)));
      let id = t.dataset.model;
      if (MODELS[id].sweat) { const on = document.querySelector('.color-pick button[aria-pressed="true"]'); if (on) id = on.dataset.id; }
      setInfo(id); show(id);
    }));
    document.querySelectorAll('.color-pick button').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('.color-pick button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      show(b.dataset.id);
    }));
    setInfo('hoodie'); show('hoodie');
    // warm the cache for the other products in the background
    setTimeout(() => ['heart-tee', 'classic-tee', 'sweat-black'].forEach((id) => prepare(id)), 1500);

    /* ---- render ---- */
    const resize = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(stage); resize();

    let ry = -0.5, rx = 0.08, vy = reduce ? 0 : 0.004, drag = false, lx = 0, ly = 0, pop = 1, fit = 1;
    stage.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', (e) => {
      if (!drag) return;
      vy = (e.clientX - lx) * 0.008; ry += vy;
      rx = Math.max(-0.45, Math.min(0.45, rx + (e.clientY - ly) * 0.004));
      lx = e.clientX; ly = e.clientY;
    });
    const up = () => { drag = false; };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
    const clock = new THREE.Clock();
    (function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      const t = clock.getElapsedTime();
      if (!drag) { vy += ((reduce ? 0 : 0.004) - vy) * 0.03; ry += vy; rx += (0.08 - rx) * 0.03; }
      pop = Math.min(1, pop + 0.035);
      const e = 1 - Math.pow(1 - pop, 3);
      group.scale.setScalar((0.001 + e * 0.999) * fit);
      group.rotation.set(rx, ry, 0);
      group.position.y = Math.sin(t * 1.1) * 0.05;
      renderer.render(scene, camera);
    })();
  }
}

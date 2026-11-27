/* VE:LASH 3D garment viewer (shop): the product photo is cut out of its white background,
   then "inflated" into a closed, rounded volume (thick at the body, thin at sleeves/edges)
   and lit like a studio shot. Drag to rotate; colour buttons swap the garment. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

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
    camera.position.set(0, 0.05, 6.2);

    // studio lights: soft key, cool fill, brand-pink rim
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2.5, 3, 4);
    const fill = new THREE.DirectionalLight(0xbfd8ff, 0.7); fill.position.set(-3, 1, 2);
    const rim = new THREE.DirectionalLight(0xff2f8e, 2.4); rim.position.set(-2, 1.5, -4);
    const rim2 = new THREE.DirectionalLight(0x7fd8ff, 1.4); rim2.position.set(3, -1, -3);
    scene.add(key, fill, rim, rim2, new THREE.AmbientLight(0xffffff, 0.25));

    const group = new THREE.Group();
    scene.add(group);

    const FABRIC = { 'sweat-black': 0x161618, 'sweat-navy': 0x1c2442, 'sweat-pink': 0xe7a3c3 };
    const W = 3.6; // world width of the garment plane
    const SEG = matchMedia("(max-width: 900px)").matches ? 110 : 170;
    let meshes = [];

    /* cut-out mask (flood fill of the white background from the borders) + distance field */
    function analyse(img) {
      const S = 512;
      const h = Math.round(S * img.height / img.width);
      const c = document.createElement('canvas'); c.width = S; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, S, h);
      const d = g.getImageData(0, 0, S, h).data;
      const bg = new Uint8Array(S * h);
      const isWhite = (i) => d[i * 4] > 200 && d[i * 4 + 1] > 200 && d[i * 4 + 2] > 200 && Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) - Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) < 22;
      const stack = [];
      for (let x = 0; x < S; x++) { stack.push(x, (h - 1) * S + x); }
      for (let y = 0; y < h; y++) { stack.push(y * S, y * S + S - 1); }
      while (stack.length) {
        const i = stack.pop();
        if (bg[i] || !isWhite(i)) continue;
        bg[i] = 1;
        const x = i % S, y = (i / S) | 0;
        if (x > 0) stack.push(i - 1); if (x < S - 1) stack.push(i + 1);
        if (y > 0) stack.push(i - S); if (y < h - 1) stack.push(i + S);
      }
      // chamfer distance from the background (in pixels)
      const dist = new Float32Array(S * h);
      for (let i = 0; i < S * h; i++) dist[i] = bg[i] ? 0 : 1e6;
      const a = 1, b = 1.414;
      for (let y = 0; y < h; y++) for (let x = 0; x < S; x++) {
        const i = y * S + x; let v = dist[i];
        if (x > 0) v = Math.min(v, dist[i - 1] + a);
        if (y > 0) { v = Math.min(v, dist[i - S] + a); if (x > 0) v = Math.min(v, dist[i - S - 1] + b); if (x < S - 1) v = Math.min(v, dist[i - S + 1] + b); }
        dist[i] = v;
      }
      for (let y = h - 1; y >= 0; y--) for (let x = S - 1; x >= 0; x--) {
        const i = y * S + x; let v = dist[i];
        if (x < S - 1) v = Math.min(v, dist[i + 1] + a);
        if (y < h - 1) { v = Math.min(v, dist[i + S] + a); if (x < S - 1) v = Math.min(v, dist[i + S + 1] + b); if (x > 0) v = Math.min(v, dist[i + S - 1] + b); }
        dist[i] = v;
      }
      // smooth the distance field (two box-blur passes) so the surface has no terraces
      for (let pass = 0; pass < 2; pass++) {
        const src = dist.slice();
        for (let y = 1; y < h - 1; y++) for (let x = 1; x < S - 1; x++) {
          const i = y * S + x;
          if (bg[i]) continue;
          dist[i] = (src[i] * 4 + src[i - 1] + src[i + 1] + src[i - S] + src[i + S]) / 8;
        }
      }
      let max = 1; for (let i = 0; i < S * h; i++) if (dist[i] < 1e5 && dist[i] > max) max = dist[i];
      // alpha mask texture (white = garment)
      const mc = document.createElement('canvas'); mc.width = S; mc.height = h;
      const mg = mc.getContext('2d'); const md = mg.createImageData(S, h);
      for (let i = 0; i < S * h; i++) { const v = bg[i] ? 0 : 255; md.data[i * 4] = md.data[i * 4 + 1] = md.data[i * 4 + 2] = v; md.data[i * 4 + 3] = 255; }
      mg.putImageData(md, 0, 0);
      return { S, h, dist, max, mask: mc };
    }

    function build(img, id) {
      meshes.forEach((m) => { group.remove(m); m.geometry.dispose(); m.material.dispose(); });
      meshes = [];
      const A = analyse(img);
      const H = W * A.h / A.S;
      const depth = 0.42; // max half-thickness at the thickest point (world units)
      const sample = (u, v) => {
        const x = Math.min(A.S - 1, Math.max(0, Math.round(u * (A.S - 1))));
        const y = Math.min(A.h - 1, Math.max(0, Math.round((1 - v) * (A.h - 1))));
        return Math.min(1, A.dist[y * A.S + x] / (A.max * 0.7));
      };
      // colour texture with the white background (and its anti-aliased halo) repainted in the fabric colour,
      // so the steep sides of the volume never pick up white
      const cw = Math.min(1400, img.width), chh = Math.round(cw * img.height / img.width);
      const cc = document.createElement('canvas'); cc.width = cw; cc.height = chh;
      const cg = cc.getContext('2d', { willReadFrequently: true });
      cg.drawImage(img, 0, 0, cw, chh);
      const cd = cg.getImageData(0, 0, cw, chh);
      const fab = new THREE.Color(FABRIC[id] || 0x1a1a1c);
      const fr = Math.round(fab.r * 255), fgc = Math.round(fab.g * 255), fb = Math.round(fab.b * 255);
      for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) {
        const mx = Math.min(A.S - 1, Math.round(x / cw * (A.S - 1))), my = Math.min(A.h - 1, Math.round(y / chh * (A.h - 1)));
        const dd = A.dist[my * A.S + mx];
        if (dd < 2.2) { const k = (y * cw + x) * 4; cd.data[k] = fr; cd.data[k + 1] = fgc; cd.data[k + 2] = fb; }
      }
      cg.putImageData(cd, 0, 0);
      const tex = new THREE.CanvasTexture(cc); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      const mask = new THREE.CanvasTexture(A.mask);
      const makeSide = (sign) => {
        const geo = new THREE.PlaneGeometry(W, H, SEG, Math.round(SEG * A.h / A.S));
        const pos = geo.attributes.position, uv = geo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          const t = sample(uv.getX(i), uv.getY(i));
          // rounded "pillow" profile: steep at the outline, flat across the body; front and back meet at the outline
          const u = Math.max(0, (t - 0.07) / 0.93);   // zero thickness right at (and just inside) the outline -> shells meet, no gap
          pos.setZ(i, sign * depth * Math.sqrt(u * (2 - u)));
        }
        if (sign < 0) {
          // back shell: same silhouette, pushed backwards, faces flipped to point outward
          const idx = geo.index.array;
          for (let k = 0; k < idx.length; k += 3) { const tmp = idx[k]; idx[k] = idx[k + 2]; idx[k + 2] = tmp; }
          geo.index.needsUpdate = true;
        }
        geo.computeVertexNormals();
        const mat = sign > 0
          ? new THREE.MeshStandardMaterial({ map: tex, alphaMap: mask, alphaTest: 0.5, roughness: 0.86, metalness: 0 })
          : new THREE.MeshStandardMaterial({ color: FABRIC[id] || 0x1a1a1c, alphaMap: mask, alphaTest: 0.5, roughness: 0.9, metalness: 0 });
        return new THREE.Mesh(geo, mat);
      };
      meshes = [makeSide(1), makeSide(-1)];
      meshes.forEach((m) => group.add(m));
      group.scale.setScalar(0.001);
      pop = 0;
    }

    let pop = 1;
    const loadProduct = (id) => {
      const p = (typeof PRODUCTS !== 'undefined' && PRODUCTS.find((x) => x.id === id)) || { img: 'sweat-black.webp' };
      const img = new Image();
      img.onload = () => build(img, id);
      img.src = 'assets/img/' + p.img;
    };
    loadProduct('sweat-black');
    document.querySelectorAll('.color-pick button').forEach((b) => b.addEventListener('click', () => loadProduct(b.dataset.id)));

    /* sizing */
    const resize = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(stage); resize();

    /* drag to rotate with inertia */
    let ry = -0.5, rx = 0.08, vy = reduce ? 0 : 0.004, drag = false, lx = 0, ly = 0;
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
      group.scale.setScalar(0.001 + e * 0.999);
      group.rotation.set(rx, ry, 0);
      group.position.y = Math.sin(t * 1.1) * 0.05;
      renderer.render(scene, camera);
    })();
  }
}

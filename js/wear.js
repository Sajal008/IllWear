import * as THREE from 'three';
import { MEDIA, mountMedia } from './media.js';
import { initShared, clamp, lerp } from './shared.js';
import { PRODUCTS, SIZES, VAULT_CODE, VAULT_DISCOUNT } from './products.js';
import { createVault } from './lock.js';

initShared();
const $ = (s, r = document) => r.querySelector(s);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ═════════════ SHIRT TEXTURES (painted on canvas) ═════════════ */
const TW = 1024, TH = 939;            // matches 2.4 × 2.2 world units
const SW = 2.4, SH = 2.2;

function shirtPath(ctx, w, h, face) {
  const P = (x, y) => [x * w, y * h];
  const neckY = face === 'front' ? 0.15 : 0.07;
  ctx.beginPath();
  ctx.moveTo(...P(0.37, 0.0));
  ctx.quadraticCurveTo(...P(0.25, 0.015), ...P(0.14, 0.075));         // L shoulder
  ctx.lineTo(...P(0.005, 0.30));                                       // sleeve out
  ctx.lineTo(...P(0.135, 0.378));                                      // sleeve hem
  ctx.lineTo(...P(0.185, 0.305));                                      // armpit
  ctx.quadraticCurveTo(...P(0.17, 0.65), ...P(0.18, 0.985));           // side seam
  ctx.quadraticCurveTo(...P(0.5, 1.0), ...P(0.82, 0.985));             // hem
  ctx.quadraticCurveTo(...P(0.83, 0.65), ...P(0.815, 0.305));
  ctx.lineTo(...P(0.865, 0.378));
  ctx.lineTo(...P(0.995, 0.30));
  ctx.lineTo(...P(0.86, 0.075));
  ctx.quadraticCurveTo(...P(0.75, 0.015), ...P(0.63, 0.0));            // R shoulder
  ctx.bezierCurveTo(...P(0.60, neckY), ...P(0.40, neckY), ...P(0.37, 0.0)); // neckline
  ctx.closePath();
}

function neckPath(ctx, w, h, face) {
  const neckY = face === 'front' ? 0.15 : 0.07;
  ctx.beginPath();
  ctx.moveTo(0.37 * w, 0);
  ctx.bezierCurveTo(0.40 * w, neckY * h, 0.60 * w, neckY * h, 0.63 * w, 0);
}

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};
const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => clamp(Math.round(v * f), 0, 255);
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
};

function fitText(ctx, text, family, maxW, start = 400, weight = '') {
  let s = start;
  ctx.font = `${weight} ${s}px ${family}`;
  const m = ctx.measureText(text).width;
  s = Math.floor((s * maxW) / m);
  ctx.font = `${weight} ${s}px ${family}`;
  return s;
}

function distress(ctx, w, h, amount = 5500) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < amount; i++) {
    ctx.globalAlpha = 0.25 + Math.random() * 0.55;
    const s = Math.random() < 0.9 ? 1 + Math.random() * 2 : 3 + Math.random() * 5;
    ctx.fillRect(Math.random() * w, Math.random() * h, s, s * (0.4 + Math.random()));
  }
  ctx.restore();
}

let stillImg = null;
function halftone(ctx, img, x, y, w, h, cell, color, invert) {
  const sw = Math.floor(w / cell), sh = Math.floor(h / cell);
  const c = document.createElement('canvas'); c.width = sw; c.height = sh;
  const cx = c.getContext('2d', { willReadFrequently: true });
  // cover-fit
  const ir = img.width / img.height, tr = sw / sh;
  let sx = 0, sy = 0, sW = img.width, sH = img.height;
  if (ir > tr) { sW = img.height * tr; sx = (img.width - sW) / 2; } else { sH = img.width / tr; sy = (img.height - sH) / 2; }
  cx.drawImage(img, sx, sy, sW, sH, 0, 0, sw, sh);
  const d = cx.getImageData(0, 0, sw, sh).data;
  ctx.fillStyle = color;
  for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
    const k = (j * sw + i) * 4;
    let l = (0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]) / 255;
    l = clamp((l - 0.08) * 1.35);
    if (invert) l = 1 - l;
    const r = cell * 0.62 * Math.sqrt(l);
    if (r < 0.5) continue;
    ctx.beginPath(); ctx.arc(x + (i + 0.5) * cell, y + (j + 0.5) * cell, r, 0, 6.2832); ctx.fill();
  }
}

function glitchBands(ctx, draw, w, h, color, n = 3) {
  // red-offset slices of the same artwork → "glitch print"
  for (let i = 0; i < n; i++) {
    const by = h * (0.3 + Math.random() * 0.4), bh = 10 + Math.random() * 28;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, by, w, bh); ctx.clip();
    ctx.translate((Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 14), 0);
    draw(color);
    ctx.restore();
  }
}

const ART = {
  society(ctx, w, h, v, face) {
    if (face === 'front') {
      const x = 0.27 * w, maxW = 0.46 * w;
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      ctx.fillStyle = v.ink;
      ctx.font = '26px "Rubik Mono One", monospace';
      ctx.fillText('ILL WEAR / DROP 001', x, 0.325 * h);
      const lines = ['TOO ILL', 'FOR THE', 'SOCIETY'];
      let y = 0.325 * h + 12;
      const drawAll = (col) => {
        let yy = 0.325 * h + 12;
        lines.forEach((t) => {
          const s = fitText(ctx, t, 'Anton, Impact, sans-serif', maxW);
          yy += s * 0.98; ctx.fillStyle = col; ctx.fillText(t, x, yy);
        });
      };
      ctx.fillStyle = v.ink; drawAll(v.ink);
      glitchBands(ctx, () => drawAll(v.accent), w, h, v.accent, 4);
      ctx.fillStyle = v.ink;
      ctx.font = '700 17px "Space Mono", monospace';
      ctx.fillText('— TOO ILL FOR THIS WORLD. THE ILLICITZ / SEATTLE', x, 0.865 * h);
    } else {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const s = fitText(ctx, 'ILL', '"Rubik Glitch", Anton, sans-serif', 0.5 * w, 400);
      ctx.fillStyle = v.accent; ctx.fillText('ILL', 0.5 * w, 0.46 * h);
      ctx.fillStyle = v.ink; ctx.font = '700 20px "Space Mono", monospace';
      ctx.fillText('ILLICITZ  ·  SEATTLE, WA  ·  EST. 2025', 0.5 * w, 0.82 * h);
      ctx.font = '24px "Rubik Mono One", monospace';
      ctx.fillText('ILL WEAR', 0.5 * w, 0.28 * h);
    }
  },

  box(ctx, w, h, v, face) {
    if (face === 'front') {
      const cw = 0.46 * w, ch = 0.16 * h;
      ctx.save();
      ctx.translate(0.5 * w, 0.43 * h);
      ctx.transform(1, 0, -0.22, 1, 0, 0);               // italic slant
      ctx.fillStyle = v.accent; ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
      ctx.fillStyle = lum(v.accent) < 0.4 ? '#efe9dd' : '#0e0e0e';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      fitText(ctx, 'ILL WEAR', 'Anton, Impact, sans-serif', cw * 0.86);
      ctx.fillText('ILL WEAR', 0, 4);
      ctx.restore();
      ctx.fillStyle = v.ink; ctx.textAlign = 'center';
      ctx.font = '700 17px "Space Mono", monospace';
      ctx.fillText('T O O   I L L   F O R   T H E   S O C I E T Y', 0.5 * w, 0.55 * h);
    } else {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const rows = 6;
      for (let i = 0; i < rows; i++) {
        const y = (0.3 + i * 0.075) * h;
        const t = 'TOO ILL FOR THE SOCIETY';
        fitText(ctx, t, '"Rubik Mono One", monospace', 0.5 * w, 100);
        if (i % 2) { ctx.strokeStyle = v.ink; ctx.lineWidth = 2; ctx.strokeText(t, 0.5 * w, y); }
        else { ctx.fillStyle = i === 2 ? v.accent : v.ink; ctx.fillText(t, 0.5 * w, y); }
      }
      ctx.fillStyle = v.ink; ctx.font = '700 18px "Space Mono", monospace';
      ctx.fillText('ILL WEAR BY THE ILLICITZ — SEATTLE', 0.5 * w, 0.82 * h);
    }
  },

  vol1(ctx, w, h, v, face) {
    const light = lum(v.base) > 0.55;
    if (face === 'front') {
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = v.ink;
      const s = fitText(ctx, 'ILLICITZ', '"Planet Kosmos", Anton, sans-serif', 0.5 * w, 300);
      ctx.fillText('ILLICITZ', 0.5 * w, 0.42 * h);
      ctx.font = '40px Anton, sans-serif';
      ctx.fillStyle = v.accent;
      ctx.fillText('VOL.1  —  SLAYIN SINCE 2025', 0.5 * w, 0.42 * h + s * 0.33);
      ctx.fillStyle = v.ink; ctx.font = '700 17px "Space Mono", monospace';
      ctx.fillText('CREATIVE COLLECTIVE · BREAKIN\' CULTURE · SEATTLE, WA', 0.5 * w, 0.83 * h);
    } else {
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      if (stillImg) halftone(ctx, stillImg, 0.25 * w, 0.20 * h, 0.5 * w, 0.5 * w * (9 / 16), 7, v.ink, light);
      ctx.save();
      ctx.translate(0.5 * w, 0.73 * h); ctx.rotate(-0.06);
      fitText(ctx, 'TALK YO SH** VOL.1', '"Permanent Marker", cursive', 0.5 * w, 100);
      ctx.fillStyle = v.accent; ctx.fillText('TALK YO SH** VOL.1', 0, 0);
      ctx.restore();
      ctx.fillStyle = v.ink; ctx.font = '700 18px "Space Mono", monospace';
      ctx.fillText('THE ILLICITZ ✦ TOO ILL FOR THIS WORLD', 0.5 * w, 0.84 * h);
    }
  },
};

function paintFace(product, variant, face) {
  const c = document.createElement('canvas'); c.width = TW; c.height = TH;
  const ctx = c.getContext('2d');
  // base fabric
  shirtPath(ctx, TW, TH, face);
  ctx.fillStyle = variant.base; ctx.fill();
  ctx.save(); ctx.clip();
  // weave speckle
  for (let i = 0; i < 38000; i++) {
    ctx.globalAlpha = Math.random() * 0.06;
    ctx.fillStyle = Math.random() < 0.5 ? '#fff' : '#000';
    ctx.fillRect(Math.random() * TW, Math.random() * TH, 1, 1 + Math.random() * 2);
  }
  ctx.globalAlpha = 1;
  // print layer (distressed)
  const pc = document.createElement('canvas'); pc.width = TW; pc.height = TH;
  const pctx = pc.getContext('2d');
  ART[product.art](pctx, TW, TH, variant, face);
  distress(pctx, TW, TH);
  ctx.drawImage(pc, 0, 0);
  // seams: darker edge + hem stitch lines
  ctx.restore();
  ctx.save(); shirtPath(ctx, TW, TH, face); ctx.clip();
  shirtPath(ctx, TW, TH, face);
  ctx.lineWidth = 26; ctx.strokeStyle = 'rgba(0,0,0,.20)'; ctx.stroke();
  ctx.setLineDash([9, 7]); ctx.lineWidth = 2.2;
  ctx.strokeStyle = lum(variant.base) > 0.5 ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.22)';
  ctx.beginPath(); ctx.moveTo(0.185 * TW, 0.95 * TH);
  ctx.quadraticCurveTo(0.5 * TW, 0.962 * TH, 0.815 * TW, 0.95 * TH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0.012 * TW, 0.31 * TH); ctx.lineTo(0.14 * TW, 0.385 * TH - 14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0.988 * TW, 0.31 * TH); ctx.lineTo(0.86 * TW, 0.385 * TH - 14); ctx.stroke();
  ctx.restore();
  // rib collar
  ctx.save(); shirtPath(ctx, TW, TH, face); ctx.clip();
  neckPath(ctx, TW, TH, face);
  ctx.setLineDash([]); ctx.lineWidth = 34; ctx.lineCap = 'round';
  ctx.strokeStyle = shade(variant.base, lum(variant.base) > 0.5 ? 0.86 : 1.35); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();
  ctx.restore();
  return c;
}

/* ═════════════ THREE SCENE ═════════════ */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);

scene.add(new THREE.HemisphereLight(0xfff4e6, 0x6b6558, 1.0));
const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-3, 4, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0xffd7c2, 1.0); rim.position.set(4, 2, -4); scene.add(rim);
const fill = new THREE.DirectionalLight(0xcfe3ff, 0.55); fill.position.set(4, -1, 4); scene.add(fill);

const group = new THREE.Group(); scene.add(group);

/* cloth particles */
const NX = 46, NY = 42, COLS = NX + 1, ROWS = NY + 1, N = COLS * ROWS;
const pos = new Float32Array(N * 3), prev = new Float32Array(N * 3), home = new Float32Array(N * 3);
const th = new Float32Array(N), kHome = new Float32Array(N), pinned = new Uint8Array(N);
for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
  const k = j * COLS + i, u = i / NX, v = j / NY;
  const x = (u - 0.5) * SW, y = (0.5 - v) * SH;
  home[k * 3] = pos[k * 3] = prev[k * 3] = x;
  home[k * 3 + 1] = pos[k * 3 + 1] = prev[k * 3 + 1] = y;
  const body = Math.cos(clamp((u - 0.5) / 0.335, -1, 1) * Math.PI / 2);
  th[k] = 0.012 + 0.065 * Math.max(0, body) * (1 - 0.25 * v);
  kHome[k] = lerp(0.2, 0.014, smooth(0, 0.55, v));
  if (j === 0 && (u < 0.40 || u > 0.60)) pinned[k] = 1;
}
// springs
const spr = [];
const addS = (a, b) => {
  const dx = home[a * 3] - home[b * 3], dy = home[a * 3 + 1] - home[b * 3 + 1];
  spr.push(a, b, Math.hypot(dx, dy));
};
for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
  const k = j * COLS + i;
  if (i < NX) addS(k, k + 1);
  if (j < NY) addS(k, k + COLS);
  if (i < NX && j < NY) { addS(k, k + COLS + 1); addS(k + 1, k + COLS); }
  if (i < NX - 1) addS(k, k + 2);
  if (j < NY - 1) addS(k, k + 2 * COLS);
}
const SPR = new Float32Array(spr);

function buildPanel(back) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const uv = new Float32Array(N * 2);
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const k = j * COLS + i;
    uv[k * 2] = back ? 1 - i / NX : i / NX;
    uv[k * 2 + 1] = 1 - j / NY;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const idx = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const a = j * COLS + i, b = a + 1, c = a + COLS, d = c + 1;
    if (back) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
  }
  g.setIndex(idx);
  return g;
}
const gFront = buildPanel(false), gBack = buildPanel(true);
const mat = () => new THREE.MeshStandardMaterial({ roughness: 0.93, metalness: 0, alphaTest: 0.5, side: THREE.FrontSide });
const mFront = mat(), mBack = mat();
const meshFront = new THREE.Mesh(gFront, mFront), meshBack = new THREE.Mesh(gBack, mBack);
meshFront.frustumCulled = meshBack.frustumCulled = false;
group.add(meshFront, meshBack);

// hanger
{
  const hm = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.35, metalness: 0.85 });
  const hook = new THREE.CatmullRomCurve3([
    [0, 1.24, 0], [0, 1.36, 0], [0.05, 1.45, 0], [0.13, 1.55, 0], [0.1, 1.66, 0], [0, 1.7, 0], [-0.09, 1.63, 0],
  ].map((p) => new THREE.Vector3(...p)));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(hook, 40, 0.014, 8), hm));
  for (const s of [-1, 1]) {
    const arm = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.25, 0), new THREE.Vector3(s * 0.5, 1.12, 0), new THREE.Vector3(s * 0.96, 0.955, 0)]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(arm, 24, 0.014, 8), hm));
  }
}

/* textures */
const textures = new Map();
function setSkin(pi, vi) {
  const p = PRODUCTS[pi], v = p.variants[vi];
  const key = `${pi}.${vi}`;
  if (!textures.has(key)) {
    const f = paintFace(p, v, 'front'), b = paintFace(p, v, 'back');
    const mk = (c) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    };
    textures.set(key, { f: mk(f), b: mk(b), fc: f });
  }
  const t = textures.get(key);
  mFront.map = t.f; mBack.map = t.b; mFront.needsUpdate = mBack.needsUpdate = true;
  return t;
}

/* ═════════════ INTERACTION ═════════════ */
const ndc = new THREE.Vector2(0, 0);
const raycaster = new THREE.Raycaster();
const inv = new THREE.Matrix4();
let pointerIn = false, hitPrev = null, rawX = 0, rawY = 0;
let rotY = 0, rotTarget = 0, dragging = false, dragX = 0, dragMoved = 0;

canvas.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  rawX = ndc.x; rawY = ndc.y;
  pointerIn = true;
  if (dragging) {
    const dx = e.clientX - dragX; dragX = e.clientX; dragMoved += Math.abs(dx);
    rotY += dx * 0.012;
  }
});
canvas.addEventListener('pointerleave', () => { pointerIn = false; hitPrev = null; });
canvas.addEventListener('pointerdown', (e) => {
  dragging = true; dragX = e.clientX; dragMoved = 0; canvas.classList.add('drag');
  canvas.setPointerCapture?.(e.pointerId);
});
const endDrag = () => {
  if (!dragging) return;
  dragging = false; canvas.classList.remove('drag');
  rotTarget = Math.round(rotY / Math.PI) * Math.PI;
};
addEventListener('pointerup', endDrag);
addEventListener('pointercancel', endDrag);

function poke(time) {
  if (!pointerIn) return;
  raycaster.setFromCamera(ndc, camera);
  group.updateMatrixWorld();
  inv.copy(group.matrixWorld).invert();
  const o = raycaster.ray.origin.clone().applyMatrix4(inv);
  const d = raycaster.ray.direction.clone().transformDirection(inv);
  if (Math.abs(d.z) < 1e-4) return;
  const t = -o.z / d.z;
  const hx = o.x + d.x * t, hy = o.y + d.y * t;
  const speed = hitPrev ? Math.hypot(hx - hitPrev[0], hy - hitPrev[1]) : 0;
  hitPrev = [hx, hy];
  const R = 0.42, R2 = R * R;
  const amt = 0.014 + Math.min(speed, 0.2) * 1.5;
  for (let k = 0; k < N; k++) {
    if (pinned[k]) continue;
    const dx = pos[k * 3] - hx, dy = pos[k * 3 + 1] - hy, dd = dx * dx + dy * dy;
    if (dd > R2) continue;
    const w = 1 - Math.sqrt(dd) / R, f = w * w * amt;
    pos[k * 3] += d.x * f; pos[k * 3 + 1] += d.y * f; pos[k * 3 + 2] += d.z * f;
  }
}

function impulse(power = 0.05) {
  for (let k = 0; k < N; k++) if (!pinned[k]) prev[k * 3 + 2] -= (Math.random() - 0.3) * power * (0.4 + (1 - k / N));
}

function simulate(time) {
  const damp = 0.968;
  for (let k = 0; k < N; k++) {
    if (pinned[k]) { pos[k * 3] = prev[k * 3] = home[k * 3]; pos[k * 3 + 1] = prev[k * 3 + 1] = home[k * 3 + 1]; pos[k * 3 + 2] = prev[k * 3 + 2] = 0; continue; }
    for (let a = 0; a < 3; a++) {
      const i = k * 3 + a, p = pos[i];
      let vel = (p - prev[i]) * damp;
      prev[i] = p;
      let acc = 0;
      if (a === 1) acc = -0.00012;                       // gravity (tiny, it's hanging)
      if (a === 2) {                                      // breathing wind
        const x = pos[k * 3], y = pos[k * 3 + 1];
        acc = Math.sin(time * 1.15 + x * 2.3 + y * 1.7) * 0.00035 + Math.sin(time * 2.6 + y * 4.1) * 0.00018;
      }
      pos[i] = p + vel + acc + (home[i] - p) * kHome[k];
    }
  }
  for (let it = 0; it < 3; it++) {
    for (let s = 0; s < SPR.length; s += 3) {
      const a = SPR[s] | 0, b = SPR[s + 1] | 0, rest = SPR[s + 2];
      const ax = a * 3, bx = b * 3;
      const dx = pos[bx] - pos[ax], dy = pos[bx + 1] - pos[ax + 1], dz = pos[bx + 2] - pos[ax + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
      const diff = ((dist - rest) / dist) * 0.5;
      const wa = pinned[a] ? 0 : 1, wb = pinned[b] ? 0 : 1, ws = wa + wb || 1;
      const fa = (diff * 2 * wa) / ws, fb = (diff * 2 * wb) / ws;
      pos[ax] += dx * fa; pos[ax + 1] += dy * fa; pos[ax + 2] += dz * fa;
      pos[bx] -= dx * fb; pos[bx + 1] -= dy * fb; pos[bx + 2] -= dz * fb;
    }
  }
}

function writeGeometry() {
  const pf = gFront.attributes.position.array, pb = gBack.attributes.position.array;
  for (let k = 0; k < N; k++) {
    const x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2], t = th[k];
    pf[k * 3] = pb[k * 3] = x; pf[k * 3 + 1] = pb[k * 3 + 1] = y;
    pf[k * 3 + 2] = z + t; pb[k * 3 + 2] = z - t;
  }
  gFront.attributes.position.needsUpdate = gBack.attributes.position.needsUpdate = true;
  gFront.computeVertexNormals(); gBack.computeVertexNormals();
}

/* resize */
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const wide = innerWidth > 820;
  const needH = wide ? 4.15 : 3.45;
  const panelPx = wide ? 380 : 0, sidePx = wide ? 100 : 0;
  const availPx = w - panelPx - sidePx;
  const needW = (SW * 1.06 * w) / availPx;           // world width the view must span
  const dist = Math.max(needH / (2 * Math.tan(fov / 2)), needW / (2 * Math.tan(fov / 2) * camera.aspect));
  camera.position.set(0, 0.1, dist);
  camera.lookAt(0, 0.1, 0);
  const visW = 2 * dist * Math.tan(fov / 2) * camera.aspect;
  group.position.x = ((panelPx + (availPx / 2)) - w / 2) / w * visW;
  group.position.y = -0.25;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

/* ═════════════ UI STATE ═════════════ */
let pi = 0, vi = 0, size = 'M';
const ui = {
  tag: $('#pTag'), name: $('#pName'), price: $('#pPrice'), blurb: $('#pBlurb'),
  color: $('#pColor'), swColor: $('#swColor'), swSize: $('#swSize'), strip: $('#strip'),
  flash: $('#flash'),
};
const money = (n) => '$' + n.toFixed(2).replace(/\.00$/, '');

function renderPanel() {
  const p = PRODUCTS[pi], v = p.variants[vi];
  ui.tag.textContent = p.tag; ui.name.textContent = p.name;
  ui.price.textContent = money(p.price); ui.blurb.textContent = p.blurb;
  ui.color.textContent = v.name;
  ui.swColor.innerHTML = '';
  p.variants.forEach((vv, i) => {
    const b = document.createElement('button');
    b.className = 'dot' + (i === vi ? ' on' : '');
    b.style.background = vv.base; b.title = vv.name; b.setAttribute('aria-label', vv.name);
    b.addEventListener('click', () => { vi = i; swap(); });
    ui.swColor.appendChild(b);
  });
  ui.swSize.innerHTML = '';
  SIZES.forEach((s) => {
    const b = document.createElement('button');
    b.textContent = s; if (s === size) b.className = 'on';
    b.addEventListener('click', () => { size = s; renderPanel(); });
    ui.swSize.appendChild(b);
  });
  [...ui.strip.children].forEach((b, i) => b.classList.toggle('on', i === pi));
}

function flashFx() {
  ui.flash.classList.remove('on'); void ui.flash.offsetWidth; ui.flash.classList.add('on');
}
function swap(fx = true) {
  if (fx) { flashFx(); impulse(0.07); }
  setSkin(pi, vi); renderPanel();
}
const go = (d) => { pi = (pi + d + PRODUCTS.length) % PRODUCTS.length; vi = 0; swap(); };
$('#prev').addEventListener('click', () => go(-1));
$('#next').addEventListener('click', () => go(1));
$('#flip').addEventListener('click', () => { rotTarget = rotTarget + Math.PI; impulse(0.05); });
addEventListener('keydown', (e) => {
  if (document.getElementById('vault').classList.contains('open')) return;
  if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1);
});

/* ═════════════ CART ═════════════ */
const store = {
  get cart() { try { return JSON.parse(localStorage.getItem('illwear-cart') || '[]'); } catch { return []; } },
  set cart(v) { try { localStorage.setItem('illwear-cart', JSON.stringify(v)); } catch {} },
  get vault() { try { return localStorage.getItem('illwear-vault'); } catch { return null; } },
  set vault(v) { try { localStorage.setItem('illwear-vault', v); } catch {} },
};
const drawer = $('#drawer'), scrim = $('#scrim'), toastEl = $('#toast');
function toast(msg) {
  toastEl.textContent = msg; toastEl.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('on'), 2200);
}
function renderCart() {
  const cart = store.cart;
  $('#cartN').textContent = cart.reduce((a, c) => a + c.qty, 0);
  const box = $('#dItems'); box.innerHTML = '';
  if (!cart.length) box.innerHTML = '<div class="d-empty">Nothing here yet. Too ill to shop?</div>';
  let total = 0;
  cart.forEach((c, i) => {
    const p = PRODUCTS.find((x) => x.id === c.id); if (!p) return;
    total += p.price * c.qty;
    const row = document.createElement('div'); row.className = 'd-item';
    row.innerHTML = `<img alt="" src="${c.thumb}"><div><b>${p.name}</b><small>${p.variants[c.v].name} · ${c.size} · x${c.qty}</small></div><div>${money(p.price * c.qty)}<br><button data-i="${i}">Remove</button></div>`;
    box.appendChild(row);
  });
  const code = store.vault;
  const off = code ? total * VAULT_DISCOUNT : 0;
  $('#dCode').textContent = code ? `Vault code ${code} — ${VAULT_DISCOUNT * 100}% off (-${money(off)})` : '';
  $('#dTotal').textContent = money(total - off);
  box.querySelectorAll('button[data-i]').forEach((b) => b.addEventListener('click', () => {
    const c = store.cart; c.splice(+b.dataset.i, 1); store.cart = c; renderCart();
  }));
}
function openCart(o) { drawer.classList.toggle('open', o); scrim.classList.toggle('on', o); if (o) renderCart(); }
$('#openCart').addEventListener('click', () => openCart(true));
$('#closeCart').addEventListener('click', () => openCart(false));
scrim.addEventListener('click', () => openCart(false));
$('#addBtn').addEventListener('click', () => {
  const p = PRODUCTS[pi];
  const c = store.cart;
  const hit = c.find((x) => x.id === p.id && x.v === vi && x.size === size);
  if (hit) hit.qty++; else c.push({ id: p.id, v: vi, size, qty: 1, thumb: textures.get(`${pi}.${vi}`).fc.toDataURL('image/jpeg', 0.5) });
  try { store.cart = c; } catch { toast('Cart is full — remove something'); return; }
  renderCart(); toast('Added — ' + p.name); impulse(0.09); flashFx();
});
$('#checkout').addEventListener('click', () => {
  $('#dMsg').innerHTML = store.cart.length
    ? 'DROP 001 checkout opens soon. DM <a href="https://www.instagram.com/theillicitz/" target="_blank" rel="noopener" style="text-decoration:underline">@theillicitz</a> with your cart to reserve.'
    : 'Add something first.';
});

/* ═════════════ VAULT ═════════════ */
const vault = createVault({
  onWin: (code) => { store.vault = code; renderCart(); toast(`Code ${code} applied · 15% off`); },
});
$('#openVault').addEventListener('click', () => vault.open());
$('#openVault2').addEventListener('click', () => vault.open());

/* ═════════════ LOOKBOOK ═════════════ */
const lb = $('#lb');
const crop = ['50% 40%', '60% 50%', '40% 40%', '30% 50%', '70% 60%'];
for (let i = 0; i < 5; i++) {
  const d = document.createElement('div');
  mountMedia(d, MEDIA[i % MEDIA.length], crop[i]);
  lb.appendChild(d);
}

/* ═════════════ BOOT ═════════════ */
function loadImg(src) { return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
async function boot() {
  stillImg = await loadImg(MEDIA[0].poster || MEDIA[0].src);
  const fonts = ['100px Anton', '100px "Rubik Glitch"', '100px "Rubik Mono One"', '100px "Permanent Marker"', '700 20px "Space Mono"', '100px "Planet Kosmos"'];
  await Promise.race([Promise.all(fonts.map((f) => document.fonts.load(f).catch(() => {}))), new Promise((r) => setTimeout(r, 3500))]);
  resize();
  // thumbnails
  ui.strip.innerHTML = '';
  PRODUCTS.forEach((p, i) => {
    setSkin(i, 0);
    const b = document.createElement('button');
    b.setAttribute('aria-label', p.name);
    const img = new Image(); img.alt = '';
    img.src = textures.get(`${i}.0`).fc.toDataURL('image/jpeg', 0.6);
    b.appendChild(img);
    b.addEventListener('click', () => { pi = i; vi = 0; swap(); });
    ui.strip.appendChild(b);
  });
  swap(false);
  renderCart();
  impulse(0.1);
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    poke(t);
    simulate(t);
    writeGeometry();
    if (!dragging) rotY += (rotTarget - rotY) * 0.1;
    group.rotation.y = rotY + rawX * 0.14;
    group.rotation.x = -rawY * 0.05;
    renderer.render(scene, camera);
  });
  window.__ill = { impulse, get pos() { return pos; } };
}
boot();

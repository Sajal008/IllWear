import { MEDIA, CAPTIONS, mountMedia } from './media.js';
import { initShared, clamp, lerp, seg, ease, easeOut } from './shared.js';
import { initTicker, bindSoundButton, armFirstGesture } from './audio.js';

initShared();
bindSoundButton(document.getElementById('snd'));
armFirstGesture();
initTicker(document.getElementById('ticker'));

const $ = (s, r = document) => r.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ───────── mount media into static slots ───────── */
document.querySelectorAll('[data-m]').forEach((el) => {
  mountMedia(el, MEDIA[+el.dataset.m % MEDIA.length], el.dataset.pos);
});

/* ───────── generated: columns ───────── */
const crops = ['20% 50%', '75% 40%', '50% 30%', '30% 70%', '85% 60%', '55% 50%'];
const colsEl = $('#cols');
for (let c = 0; c < 3; c++) {
  const col = document.createElement('div');
  col.className = 'col';
  for (let i = 0; i < 4; i++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    const idx = (c * 2 + i * 3 + c) % MEDIA.length;
    mountMedia(tile, MEDIA[idx], crops[(c * 4 + i) % crops.length]);
    col.appendChild(tile);
  }
  colsEl.appendChild(col);
}

/* ───────── generated: reel ───────── */
const reelTrack = $('#reelTrack');
const frameCount = Math.max(6, MEDIA.length * 2);
for (let i = 0; i < frameCount; i++) {
  const f = document.createElement('figure');
  const m = MEDIA[i % MEDIA.length];
  f.className = 'frame' + (m.portrait ? ' tall' : '');
  const box = document.createElement('div');
  mountMedia(box, m, crops[(i * 2) % crops.length]);
  const cap = CAPTIONS[i % CAPTIONS.length];
  const fc = document.createElement('figcaption');
  fc.innerHTML = `<b>${String(i + 1).padStart(2, '0')} — ${cap[0]}</b><span>${cap[1]}</span>`;
  f.append(box, fc);
  reelTrack.appendChild(f);
}

/* ───────── generated: manifesto words ───────── */
const maniText = [
  "We don't dance for the room.", "We dance for the cypher.",
  "[Toprock.] [Downrock.] [Power.] [Freeze.]",
  "Every round is a signature.", "Slayin' since 2025.",
];
const maniEl = $('#mani');
maniText.join(' ').split(/\s+/).forEach((w) => {
  const hot = /^\[/.test(w);
  const s = document.createElement('span');
  s.className = 'w' + (hot ? ' hot' : '');
  s.textContent = w.replace(/[\[\]]/g, '');
  maniEl.appendChild(s);
});
const maniWords = [...maniEl.querySelectorAll('.w')];

/* ───────── finale split text ───────── */
const finSpans = [...document.querySelectorAll('#finMoto i')];

/* ───────── LOADER ───────── */
const loader = $('#loader');
const ldFill = $('#ldFill');
const ldCount = $('#ldCount');
const ldWrap = $('#ldWrap');
ldFill.style.backgroundImage = `url(${MEDIA[1].poster || MEDIA[1].src})`;

function preload(src) {
  return new Promise((res) => { const i = new Image(); i.onload = i.onerror = res; i.src = src; });
}

async function runLoader() {
  const t0 = performance.now();
  const MIN = reduced ? 300 : 2600;
  let loaded = 0;
  const total = MEDIA.length;
  const jobs = MEDIA.map((m) => preload(m.poster || m.src).then(() => { loaded++; }));
  const fonts = document.fonts.ready;
  Promise.all([...jobs, fonts]).then(() => { loaded = total + 1; });
  let shown = 0;
  await new Promise((resolve) => {
    (function step() {
      const real = Math.min(1, loaded / (total + 1));
      const timeP = Math.min(1, (performance.now() - t0) / MIN);
      const target = Math.min(real, timeP);
      shown += (target - shown) * 0.12;
      if (target >= 1 && shown > 0.995) shown = 1;
      ldFill.style.clipPath = `inset(${(1 - shown) * 100}% 0 0 0)`;
      ldFill.style.backgroundPosition = `${50 + (1 - shown) * 8}% ${50 - (1 - shown) * 10}%`;
      ldCount.textContent = String(Math.round(shown * 100)).padStart(3, '0');
      if (shown >= 1) return resolve();
      requestAnimationFrame(step);
    })();
  });
  // zoom through the word → reveals hero
  await new Promise((r) => setTimeout(r, 250));
  ldWrap.style.transition = 'transform 1.25s cubic-bezier(.75,0,.2,1)';
  ldWrap.style.transform = 'scale(34)';
  loader.querySelector('.ld-meta').style.opacity = 0;
  loader.querySelector('.ld-moto').style.opacity = 0;
  loader.style.transition = 'opacity .5s .85s';
  loader.style.opacity = 0;
  document.body.classList.remove('is-loading');
  setTimeout(() => { loader.style.display = 'none'; }, 1500);
  heroIntro();
}

function heroIntro() {
  const w = $('#heroWord');
  w.animate(
    [{ transform: 'translateY(40%) scale(1.05)', opacity: 0 }, { transform: 'none', opacity: 1 }],
    { duration: 1100, easing: 'cubic-bezier(.2,.8,.2,1)', delay: 500, fill: 'backwards' }
  );
  document.querySelectorAll('.hero-row > *, .nav, .ticker').forEach((el, i) => {
    el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
      { duration: 800, delay: 900 + i * 120, easing: 'ease-out', fill: 'backwards' });
  });
}

/* ───────── SCROLL ENGINE ───────── */
let vw = innerWidth, vh = innerHeight;
let cur = scrollY;
const scenes = {};
['sExpand', 'sCols', 'sReel', 'sMani', 'sFin'].forEach((id) => { scenes[id] = { el: $('#' + id), top: 0, h: 0 }; });
const cols = [...document.querySelectorAll('.col')];
const hero = $('#hero');
const heroBg = $('#heroBg');
const heroWord = $('#heroWord');
const reelFrames = [...document.querySelectorAll('.frame')];
let colH = [], trackW = 0;

function measure() {
  vw = innerWidth; vh = innerHeight;
  for (const k in scenes) {
    const s = scenes[k];
    s.top = s.el.offsetTop; s.h = s.el.offsetHeight - vh;
  }
  colH = cols.map((c) => c.offsetHeight);
  trackW = reelTrack.scrollWidth;
}
addEventListener('resize', measure);
addEventListener('load', measure);
document.fonts.ready.then(measure);
setTimeout(measure, 800);
measure();

const prog = $('#prog');
const exFrame = $('#exFrame'), exMedia = $('#exMedia img, #exMedia video'), exL = $('#exL'), exR = $('#exR'), exCap = $('#exCap');
const reelBg = $('#reelBg');
const maniBg = $('#maniBg');
const finMoto = $('#finMoto'), shopBadge = $('#shopBadge'), shopLabel = $('#shopLabel');
const colTitle = $('.cols-title');
// a portrait photo ends as a full-height tall frame instead of being stretched across the screen
const exItem = MEDIA[+$('#exMedia').dataset.m % MEDIA.length];
let exEndX = 0;
function calcEx() { exEndX = exItem.portrait && exItem.ar ? Math.max(0, (1 - (vh * exItem.ar) / vw) / 2 * 100) : 0; }
calcEx(); addEventListener('resize', calcEx);

function P(s) { return clamp((cur - s.top) / s.h); }
function near(s) { return cur > s.top - vh * 1.2 && cur < s.top + s.h + vh * 1.2; }

function update() {
  /* hero parallax */
  if (cur < vh * 1.3) {
    const t = clamp(cur / vh);
    heroBg.style.transform = `translate3d(0,${cur * 0.28}px,0)`;
    heroWord.style.transform = `translate3d(0,${-cur * 0.18}px,0) scale(${1 + t * 0.12})`;
    heroWord.style.opacity = 1 - t * 1.1;
  }

  /* 01 expand */
  let s = scenes.sExpand;
  if (near(s)) {
    const p = P(s);
    const e = ease(seg(p, 0.04, 0.72));
    const ix = lerp(37, exEndX, e), iy = lerp(23, 0, e);
    exFrame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${lerp(18, 0, e)}px)`;
    if (exMedia) exMedia.style.transform = `scale(${lerp(1.5, 1.0, e)})`;
    const x = e * 78;
    exL.style.transform = `translate3d(${-x}vw,-50%,0)`;
    exR.style.transform = `translate3d(${x}vw,-50%,0)`;
    exL.style.opacity = exR.style.opacity = 1 - seg(p, 0.55, 0.78);
    const c = seg(p, 0.78, 0.92);
    exCap.style.opacity = c; exCap.style.transform = `translateY(${(1 - c) * 30}px)`;
  }

  /* 02 columns */
  s = scenes.sCols;
  if (near(s)) {
    const p = P(s);
    cols.forEach((c, i) => {
      const range = Math.max(0, colH[i] - vh);
      const dir = i === 1 ? 1 - p : p;
      const speed = [1, 1.0, 0.85][i];
      c.style.transform = `translate3d(0,${-range * dir * speed}px,0)`;
    });
    // light up the tiles near the viewport centre
    const mid = vh / 2;
    document.querySelectorAll('.tile').forEach((t) => {
      const r = t.getBoundingClientRect();
      t.classList.toggle('lit', Math.abs(r.top + r.height / 2 - mid) < r.height * 0.45);
    });
    colTitle.style.opacity = 1 - seg(p, 0.9, 1);
    colTitle.style.transform = `scale(${lerp(0.9, 1.08, p)})`;
  }

  /* 03 reel */
  s = scenes.sReel;
  if (near(s)) {
    const p = P(s);
    const travel = Math.max(0, trackW - vw);
    const tx = -travel * ease(p);
    reelTrack.style.transform = `translate3d(${tx}px,0,0)`;
    reelBg.style.transform = `translate3d(${lerp(0, -45, p)}vw,-52%,0)`;
    reelFrames.forEach((f) => {
      const cx = f.offsetLeft + f.offsetWidth / 2 + tx;
      const d = clamp(Math.abs(cx - vw / 2) / (vw * 0.55));
      const sc = lerp(1.04, 0.8, d);
      const rot = clamp((cx - vw / 2) / vw, -1, 1) * -22;
      f.style.transform = `scale(${sc}) rotateY(${rot}deg)`;
      f.style.opacity = lerp(1, 0.35, d);
    });
  }

  /* 04 manifesto */
  s = scenes.sMani;
  if (near(s)) {
    const p = P(s);
    maniBg.style.transform = `scale(${lerp(1.18, 1, p)}) translate3d(0,${lerp(4, -4, p)}%,0)`;
    const n = maniWords.length;
    maniWords.forEach((w, i) => {
      const a = 0.04 + (i / n) * 0.78;
      const o = easeOut(seg(p, a, a + 0.1));
      w.style.opacity = 0.12 + 0.88 * o;
      w.style.transform = `translateY(${(1 - o) * 14}px)`;
    });
  }

  /* 05 finale */
  s = scenes.sFin;
  if (near(s)) {
    const p = P(s);
    finSpans.forEach((sp, i) => {
      const o = easeOut(seg(p, i * 0.1, 0.22 + i * 0.1));
      sp.style.transform = `translateY(${(1 - o) * 105}%)`;
    });
    const b = ease(seg(p, 0.5, 0.82));
    const dim = seg(p, 0.45, 0.85);
    finMoto.style.opacity = 1 - dim * 0.8;
    finMoto.style.filter = `blur(${dim * 7}px)`;
    finMoto.style.transform = `scale(${1 + dim * 0.1})`;
    shopBadge.style.transform = `scale(${b}) rotate(${(1 - b) * -140}deg)`;
    shopBadge.style.opacity = b > 0 ? 1 : 0;
    shopBadge.style.pointerEvents = b > 0.85 ? 'auto' : 'none';
    shopLabel.style.opacity = seg(p, 0.8, 0.95);
  }

  /* progress readout */
  const total = document.documentElement.scrollHeight - vh;
  prog.textContent = String(Math.round(clamp(cur / total) * 100)).padStart(3, '0') + '%';
}

function tick() {
  const target = scrollY;
  cur += (target - cur) * (reduced ? 1 : 0.09);
  if (Math.abs(target - cur) < 0.05) cur = target;
  update();
  requestAnimationFrame(tick);
}
cur = scrollY;
requestAnimationFrame(tick);

/* anchor: logo → top */
document.querySelector('.nav .logo').addEventListener('click', (e) => {
  e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' });
});

history.scrollRestoration = 'manual';
scrollTo(0, 0);
runLoader();

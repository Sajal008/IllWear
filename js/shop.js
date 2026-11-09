import { initShared } from './shared.js';
import { initTicker, bindSoundButton, armFirstGesture } from './audio.js';
import { runChromeLoader } from './chrome-loader.js';
import { PRODUCTS, CATS, SIZES, VAULT_CODE, VAULT_DISCOUNT } from './products.js';
import { createVault } from './lock.js';

initShared();
bindSoundButton(document.getElementById('snd'));
armFirstGesture();

const $ = (s, r = document) => r.querySelector(s);
const money = (n) => '$' + n.toFixed(2).replace(/\.00$/, '');
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const media = (f) => `media/${f}`;

/* ───────── Seattle timestamp, Courier, à la preview pages ───────── */
function stamp() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', month: '2-digit', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return `${parts.month}/${parts.day}/${parts.year} ${parts.hour}:${parts.minute}${parts.dayPeriod.toLowerCase()} SEA`;
}
const tick = () => { $('#sTime').textContent = stamp(); $('#capDate').textContent = stamp(); };
tick(); setInterval(tick, 20000);

/* ───────── product art: real product photos (media/products) ───────── */
function artHTML(p, vi, view = 0) {
  const f = p.photos[Math.min(view, p.photos.length - 1)];
  return `<img src="${f}" alt="${p.name}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block">`;
}

/* ───────── hero ───────── */
$('#bagSvg').innerHTML = '<img src="media/products/hero-duffel.jpg" alt="Ill Wear duffel bag with green webbing strap" style="width:100%;display:block">';

/* ───────── preview tiles (Supreme-style dense grid) ───────── */
const TILES = [
  { k: 'photo', f: 'crew-5.jpg', pos: '50% 22%' },
  { k: 'prod', id: 'tee-skull', i: 0 },
  { k: 'art', f: 'prints/skulls.png', bg: '#000', label: 'See no evil' },
  { k: 'prod', id: 'duffel', i: 1 },
  { k: 'photo', f: 'solo-d.jpg', pos: '50% 30%' },
  { k: 'prod', id: 'hoodie-dubbel', i: 0 },
  { k: 'art', f: 'prints/logo-white.png', bg: '#3B5249', label: 'Illicitz crest' },
  { k: 'prod', id: 'windbreaker', i: 0 },
  { k: 'prod', id: 'hoodie-flame', i: 1 },
  { k: 'photo', f: 'moment-air.jpg', pos: '55% 40%', bw: true },
  { k: 'prod', id: 'pants', i: 0 },
  { k: 'photo', f: 'crew-3.jpg', pos: '50% 62%' },
  { k: 'prod', id: 'tee-gear', i: 0 },
  { k: 'prod', id: 'pants', i: 1 },
  { k: 'prod', id: 'hoodie-flame', i: 0 },
  { k: 'photo', f: 'crew-wide.jpg', pos: '40% 50%', bw: true },
];
const tilesEl = $('#tiles');
TILES.forEach((t, i) => {
  const b = document.createElement('button');
  b.className = 'tile';
  if (t.k === 'prod') {
    const p = byId(t.id);
    b.style.background = '#ececea';
    b.innerHTML = artHTML(p, 0, t.i) + `<span class="tl">${p.name}</span>`;
    b.addEventListener('click', () => openProduct(p.id));
  } else if (t.k === 'art') {
    b.classList.add('art'); b.style.background = t.bg;
    b.innerHTML = `<img src="${media(t.f)}" alt="${t.label}" loading="lazy"><span class="tl">${t.label}</span>`;
    b.addEventListener('click', () => openLightbox(media(t.f), t.bg));
  } else {
    if (t.bw) b.classList.add('bw');
    b.innerHTML = `<img src="${media(t.f)}" alt="" loading="lazy" style="object-position:${t.pos}">`;
    b.addEventListener('click', () => openLightbox(media(t.f)));
  }
  tilesEl.appendChild(b);
});

/* ───────── product grid ───────── */
const chipsEl = $('#chips'), grid = $('#pgrid');
let cat = 'All';
CATS.forEach((c) => {
  const b = document.createElement('button'); b.textContent = c; if (c === cat) b.className = 'on';
  b.addEventListener('click', () => {
    cat = c; chipsEl.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    grid.querySelectorAll('.card').forEach((cd) => cd.classList.toggle('hide', c !== 'All' && cd.dataset.cat !== c));
  });
  chipsEl.appendChild(b);
});
PRODUCTS.forEach((p, i) => {
  const c = document.createElement('button');
  c.className = 'card'; c.dataset.cat = p.cat; c.setAttribute('aria-label', `${p.name} — ${money(p.price)}`);
  c.innerHTML = `<span class="tg">${p.tag}</span>
    <div class="pimg"><div class="front" style="position:absolute;inset:0;transition:opacity .35s">${artHTML(p, 0, 0)}</div><div class="back" style="position:absolute;inset:0;opacity:0;transition:opacity .35s">${artHTML(p, 0, 1)}</div></div>
    <div class="row"><span>${p.name}</span><span class="pr">${money(p.price)}</span></div>
    <div class="dots">${p.variants.map((v) => `<i style="background:${v.base}" title="${v.name}"></i>`).join('')}</div>`;
  const f = c.querySelector('.front'), bk = c.querySelector('.back');
  c.addEventListener('mouseenter', () => { f.style.opacity = 0; bk.style.opacity = 1; });
  c.addEventListener('mouseleave', () => { f.style.opacity = 1; bk.style.opacity = 0; });
  c.addEventListener('click', () => openProduct(p.id));
  grid.appendChild(c);
});
document.querySelector('[data-open]').addEventListener('click', (e) => openProduct(e.currentTarget.dataset.open));

/* ───────── lookbook ───────── */
const LOOK = ['crew-5.jpg', 'crew-wide.jpg', 'moment-cypher.jpg', 'crew-3.jpg', 'solo-a.jpg', 'solo-b.jpg', 'solo-c.jpg', 'moment-air.jpg'];
LOOK.forEach((f) => {
  const b = document.createElement('button');
  b.innerHTML = `<img src="${media(f)}" alt="" loading="lazy">`;
  b.addEventListener('click', () => openLightbox(media(f)));
  $('#look').appendChild(b);
});

/* ───────── lightbox ───────── */
const lb = $('#lightbox');
function openLightbox(src, bg) { $('#lbImg').src = src; lb.style.background = bg ? bg : ''; lb.classList.add('open'); }
lb.addEventListener('click', () => lb.classList.remove('open'));
$('#lbClose').addEventListener('click', () => lb.classList.remove('open'));

/* ───────── product modal ───────── */
const modal = $('#modal');
let cur = { p: null, vi: 0, view: 0, size: null };
function renderModal() {
  const { p, vi, view } = cur;
  $('#mImg').innerHTML = artHTML(p, vi, view);
  $('#mTag').textContent = `${p.cat} — ${p.tag}`;
  $('#mName').textContent = p.name;
  $('#mPrice').textContent = money(p.price);
  $('#mDesc').textContent = p.desc;
  $('#mSpecs').innerHTML = p.specs.map((s) => `<li>${s}</li>`).join('');
  $('#mColor').textContent = p.variants[vi].name;
  $('#mSw').innerHTML = '';
  p.variants.forEach((v, i) => {
    const b = document.createElement('button'); b.style.background = v.base; b.title = v.name;
    b.setAttribute('aria-label', v.name); if (i === vi) b.className = 'on';
    b.addEventListener('click', () => { cur.vi = i; renderModal(); });
    $('#mSw').appendChild(b);
  });
  const sizes = p.sizes || SIZES;
  if (!sizes.includes(cur.size)) cur.size = sizes.includes('M') ? 'M' : sizes[0];
  $('#mSz').innerHTML = '';
  sizes.forEach((s) => {
    const b = document.createElement('button'); b.textContent = s; if (s === cur.size) b.className = 'on';
    b.addEventListener('click', () => { cur.size = s; renderModal(); });
    $('#mSz').appendChild(b);
  });
  $('#mViews').innerHTML = '';
  p.photos.forEach((_, i) => {
    const b = document.createElement('button'); b.textContent = p.views[i] || `View ${i + 1}`; if (i === view) b.className = 'on';
    b.addEventListener('click', () => { cur.view = i; renderModal(); });
    $('#mViews').appendChild(b);
  });
}
function openProduct(id) {
  cur = { p: byId(id), vi: 0, view: 0, size: null };
  renderModal();
  modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
  document.documentElement.style.overflow = 'hidden';
}
function closeModal() {
  modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
  document.documentElement.style.overflow = '';
}
$('#mClose').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
$('#mAdd').addEventListener('click', () => {
  const { p, vi, size } = cur;
  const c = store.cart;
  const hit = c.find((x) => x.id === p.id && x.v === vi && x.size === size);
  if (hit) hit.qty++; else c.push({ id: p.id, v: vi, size, qty: 1 });
  store.cart = c; renderCart(); toast(`Added — ${p.name}`);
  closeModal(); openCart(true);
});

/* ───────── bag ───────── */
const store = {
  get cart() { try { return JSON.parse(localStorage.getItem('illwear-cart2') || '[]'); } catch { return []; } },
  set cart(v) { try { localStorage.setItem('illwear-cart2', JSON.stringify(v)); } catch {} },
  get vault() { try { return localStorage.getItem('illwear-vault'); } catch { return null; } },
  set vault(v) { try { localStorage.setItem('illwear-vault', v); } catch {} },
};
const drawer = $('#drawer'), scrim = $('#scrim'), toastEl = $('#toast');
function toast(msg) {
  toastEl.textContent = msg; toastEl.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('on'), 2200);
}
function renderCart() {
  const cart = store.cart.filter((c) => byId(c.id));
  $('#cartN').textContent = cart.reduce((a, c) => a + c.qty, 0);
  const box = $('#dItems'); box.innerHTML = '';
  if (!cart.length) box.innerHTML = '<div class="d-empty">Your bag is empty.</div>';
  let total = 0;
  cart.forEach((c, i) => {
    const p = byId(c.id); total += p.price * c.qty;
    const row = document.createElement('div'); row.className = 'd-item';
    row.innerHTML = `<div class="th">${artHTML(p, c.v, 0)}</div>
      <div><b>${p.name}</b><small>${p.variants[c.v].name} · ${c.size} · x${c.qty}</small></div>
      <div>${money(p.price * c.qty)}<br><button data-i="${i}">Remove</button></div>`;
    box.appendChild(row);
  });
  const code = store.vault, off = code ? total * VAULT_DISCOUNT : 0;
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
$('#checkout').addEventListener('click', () => {
  $('#dMsg').innerHTML = store.cart.length
    ? 'DROP 001 checkout opens soon. DM <a href="https://www.instagram.com/theillicitz/" target="_blank" rel="noopener" style="text-decoration:underline">@theillicitz</a> with your bag to reserve.'
    : 'Add something first.';
});
renderCart();

/* ───────── vault ───────── */
const vault = createVault({
  onWin: (code) => { store.vault = code; renderCart(); toast(`Code ${code} applied · 15% off`); },
});
$('#openVault').addEventListener('click', () => vault.open());
$('#openVault2').addEventListener('click', () => vault.open());

addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  closeModal(); lb.classList.remove('open'); openCart(false);
});

/* ───────── banner: drag to scratch ───────── */
initTicker($('#ticker'), { speed: 55 });

/* ───────── boot: chrome-liquid loader runs while everything above is already built ───────── */
history.scrollRestoration = 'manual'; scrollTo(0, 0);
runChromeLoader({
  assets: ['media/prints/logo-bold.png', 'media/prints/logo-white.png', 'media/prints/skulls.png', 'media/prints/xray.png',
    'media/crew-3.jpg', 'media/solo-d.jpg', 'media/crew-5.jpg'],
  min: 3200,
});

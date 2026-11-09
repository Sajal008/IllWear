// THE VAULT — a glitchy lock game. Freeze the spinning letter on the right
// one, eight times in a row, to spell I-L-L-I-C-I-T-Z and crack the lock.
import { VAULT_CODE } from './products.js';

const WORD = 'ILLICITZ';
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NOISE = '#$%&@?!<>/\\|[]{}0123456789';

let ac;
function beep(freq, dur = 0.09, type = 'square', vol = 0.05) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol; g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
  } catch {}
}
function crunch() {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const n = ac.sampleRate * 0.25, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ac.createBufferSource(), g = ac.createGain(); g.gain.value = 0.12;
    s.buffer = buf; s.connect(g).connect(ac.destination); s.start();
  } catch {}
}

export function createVault({ onWin } = {}) {
  const root = document.getElementById('vault');
  const slotsEl = root.querySelector('.v-slots');
  const lockEl = root.querySelector('.v-lock');
  const body = root.querySelector('.v-body');
  const status = root.querySelector('.v-status');
  const win = root.querySelector('.v-win');
  const btn = root.querySelector('.v-lockbtn');

  // build slots
  slotsEl.innerHTML = '';
  const slots = [...WORD].map((ch) => {
    const s = document.createElement('div');
    s.className = 'slot';
    s.innerHTML = `<div class="ghost">${ch}</div><div class="live">·</div>`;
    slotsEl.appendChild(s);
    return { el: s, live: s.querySelector('.live') };
  });

  let idx = 0, pos = 0, timer = null, open = false, tries = 0, scrambleT = null;

  const speed = (i) => 150 - i * 11; // ms per letter, faster each slot

  function say(msg, bad) {
    status.textContent = msg; status.classList.toggle('bad', !!bad);
  }

  function startSlot() {
    clearInterval(timer);
    slots.forEach((s, i) => s.el.classList.toggle('active', i === idx));
    if (idx >= WORD.length) return;
    pos = (Math.random() * 26) | 0;
    timer = setInterval(() => {
      pos = (pos + 1) % 26;
      slots[idx].live.textContent = ALPHA[pos];
    }, speed(idx));
  }

  function scrambleIdle() {
    // un-started slots flicker with noise (the "glitchy" look)
    clearInterval(scrambleT);
    scrambleT = setInterval(() => {
      slots.forEach((s, i) => {
        if (i > idx) s.live.textContent = Math.random() < 0.55 ? NOISE[(Math.random() * NOISE.length) | 0] : '';
      });
    }, 90);
  }

  function reset(fresh) {
    idx = 0; tries = 0;
    slots.forEach((s) => { s.el.classList.remove('locked', 'bad', 'active'); s.live.textContent = '·'; });
    lockEl.classList.remove('open');
    win.classList.remove('on');
    say('Freeze each letter. Spell it. Crack it.');
    scrambleIdle();
    startSlot();
  }

  function press() {
    if (!open || idx >= WORD.length) return;
    const got = ALPHA[pos], want = WORD[idx];
    if (got === want) {
      clearInterval(timer);
      slots[idx].el.classList.add('locked');
      slots[idx].live.textContent = want;
      beep(440 + idx * 90, 0.12, 'square');
      idx++;
      if (idx >= WORD.length) return success();
      say(`LOCKED ${idx}/8 — next: ${WORD[idx]}`);
      startSlot();
    } else {
      // miss: glitch + drop the previous lock
      crunch();
      body.classList.remove('deny'); void body.offsetWidth; body.classList.add('deny');
      slots[idx].el.classList.add('bad');
      const bad = slots[idx].el;
      setTimeout(() => bad.classList.remove('bad'), 400);
      say(`ACCESS DENIED — wanted ${want}, got ${got}`, true);
      tries++;
      if (idx > 0) {
        idx--;
        slots[idx].el.classList.remove('locked');
      }
      startSlot();
    }
  }

  function success() {
    clearInterval(timer); clearInterval(scrambleT);
    slots.forEach((s) => s.el.classList.remove('active'));
    lockEl.classList.add('open');
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'square', 0.06), i * 110));
    say('ACCESS GRANTED');
    setTimeout(() => {
      win.querySelector('.code').textContent = VAULT_CODE;
      win.classList.add('on');
      onWin && onWin(VAULT_CODE);
    }, 900);
  }

  function onKey(e) {
    if (!open) return;
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); press(); }
    if (e.code === 'Escape') close();
  }
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
  root.querySelector('.v-close').addEventListener('click', () => close());
  win.querySelector('[data-close]').addEventListener('click', () => close());
  win.querySelector('[data-again]').addEventListener('click', () => reset());
  document.addEventListener('keydown', onKey);

  function show() {
    open = true; root.classList.add('open'); reset();
    document.documentElement.style.overflow = 'hidden';
  }
  function close() {
    open = false; root.classList.remove('open');
    clearInterval(timer); clearInterval(scrambleT);
    document.documentElement.style.overflow = '';
  }
  return { open: show, close };
}

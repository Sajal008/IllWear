// BoomBAP02 beat + turntable-style scratching.
// The beat runs as a looping AudioBufferSource so we always know where "the needle" is.
// Dragging the banner scrubs the SAME record at that exact spot (forward / reverse,
// speed = drag speed), the beat ducks underneath, and when you let go the groove is
// still running in time — so every scratch lands on whatever part of the beat it is.

const SRC = 'media/audio/boombap02.mp3';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

let ctx = null, buf = null, rev = null, loading = null;
let musicGain = null, scratchBus = null, srcNode = null, startT = 0;
let on = false, started = false, scratching = false;
let sPos = 0, sVel = 0, lastMove = 0, grainTimer = null;
const listeners = new Set();

function ensureCtx() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  musicGain = ctx.createGain(); musicGain.gain.value = 0;
  musicGain.connect(ctx.destination);
  // scratch voice: high-passed + a little presence boost, like a record through a mixer
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 140;
  const pk = ctx.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 2200; pk.gain.value = 5; pk.Q.value = 0.8;
  scratchBus = ctx.createGain(); scratchBus.gain.value = 1.35;
  scratchBus.connect(hp).connect(pk).connect(ctx.destination);
  return ctx;
}

function load() {
  if (loading) return loading;
  ensureCtx();
  loading = fetch(SRC)
    .then((r) => r.arrayBuffer())
    .then((ab) => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
    .then((b) => {
      buf = b;
      rev = ctx.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
      for (let c = 0; c < b.numberOfChannels; c++) {
        const s = b.getChannelData(c), d = rev.getChannelData(c);
        for (let i = 0, n = s.length; i < n; i++) d[i] = s[n - 1 - i];
      }
    })
    .catch((e) => { console.warn('beat failed to load', e); });
  return loading;
}

const position = () => (buf ? (ctx.currentTime - startT) % buf.duration : 0);

function startBeat() {
  if (started || !buf) return;
  started = true;
  srcNode = ctx.createBufferSource();
  srcNode.buffer = buf; srcNode.loop = true;
  srcNode.connect(musicGain);
  startT = ctx.currentTime;
  srcNode.start();
  applyGain();
}

function applyGain(t = 0.06) {
  if (!musicGain) return;
  const target = !on ? 0 : scratching ? 0.14 : 0.85;
  musicGain.gain.cancelScheduledValues(ctx.currentTime);
  musicGain.gain.setTargetAtTime(target, ctx.currentTime, t);
}

function emit() { listeners.forEach((f) => f(on)); }

export const audio = {
  get on() { return on; },
  onChange(f) { listeners.add(f); f(on); },
  /** call from any user gesture */
  async enable() {
    ensureCtx();
    await ctx.resume();
    on = true;
    await load();
    startBeat();
    applyGain();
    emit();
  },
  async toggle() {
    if (!on) return this.enable();
    on = false; applyGain(); emit();
  },
  async scratchStart() {
    if (!on) await this.enable();
    if (!buf) return;
    scratching = true;
    sPos = position(); sVel = 0; lastMove = performance.now();
    applyGain(0.01);
    clearInterval(grainTimer);
    grainTimer = setInterval(grain, 22);
  },
  /** dx in px, dt in ms since previous move */
  scratchMove(dx, dt) {
    if (!scratching) return;
    const v = (dx / Math.max(dt, 4)) * 1000;          // px/s
    sVel = sVel * 0.45 + v * 0.55;
    lastMove = performance.now();
  },
  scratchEnd() {
    scratching = false;
    clearInterval(grainTimer);
    applyGain(0.03);
  },
};

const TICK = 0.022;
function grain() {
  if (!scratching || !buf) return;
  const now = performance.now();
  if (now - lastMove > 45) sVel *= 0.72;               // record held still → silence
  const speed = clamp(sVel / 650, -3.6, 3.6);          // 650 px/s ≈ normal speed
  const d = buf.duration;
  sPos = (sPos + speed * TICK + d) % d;
  const a = Math.abs(speed);
  if (a < 0.05) return;
  const fwd = speed >= 0;
  const src = ctx.createBufferSource();
  src.buffer = fwd ? buf : rev;
  src.playbackRate.value = a;
  const g = ctx.createGain();
  const t0 = ctx.currentTime, len = TICK * 2.4;
  const vol = clamp(0.25 + a * 0.5, 0.25, 1);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
  g.gain.setValueAtTime(vol, t0 + len - 0.012);
  g.gain.linearRampToValueAtTime(0.0001, t0 + len);
  src.connect(g).connect(scratchBus);
  const off = fwd ? sPos : (d - sPos) % d;
  src.start(t0, off, len * Math.max(a, 0.2));
  src.stop(t0 + len + 0.02);
}

/** Wire a sound on/off button */
export function bindSoundButton(btn) {
  if (!btn) return;
  btn.addEventListener('click', (e) => { e.stopPropagation(); audio.toggle(); });
  audio.onChange((v) => {
    btn.setAttribute('aria-pressed', v);
    btn.querySelector('.snd-state').textContent = v ? 'ON' : 'OFF';
    btn.classList.toggle('on', v);
  });
}

/** Start the beat on the visitor's first tap/click anywhere (browsers need a gesture). */
export function armFirstGesture() {
  let used = false;
  const go = (e) => {
    if (used) return; used = true;
    if (e.target.closest?.('[data-no-autoplay]')) { return; }
    audio.enable();
  };
  addEventListener('pointerdown', go, { once: true, passive: true });
  addEventListener('keydown', go, { once: true });
}

/**
 * Draggable, scratchable marquee.
 * el must contain .tk-track > .tk-seg (one copy; we clone it to fill).
 */
export function initTicker(el, { speed = 55 } = {}) {
  const track = el.querySelector('.tk-track');
  const seg = track.querySelector('.tk-seg');
  const need = () => Math.ceil((innerWidth * 2) / seg.offsetWidth) + 1;
  for (let i = 0; i < need(); i++) track.appendChild(seg.cloneNode(true));
  let w = seg.offsetWidth, x = 0, base = -speed, vel = base, dragging = false, lastX = 0, lastT = 0;
  addEventListener('resize', () => { w = seg.offsetWidth; });
  document.fonts?.ready.then(() => { w = seg.offsetWidth; });
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastT = performance.now(); vel = 0;
    el.setPointerCapture(e.pointerId); el.classList.add('grab');
    audio.scratchStart();
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now(), dx = e.clientX - lastX, dt = now - lastT;
    lastX = e.clientX; lastT = now;
    x += dx; vel = (dx / Math.max(dt, 4)) * 1000;
    audio.scratchMove(dx, dt);
  });
  const up = () => {
    if (!dragging) return;
    dragging = false; el.classList.remove('grab'); audio.scratchEnd();
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  let last = performance.now();
  (function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (!dragging) { vel += (base - vel) * Math.min(1, dt * 2.2); x += vel * dt; }
    x = ((x % w) - w) % w;
    track.style.transform = `translate3d(${x}px,0,0)`;
    requestAnimationFrame(loop);
  })(last);
}

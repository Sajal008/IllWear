// Shared bits: film grain, cursor, glitch pulses, page wipe transitions.

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (p, a, b) => clamp((p - a) / (b - a));
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export function initGrain() {
  const c = document.getElementById('grain');
  if (!c) return;
  const ctx = c.getContext('2d');
  const S = 240;
  c.width = S; c.height = S;
  const img = ctx.createImageData(S, S);
  let last = 0;
  (function loop(t) {
    if (t - last > 70) {
      last = t;
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }
    requestAnimationFrame(loop);
  })(0);
}

export function initCursor() {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  document.body.classList.add('has-cursor');
  const ring = document.createElement('div'); ring.className = 'cursor';
  const dot = document.createElement('div'); dot.className = 'cursor-dot';
  document.body.append(ring, dot);
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    dot.style.transform = `translate(${x}px,${y}px)`;
  }, { passive: true });
  (function loop() {
    rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest?.('a,button,[data-cursor]');
    ring.classList.toggle('big', !!t && t.matches('.shop-badge,[data-cursor="big"]'));
  });
}

/** Random glitch bursts on any .glitch[data-auto] element. */
export function initGlitchPulses() {
  const els = [...document.querySelectorAll('.glitch[data-auto]')];
  if (!els.length) return;
  (function pulse() {
    const el = els[(Math.random() * els.length) | 0];
    el.classList.add('on');
    setTimeout(() => el.classList.remove('on'), 160 + Math.random() * 260);
    setTimeout(pulse, 1800 + Math.random() * 3200);
  })();
}

function makeWipe() {
  let w = document.querySelector('.wipe');
  if (w) return w;
  w = document.createElement('div');
  w.className = 'wipe';
  for (let i = 0; i < 7; i++) {
    const b = document.createElement('i'); b.style.setProperty('--i', i); w.appendChild(b);
  }
  document.body.appendChild(w);
  return w;
}

export function initTransitions() {
  const wipe = makeWipe();
  // reveal on arrival from another page (not on first visit with loader)
  if (sessionStorage.getItem('illwipe')) {
    sessionStorage.removeItem('illwipe');
    wipe.classList.add('in');
    setTimeout(() => wipe.classList.remove('in'), 1100);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-transition]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const href = a.getAttribute('href');
    sessionStorage.setItem('illwipe', '1');
    wipe.classList.remove('in');
    wipe.classList.add('out');
    setTimeout(() => { location.href = href; }, 650);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) wipe.classList.remove('out'); });
}

export function initShared() {
  initGrain();
  initCursor();
  initGlitchPulses();
  initTransitions();
}

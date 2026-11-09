// Ill Wear loading screen: the bold Illicitz logo fills up with liquid chrome as the page loads.
// A 2D canvas paints a chrome texture (banded reflections + drifting highlights), warps it
// row-by-row so it ripples like liquid, clips it to a rising wavy surface, and CSS masks the
// whole canvas with the bold logo PNG.

const W = 910, H = 472, PAD = 70;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function preload(src) {
  return new Promise((res) => {
    if (/\.(woff2?|ttf)$/.test(src)) return res();
    const i = new Image(); i.onload = i.onerror = () => res(); i.src = src;
  });
}

export async function runChromeLoader({ assets = [], min = 3200 } = {}) {
  const root = document.getElementById('chromeLoader');
  const cv = document.getElementById('clCanvas');
  const pct = document.getElementById('clPct');
  if (!root || !cv) return;
  const ctx = cv.getContext('2d');
  cv.width = W; cv.height = H;

  const tex = document.createElement('canvas');
  tex.width = W + PAD * 2; tex.height = H;
  const tx = tex.getContext('2d');
  const stops = ['#f7fafc', '#a9b7c1', '#2b333a', '#eef4f8', '#7d8c97', '#ffffff', '#171c20', '#cdd8df', '#f7fafc'];

  function paintTex(t) {
    const TW = tex.width;
    const off = (t * 38) % H;
    const g = tx.createLinearGradient(0, off - H, 0, off + H);
    for (let k = 0; k <= 2; k++) stops.forEach((c, i) => g.addColorStop(clamp((k + i / (stops.length - 1)) / 2.0001), c));
    tx.fillStyle = g; tx.fillRect(0, 0, TW, H);
    const d = tx.createLinearGradient(0, 0, TW, H);
    d.addColorStop(0, 'rgba(255,255,255,.4)'); d.addColorStop(0.5, 'rgba(255,255,255,0)'); d.addColorStop(1, 'rgba(0,0,0,.45)');
    tx.fillStyle = d; tx.fillRect(0, 0, TW, H);
    for (let i = 0; i < 6; i++) {
      const cx = TW / 2 + Math.sin(t * 0.7 + i * 1.9) * TW * 0.42;
      const cy = H / 2 + Math.cos(t * 0.9 + i * 2.3) * H * 0.4;
      const r = H * (0.26 + 0.1 * Math.sin(i * 1.3 + t * 1.1));
      const rg = tx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const light = i % 2 === 0;
      rg.addColorStop(0, light ? 'rgba(255,255,255,.9)' : 'rgba(0,0,0,.65)');
      rg.addColorStop(1, light ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)');
      tx.fillStyle = rg; tx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }

  let level = 0, shown = 0, real = 0, done = false, t0 = performance.now();
  const total = assets.length + 1;
  let loaded = 0;
  Promise.all([
    ...assets.map((a) => preload(a).then(() => { loaded++; })),
    (document.fonts?.ready || Promise.resolve()).then(() => { loaded++; }),
  ]).then(() => { real = 1; });

  const surface = (x, t, lv) => {
    if (lv >= 0.999) return -30;
    const A = 16 * (1 - lv * lv) + 3;
    return H * (1 - lv) + Math.sin(x * 0.012 + t * 2.4) * A + Math.sin(x * 0.027 - t * 3.7) * A * 0.45;
  };

  await new Promise((resolve) => {
    function frame(now) {
      const t = (now - t0) / 1000;
      const timeP = clamp((now - t0) / min);
      const realP = real ? 1 : clamp(loaded / total) * 0.9;
      const target = Math.min(timeP, realP);
      shown += (target - shown) * 0.06;
      if (target >= 1 && shown > 0.995) shown = 1;
      level = 1 - Math.pow(1 - shown, 1.6);
      pct.textContent = String(Math.round(shown * 100)).padStart(3, '0');

      paintTex(t);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, surface(0, t, level));
      for (let x = 8; x <= W; x += 8) ctx.lineTo(x, surface(x, t, level));
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.clip();
      for (let y = 0; y < H; y += 4) {
        const shift = Math.sin(y * 0.018 + t * 2.2) * PAD * 0.55 + Math.sin(y * 0.05 - t * 3.1) * PAD * 0.25;
        ctx.drawImage(tex, PAD + shift, y, W, 4, 0, y, W, 4);
      }
      ctx.restore();
      if (level < 0.999) { // meniscus: bright lip + dark undercut
        ctx.save();
        ctx.beginPath();
        for (let x = 0; x <= W; x += 8) { const y = surface(x, t, level); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.stroke();
        ctx.translate(0, 6); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.stroke();
        ctx.restore();
      }
      if (shown >= 1) return resolve();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  // hold the finished chrome logo for a beat, then lift the loader off
  root.classList.add('full');
  await new Promise((r) => setTimeout(r, 650));
  root.classList.add('lift');
  document.body.classList.remove('is-loading');
  await new Promise((r) => setTimeout(r, 950));
  root.remove();
}

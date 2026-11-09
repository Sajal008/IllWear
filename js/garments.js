// Vector garment mock-ups (600×720 viewBox). No libraries — plain SVG strings.
// Each template draws a garment in the given colours, adds fabric shading, and then
// the product's print list is composited on top (images, type, the ILL WEAR slab).

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => clamp(Math.round(v * f), 0, 255);
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/* ── print primitives ─────────────────────────────────── */
function gearMark(cx, y, w, color) {
  const s = w * 0.2;
  return `<g fill="${color}" font-family="'Alfa Slab One','Rockwell',serif" filter="url(#DIS)">
    <text x="${cx}" y="${y}" text-anchor="middle" font-size="${w * 0.085}" textLength="${w * 0.44}" lengthAdjust="spacingAndGlyphs" transform="rotate(-2 ${cx} ${y})">AUTHENTIC®</text>
    <text x="${cx}" y="${y + s * 1.05}" text-anchor="middle" font-size="${s}" textLength="${w}" lengthAdjust="spacingAndGlyphs" transform="rotate(-1.5 ${cx} ${y})">ILLICITZ</text>
    <text x="${cx}" y="${y + s * 2.1}" text-anchor="middle" font-size="${s * 1.05}" textLength="${w * 0.64}" lengthAdjust="spacingAndGlyphs">GEAR</text></g>`;
}
function slab(cx, cy, w, fill, txt = '#fff') {
  const h = w * 0.3;
  return `<g transform="translate(${cx} ${cy}) skewX(-12)" filter="url(#DIS)">
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${fill}"/>
    <text x="0" y="${h * 0.04}" text-anchor="middle" dominant-baseline="central" font-family="Anton,Impact,sans-serif" font-size="${h * 0.78}" fill="${txt}" textLength="${w * 0.84}" lengthAdjust="spacingAndGlyphs">ILL WEAR</text></g>`;
}
function textBlock(p, fill) {
  const lh = p.lh || 56;
  return `<g fill="${fill}" font-family="${p.font || 'Anton,Impact,sans-serif'}" filter="url(#DIS)">` +
    p.lines.map((t, i) => `<text x="${p.x}" y="${p.y + i * lh}" font-size="${lh * 1.02}" textLength="${p.w}" lengthAdjust="spacingAndGlyphs"${p.rot ? ` transform="rotate(${p.rot} ${p.x} ${p.y})"` : ''}>${t}</text>`).join('') + '</g>';
}

function printsSVG(list, v) {
  const inkName = v.tone === 'dark' ? 'white' : 'black';
  return (list || []).map((p) => {
    const fill = (p.fill || '$ink').replace('$ink', v.ink).replace('$base', v.base);
    switch (p.type) {
      case 'img': {
        const src = `media/prints/${p.src.replace('{ink}', inkName)}.png`;
        return `<image href="${src}" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" preserveAspectRatio="xMidYMid meet" filter="url(#DIS)"${p.rot ? ` transform="rotate(${p.rot} ${p.x + p.w / 2} ${p.y + p.h / 2})"` : ''}/>`;
      }
      case 'gear': return gearMark(p.x, p.y, p.w, fill);
      case 'slab': return slab(p.x, p.y, p.w, v.slab || '#3B5249');
      case 'text': return textBlock(p, fill);
      default: return '';
    }
  }).join('');
}

/* ── garment templates ─────────────────────────────────── */
const T = {
  tee({ b, back }) {
    const neck = back ? 84 : 112;
    const body = `M222,58 Q150,66 88,104 L16,236 L92,282 L130,230 Q120,460 126,664 Q300,682 474,664 Q480,460 470,230 L508,282 L584,236 L512,104 Q450,66 378,58 C355,${neck} 245,${neck} 222,58 Z`;
    return {
      clip: body,
      art: `<path d="${body}" fill="${b}"/>`,
      detail: `<path d="M222,58 C245,${neck} 355,${neck} 378,58" fill="none" stroke="${shade(b, 0.8)}" stroke-width="15" stroke-linecap="round"/>
        <path d="M222,58 C245,${neck - 8} 355,${neck - 8} 378,58" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="2"/>
        <path d="M128,232 Q152,150 92,106 M472,232 Q448,150 508,106" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="2.2" stroke-dasharray="8 6"/>
        <path d="M30,224 L104,268 M570,224 L496,268 M128,640 Q300,660 472,640" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2.2" stroke-dasharray="8 6"/>`,
      folds: ['M190,330 Q232,420 205,525', 'M412,300 Q380,425 402,545', 'M240,610 Q300,626 360,610', 'M150,250 Q170,300 160,360'],
    };
  },

  hoodie({ b, back }) {
    const body = 'M186,150 Q112,168 76,212 L22,528 L108,548 L134,350 Q126,500 130,640 Q300,660 470,640 Q474,500 466,350 L492,548 L578,528 L524,212 Q488,168 414,150 C392,200 208,200 186,150 Z';
    const hoodBack = `<path d="M178,160 C170,62 226,14 300,14 C374,14 430,62 422,160 Z" fill="${shade(b, 0.86)}"/>`;
    const hole = back
      ? `<path d="M206,152 C206,100 246,74 300,74 C354,74 394,100 394,152 C372,178 228,178 206,152 Z" fill="${shade(b, 0.9)}"/>`
      : `<path d="M206,152 C204,92 246,56 300,56 C354,56 396,92 394,152 C372,186 228,186 206,152 Z" fill="${shade(b, 0.42)}" stroke="${shade(b, 0.7)}" stroke-width="6"/>`;
    const rib = shade(b, 0.88);
    return {
      clip: body + ' M178,160 C170,62 226,14 300,14 C374,14 430,62 422,160 Z',
      art: `${hoodBack}<path d="${body}" fill="${b}"/>
        <path d="M22,528 L108,548 L100,594 L14,572 Z M578,528 L492,548 L500,594 L586,572 Z M130,640 Q300,660 470,640 L472,696 Q300,718 128,696 Z" fill="${rib}"/>
        ${hole}`,
      detail: (back ? '' : `<path d="M170,470 L430,470 L452,602 L148,602 Z" fill="rgba(255,255,255,.04)" stroke="rgba(0,0,0,.32)" stroke-width="2.4"/>
        <path d="M170,470 L146,524 M430,470 L454,524" stroke="rgba(0,0,0,.3)" stroke-width="2.4"/>
        <path d="M268,184 L262,292 M332,184 L338,292" stroke="${shade(b, 1.5)}" stroke-width="5" stroke-linecap="round"/>
        <rect x="258" y="288" width="9" height="20" rx="3" fill="#bdb8ab" transform="rotate(3 262 292)"/><rect x="333" y="288" width="9" height="20" rx="3" fill="#bdb8ab" transform="rotate(-3 338 292)"/>`) +
        `<path d="M22,545 L100,566 M578,545 L500,566 M130,668 Q300,690 470,668" stroke="rgba(0,0,0,.3)" stroke-width="2" stroke-dasharray="3 5" fill="none"/>
        <path d="M136,352 Q150,230 90,214 M464,352 Q450,230 510,214" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2.2" stroke-dasharray="8 6"/>`,
      folds: ['M215,320 Q250,380 228,455', 'M390,300 Q360,390 380,458', 'M60,320 Q85,420 70,500', 'M540,320 Q515,420 530,500', 'M220,620 Q300,640 380,620'],
    };
  },

  windbreaker({ b, c2, c3, back }) {
    const body = 'M196,92 Q120,108 80,150 L24,500 L106,520 L134,300 Q126,470 130,612 Q300,632 470,612 Q474,470 466,300 L494,520 L576,500 L520,150 Q480,108 404,92 L370,76 L230,76 Z';
    const yoke = 'M196,92 Q120,108 80,150 L64,232 Q300,264 536,232 L520,150 Q480,108 404,92 L370,76 Q300,98 230,76 Z';
    const collar = 'M230,76 L214,28 Q300,8 386,28 L370,76 Q300,98 230,76 Z';
    const stripeL = 'M62,250 L26,498 L52,504 L90,262 Z M92,262 L58,502 L68,505 L102,266 Z';
    const stripeR = 'M538,250 L574,498 L548,504 L510,262 Z M508,262 L542,502 L532,505 L498,266 Z';
    return {
      clip: body + ' ' + collar,
      art: `<path d="${body}" fill="${b}"/><path d="${yoke}" fill="${c2}"/>
        <path d="${stripeL} ${stripeR}" fill="${c3}"/>
        <path d="${collar}" fill="${c2}"/>
        <path d="M24,500 L106,520 L100,558 L18,538 Z M576,500 L494,520 L500,558 L582,538 Z M130,590 Q300,610 470,590 L470,614 Q300,634 130,614 Z" fill="${shade(c2, 1.1)}"/>`,
      detail: (back
        ? `<path d="M300,98 L300,612" stroke="rgba(0,0,0,.22)" stroke-width="2" stroke-dasharray="6 6" fill="none"/>`
        : `<path d="M300,98 L300,614" stroke="#111" stroke-width="7"/><path d="M300,98 L300,614" stroke="#8d8f90" stroke-width="3" stroke-dasharray="2 4"/>
           <rect x="293" y="110" width="14" height="30" rx="4" fill="#cfd3d6" stroke="#222" stroke-width="2"/>
           <path d="M172,410 L196,520 M428,410 L404,520" stroke="rgba(0,0,0,.42)" stroke-width="3.5"/><path d="M178,330 L218,330 M382,330 L422,330" stroke="rgba(255,255,255,.16)" stroke-width="2"/>`) +
        `<path d="M136,302 Q150,200 84,152 M464,302 Q450,200 516,152" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="2.2" stroke-dasharray="8 6"/>`,
      folds: ['M215,300 Q250,380 226,470', 'M392,290 Q364,380 382,480', 'M70,300 Q90,400 76,480', 'M530,300 Q510,400 524,480'],
    };
  },

  pants({ b, c2, back }) {
    const legs = 'M168,74 H432 L486,692 L330,692 L300,252 L270,692 L114,692 Z';
    const rib = shade(b, 0.8);
    return {
      clip: legs + ' M168,24 H432 V74 H168 Z',
      art: `<path d="${legs}" fill="${b}"/><path d="M168,24 H432 V74 H168 Z" fill="${rib}"/>
        <path d="M114,664 L270,664 L270,692 L114,692 Z M330,664 L486,664 L486,692 L330,692 Z" fill="${rib}"/>`,
      detail: (back
        ? `<path d="M178,100 H278 V190 L228,205 L178,190 Z M322,100 H422 V190 L372,205 L322,190 Z" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2.4"/>`
        : `<path d="M300,74 L296,212 Q296,236 280,240" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2.4" stroke-dasharray="7 5"/>
           <path d="M138,300 L208,296 L204,430 L132,434 Z M392,296 L462,300 L468,434 L396,430 Z" fill="rgba(255,255,255,.04)" stroke="rgba(0,0,0,.4)" stroke-width="2.6"/>
           <path d="M136,330 L206,326 M394,326 L464,330" stroke="rgba(0,0,0,.35)" stroke-width="2.2"/>
           <path d="M268,46 Q248,118 262,150 M332,46 Q352,118 338,150" fill="none" stroke="${shade(b, 1.7)}" stroke-width="4.5" stroke-linecap="round"/>`) +
        `<path d="M172,76 L120,690 M428,76 L480,690" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="2" stroke-dasharray="8 6"/>`,
      folds: ['M200,250 Q215,420 190,600', 'M400,250 Q385,420 410,600', 'M260,260 Q250,440 262,640', 'M340,260 Q350,440 338,640'],
    };
  },

  duffel({ b, c2, back }) {
    const body = 'M80,300 Q80,236 150,236 H450 Q520,236 520,300 V470 Q520,534 450,534 H150 Q80,534 80,470 Z';
    return {
      clip: body,
      pre: `<ellipse cx="300" cy="566" rx="236" ry="15" fill="rgba(0,0,0,.2)"/>
        <path d="M96,300 C120,40 480,40 504,300" fill="none" stroke="${c2}" stroke-width="15" stroke-linecap="round"/>
        <path d="M96,300 C120,40 480,40 504,300" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="3" stroke-dasharray="3 6"/>
        <rect x="292" y="66" width="34" height="22" rx="4" fill="#bfc3c6" stroke="#222" stroke-width="2.5" transform="rotate(0 309 77)"/>
        <path d="M216,240 C216,138 384,138 384,240" fill="none" stroke="${c2}" stroke-width="17" stroke-linecap="round"/>
        <rect x="262" y="150" width="76" height="26" rx="13" fill="${shade(c2, 0.78)}"/>`,
      art: `<path d="${body}" fill="${b}"/>
        <path d="M80,300 Q80,236 150,236 H450 Q520,236 520,300 V300 H80 Z" fill="${shade(b, 1.12)}"/>
        <rect x="80" y="486" width="440" height="60" fill="${shade(b, 0.78)}"/>
        <rect x="80" y="236" width="70" height="300" fill="${shade(b, 0.9)}"/><rect x="450" y="236" width="70" height="300" fill="${shade(b, 0.9)}"/>`,
      detail: `<path d="M80,296 H520" stroke="#0b0b0b" stroke-width="6"/><path d="M80,296 H520" stroke="#8b8f91" stroke-width="2.4" stroke-dasharray="2 4"/>
        <rect x="262" y="287" width="26" height="18" rx="4" fill="#cfd3d6" stroke="#222" stroke-width="2"/>
        <path d="M150,236 V534 M450,236 V534" stroke="rgba(0,0,0,.4)" stroke-width="2.6"/>
        <path d="M96,350 H134 M466,350 H504" stroke="#0b0b0b" stroke-width="5"/><rect x="108" y="342" width="14" height="16" rx="3" fill="#cfd3d6" stroke="#222" stroke-width="1.6"/><rect x="478" y="342" width="14" height="16" rx="3" fill="#cfd3d6" stroke="#222" stroke-width="1.6"/>
        <path d="M80,486 H520" stroke="rgba(0,0,0,.35)" stroke-width="2.4" stroke-dasharray="8 6"/>
        <circle cx="96" cy="300" r="9" fill="#bfc3c6" stroke="#222" stroke-width="2.4"/><circle cx="504" cy="300" r="9" fill="#bfc3c6" stroke="#222" stroke-width="2.4"/>`,
      folds: ['M200,300 Q215,400 202,480', 'M400,300 Q388,400 398,480'],
    };
  },
};

let UID = 0;
export function garmentSVG(product, vi, view = 'front', opts = {}) {
  const v = product.variants[vi];
  const u = opts.uid || `g${++UID}_`;
  const back = view === 'back';
  const g = T[product.garment]({ b: v.base, c2: v.c2 || shade(v.base, 0.7), c3: v.c3 || v.ink, back });
  const vb = opts.crop ? opts.crop.join(' ') : '0 0 600 720';
  const dark = v.tone === 'dark';
  const shadeH = `<linearGradient id="${u}h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset=".2" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${dark ? 0.07 : 0.1}"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></linearGradient>`;
  const shadeV = `<linearGradient id="${u}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.08 : 0.16}"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>`;
  const fab = `<filter id="${u}f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .7 -.22"/></filter>`;
  const dis = `<filter id="${u}d" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="9" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  10 0 0 0 -2.5" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>`;
  const prints = printsSVG(product.prints[back ? 'back' : 'front'], v).replaceAll('url(#DIS)', `url(#${u}d)`);
  const folds = g.folds.map((d, i) => `<path d="${d}" fill="none" stroke="${i % 2 ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.14)'}" stroke-width="${6 + (i % 3) * 3}" stroke-linecap="round" opacity=".9"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${product.name}, ${v.name}, ${view}" preserveAspectRatio="xMidYMid meet">
  <defs>${shadeH}${shadeV}${fab}${dis}<clipPath id="${u}c"><path d="${g.clip}"/></clipPath></defs>
  ${g.pre || `<ellipse cx="300" cy="700" rx="220" ry="12" fill="rgba(0,0,0,.14)"/>`}
  ${g.art}
  <g clip-path="url(#${u}c)">
    <rect width="600" height="720" fill="url(#${u}h)"/><rect width="600" height="720" fill="url(#${u}v)"/>
    ${folds}
    <rect width="600" height="720" filter="url(#${u}f)" opacity=".55"/>
  </g>
  ${g.detail}
  <g clip-path="url(#${u}c)">${prints}</g>
</svg>`;
}

// ─────────────────────────────────────────────────────────────
//  MEDIA MANIFEST
//  Everything cinematic on the site is fed from this list.
//  To add more footage: drop files in /media and add a row below.
//    image → { type:'image', src:'media/your-photo.jpg', alt:'…' }
//    video → { type:'video', src:'media/your-clip.mp4', poster:'media/your-poster.jpg', alt:'…' }
//  The scroll scenes (columns, reel) automatically use every entry.
// ─────────────────────────────────────────────────────────────
export const MEDIA = [
  { type: 'image', src: 'media/still-01.jpg', alt: 'A breaker mid one-handed freeze while the crew watches' },
  { type: 'image', src: 'media/still-02.jpg', alt: 'The crew posed up inside a cypher circle' },
  { type: 'image', src: 'media/still-03.jpg', alt: 'Talk Yo Sh** Vol.1 — bar and crowd' },
];

export const CAPTIONS = [
  ['THE CYPHER', 'ROUND 01'],
  ['VOL. 1', 'TALK YO SH**'],
  ['SEATTLE, WA', 'PNW'],
  ['FREEZE', 'HOLD IT'],
  ['SLAYIN SINCE 2025', 'ILLICITZ'],
  ['TOO ILL', 'FOR THIS WORLD'],
];

/** Fill an element with an <img> or <video> from a manifest entry. */
export function mountMedia(el, item, pos) {
  el.classList.add('media');
  let node;
  if (item.type === 'video') {
    node = document.createElement('video');
    node.src = item.src;
    if (item.poster) node.poster = item.poster;
    node.muted = true; node.loop = true; node.playsInline = true; node.autoplay = true;
    node.setAttribute('muted', ''); node.setAttribute('playsinline', '');
    node.play?.().catch(() => {});
  } else {
    node = document.createElement('img');
    node.src = item.src;
    node.alt = item.alt || '';
    node.decoding = 'async';
  }
  if (pos) node.style.objectPosition = pos;
  el.appendChild(node);
  return node;
}

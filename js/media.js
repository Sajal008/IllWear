// ─────────────────────────────────────────────────────────────
//  MEDIA MANIFEST
//  Everything cinematic on the site is fed from this list.
//  To add more footage: drop files in /media and add a row below.
//    image → { type:'image', src:'media/your-photo.jpg', alt:'…' }
//    video → { type:'video', src:'media/your-clip.mp4', poster:'media/your-poster.jpg', alt:'…' }
//  The scroll scenes (columns, reel) automatically use every entry.
// ─────────────────────────────────────────────────────────────
export const MEDIA = [
  { type: 'image', src: 'media/moment-cypher.jpg', alt: 'The cypher: crowd circled around the floor' },
  { type: 'image', src: 'media/crew-5.jpg', alt: 'Five members of the crew in front of graffiti', portrait: true, ar: 672 / 865 },
  { type: 'image', src: 'media/crew-wide.jpg', alt: 'The crew posed up in a dark hallway' },
  { type: 'image', src: 'media/moment-air.jpg', alt: 'A breaker frozen mid-air above the checkerboard floor' },
  { type: 'image', src: 'media/solo-a.jpg', alt: 'Floor freeze in a fisheye lens, crowd blurred behind' },
  { type: 'image', src: 'media/crew-3.jpg', alt: 'Three members posing outside a graffiti doorway', portrait: true, ar: 1180 / 1572 },
  { type: 'image', src: 'media/solo-d.jpg', alt: 'Black and white portrait with the Illicitz hand sign', portrait: true, ar: 818 / 1068 },
  { type: 'image', src: 'media/solo-b.jpg', alt: 'Two members posing with a trophy' },
  { type: 'image', src: 'media/solo-c.jpg', alt: 'Post-battle laughs' },
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

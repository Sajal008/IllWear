// ILL WEAR — product catalogue. Edit names / prices / colours here.
// `art` picks the print layout drawn in wear.js (society | box | vol1).
export const PRODUCTS = [
  {
    id: 'society',
    art: 'society',
    name: 'Too Ill For The Society Tee',
    tag: 'DROP 001',
    price: 38,
    blurb: 'Stacked block type, glitch-split. Heavyweight boxy cut. Say it loud.',
    variants: [
      { name: 'Black', base: '#0e0e0e', ink: '#efe9dd', accent: '#ff2d1f' },
      { name: 'Bone', base: '#e6e0d1', ink: '#0e0e0e', accent: '#ff2d1f' },
    ],
  },
  {
    id: 'box',
    art: 'box',
    name: 'Ill Wear Slab Tee',
    tag: 'CORE',
    price: 36,
    blurb: 'The slab. Red block, italic cut, nothing else needed.',
    variants: [
      { name: 'Bone', base: '#e6e0d1', ink: '#0e0e0e', accent: '#ff2d1f' },
      { name: 'Red', base: '#c9231a', ink: '#efe9dd', accent: '#0e0e0e' },
    ],
  },
  {
    id: 'vol1',
    art: 'vol1',
    name: 'Illicitz Vol.1 Tee',
    tag: 'VOL. 1',
    price: 42,
    blurb: 'Planet Kosmos wordmark up front. Halftone floor photo on the back. Seattle, 2025.',
    variants: [
      { name: 'Charcoal', base: '#22221f', ink: '#c8ff00', accent: '#efe9dd' },
      { name: 'Acid', base: '#c8ff00', ink: '#0e0e0e', accent: '#ff2d1f' },
    ],
  },
];

export const SIZES = ['S', 'M', 'L', 'XL', '2XL'];
export const VAULT_CODE = 'ILLOUT15';
export const VAULT_DISCOUNT = 0.15;

// ILL WEAR — DROP 001 catalogue. Edit names, prices, copy here.
// Photos live in media/products/ (cut from the product renders in the "Products" folder).
// `photos` = images shown for the product (first one is the main shot, second shows on hover);
// `views` = the label for each photo in the product popup.
// (js/garments.js is an optional vector fallback for products without photos — not used right now.)

export const SIZES = ['S', 'M', 'L', 'XL', '2XL'];
export const VAULT_CODE = 'ILLOUT15';
export const VAULT_DISCOUNT = 0.15;

const BLACK = [{ name: 'Black', base: '#111111' }];
const ph = (...n) => n.map((x) => `media/products/${x}.jpg`);

export const PRODUCTS = [
  {
    id: 'duffel', cat: 'Bags', name: 'Ill Wear Duffel', price: 88, tag: 'NEW', sizes: ['OS'], variants: [{ name: 'Black / Forest', base: '#1b2a24' }],
    photos: ph('duffel-1', 'duffel-2', 'duffel-3'), views: ['Front', 'Embroidery', 'Strap + pocket'],
    desc: 'Barrel duffel with the Illicitz crest embroidered across the front. Forest-green webbing handles and a detachable shoulder strap printed ILL WEAR / ILL DUBBEL, two-way top zip and a zip end pocket.',
    specs: ['Black heavy canvas shell', 'Embroidered Illicitz crest', 'Two-way top zip', 'Zip end pocket + vented eyelets', 'Webbing handles + adjustable strap'],
  },
  {
    id: 'hoodie-flame', cat: 'Hoodies', name: 'Blue Flame Hoodie', price: 78, tag: 'DROP 001', variants: BLACK,
    photos: ph('hoodie-flame-1', 'hoodie-flame-2', 'hoodie-flame-3'), views: ['Front', 'X-ray cuff', 'Sunburst'],
    desc: 'Heavyweight black hoodie with blue flames licking up both sleeves. X-ray crossed-fingers hand on the cuff and the sunburst mark on the pocket side.',
    specs: ['450 gsm brushed fleece', 'Oversized fit', 'Kangaroo pocket', 'Sleeve prints + cuff print'],
  },
  {
    id: 'hoodie-dubbel', cat: 'Hoodies', name: 'Ill Dubbel Varsity Hoodie', price: 82, tag: 'NEW', variants: BLACK,
    photos: ph('hoodie-dubbel-1', 'hoodie-dubbel-2', 'hoodie-dubbel-3'), views: ['Front', 'X-ray cuff', 'Sunburst'],
    desc: 'ILL DUBBEL in electric-blue varsity type across the chest, flames up the sleeves, x-ray hand on the cuff.',
    specs: ['450 gsm brushed fleece', 'Oversized fit', 'Chenille-look varsity print', 'Kangaroo pocket'],
  },
  {
    id: 'windbreaker', cat: 'Outerwear', name: 'See No Evil Windbreaker', price: 120, tag: 'NEW', variants: BLACK,
    photos: ph('wind-1', 'wind-2', 'wind-3'), views: ['Back', 'Collar', 'Back label'],
    desc: 'Black stand-collar shell with the thermal-camera skulls — see no evil, hear no evil, speak no evil — across the back. Small ILL WEAR label at the nape, elastic hem and cuffs.',
    specs: ['Lightweight nylon shell', 'Stand collar, zip front', 'Elastic hem + cuffs', 'Heat-sealed back print'],
  },
  {
    id: 'pants', cat: 'Pants', name: 'Cargo Pant', price: 92, tag: 'CORE', variants: BLACK,
    photos: ph('pants-1', 'pants-2', 'pants-3'), views: ['Front', 'Pocket print', 'Skull'],
    desc: 'Wide-leg cotton cargo with drawcord elastic waist and big thigh pockets — made to move on the floor. AUTHENTIC® ILLICITZ GEAR stamped on the pocket, thermal skull at the hip.',
    specs: ['Washed cotton twill', 'Wide leg', 'Cargo thigh pockets', 'Elastic drawcord waist'],
  },
  {
    id: 'tee-skull', cat: 'Tees', name: 'Skull Pocket Tee', price: 40, tag: 'DROP 001', variants: BLACK,
    photos: ph('tee-skull-1', 'tee-skull-2'), views: ['Pocket', 'Label'],
    desc: 'Heavyweight black tee with a chest pocket and the three thermal skulls embroidered on it. I’LL WEAR label at the neck.',
    specs: ['240 gsm cotton', 'Boxy fit', 'Chest pocket', 'Embroidered skulls'],
  },
  {
    id: 'tee-sun', cat: 'Tees', name: 'Sunburst Tee', price: 36, tag: 'CORE', variants: BLACK,
    photos: ph('tee-sun-1', 'tee-sun-2'), views: ['Front', 'Label'],
    desc: 'Black heavyweight tee with the small sunburst mark on the chest. Quiet on the front, I’LL WEAR at the neck.',
    specs: ['240 gsm cotton', 'Boxy fit', 'Ribbed collar', 'Small chest print'],
  },
  {
    id: 'tee-gear', cat: 'Tees', name: 'Authentic Gear Tee', price: 36, tag: 'CORE', variants: BLACK,
    photos: ph('tee-gear-1', 'tee-gear-2'), views: ['Back neck', 'Front'],
    desc: 'The hand-lettered AUTHENTIC© ILLICITZ GEAR mark across the upper back, tone-on-tone.',
    specs: ['240 gsm cotton', 'Boxy fit', 'Ribbed collar', 'Distressed screen-print'],
  },
];

export const CATS = ['All', 'Tees', 'Hoodies', 'Outerwear', 'Pants', 'Bags'];

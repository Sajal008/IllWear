# ILLICITZ — Too ill for this world.

Site for **The Illicitz**, a creative collective grounded in breakin' culture (Seattle, WA).
Plain HTML / CSS / JS — no build step, so it deploys as-is on GitHub Pages.

| Page | What it is |
|---|---|
| `index.html` | Cinematic scroll home built from the crew's own photos: image loads *into* the word ILLICITZ → hero → expanding frame → parallax columns → horizontal reel → manifesto → finale with the centre **Ill Wear** shop badge. The top banner is **draggable: drag it to scratch** the BoomBAP02 beat. |
| `wear.html` | **Ill Wear** shop — plain HTML/CSS/JS + SVG (no three.js). Chrome-liquid logo loader, Skilz-style spec hero with the duffel, Supreme-style preview grid, Yeezy-style product grid, product modal, bag, lookbook |
| The Vault (modal in `wear.html`) | Glitch lock game with `ILLICITZ` embedded. Freeze 8 spinning letters → code `ILLOUT15` (15% off in the bag) |

**Sound:** the beat starts on the visitor's first tap/click (browsers block autoplay) and can be toggled with the ♪ button. Dragging the banner scrubs the same record at the current spot of the beat — forward/back, speed = drag speed — so every scratch lands in time.

## Run locally
ES modules need a web server (double-clicking the HTML won't work):

```bash
python -m http.server 5173
```
then open http://localhost:5173

## Edit stuff
- **Media** → `js/media.js`. Drop files into `media/` and add a row (image *or* video). The scroll columns and reel use every entry automatically. Shop tiles/lookbook lists are at the top of `js/shop.js`.
- **Products / prices / colours / print placement** → `js/products.js`. Garment shapes are vector templates in `js/garments.js`. **To use real product photos** add `photo: ['media/x-front.jpg','media/x-back.jpg']` to a product.
- **Prints** (`media/prints/*.png`) are cut from the files in the *Ill Wear Design* folder.
- **Accent colour** `#3B5249` → `--acid` in `css/style.css` (`--hi` is a lighter tint of it for small text on black).
- **Vault code & discount** → `js/products.js` (`VAULT_CODE`, `VAULT_DISCOUNT`).
- **Fonts** → *Planet Kosmos* (`fonts/PlanetKosmos.ttf`, by Mads Rydahl / The Planet — free for non-commercial; **commercial use needs a license, see the readme in the font download**). Anton, Space Mono, Rubik Glitch, Rubik Mono One and Permanent Marker load from Google Fonts.

Checkout is intentionally a stub ("Reserve my drop" → DM on Instagram). Wire Shopify/Stripe/Snipcart when the drop is real.

## Deploy → your Spaceship domain
See **[DEPLOY.md](DEPLOY.md)**.

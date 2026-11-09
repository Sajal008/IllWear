# ILLICITZ — Too ill for this world.

Site for **The Illicitz**, a creative collective grounded in breakin' culture (Seattle, WA).
Plain HTML / CSS / JS — no build step, so it deploys as-is on GitHub Pages.

| Page | What it is |
|---|---|
| `index.html` | Cinematic scroll home: image loads *into* the word ILLICITZ → hero → expanding frame → parallax columns → horizontal reel → manifesto → finale with the centre **Ill Wear** shop badge |
| `wear.html` | **Ill Wear** shop. three.js cloth-sim tees — hover to push the fabric, drag/Flip to spin, 3 designs × 2 colours, cart |
| The Vault (modal in `wear.html`) | Glitch lock game with `ILLICITZ` embedded. Freeze 8 spinning letters to crack it → code `ILLOUT15` (15% off in cart) |

## Run locally
ES modules need a web server (double-clicking the HTML won't work):

```bash
python -m http.server 5173
```
then open http://localhost:5173

## Edit stuff
- **Media** → `js/media.js`. Drop files into `media/` and add a row (image *or* video). The scroll columns, reel and lookbook use every entry automatically.
- **Products / prices / colours** → `js/products.js` (print layouts are drawn in `js/wear.js` → `ART`).
- **Vault code & discount** → `js/products.js` (`VAULT_CODE`, `VAULT_DISCOUNT`).
- **Fonts** → *Planet Kosmos* (`fonts/PlanetKosmos.ttf`, by Mads Rydahl / The Planet — free for non-commercial; **commercial use needs a license, see the readme in the font download**). Anton, Space Mono, Rubik Glitch, Rubik Mono One and Permanent Marker load from Google Fonts.
- `vendor/three.module.js` is three.js r160 (MIT), vendored so the site has no CDN dependency for 3D.

Checkout is intentionally a stub ("Reserve my drop" → DM on Instagram). Wire Shopify/Stripe/Snipcart when the drop is real.

## Deploy → your Spaceship domain
See **[DEPLOY.md](DEPLOY.md)**.

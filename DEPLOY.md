# Deploy: GitHub Pages + Spaceship domain

The site files live in the root of this repo (`index.html`, `wear.html`, `css/`, `js/`, `media/`, `fonts/`, `vendor/`, `CNAME`).

## 1. Put it on GitHub
1. On github.com → **New repository** → name it e.g. `IllWear` → **Public** (Pages on free plans needs public) → create it **empty** (no README).
2. In this folder:
   ```bash
   git remote add origin https://github.com/<YOUR-USERNAME>/IllWear.git
   git push -u origin main
   ```

## 2. Turn on GitHub Pages
Repo → **Settings → Pages** → *Build and deployment* → Source: **Deploy from a branch** → Branch: `main` / `/ (root)` → Save.
Under **Custom domain** type your domain (e.g. `illicitz.com`) → Save. (The `CNAME` file in this repo already says `illicitz.com` — **edit it if your domain is different.**)

## 3. Spaceship DNS settings
1. Log in at **spaceship.com** → **Domain List** → click your domain → **DNS** (sometimes labelled *Advanced DNS* / *DNS records*).
2. Make sure the domain uses **Spaceship's default nameservers** (Nameservers section). Records below only take effect if so.
3. Delete any existing parking `A` / `ALIAS` / `CNAME` records on `@` and `www`.
4. Add these records:

| Type | Host / Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `<YOUR-USERNAME>.github.io` |

   TTL: automatic/default. (Optional IPv6: four `AAAA` records on `@` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.)
5. Wait 10 min – a few hours for DNS to propagate. In GitHub **Settings → Pages**, once the DNS check goes green, tick **Enforce HTTPS**.

Check: `nslookup illicitz.com` should list the 185.199.x.153 addresses.

## Troubleshooting
- *"DNS check unsuccessful"* → old parking records still present, or nameservers aren't Spaceship's default.
- *404* → Pages source not set to `main` / root, or `index.html` isn't in the repo root.
- *Fonts/3D missing* → open the browser console; everything must be served over http(s), not `file://`.

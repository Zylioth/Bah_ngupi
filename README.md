# ☕ Bah_ngupi

A gamified, mobile-first **cafe hopping passport & tracker** for Brunei Darussalam and Borneo — with a home-espresso dialer built in.

Check in at local cafes, add a photo of your cup, collect a custom digital stamp, and watch your passport (and badge shelf) fill up. The espresso dialer times your shots and keeps a recipe diary for dialing in beans.

> **v1.0** — no build step, no accounts, no tracking. Everything lives on your device.

---

## Features

### Passport
- Progress ring showing unique cafes visited vs. the whole directory
- Digital stamps generated per check-in: cafe monogram, area, month and year
- 10 achievements (First Sip, Cafe Crawler, District Hopper, Sweet Spot, and more)
- Recent-sip timeline with photo thumbnails
- Duplicate visits are allowed — every visit earns its own dated stamp

### Cafe directory
- 20 starter cafes across Brunei-Muara, Tutong and Belait, curated from public Brunei coffee guides
- Search by cafe, area, vibe, menu or district
- Area chips + favourites filter
- Add, edit and delete your own cafes
- One-tap Google Maps search for every cafe

### Check-in flow
- Photo proof from camera or gallery
- Client-side compression to max 800px at 0.7 JPEG quality before storage
- Drink quick-picks from the cafe's signature menu
- 5-star rating and tasting notes
- Animated stamp reveal, with any newly earned badges
- Quota guardrail: if storage is full, the visit is retried without the photo instead of failing silently

### Espresso dialer
- Shot timer with a dial progress ring, sweet-spot (25–32s) indicator and haptics
- Bean search across Brunei, Malaysian and Borneo roasters
- Dose / yield / ratio calculator
- Recipe log with grind setting, tasting notes, and delete
- Migrates recipes from the original single-file dialer (`espresso_history`)

### PWA & privacy
- Installable on iOS and Android from the browser
- Service worker caches the shell so the passport catalog and timer work offline
- Photos are compressed locally and **never uploaded**
- Export/import a JSON backup; reset wipes the device data

---

## Quick start

No bundler, no dependencies.

```bash
# from the project root
python -m http.server 8080
# or
npx serve .
```

Open <http://localhost:8080>. A local server is needed for the service worker; the app itself also runs when `index.html` is opened directly (offline caching stays off on `file://`).

---

## Project structure

```text
bah-ngupi/
├── index.html               App shell, tab containers, SVG icon sprite
├── manifest.json            PWA manifest (name, icons, shortcuts)
├── sw.js                    Offline app-shell cache
├── _headers                 Netlify security headers + CSP
├── vercel.json              Vercel security headers + caching
├── css/
│   └── style.css            Coffee-dark design system, mobile-first layout
├── js/
│   ├── utils.js             Escaping, storage, image compression, sheet/toast UI
│   ├── cafes.js             Starter Brunei cafe + coffee bean databases
│   ├── passport.js          Directory, check-ins, stamps, achievements
│   ├── dialer.js            Shot timer, bean picker, recipe log
│   └── app.js               Store, router, profile, import/export, PWA
├── assets/
│   └── icons/               Generated PNG icons + SVG favicon
└── tools/
    └── generate-icons.js    Dependency-free PNG icon generator
```

Scripts are classic `<script defer>` files sharing the `window.BN` namespace. That keeps the app working from the filesystem and avoids module/CORS surprises.

---

## Data model

All state is stored in `localStorage` under versioned keys:

| Key | Contents |
| --- | --- |
| `bn_custom_cafes_v1` | Cafes added by the user |
| `bn_visits_v1` | Check-ins: cafe id, ISO date, drink, notes, rating, compressed photo |
| `bn_favorites_v1` | Favourite cafe ids |
| `bn_profile_v1` | Passport name, home district, join date |
| `espresso_history` | Espresso recipes (kept compatible with the original dialer) |

The starter cafe list lives in `js/cafes.js` and is merged with custom cafes at runtime.

### Backup format

```json
{
  "app": "bah-ngupi",
  "version": 1,
  "exportedAt": "2026-10-26T08:00:00.000Z",
  "profile": { "name": "Aiman", "district": "Brunei-Muara", "joined": "..." },
  "customCafes": [],
  "favorites": [],
  "visits": [],
  "shots": []
}
```

Imports are validated and normalised before replacing state.

---

## Security & data integrity notes

- **XSS**: all user-controlled values are escaped with `BN.Utils.escapeHtml` before entering template strings. Dynamic text that goes through `textContent` is passed raw. No inline `onclick` handlers, so the CSP does not need `unsafe-inline` for scripts.
- **Image pipeline**: `compressImage()` draws the selected file to a canvas capped at 800px (long edge) and encodes JPEG at 0.7 quality. Typical output is 50–100 KB instead of 10–15 MB.
- **Storage**: every `localStorage` write goes through `writeJSON()` and is wrapped in `try/catch`. Quota failures are surfaced; check-ins retry without the photo.
- **CSP**: `default-src 'self'`, scripts only from self, images limited to self/data/blob. Google Maps opens as a normal top-level navigation, not an embedded script.
- **Photo data URLs** are validated on import (`data:image/jpeg|png|webp;base64`) and size-capped.
- **No third-party fonts or analytics** — the app is fully self-contained and offline-friendly.

> `style-src` allows `'unsafe-inline'` because cover gradients and timer progress use inline style properties. Scripts remain locked down.

---

## Deploy

### Netlify
Drag the folder into Netlify, or connect the repo. `_headers` applies HTTPS/HSTS (automatic), CSP and cache rules. There is no build command.

### Vercel
Import the repo and deploy as a static project. `vercel.json` mirrors the security and cache headers.

### Any static host
Upload the repository contents. Serve over HTTPS so the service worker and install prompt work. Do not rename `sw.js` without updating the registration in `js/app.js`.

---

## Regenerate icons

```bash
node tools/generate-icons.js
```

The script renders the coffee-bean passport mark with anti-aliasing and writes:

- `icon-192.png`
- `icon-512.png`
- `icon-maskable-512.png`
- `apple-touch-icon-180.png`
- `favicon-32.png`

---

## Starter directory credit

Cafe names and areas are curated from public Brunei coffee resources, including the **Brunei Coffee Trail** (Brunei Tourism, 2025 edition) and the **Explore Brunei** cafe directory. Listings intentionally use light detail because hours, menus and addresses change. Users can edit their own additions; seed entries can be supplemented via the "Add a cafe" flow.

No affiliation with any cafe or brand is implied.

---

## Browser support

Modern evergreen browsers (Chrome, Edge, Safari 16+, Firefox). PWA installation is supported on Chromium browsers and iOS Safari via Share → Add to Home Screen. `navigator.vibrate` is a progressive enhancement.

---

Made for Brunei coffee lovers. **Selamat ngupi.**

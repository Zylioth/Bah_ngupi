# Bah_ngupi

A cafe-hopping passport for Brunei. Check in at a cafe, add a photo of your cup, collect a digital
stamp — and time your espresso shots with the built-in dialer.

Everything runs in the browser. No account, no server, no build step, and the app keeps working
offline once it has loaded.

---

## What's inside

- **Passport** — your stamps, visit diary, badges and progress.
- **Explore** — 342 cafes (296 brands) across all four districts, with search, district filters and favourites.
- **Dialer** — espresso shot timer with a recipe log.
- **Profile** — your name and home district, plus backup export and import.

---

## Run it locally

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>.

Use a local server instead of double-clicking `index.html` — the service worker that makes the app
work offline only runs over http.

There is no `npm install` and no build step. Node is needed only to regenerate the cafe list or the
app icons.

---

## Where the cafes come from

Every cafe comes from **[bruneicoffeeplaces.com](https://bruneicoffeeplaces.com)**, a
community-maintained Brunei coffee directory. It is downloaded once and saved into the repo:

```bash
node tools/import-cafes.mjs
```

That rewrites `js/cafes-directory.js` and needs nothing installed (Node 18+). The app never fetches
cafes at runtime.

- **Never edit `js/cafes-directory.js` by hand** — the next run overwrites it.
- The importer skips closed cafes, drops pop-ups that have no location, and merges the one shop the
  source happens to list twice.
- **Missing cafe?** Add it in the app: Explore → **+**. It is saved on your device and marked
  "Added by you".
- Hours, price and menu stay blank for directory rows rather than being guessed. That is deliberate.

---

## Logos

Optional. Drop a 128px transparent PNG in `assets/logos/` named after the brand:

```
assets/logos/zus-coffee.png    → every ZUS Coffee branch
assets/logos/roasted-sip.png   → every Roasted Sip branch
```

Rerun the importer and every branch of that brand picks it up. Brands without a file show a
generated monogram instead, which is what most of the list does. Only two logos ship today, because
that is all that could be sourced cleanly.

Brand marks are trademarks of their owners and are used only to identify the business.

---

## Your data

Everything lives in this browser's `localStorage`. Nothing is uploaded anywhere.

| Key | What it holds |
| --- | --- |
| `bn_visits_v1` | Check-ins: cafe, date, drink, notes, rating, photo |
| `bn_favorites_v1` | Favourite cafe ids |
| `bn_custom_cafes_v1` | Cafes you added yourself |
| `bn_profile_v1` | Name, home district, join date |
| `espresso_history` | Espresso recipes |

Photos are compressed to 800px JPEG before saving. Because it is all local, clearing browser data
deletes it — use **Profile → Export** for a backup, and Import to restore it.

---

## Files

```
index.html              app shell: four views, icon sprite, sheets, modals
manifest.json           PWA metadata
sw.js                   offline cache — bump VERSION when you ship changes
css/style.css           all styling
js/utils.js             helpers: escaping, storage, image compression, toasts
js/cafes-directory.js   GENERATED cafe list — do not edit
js/cafes.js             coffee bean database
js/passport.js          explore list, check-ins, stamps, badges
js/dialer.js            espresso timer and recipe log
js/app.js               store, router, profile, import/export
assets/                 fonts, icons, logos
tools/import-cafes.mjs  regenerates the cafe list
tools/generate-icons.js regenerates the app icons
_headers, vercel.json   caching and security headers for Netlify / Vercel
```

Scripts load in a fixed order — `utils → cafes-directory → cafes → passport → dialer → app` — and
share one `window.BN` namespace. Keep that order.

---

## Making changes

Four rules that keep the app working:

1. **Escape everything you render.** Text goes through `U.escapeHtml()`. The page builds HTML from
   strings, and the Content Security Policy forbids inline `<script>` and `onclick`.
2. **A new saved field needs three edits:** the normaliser in `js/app.js`, plus `exportData` and
   `importData`. Miss them and backups silently drop the field.
3. **Bump `VERSION` in `sw.js`** whenever a change to `css/` or `js/` should reach existing users.
   Installed copies cache hard and will not refresh otherwise.
4. **Append new CSS to the end of `css/style.css`.** The file is layered and later rules win.

There are no automated tests. Before pushing, click through: passport stamps → explore search and
district filter → open a cafe → check in with a photo → stamp modal → profile stats → export and
import → dialer timer → save a shot.

---

## Deploy

Static hosting, nothing to configure.

- **Vercel** — import the repo, framework preset "Other", no build command, output directory `/`.
  `vercel.json` sets headers and caching.
- **Netlify** — publish directory `.`, no build command. `_headers` does the same job.

Long cache for `assets/`, short for `js/` and `css/`, no-store for `sw.js` — already configured in
both files.

---

## Credits

- Cafe directory: [bruneicoffeeplaces.com](https://bruneicoffeeplaces.com) — the list is their
  curation work, not ours.
- Fonts: Fraunces, Manrope and JetBrains Mono, self-hosted under the SIL Open Font License
  (`assets/fonts/OFL.txt`).
- Brand logos belong to their respective cafes.

Not affiliated with any cafe or brand.

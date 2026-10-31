/* ============================================================
   Bah_ngupi service worker
   Caches the app shell so the passport and espresso timer keep
   working with no mobile data. Cafe photos never leave the device.
   ============================================================ */
"use strict";

const VERSION = "2.1.1";
const CACHE = "bah-ngupi-v" + VERSION;

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/utils.js",
  "./js/cafes-directory.js",
  "./js/cafes.js",
  "./js/passport.js",
  "./js/dialer.js",
  "./js/app.js",
  "./assets/fonts/fraunces-latin.woff2",
  "./assets/fonts/manrope-latin.woff2",
  "./assets/fonts/jetbrains-mono-latin.woff2",
  "./assets/icons/icon.svg",
  "./assets/icons/favicon-32.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/apple-touch-icon-180.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || !response.ok) {
            throw new Error("Navigation request failed");
          }
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match("./index.html")) ||
            (await caches.match("./"))
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});

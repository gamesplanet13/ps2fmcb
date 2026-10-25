const CACHE_NAME = "games-planet-live-v12";
const APP_SHELL = [
  "./",
  "./index.html",
  "./Simple.html",
  "./order-prefill.html",
  "./invoice.html",
  "./manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_SHELL.map(async url => {
      const response = await fetch(url, { cache: "reload" });
      if (response.ok) await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(new Request(event.request, { cache: "no-store" }));
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
        return response;
      } catch (_) {
        return (await caches.match(event.request)) || (await caches.match("./index.html"));
      }
    })());
    return;
  }

  event.respondWith(fetch(new Request(event.request, { cache: "no-store" })).catch(() => caches.match(event.request)));
});

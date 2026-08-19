const CACHE_NAME="games-planet-live-v10";
const APP_SHELL=[
  "./","./index.html","./Simple.html","./order-prefill.html","./invoice.html","./manifest.webmanifest",
  "./assets/html2canvas.min.js","./assets/jspdf.umd.min.js",
  "./games-planet-logo-transparent.png","./games-planet-icon-192.png","./games-planet-icon-512.png",
  "./01-Current-ac-qr.jpg",
  "./images/jpeg/best-av-cable-for-ps2.jpeg","./images/png/best-av-cable-for-ps2.png",
  "./images/jpeg/av-component-connector.jpeg","./images/png/av-component-connector.png",
  "./images/jpeg/av-male-to-male-cable.jpeg","./images/png/av-male-to-male-cable.png"
];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  if(event.request.mode==="navigate"){
    event.respondWith(fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
      return response;
    }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match("./index.html"))));
    return;
  }
  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});

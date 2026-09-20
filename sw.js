/* Bump CACHE on every release. Changing this file is what triggers reinstall. */
const CACHE = "humwatch-3.1";
const SHELL = ["./", "./index.html", "./analyse.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", e => { if(e.data === "skipWaiting") self.skipWaiting(); });

/* Pages and scripts: network first, so a deploy actually reaches the browser.
   Icons and manifest: cache first, they rarely change and the name is versioned. */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const live = e.request.mode === "navigate" || /\.(html|js|webmanifest)$/.test(url.pathname);
  if (live) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
    );
  } else {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
  }
});

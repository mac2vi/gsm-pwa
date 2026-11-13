// App-shell service worker: the UI works offline; data lives in IndexedDB and syncs when online.
// The build replaces the two placeholder constants below (build id, list of files to precache).
// Strategy: network first (always revalidated, so a new deploy shows up immediately), cache as the offline fallback.
const CACHE = 'gsm-1794567920249';
const PRECACHE = ["app.css","app.js","icon-192.png","icon-512.png","icon-maskable-512.png","index.html","manifest.webmanifest","./"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE.map((p) => new Request(p, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('gsm-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // Google APIs etc. go straight to the network
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          void caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) => hit ?? (req.mode === 'navigate' ? caches.match('index.html') : Response.error())),
      ),
  );
});

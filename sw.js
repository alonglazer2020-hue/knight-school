// Knight School service worker: lets the site install as an app and open offline.
// Network first for the site's own files (so updates show up straight away), the saved copy when offline.
// Engine, voice models and APIs on other sites are left to the browser.
const CACHE = 'ks-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(r => r || caches.match('./'))));
});

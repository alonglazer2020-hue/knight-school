// Knight School service worker: lets the site install as an app and open offline.
// Network first for the site's own files (so updates show up straight away), the saved copy when offline.
// Engine, voice models and APIs on other sites are left to the browser.
const CACHE = 'ks-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // no-cache: ask the server every time (a cheap "not modified" when nothing changed), so a fix reaches phones at once
  // instead of after GitHub Pages' 10-minute browser cache. By URL because navigation requests can't take options.
  e.respondWith(fetch(req.url, { cache: 'no-cache' }).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(r => r || caches.match('./'))));
});

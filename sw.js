// Offline cache for ActivityPay Sales. Bump VERSION after editing any app file.
const VERSION = 'ap-calc-v6';
const SHELL = ['./', 'index.html', 'manifest.json', 'icons/icon.svg',
  'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Cache-first so the app opens instantly anywhere (the PC may be unreachable at a customer site).
// When the PC is reachable, a fresh copy is fetched in the background and used on the next launch.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(e.request, {ignoreSearch: true});
    const net = fetch(e.request).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; });
    if (cached) { e.waitUntil(net.catch(() => {})); return cached; }
    return net.catch(() => cache.match('index.html'));
  }));
});

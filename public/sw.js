// Laya Snapgrid Service Worker (Offline Support v__APP_VERSION__)
const CACHE_NAME = 'laya-snapgrid-v__APP_VERSION__';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Force fetching fresh app shell without HTTP cache on install
      const indexResponse = await fetch('/index.html', { cache: 'no-cache' });
      if (!indexResponse.ok) {
        throw new Error(`Unable to cache app shell: ${indexResponse.status}`);
      }
      const html = await indexResponse.clone().text();
      const appAssets = Array.from(
        html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g),
        match => new URL(match[1], self.location.origin).href
      );
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/index.html', indexResponse);
      await cache.addAll([...ASSETS_TO_CACHE.filter(asset => asset !== '/index.html'), ...appAssets]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // 1. Navigation / HTML Requests: Network-First with Cache Fallback
  // Guarantees that online users immediately receive new releases without needing
  // to clear browser data, unregister the service worker, or reinstall.
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put('/index.html', networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html') || await caches.match('/');
          return cached || new Response('Offline - Laya Snapgrid', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, SVGs, Fonts): Cache-First with Network Fallback
  // Immutable hashed assets load instantly from cache, falling back to network.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});

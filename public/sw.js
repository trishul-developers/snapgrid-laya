// Laya Snapgrid Service Worker (Offline Support v0.3.1)
const CACHE_NAME = 'laya-snapgrid-v0.3.1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const indexResponse = await fetch('/index.html');
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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
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
      }).catch(() => {
        // Fallback to cached index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

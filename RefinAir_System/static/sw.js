// RefinAir Service Worker - PWA Offline Caching & Performance
const CACHE_NAME = 'refinair-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/static/css/style.css',
  '/static/js/app.js',
  '/static/js/telemetry.js',
  '/static/js/classroom_twin.js',
  '/static/js/ml_dashboard.js',
  '/static/js/map.js',
  '/static/js/export_manager.js',
  '/static/js/mobile.js',
  '/static/manifest.json',
  '/static/images/refinair_logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Continue even if some individual assets fail to cache
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network first, falling back to cache for API requests; Cache first for static assets
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).then((networkResponse) => {
          if (event.request.method === 'GET' && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
    );
  }
});

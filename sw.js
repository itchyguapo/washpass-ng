const CACHE_NAME = 'washpass-v1';
const ASSETS_TO_CACHE = [
  './dashboard.html',
  './assets/css/styles.css',
  './assets/css/mobile-app.css',
  './assets/js/app-router.js',
  './assets/js/dashboard.js',
  './assets/js/auth.js',
  './assets/images/pwa-icon.png'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => {
          return name !== CACHE_NAME;
        }).map(name => {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', event => {
  // Try network first, fall back to cache for local assets
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

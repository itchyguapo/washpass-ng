const CACHE_NAME = 'washpass-v2';
const ASSETS_TO_CACHE = [
  './dashboard.html',
  './partner-dashboard.html',
  './admin-panel.html',
  './assets/css/styles.css',
  './assets/css/mobile-app.css',
  './assets/js/app-router.js',
  './assets/js/dashboard.js',
  './assets/js/auth.js',
  './assets/js/partner-dashboard.js',
  './assets/js/admin-panel.js',
  './assets/images/pwa-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Network-first for application logic and HTML
  if (ASSETS_TO_CACHE.some(path => event.request.url.includes(path.replace('./', '')))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Stale-while-revalidate for other assets (images, etc)
    event.respondWith(
      caches.match(event.request).then(cached => {
        const networked = fetch(event.request).then(res => {
          const cloned = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
          return res;
        });
        return cached || networked;
      })
    );
  }
});

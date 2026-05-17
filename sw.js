const CACHE_NAME = 'fleet-merits-v8';
const urlsToCache = [
  './',
  './index.html',
  './pages/encode.html',
  './pages/admin.html',
  './pages/feedback.html',
  './js/config.js',
  './js/auth.js',
  './pages/about.html',
  './manifest.json',
  './logo.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Always get fresh HTML - never cache
  if (event.request.url.includes('.html') || event.request.url.endsWith('/') || event.request.url.includes('index')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html');
      })
    );
  } else if (event.request.url.includes('supabase') || event.request.url.includes('googleapis') || event.request.url.includes('jsdelivr')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
// VoiceIntro AI - Service Worker (Cache Buster & Auto-Clean)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((name) => caches.delete(name)));
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.registration.unregister();
    })
  );
});

// Always pass through directly to network
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

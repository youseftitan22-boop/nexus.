// Nexus Service Worker (Self-Clearing Pass-Through)
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});

// Any fetch bypasses worker completely
self.addEventListener('fetch', () => {
  // Pass through directly to network
});


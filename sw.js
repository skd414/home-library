// Minimal Network-Only Service Worker to enable Android & Windows App Installation
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  // Always use live internet connection
  e.respondWith(fetch(e.request));
});

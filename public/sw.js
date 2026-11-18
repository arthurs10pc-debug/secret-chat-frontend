// Progressive Web App Service Worker with Push Notifications & Offline Caching
const CACHE_NAME = 'stealth-chat-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first fetch handler for PWA installability
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Don't intercept socket.io, WebRTC or cross-origin API calls
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/socket.io/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Background Push Notifications (Stealth Disguised Mask)
self.addEventListener('push', (event) => {
  let title = 'System Update Available';
  let body = 'Tap to review system performance.';

  if (event.data) {
    try {
      const data = event.data.json();
      // If server sent explicit stealth masked alert, use it; otherwise use safe system masked defaults
      title = data.isStealthMasked ? data.title : (data.title || 'System Update Available');
      body = data.isStealthMasked ? data.body : (data.body || 'Tap to optimize battery & security settings.');
    } catch (e) {
      // Default stealth mask to ensure zero suspicion on screen
      title = 'System Update Available';
      body = 'Tap to review system performance.';
    }
  }

  const options = {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [150, 80, 150],
    tag: 'stealth_background_alert',
    renotify: true,
    data: { url: '/' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

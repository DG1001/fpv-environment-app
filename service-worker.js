// Service Worker für die First-Person-View Umgebungs-App
const CACHE_NAME = 'fpv-environment-app-v1';
const RESOURCES_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/gps.js',
  '/js/compass.js',
  '/js/map.js',
  '/js/render.js',
  '/manifest.json'
];

// Service Worker installieren und Ressourcen cachen
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache geöffnet');
        return cache.addAll(RESOURCES_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Service Worker aktivieren und alte Caches löschen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Alter Cache wird gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch-Ereignisse abfangen und gecachte Ressourcen verwenden
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache-Hit - Ressource aus dem Cache zurückgeben
        if (response) {
          return response;
        }

        // Kein Cache-Hit - Ressource vom Netzwerk abrufen
        return fetch(event.request).then(
          (response) => {
            // Prüfen, ob wir eine gültige Antwort erhalten haben
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Antwort klonen, da sie nur einmal verwendet werden kann
            const responseToCache = response.clone();

            // Antwort im Cache speichern
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(() => {
        // Bei Netzwerkfehlern eine Offline-Seite anzeigen
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
  );
});

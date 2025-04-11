const CACHE_NAME = 'ressourcen-imperium-v1';
const ASSETS_TO_CACHE = [
    '/Game2/',
    '/Game2/index.html',
    '/Game2/assets/css/styles.css',
    '/Game2/assets/js/app.js',
    '/Game2/assets/js/gameConfig.js',
    '/Game2/manifest.json'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
    console.log('Service Worker wird installiert...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache geöffnet');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('Alle Assets gecached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Cache-Fehler:', error);
            })
    );
});

// Service Worker Aktivierung
self.addEventListener('activate', (event) => {
    console.log('Service Worker wird aktiviert...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Alter Cache wird gelöscht:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker ist jetzt aktiv');
                return self.clients.claim();
            })
    );
});

// Fetch Event Handling
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest)
                    .then((response) => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Wenn offline und Ressource nicht im Cache
                        console.log('Offline-Modus: Ressource nicht verfügbar');
                        return new Response('Offline: Ressource nicht verfügbar');
                    });
            })
    );
});

// Spielstand-Synchronisation
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-gamestate') {
        event.waitUntil(
            syncGameState()
        );
    }
});

// Benachrichtigungen
self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: '/Game2/assets/icons/favicon-32x32.png',
        badge: '/Game2/assets/icons/favicon-16x16.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('Ressourcen-Imperium', options)
    );
});

// Benachrichtigungs-Klick-Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/Game2/')
    );
});

// Periodische Synchronisation
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-gamestate') {
        event.waitUntil(
            updateGameState()
        );
    }
});

// Hilfsfunktionen

async function syncGameState() {
    try {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_REQUIRED'
            });
        });
        console.log('Spielstand-Synchronisation angefordert');
    } catch (error) {
        console.error('Sync fehlgeschlagen:', error);
    }
}

async function updateGameState() {
    try {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'UPDATE_REQUIRED'
            });
        });
        console.log('Spielstand-Update angefordert');
    } catch (error) {
        console.error('Update fehlgeschlagen:', error);
    }
}

// Offline-Funktionalität
async function handleOffline() {
    const cache = await caches.open(CACHE_NAME);
    try {
        const offlineResponse = new Response(
            '<html><body><h1>Offline</h1><p>Das Spiel ist momentan offline.</p></body></html>',
            {
                headers: { 'Content-Type': 'text/html' }
            }
        );
        await cache.put('/Game2/offline', offlineResponse);
        return offlineResponse;
    } catch (error) {
        console.error('Offline-Handling fehlgeschlagen:', error);
        return new Response('Offline: Keine Verbindung möglich');
    }
}

// Cache-Management
async function updateCache() {
    const cache = await caches.open(CACHE_NAME);
    try {
        await cache.addAll(ASSETS_TO_CACHE);
        console.log('Cache erfolgreich aktualisiert');
    } catch (error) {
        console.error('Cache-Aktualisierung fehlgeschlagen:', error);
    }
}

// Periodische Cache-Aktualisierung
setInterval(() => {
    updateCache();
}, 24 * 60 * 60 * 1000); // Einmal täglich

// Error-Handling
self.addEventListener('error', (event) => {
    console.error('Service Worker Fehler:', event.error);
});

// Unhandled Promise Rejection Handling
self.addEventListener('unhandledrejection', (event) => {
    console.error('Unbehandelte Promise-Ablehnung:', event.reason);
});

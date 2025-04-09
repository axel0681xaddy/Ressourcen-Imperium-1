/**
 * @fileoverview Service Worker für Progressive Web App Funktionalität
 * @author Ressourcen-Imperium Team
 */

const CACHE_NAME = 'ressourcen-imperium-v1';
const OFFLINE_URL = '/offline.html';

// Assets die beim Installieren gecacht werden sollen
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/config/gameConfig.js',
    '/js/core/gameLoop.js',
    '/js/managers/ResourceManager.js',
    '/js/managers/UpgradeManager.js',
    '/js/managers/AchievementManager.js',
    '/js/managers/SaveManager.js',
    '/js/managers/UIManager.js',
    '/assets/icons/favicon.png',
    '/assets/icons/wood.png',
    '/assets/icons/stone.png',
    '/assets/icons/tools.png',
    '/assets/icons/building.png',
    '/assets/icons/settings.png',
    '/assets/icons/save.png',
    '/assets/sounds/click.mp3',
    '/assets/sounds/upgrade.mp3',
    '/assets/sounds/achievement.mp3',
    '/assets/sounds/error.mp3',
    '/assets/fonts/game-font.woff2'
];

// Installation des Service Workers
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            // Cache alle definierten Assets
            caches.open(CACHE_NAME).then(cache => {
                console.log('Caching app assets');
                return cache.addAll(PRECACHE_ASSETS);
            }),
            
            // Aktiviere sofort ohne auf alte Instanzen zu warten
            self.skipWaiting()
        ])
    );
});

// Aktivierung des Service Workers
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            // Lösche alte Cache-Versionen
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => caches.delete(cacheName))
                );
            }),
            
            // Übernimm sofort die Kontrolle über alle Clients
            self.clients.claim()
        ])
    );
});

// Abfangen von Fetch-Requests
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    // Cache hit - return response
                    return response;
                }

                return fetch(event.request)
                    .then(response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the new resource
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(error => {
                        // Check if the user is offline
                        if (event.request.mode === 'navigate') {
                            return caches.match(OFFLINE_URL);
                        }
                        
                        console.error('Fetch failed:', error);
                        throw error;
                    });
            })
    );
});

// Background Sync für Offline-Speicherung
self.addEventListener('sync', event => {
    if (event.tag === 'sync-saves') {
        event.waitUntil(syncSavedGames());
    }
});

// Push Notifications
self.addEventListener('push', event => {
    if (!event.data) return;

    const notification = event.data.json();
    
    event.waitUntil(
        self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: '/assets/icons/favicon.png',
            badge: '/assets/icons/notification-badge.png',
            data: notification.data
        })
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({
            type: 'window'
        })
        .then(clientList => {
            // Fokussiere existierendes Fenster oder öffne neues
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

/**
 * Synchronisiert gespeicherte Spielstände
 * @returns {Promise} Promise der Sync-Operation
 */
async function syncSavedGames() {
    try {
        const savedGames = await getSavedGamesFromIDB();
        
        for (const save of savedGames) {
            await fetch('/api/save-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(save)
            });
        }

        await clearSavedGamesFromIDB();
        
    } catch (error) {
        console.error('Sync failed:', error);
        throw error;
    }
}

/**
 * Holt gespeicherte Spielstände aus IndexedDB
 * @returns {Promise<Array>} Array von gespeicherten Spielständen
 */
async function getSavedGamesFromIDB() {
    // Implementierung für IndexedDB Zugriff
    return [];
}

/**
 * Löscht synchronisierte Spielstände aus IndexedDB
 * @returns {Promise} Promise der Lösch-Operation
 */
async function clearSavedGamesFromIDB() {
    // Implementierung für IndexedDB Löschung
    return Promise.resolve();
}

/**
 * Periodische Cache-Bereinigung
 */
async function periodicCacheCleanup() {
    const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 1 Woche
    
    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();
        const now = Date.now();

        for (const request of requests) {
            const response = await cache.match(request);
            const headers = new Headers(response.headers);
            const dateHeader = headers.get('date');

            if (dateHeader) {
                const cacheAge = now - new Date(dateHeader).getTime();
                if (cacheAge > MAX_CACHE_AGE) {
                    await cache.delete(request);
                }
            }
        }
    } catch (error) {
        console.error('Cache cleanup failed:', error);
    }
}

// Führe Cache-Bereinigung periodisch durch
setInterval(periodicCacheCleanup, 24 * 60 * 60 * 1000); // Einmal täglich

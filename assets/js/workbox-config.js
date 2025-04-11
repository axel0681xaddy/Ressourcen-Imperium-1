module.exports = {
  // Ausgabeverzeichnis für den Service Worker
  swDest: 'dist/service-worker.js',

  // Quellverzeichnis
  globDirectory: 'dist',

  // Zu cachende Dateien
  globPatterns: [
    '**/*.{html,js,css,png,jpg,jpeg,gif,svg,woff,woff2,eot,ttf,otf,ico}'
  ],

  // Zu ignorierende Dateien/Verzeichnisse
  globIgnores: [
    'node_modules/**/*',
    '*.map',
    'asset-manifest.json',
    'service-worker.js',
    'workbox-*.js'
  ],

  // Cache-ID
  cacheId: 'ressourcen-imperium-v1',

  // Nicht den Service Worker selbst cachen
  skipWaiting: true,
  clientsClaim: true,

  // Offline-Fallback
  offlineGoogleAnalytics: true,

  // Runtime Caching Regeln
  runtimeCaching: [
    // API-Aufrufe
    {
      urlPattern: /^https:\/\/lamp\.deinfo-projects\.de\/Game2\/api/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 72 * 60 * 60 // 72 Stunden
        },
        cacheableResponse: {
          statuses: [0, 200]
        },
        networkTimeoutSeconds: 10
      }
    },

    // Bilder
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Tage
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },

    // Fonts
    {
      urlPattern: /\.(?:woff|woff2|eot|ttf|otf)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'font-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 Jahr
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },

    // CSS und JavaScript
    {
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 24 * 60 * 60 // 24 Stunden
        }
      }
    },

    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets'
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 Jahr
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ],

  // Navigation Preload
  navigationPreload: true,

  // Cache-Namen für verschiedene Ressourcentypen
  cacheNames: {
    prefix: 'ressourcen-imperium',
    suffix: 'v1',
    precache: 'precache',
    runtime: 'runtime'
  },

  // Debugging
  debug: process.env.NODE_ENV === 'development',

  // Manifest-Generierung
  manifestTransforms: [
    (manifestEntries) => {
      const manifest = manifestEntries.map(entry => {
        // Füge Cache-Busting-Parameter hinzu
        if (entry.url.match(/\.(js|css)$/)) {
          entry.url = `${entry.url}?v=${Date.now()}`;
        }
        return entry;
      });
      return { manifest };
    }
  ],

  // Benutzerdefinierte Routing
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [/^\/api/, /^\/admin/],

  // Benutzerdefinierte Plugins
  injectManifest: {
    swSrc: 'src/service-worker.js',
    swDest: 'dist/service-worker.js',
    injectionPoint: 'self.__WB_MANIFEST'
  },

  // Workbox-Module
  mode: process.env.NODE_ENV,
  modules: [
    'workbox-core',
    'workbox-routing',
    'workbox-strategies',
    'workbox-expiration',
    'workbox-cacheable-response',
    'workbox-navigation-preload',
    'workbox-background-sync',
    'workbox-broadcast-update',
    'workbox-offline-analytics'
  ]
};

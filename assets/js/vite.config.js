import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  // Lade Umgebungsvariablen basierend auf dem Modus
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Basis-URL für Produktions-Builds
    base: '/Game2/',

    // Quellverzeichnis
    root: 'src',

    // Build-Konfiguration
    build: {
      // Ausgabeverzeichnis
      outDir: '../dist',
      
      // Assets-Verzeichnis
      assetsDir: 'assets',
      
      // Source Maps nur in Entwicklung
      sourcemap: mode === 'development',
      
      // Chunk-Größen-Warnung
      chunkSizeWarningLimit: 1000,
      
      // Rollup-Optionen
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'src/index.html'),
          offline: path.resolve(__dirname, 'src/offline.html'),
        },
        output: {
          manualChunks: {
            vendor: ['lodash', 'date-fns', 'uuid'],
            game: [
              './src/core/gameLoop.js',
              './src/managers/ResourceManager.js',
              './src/managers/UpgradeManager.js',
            ],
          },
          // Asset-Dateinamen
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          // Chunk-Dateinamen
          chunkFileNames: 'assets/js/[name]-[hash].js',
          // Entry-Dateinamen
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      
      // Optimierungen
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
    },

    // Entwicklungsserver-Konfiguration
    server: {
      port: 3000,
      open: true,
      cors: true,
      host: true,
      proxy: {
        '/api': {
          target: env.API_URL || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    // Preview-Server-Konfiguration
    preview: {
      port: 4173,
      open: true,
    },

    // Auflösung von Imports
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@managers': path.resolve(__dirname, 'src/managers'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@assets': path.resolve(__dirname, 'src/assets'),
      },
    },

    // Plugins
    plugins: [
      // Legacy-Browser-Unterstützung
      legacy({
        targets: ['defaults', 'not IE 11'],
      }),
      
      // PWA-Plugin
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'Ressourcen-Imperium',
          short_name: 'Ressourcen',
          description: 'Ein Browser-basiertes Ressourcen-Management-Spiel',
          theme_color: '#4CAF50',
          background_color: '#121212',
          icons: [
            {
              src: 'assets/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'assets/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Jahr
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],

    // Optimierungen
    optimizeDeps: {
      include: ['lodash', 'date-fns', 'uuid'],
      exclude: ['fsevents'],
    },

    // CSS-Konfiguration
    css: {
      devSourcemap: true,
      modules: {
        scopeBehaviour: 'local',
        localsConvention: 'camelCase',
      },
      postcss: {
        plugins: [
          require('autoprefixer'),
          mode === 'production' && require('cssnano')({
            preset: 'default',
          }),
        ].filter(Boolean),
      },
    },

    // Esbuild-Konfiguration
    esbuild: {
      jsxInject: `import React from 'react'`,
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
    },

    // Logging-Konfiguration
    logLevel: mode === 'development' ? 'info' : 'warn',
  };
});

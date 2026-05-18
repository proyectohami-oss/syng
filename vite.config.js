import { defineConfig } from 'vite'
import react            from '@vitejs/plugin-react'
import { VitePWA }      from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      strategies:   'generateSW',
      filename:     'sw.js',

      manifest: {
        name:             'Syng',
        short_name:       'Syng',
        description:      'Tareas y colaboración en tiempo real',
        start_url:        '/agenda',
        scope:            '/',
        display:          'standalone',
        orientation:      'portrait',
        background_color: '#ffffff',
        theme_color:      '#5B3DF6',   // morado Syng (antes era azul viejo)
        lang:             'es-MX',
        categories:       ['productivity', 'utilities'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src:     '/icon-512.png',
            sizes:   '512x512',
            type:    'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns:    ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores:     ['firebase-messaging-sw.js'],
        skipWaiting:     true,
        clientsClaim:    true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler:    'StaleWhileRevalidate',
            options: {
              cacheName:         'google-fonts-stylesheets',
              expiration:        { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      devOptions: {
        enabled: false,
        type:    'module',
      },
    }),
  ],

  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
})

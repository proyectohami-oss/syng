import { defineConfig } from 'vite'
import react            from '@vitejs/plugin-react'
import { VitePWA }      from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies:   'injectManifest',
      srcDir:       'src',
      filename:     'sw-v2.js',

      manifest: {
        name:             'Syng',
        short_name:       'Syng',
        description:      'Tareas y colaboración en tiempo real',
        start_url:        '/',
        scope:            '/',
        display:          'standalone',
        orientation:      'portrait',
        background_color: '#0A0A0A',
        theme_color:      '#0A0A0A',
        lang:             'es-MX',
        categories:       ['productivity', 'utilities'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },

      injectManifest: {
        globPatterns:    ['**/*.{js,css,ico,png,svg,woff2}'],
        globIgnores:     ['firebase-messaging-sw.js'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },

      devOptions: { enabled: false, type: 'module' },
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

  server: {
    proxy: {
      '/__/auth': {
        target:       'https://syng-app.firebaseapp.com',
        changeOrigin: true,
        secure:       true,
      },
      '/api/checkout': {
        target:       'https://us-central1-syng-app.cloudfunctions.net',
        changeOrigin: true,
        secure:       true,
        rewrite:      () => '/createMercadoPagoCheckout',
      },
    },
  },
})

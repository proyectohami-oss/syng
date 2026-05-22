import { defineConfig } from 'vite'
import react            from '@vitejs/plugin-react'
import { VitePWA }      from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies:   'injectManifest',
      srcDir:       'src',
      filename:     'sw.js',

      manifest: {
        name:             'Syng',
        short_name:       'Syng',
        description:      'Tareas y colaboración en tiempo real',
        start_url:        '/',
        scope:            '/',
        display:          'standalone',
        orientation:      'portrait',
        background_color: '#ffffff',
        theme_color:      '#5B3DF6',
        lang:             'es-MX',
        categories:       ['productivity', 'utilities'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },

      injectManifest: {
        globPatterns:    ['**/*.{js,css,html,ico,png,svg,woff2}'],
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
})

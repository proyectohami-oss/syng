/**
 * PWA service worker registration.
 *
 * Vite Plugin PWA generates /sw.js at build time using Workbox.
 * In development, the plugin provides a dev server that simulates the SW.
 *
 * This module is the ONLY place in the codebase that knows about the SW.
 * It is imported once in main.jsx and never referenced elsewhere.
 *
 * FCM INTEGRATION (future):
 *   The messaging service worker (firebase-messaging-sw.js) is a SEPARATE
 *   file registered by Firebase automatically when FCM is initialized.
 *   It does NOT go through this registration path.
 *   Two service workers can coexist: one for Workbox/cache, one for FCM.
 */

export function registerSW() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) {
    console.info('[SW] Service workers not supported in this browser')
    return
  }

  // Vite Plugin PWA injects the virtual module 'virtual:pwa-register'
  // at build time. In dev mode it's a no-op provided by the plugin.
  // Using dynamic import so the dev server doesn't fail if the plugin
  // isn't configured yet.
  import('virtual:pwa-register')
    .then(({ registerSW: vitePwaRegister }) => {
      vitePwaRegister({
        // Re-check for SW updates every hour
        onRegisteredSW(swUrl, registration) {
          console.debug('[SW] Registered:', swUrl)
          if (!registration) return
          setInterval(() => {
            registration.update().catch(() => {})
          }, 60 * 60 * 1000)
        },
        onNeedRefresh() {
          // App has a new version available.
          // Could dispatch to a context to show a "Update available" banner.
          // For now: silent. Never force-reload — it could interrupt a write.
          console.info('[SW] New version available — reload when ready')
        },
        onOfflineReady() {
          console.info('[SW] App ready for offline use')
        },
        onRegisterError(error) {
          console.error('[SW] Registration failed:', error)
        },
      })
    })
    .catch(() => {
      // virtual:pwa-register not available (plugin not installed or disabled)
      // App still works — just without the Workbox cache layer
      console.debug('[SW] vite-plugin-pwa not configured — skipping SW registration')
    })
}

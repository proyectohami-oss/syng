/**
 * Service Worker PWA — solo caché offline (Workbox).
 * Push/notificaciones → firebase-messaging-sw.js
 */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

self.skipWaiting()
self.clients.claim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  new NavigationRoute(
    new NetworkFirst({ cacheName: 'navigation', networkTimeoutSeconds: 3 }),
  ),
)

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

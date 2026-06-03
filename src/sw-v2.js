import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

self.skipWaiting()
self.clients.claim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// index.html siempre desde red — garantiza que el bundle nuevo llega
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'navigation',
      networkTimeoutSeconds: 3,
    })
  )
)

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('push', event => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { data = { title: 'Syng', body: event.data.text() } }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Syng', {
      body:     data.body || '',
      icon:     data.icon || '/icon-192.png',
      badge:    '/icon-192.png',
      vibrate:  [200, 100, 200],
      tag:      'syng-notif',
      renotify: true,
      data:     { url: data.url || '/' }
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('syng-psi.vercel.app') && 'focus' in client) {
          client.focus()
          return client.navigate(url)
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

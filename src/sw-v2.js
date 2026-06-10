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
  let payload = {}
  try { payload = event.data.json() } catch { payload = { data: { body: event.data.text() } } }

  const title  = payload.notification?.title || payload.data?.title || 'Syng'
  const body   = payload.notification?.body  || payload.data?.body  || ''
  const url    = payload.data?.url || payload.fcmOptions?.link || '/'
  const taskId = payload.data?.taskId || ''

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:     payload.notification?.icon || '/icon-192.png',
      badge:    '/icon-192.png',
      vibrate:  [200, 100, 200],
      tag:      taskId ? `syng-reminder-${taskId}` : 'syng-notif',
      renotify: true,
      requireInteraction: true,
      data:     { url, taskId },
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
      if (clients.openWindow) return clients.openWindow('/?redirect=' + encodeURIComponent(url))
    })
  )
})

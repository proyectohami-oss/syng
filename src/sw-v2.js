/**
 * Service Worker PWA — caché + push (scope /).
 * Universo B: iOS PWA requiere que el SW con scope / reciba el push.
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
    new NetworkFirst({ cacheName: 'navigation', networkTimeoutSeconds: 5 }),
  ),
)

function syngDataFrom(payload) {
  if (!payload) return {}
  if (payload.data && typeof payload.data === 'object') return payload.data
  return payload
}

function syngPathFrom(data) {
  if (data?.url) {
    if (data.url.startsWith('http')) {
      try { return new URL(data.url).pathname } catch { return '/agenda' }
    }
    return data.url
  }
  if (data?.taskId) return '/recordatorio/' + data.taskId
  return '/agenda'
}

function syngShow(title, body, data) {
  const taskId = data?.taskId || ''
  const url    = syngPathFrom(data)
  return self.registration.showNotification(title || '⏰ Syng', {
    body:  body || '',
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    tag:   taskId ? 'syng-' + taskId : 'syng-notif',
    renotify: true,
    data:  { url, taskId },
  })
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let payload = {}
    try {
      if (event.data) payload = event.data.json()
    } catch { /* ignore */ }
    const d = syngDataFrom(payload)
    await syngShow(d.title, d.body, d)
  })())
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
  if (event.data?.type !== 'SHOW_NOTIFICATION') return
  const { title, body, url, taskId } = event.data
  event.waitUntil(syngShow(title, body, { url, taskId }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = event.notification.data?.url || '/agenda'
  const abs  = self.location.origin + path
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.focus()
          if ('navigate' in c) return c.navigate(abs)
          return
        }
      }
      return clients.openWindow(self.location.origin + '/?redirect=' + encodeURIComponent(path))
    }),
  )
})

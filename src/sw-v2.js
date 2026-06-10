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

  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, url, taskId } = event.data
    event.waitUntil(
      self.registration.showNotification(title || '⏰ Recordatorio', {
        body: body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: taskId ? `syng-reminder-${taskId}` : 'syng-notif',
        renotify: true,
        requireInteraction: true,
        silent: false,
        data: { url: url || '/agenda', taskId: taskId || '' },
      })
    )
  }
})

self.addEventListener('push', event => {
  if (!event.data) return
  let payload = {}
  try { payload = event.data.json() } catch { payload = { data: { body: event.data.text() } } }

  const data   = payload.data || {}
  const title  = data.title || payload.notification?.title || '⏰ Recordatorio'
  const body   = data.body  || payload.notification?.body  || ''
  const taskId = data.taskId || ''
  let url      = data.url || (taskId ? `/recordatorio/${taskId}` : '/agenda')
  if (url.startsWith('http')) {
    try { url = new URL(url).pathname } catch { url = '/agenda' }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:     '/icon-192.png',
      badge:    '/icon-192.png',
      vibrate:  [200, 100, 200],
      tag:      taskId ? `syng-reminder-${taskId}` : 'syng-notif',
      renotify: true,
      requireInteraction: true,
      silent: false,
      data:     { url, taskId },
    })
  )
})

function openUrl(url) {
  let path = url
  if (url.startsWith('http')) {
    try { path = new URL(url).pathname + new URL(url).search } catch { path = '/agenda' }
  }
  const absolute = self.location.origin + path
  return clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const client of list) {
      if ('focus' in client) {
        client.focus()
        if ('navigate' in client) return client.navigate(absolute)
        return
      }
    }
    const openTarget = `${self.location.origin}/?redirect=${encodeURIComponent(path)}`
    if (clients.openWindow) return clients.openWindow(openTarget)
  })
}

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/agenda'
  event.waitUntil(openUrl(url))
})

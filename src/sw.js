import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

self.skipWaiting()
self.clients.claim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

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
      data:     { url: '/' }
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('syng-psi.vercel.app') && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})

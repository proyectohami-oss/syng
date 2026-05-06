const CACHE = 'syng-v1748'
self.addEventListener('install', e => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))
self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))))

self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  const title = data.notification?.title || 'Syng'
  const body = data.notification?.body || 'Tienes pendientes para hoy'
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: 'https://syng-psi.vercel.app' }
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'))
})

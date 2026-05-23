const CACHE = 'syng-v1748'
self.addEventListener('install', e => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))
self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))))

self.addEventListener('push', e => {
  let title = 'Syng 📅'
  let body = 'Tienes pendientes para hoy'
  try {
    const data = e.data?.json()
    if (data?.notification?.title) title = data.notification.title
    if (data?.notification?.body) body = data.notification.body
  } catch(err) {
    const text = e.data?.text() || ''
    if (text) body = text
  }
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

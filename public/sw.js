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

// ── Firebase Messaging ──
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyC8Ym6HJBerYK5ke6lCiRM32mx7ei2Dn78",
  authDomain: "syng-app.firebaseapp.com",
  projectId: "syng-app",
  storageBucket: "syng-app.firebasestorage.app",
  messagingSenderId: "751348580546",
  appId: "1:751348580546:web:9bfede4680f4589e367b5b"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {}
  self.registration.showNotification(title || 'Syng', {
    body: body || 'Tienes pendientes para hoy',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: 'https://syng-psi.vercel.app' }
  })
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'))
})

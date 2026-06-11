/**
 * Service Worker FCM — push y taps en Syng (iOS PWA + web).
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            'AIzaSyC8Ym6HJBerYK5ke6lCiRM32mx7ei2Dn78',
  authDomain:        'syng-app.firebaseapp.com',
  projectId:         'syng-app',
  storageBucket:     'syng-app.firebasestorage.app',
  messagingSenderId: '751348580546',
  appId:             '1:751348580546:web:9bfede4680f4589e367b5b',
})

const messaging = firebase.messaging()

function pathFrom(data) {
  if (data?.url) {
    if (data.url.startsWith('http')) {
      try { return new URL(data.url).pathname } catch { return '/agenda' }
    }
    return data.url
  }
  if (data?.taskId) return '/recordatorio/' + data.taskId
  return '/agenda'
}

function show(title, body, data) {
  const taskId = data?.taskId || ''
  const url    = pathFrom(data)
  return self.registration.showNotification(title, {
    body: body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: taskId ? 'syng-reminder-' + taskId : 'syng-notif',
    renotify: true,
    requireInteraction: true,
    data: { url, taskId },
  })
}

function handlePayload(payload) {
  const d = payload?.data || {}
  return show(
    d.title || payload?.notification?.title || '⏰ Recordatorio',
    d.body  || payload?.notification?.body  || '',
    d,
  )
}

messaging.onBackgroundMessage(handlePayload)

// iOS a veces entrega por push event en lugar de onBackgroundMessage
self.addEventListener('push', function(event) {
  if (!event.data) return
  try {
    event.waitUntil(handlePayload(event.data.json()))
  } catch (_) {}
})

self.addEventListener('message', function(e) {
  if (e.data?.type !== 'SHOW_NOTIFICATION') return
  const { title, body, url, taskId } = e.data
  e.waitUntil(show(title, body, { url, taskId }))
})

self.addEventListener('notificationclick', function(e) {
  e.notification.close()
  const path = e.notification.data?.url || '/agenda'
  const abs  = self.location.origin + path
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
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

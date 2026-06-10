/* Service Worker FCM — iOS requiere este archivo para recibir push. */
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

function recordatorioPath(data) {
  if (data?.url) {
    if (data.url.startsWith('http')) {
      try { return new URL(data.url).pathname } catch { return '/agenda' }
    }
    return data.url
  }
  if (data?.taskId) return '/recordatorio/' + data.taskId
  return '/agenda'
}

function showNotif(title, body, data) {
  const taskId = data?.taskId || ''
  const url    = recordatorioPath(data)
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

messaging.onBackgroundMessage(function(payload) {
  const data  = payload.data || {}
  const title = payload.notification?.title || data.title || '⏰ Recordatorio'
  const body  = payload.notification?.body  || data.body  || ''
  return showNotif(title, body, data)
})

self.addEventListener('message', function(event) {
  if (event.data?.type !== 'SHOW_NOTIFICATION') return
  const { title, body, url, taskId } = event.data
  event.waitUntil(showNotif(title, body, { url, taskId }))
})

self.addEventListener('push', function(event) {
  if (!event.data) return
  let payload = {}
  try { payload = event.data.json() } catch { return }
  const data  = payload.data || payload
  const title = data.title || payload.notification?.title || '⏰ Recordatorio'
  const body  = data.body  || payload.notification?.body  || ''
  event.waitUntil(showNotif(title, body, data))
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  const url  = event.notification.data?.url || '/agenda'
  const path = url.startsWith('http') ? (new URL(url).pathname) : url
  const absolute = self.location.origin + path
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (const client of list) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client) return client.navigate(absolute)
          return
        }
      }
      return clients.openWindow(self.location.origin + '/?redirect=' + encodeURIComponent(path))
    })
  )
})

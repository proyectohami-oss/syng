importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "TU_API_KEY",
  projectId: "syng-psi",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
});

const messaging = firebase.messaging();

function recordatorioUrl(data) {
  if (data?.url) return data.url;
  if (data?.taskId) return '/recordatorio/' + data.taskId;
  return '/agenda';
}

messaging.onBackgroundMessage(function(payload) {
  const title = payload.notification?.title || payload.data?.title || '⏰ Recordatorio';
  const body  = payload.notification?.body  || payload.data?.body  || '';
  const taskId = payload.data?.taskId || '';
  const url    = recordatorioUrl(payload.data);

  return self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'syng-reminder-' + taskId,
    renotify: true,
    data: { taskId, url },
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data || {};
  const url  = recordatorioUrl(data);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) return client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

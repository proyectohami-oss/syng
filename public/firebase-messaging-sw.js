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

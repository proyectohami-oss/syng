const admin = require('firebase-admin')

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()
const messaging = admin.messaging()

async function main() {
  const hoy = new Date()
  const hoyKey = `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}`
  
  console.log('Revisando tareas para:', hoyKey)
  
  // Obtener todos los usuarios con tokens FCM
  const tokensSnap = await db.collectionGroup('fcmTokens').get()
  console.log('Usuarios con tokens:', tokensSnap.size)
  
  for (const tokenDoc of tokensSnap.docs) {
    const { token, userId } = tokenDoc.data()
    if (!token || !userId) continue
    
    // Revisar si tiene tareas hoy
    const pizarronSnap = await db
      .collection('users').doc(userId)
      .collection('pizarron').doc(hoyKey).get()
    
    const items = pizarronSnap.data()?.items || []
    const pendientes = items.filter(i => !i.realizada)
    
    if (pendientes.length === 0) continue
    
    // Mandar notificación
    try {
      await messaging.send({
        token,
        notification: {
          title: 'Syng 📅',
          body: pendientes.length === 1
            ? `Tienes 1 pendiente para hoy`
            : `Tienes ${pendientes.length} pendientes para hoy`,
        },
        webpush: {
          fcmOptions: { link: 'https://syng-psi.vercel.app' },
          notification: { icon: '/icon-192.png', badge: '/icon-192.png' }
        }
      })
      console.log('✅ Notificación enviada a:', userId)
    } catch (e) {
      console.log('❌ Error enviando a:', userId, e.message)
      // Si el token es inválido, lo borramos
      if (e.code === 'messaging/invalid-registration-token' ||
          e.code === 'messaging/registration-token-not-registered') {
        await tokenDoc.ref.delete()
      }
    }
  }
  
  console.log('Listo.')
}

main().catch(console.error)

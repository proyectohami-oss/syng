const admin = require('firebase-admin')
const webpush = require('web-push')

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

webpush.setVapidDetails(
  'mailto:info@syng-psi.vercel.app',
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
)

async function main() {
  const hoy = new Date()
  const hoyKey = `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}`
  console.log('Revisando tareas para:', hoyKey)

  const subsSnap = await db.collectionGroup('pushSubs').get()
  console.log('Suscripciones encontradas:', subsSnap.size)

  for (const subDoc of subsSnap.docs) {
    const { endpoint, keys, userId } = subDoc.data()
    if (!endpoint || !keys || !userId) continue

    const pizarronSnap = await db
      .collection('users').doc(userId)
      .collection('pizarron').doc(hoyKey).get()

    const items = pizarronSnap.data()?.items || []
    const pendientes = items.filter(i => !i.realizada)
    if (pendientes.length === 0) continue

    try {
      await webpush.sendNotification(
        { endpoint, keys },
        JSON.stringify({
          notification: {
            title: 'Syng 📅',
            body: pendientes.length === 1
              ? 'Tienes 1 pendiente para hoy'
              : `Tienes ${pendientes.length} pendientes para hoy`
          }
        })
      )
      console.log('✅ Enviado a:', userId)
    } catch(e) {
      console.log('❌ Error:', userId, e.message)
      if (e.statusCode === 410 || e.statusCode === 404) {
        await subDoc.ref.delete()
      }
    }
  }
  console.log('Listo.')
}

main().catch(console.error)

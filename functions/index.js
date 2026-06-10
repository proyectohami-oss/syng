const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { onRequest }         = require('firebase-functions/v2/https')
const { initializeApp }     = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging }      = require('firebase-admin/messaging')
const { CloudTasksClient }  = require('@google-cloud/tasks')

initializeApp()
const db        = getFirestore()
const messaging = getMessaging()
const tasksClient = new CloudTasksClient()

const PROJECT       = 'syng-app'
const LOCATION      = 'us-central1'
const QUEUE         = 'reminders'
const SEND_PUSH_URL = process.env.SEND_PUSH_URL
  || `https://${LOCATION}-${PROJECT}.cloudfunctions.net/sendPushNotification`

function stringifyData(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v == null ? '' : String(v)]),
  )
}

async function getUserTokens(uid) {
  const snap = await db.doc(`users/${uid}`).get()
  if (!snap.exists) return []
  return Object.keys(snap.data().fcmTokens || {})
}

async function sendPush(tokens, title, body, data = {}) {
  if (!tokens.length) return { successCount: 0, failureCount: 0 }
  const link = data.url || '/'
  const messages = tokens.map(token => ({
    token,
    notification: { title, body },
    data: stringifyData({ ...data, title, body }),
    android: {
      priority: 'high',
      notification: { channelId: 'syng_reminders', priority: 'max', defaultSound: true },
    },
    apns: {
      headers: { 'apns-priority': '10', 'apns-push-type': 'alert' },
      payload: { aps: { alert: { title, body }, sound: 'default' } },
    },
    webpush: {
      headers: { Urgency: 'high', TTL: '86400' },
      notification: {
        icon: '/icon-192.png', badge: '/icon-192.png',
        vibrate: [200, 100, 200], requireInteraction: true,
      },
      fcmOptions: { link },
    },
  }))
  return messaging.sendEach(messages)
}

/**
 * HTTP target de Cloud Tasks — envía el push FCM en el segundo exacto.
 * Body: { userId, title, taskId, reminderId }
 */
exports.sendPushNotification = onRequest(
  { timeoutSeconds: 30 },
  async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

    const { userId, title, taskId, reminderId } = req.body
    if (!userId || !taskId) return res.status(400).json({ error: 'faltan campos' })

    const tokens = await getUserTokens(userId)
    if (!tokens.length) {
      console.warn('[sendPushNotification] sin tokens para', userId)
      return res.json({ ok: false, reason: 'no_tokens' })
    }

    const pushTitle = '⏰ Recordatorio'
    const pushBody  = title || 'Es momento de retomarlo'
    const url       = `/recordatorio/${taskId}`

    const result = await sendPush(tokens, pushTitle, pushBody, {
      type: 'reminder',
      taskId,
      url,
    })

    if (reminderId) {
      await db.doc(`reminders/${reminderId}`).update({
        status:  'sent',
        sentAt:  FieldValue.serverTimestamp(),
      }).catch(err => console.warn('[sendPushNotification] update reminder:', err.message))
    }

    console.log(`[sendPushNotification] taskId=${taskId} ok=${result.successCount} fail=${result.failureCount}`)
    res.json({ ok: true, taskId, successCount: result.successCount })
  },
)

/**
 * Al crear /reminders/{id}, encola Cloud Task para el segundo exacto de scheduledAt.
 */
exports.sendReminderTask = onDocumentCreated('reminders/{id}', async (event) => {
  const data       = event.data.data()
  const reminderId = event.params.id
  const taskId     = data.taskId

  if (!data.userId || !taskId || !data.scheduledAt) {
    console.warn('[sendReminderTask] documento incompleto', reminderId)
    return
  }

  const scheduledAt = data.scheduledAt.toDate
    ? data.scheduledAt.toDate()
    : new Date(data.scheduledAt)

  const scheduleSeconds = Math.floor(scheduledAt.getTime() / 1000)
  const nowSeconds      = Math.floor(Date.now() / 1000)

  if (scheduleSeconds <= nowSeconds) {
    console.warn('[sendReminderTask] scheduledAt en el pasado, enviando de inmediato', reminderId)
  }

  const queuePath = tasksClient.queuePath(PROJECT, LOCATION, QUEUE)
  const url       = SEND_PUSH_URL

  const payload = JSON.stringify({
    userId:     data.userId,
    title:      data.title || '',
    taskId,
    reminderId,
  })

  const cloudTask = {
    httpRequest: {
      httpMethod: 'POST',
      url,
      headers: { 'Content-Type': 'application/json' },
      body: Buffer.from(payload).toString('base64'),
    },
    scheduleTime: { seconds: Math.max(scheduleSeconds, nowSeconds) },
  }

  await tasksClient.createTask({ parent: queuePath, task: cloudTask })
  console.log(`[sendReminderTask] encolado reminder=${reminderId} taskId=${taskId} at=${scheduledAt.toISOString()}`)
})

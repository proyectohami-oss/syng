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

const PROJECT       = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'syng-app'
const LOCATION      = 'us-central1'
const QUEUE         = 'syng-reminders'
const WEB_APP_URL   = process.env.WEB_APP_URL || 'https://syng-psi.vercel.app'
const SEND_PUSH_URL = process.env.SEND_PUSH_URL
  || `https://${LOCATION}-${PROJECT}.cloudfunctions.net/sendPushNotification`
const TASKS_SA      = process.env.TASKS_INVOKER_SA
  || `${process.env.GCLOUD_PROJECT_NUMBER || '751348580546'}-compute@developer.gserviceaccount.com`

async function ensureQueue() {
  const name = tasksClient.queuePath(PROJECT, LOCATION, QUEUE)
  try {
    await tasksClient.getQueue({ name })
  } catch (err) {
    if (err.code !== 5) throw err
    const parent = tasksClient.locationPath(PROJECT, LOCATION)
    await tasksClient.createQueue({
      parent,
      queue: {
        name,
        rateLimits: { maxDispatchesPerSecond: 20 },
        retryConfig: { maxAttempts: 5 },
      },
    })
    console.log(`[ensureQueue] cola creada: ${QUEUE}`)
  }
}

function stringifyData(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v == null ? '' : String(v)]),
  )
}

function recordatorioUrl(taskId) {
  return `${WEB_APP_URL}/recordatorio/${taskId}`
}

async function getUserTokens(uid) {
  const snap = await db.doc(`users/${uid}`).get()
  if (!snap.exists) return []
  return Object.keys(snap.data().fcmTokens || {})
}

async function pruneInvalidTokens(uid, tokens, result) {
  if (!result?.responses) return
  const removals = {}
  result.responses.forEach((resp, i) => {
    if (!resp.success) {
      const code = resp.error?.code || ''
      if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token')) {
        removals[`fcmTokens.${tokens[i]}`] = FieldValue.delete()
      }
    }
  })
  if (Object.keys(removals).length) {
    await db.doc(`users/${uid}`).set({ ...removals, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  }
}

async function saveInAppNotification(uid, { title, body, taskId, url }) {
  const ref = db.collection(`users/${uid}/notifications`).doc()
  await ref.set({
    type: 'reminder',
    title,
    body,
    taskId,
    url,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  })
}

async function sendPush(uid, tokens, title, body, data = {}) {
  if (!tokens.length) return { successCount: 0, failureCount: 0, responses: [] }

  const taskId = data.taskId || ''
  const url    = data.url || (taskId ? recordatorioUrl(taskId) : WEB_APP_URL)
  const payload = stringifyData({ ...data, title, body, url, taskId, type: 'reminder' })

  const messages = tokens.map(token => ({
    token,
    data: payload,
    android: {
      priority: 'high',
      notification: {
        title,
        body,
        channelId: 'syng_reminders',
        priority: 'max',
        defaultSound: true,
        icon: 'ic_notification',
      },
    },
    apns: {
      headers: { 'apns-priority': '10', 'apns-push-type': 'alert' },
      payload: {
        aps: {
          alert: { title, body },
          sound: 'default',
          'mutable-content': 1,
        },
      },
      fcmOptions: { link: url },
    },
    webpush: {
      headers: { Urgency: 'high', TTL: '86400' },
      notification: {
        title,
        body,
        icon: `${WEB_APP_URL}/icon-192.png`,
        badge: `${WEB_APP_URL}/icon-192.png`,
        requireInteraction: true,
        tag: taskId ? `syng-reminder-${taskId}` : 'syng-notif',
      },
      data: payload,
      fcmOptions: { link: url },
    },
  }))

  const result = await messaging.sendEach(messages)
  await pruneInvalidTokens(uid, tokens, result)
  return result
}

async function deliverReminderPush({ userId, title, taskId, reminderId }) {
  const tokens = await getUserTokens(userId)
  const pushTitle = '⏰ Recordatorio'
  const pushBody  = title || 'Es momento de retomarlo'
  const url       = recordatorioUrl(taskId)

  if (!tokens.length) {
    console.warn('[deliverReminderPush] sin tokens para', userId)
    return { ok: false, reason: 'no_tokens' }
  }

  const result = await sendPush(userId, tokens, pushTitle, pushBody, { taskId, url })

  if (result.responses) {
    result.responses.forEach((resp, i) => {
      if (!resp.success) {
        console.warn(`[deliverReminderPush] FCM falló token[${i}]:`, resp.error?.code, resp.error?.message)
      }
    })
  }
  console.log(`[deliverReminderPush] taskId=${taskId} ok=${result.successCount} fail=${result.failureCount}`)

  if (result.successCount > 0) {
    await saveInAppNotification(userId, { title: pushTitle, body: pushBody, taskId, url }).catch(() => {})
  }

  if (reminderId) {
    await db.doc(`reminders/${reminderId}`).update({
      status: 'sent',
      sentAt: FieldValue.serverTimestamp(),
    }).catch(err => console.warn('[deliverReminderPush] update reminder:', err.message))
  }

  return { ok: true, successCount: result.successCount, failureCount: result.failureCount }
}

exports.sendPushNotification = onRequest(
  { timeoutSeconds: 30, invoker: 'public' },
  async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

    const { userId, title, taskId, reminderId } = req.body
    if (!userId || !taskId) return res.status(400).json({ error: 'faltan campos' })

    const result = await deliverReminderPush({ userId, title, taskId, reminderId })
    console.log(`[sendPushNotification] taskId=${taskId}`, result)
    res.json(result)
  },
)

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
  const delaySec        = scheduleSeconds - nowSeconds

  const payload = {
    userId: data.userId,
    title:  data.title || '',
    taskId,
    reminderId,
  }

  // Pasado o < 30 s: enviar ya (hora local del usuario ya convertida a UTC en el cliente)
  if (delaySec <= 30) {
    console.log(`[sendReminderTask] envío inmediato reminder=${reminderId}`)
    await deliverReminderPush(payload)
    return
  }

  try {
    await ensureQueue()
    const queuePath = tasksClient.queuePath(PROJECT, LOCATION, QUEUE)
    await tasksClient.createTask({
      parent: queuePath,
      task: {
        httpRequest: {
          httpMethod: 'POST',
          url: SEND_PUSH_URL,
          headers: { 'Content-Type': 'application/json' },
          body: Buffer.from(JSON.stringify(payload)).toString('base64'),
          oidcToken: {
            serviceAccountEmail: TASKS_SA,
            audience: SEND_PUSH_URL,
          },
        },
        scheduleTime: { seconds: scheduleSeconds },
      },
    })
    console.log(`[sendReminderTask] encolado reminder=${reminderId} at=${scheduledAt.toISOString()}`)
  } catch (err) {
    console.error('[sendReminderTask] Cloud Tasks error, fallback inmediato:', err.message)
    await deliverReminderPush(payload)
  }
})

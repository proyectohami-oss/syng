/**
 * Recordatorios Syng — pipeline completo
 *
 * Cliente guarda /reminders/{taskId} con scheduledAt (UTC, hora local del usuario)
 *   → sendReminderTask encola Cloud Task o envía ya
 *   → sendPushNotification → FCM + aviso in-app en /users/{uid}/notifications
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { onRequest }         = require('firebase-functions/v2/https')
const { initializeApp }     = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging }      = require('firebase-admin/messaging')
const { CloudTasksClient }  = require('@google-cloud/tasks')

initializeApp()

const db            = getFirestore()
const messaging     = getMessaging()
const tasksClient   = new CloudTasksClient()

const PROJECT       = process.env.GCLOUD_PROJECT || 'syng-app'
const LOCATION      = 'us-central1'
const QUEUE         = 'syng-reminders'
const WEB_APP_URL   = process.env.WEB_APP_URL || 'https://syng-psi.vercel.app'
const SEND_PUSH_URL = process.env.SEND_PUSH_URL
  || `https://${LOCATION}-${PROJECT}.cloudfunctions.net/sendPushNotification`
const TASKS_SA      = process.env.TASKS_INVOKER_SA
  || '751348580546-compute@developer.gserviceaccount.com'

// ── Helpers ──────────────────────────────────────────────────────────────────

function strData(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v == null ? '' : String(v)]))
}

function recordatorioUrl(taskId) {
  return `${WEB_APP_URL}/recordatorio/${taskId}`
}

async function ensureQueue() {
  const name = tasksClient.queuePath(PROJECT, LOCATION, QUEUE)
  try {
    await tasksClient.getQueue({ name })
  } catch (err) {
    if (err.code !== 5) throw err
    await tasksClient.createQueue({
      parent: tasksClient.locationPath(PROJECT, LOCATION),
      queue: { name, rateLimits: { maxDispatchesPerSecond: 20 }, retryConfig: { maxAttempts: 5 } },
    })
  }
}

async function getUserTokens(uid) {
  const snap = await db.doc(`users/${uid}`).get()
  if (!snap.exists) return []
  return Object.keys(snap.data().fcmTokens || {})
}

async function pruneBadTokens(uid, tokens, result) {
  if (!result?.responses) return
  const del = {}
  result.responses.forEach((r, i) => {
    const code = r.error?.code || ''
    if (!r.success && (code.includes('not-registered') || code.includes('invalid-registration'))) {
      del[`fcmTokens.${tokens[i]}`] = FieldValue.delete()
    }
  })
  if (Object.keys(del).length) {
    await db.doc(`users/${uid}`).set({ ...del, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  }
}

async function saveInApp(uid, { title, body, taskId, url }) {
  await db.collection(`users/${uid}/notifications`).add({
    type: 'reminder', title, body, taskId, url, read: false,
    createdAt: FieldValue.serverTimestamp(),
  })
}

// ── FCM — solo payload web (tokens iOS/Android PWA son web push) ─────────────

async function sendFcm(uid, tokens, title, body, { taskId, url }) {
  if (!tokens.length) return { successCount: 0, failureCount: 0, responses: [] }

  const data = strData({ type: 'reminder', title, body, taskId, url })

  const messages = tokens.map(token => ({
    token,
    notification: { title, body },
    data,
    fcmOptions: { link: url },
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
      fcmOptions: { link: url },
    },
  }))

  const result = await messaging.sendEach(messages)
  await pruneBadTokens(uid, tokens, result)
  return result
}

// ── Entrega ──────────────────────────────────────────────────────────────────

async function deliverReminderPush({ userId, title, taskId, reminderId }) {
  const pushTitle = '⏰ Recordatorio'
  const pushBody  = title || 'Es momento de retomarlo'
  const url       = recordatorioUrl(taskId)

  // Siempre guardar en Avisos de Syng
  await saveInApp(userId, { title: pushTitle, body: pushBody, taskId, url })

  const tokens = await getUserTokens(userId)
  if (!tokens.length) {
    console.warn('[deliver] sin tokens FCM para', userId)
    return { ok: true, push: false, reason: 'no_tokens' }
  }

  const result = await sendFcm(userId, tokens, pushTitle, pushBody, { taskId, url })

  result.responses?.forEach((r, i) => {
    if (!r.success) console.warn(`[deliver] FCM[${i}]:`, r.error?.code, r.error?.message)
  })
  console.log(`[deliver] taskId=${taskId} ok=${result.successCount} fail=${result.failureCount}`)

  if (reminderId) {
    await db.doc(`reminders/${reminderId}`).update({
      status: 'sent', sentAt: FieldValue.serverTimestamp(),
    }).catch(() => {})
  }

  return { ok: true, push: result.successCount > 0, successCount: result.successCount }
}

// ── Cloud Functions ──────────────────────────────────────────────────────────

exports.sendPushNotification = onRequest({ timeoutSeconds: 30, invoker: 'public' }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')
  const { userId, title, taskId, reminderId } = req.body
  if (!userId || !taskId) return res.status(400).json({ error: 'faltan campos' })
  const result = await deliverReminderPush({ userId, title, taskId, reminderId })
  res.json(result)
})

exports.sendReminderTask = onDocumentCreated('reminders/{id}', async (event) => {
  const data       = event.data.data()
  const reminderId = event.params.id
  const { userId, taskId, title, scheduledAt } = data

  if (!userId || !taskId || !scheduledAt) {
    console.warn('[sendReminderTask] incompleto', reminderId)
    return
  }

  const when = scheduledAt.toDate ? scheduledAt.toDate() : new Date(scheduledAt)
  const delaySec = Math.floor(when.getTime() / 1000) - Math.floor(Date.now() / 1000)
  const payload = { userId, title: title || '', taskId, reminderId }

  if (delaySec <= 30) {
    console.log('[sendReminderTask] inmediato', reminderId)
    await deliverReminderPush(payload)
    return
  }

  try {
    await ensureQueue()
    await tasksClient.createTask({
      parent: tasksClient.queuePath(PROJECT, LOCATION, QUEUE),
      task: {
        httpRequest: {
          httpMethod: 'POST',
          url: SEND_PUSH_URL,
          headers: { 'Content-Type': 'application/json' },
          body: Buffer.from(JSON.stringify(payload)).toString('base64'),
          oidcToken: { serviceAccountEmail: TASKS_SA, audience: SEND_PUSH_URL },
        },
        scheduleTime: { seconds: Math.floor(when.getTime() / 1000) },
      },
    })
    console.log('[sendReminderTask] encolado', reminderId, when.toISOString())
  } catch (err) {
    console.error('[sendReminderTask] cola falló, envío directo:', err.message)
    await deliverReminderPush(payload)
  }
})

/**
 * Recordatorios Syng — pipeline completo
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
  const map = snap.data().fcmTokens || {}
  return Object.entries(map).map(([token, meta]) => ({
    token,
    platform: meta?.platform || 'web',
  }))
}

function platformForToken(entries, token) {
  return entries.find(e => e.token === token)?.platform || 'web'
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

const { saveInAppNotification, notifyGroupMembersFromActivity } = require('./inAppNotifications')

/** Payload congelado v4 — ver src/core/notifications/PUSH_CONTRACT.js */
const PUSH_PIPELINE_VERSION = 'native-v1'

async function sendFcm(uid, entries, title, body, { taskId, url }) {
  if (!entries.length) return { successCount: 0, failureCount: 0, responses: [] }

  const data = strData({ type: 'reminder', title, body, taskId, url })
  const tokens = entries.map(e => e.token)

  const messages = entries.map(({ token, platform }) => {
    const msg = { token, data }
    if (platform === 'android' || platform === 'ios') {
      msg.notification = { title, body }
      msg.android = { priority: 'high' }
    }
    return msg
  })

  const result = await messaging.sendEach(messages)
  await pruneBadTokens(uid, tokens, result)
  return result
}

async function deliverReminderPush({ userId, title, taskId, reminderId, test, tokenOnly, tokenPlatform }) {
  const testTaskId = 'universe-a-test'
  const pushTitle = test ? '✓ Syng' : '⏰ Recordatorio'
  const pushBody  = test ? 'Toca para abrir el recordatorio de prueba' : (title || 'Es momento de retomarlo')
  const url       = test ? recordatorioUrl(testTaskId) : recordatorioUrl(taskId)

  if (!test) {
    await saveInAppNotification(userId, { type: 'reminder', title: pushTitle, body: pushBody, taskId, url })
  }

  let entries = await getUserTokens(userId)
  if (test && tokenOnly) {
    const plat = tokenPlatform || platformForToken(entries, tokenOnly) || 'web'
    entries = [{ token: tokenOnly, platform: plat }]
  } else if (tokenOnly) {
    entries = entries.filter(e => e.token === tokenOnly)
  }
  console.log(`[deliver] ${PUSH_PIPELINE_VERSION} uid=${userId} tokens=${entries.length} test=${!!test}`)

  if (!entries.length) {
    return { ok: false, push: false, reason: 'no_tokens', tokenCount: 0, pipeline: PUSH_PIPELINE_VERSION }
  }

  const result = await sendFcm(userId, entries, pushTitle, pushBody, {
    taskId: test ? testTaskId : (taskId || 'test'),
    url,
  })

  result.responses?.forEach((r, i) => {
    if (!r.success) console.warn(`[deliver] FCM[${i}]:`, r.error?.code, r.error?.message)
  })
  console.log(`[deliver] ok=${result.successCount} fail=${result.failureCount}`)

  if (reminderId && !test) {
    await db.doc(`reminders/${reminderId}`).update({
      status: 'sent', sentAt: FieldValue.serverTimestamp(),
    }).catch(() => {})
  }

  return {
    ok:           result.successCount > 0,
    push:         result.successCount > 0,
    successCount: result.successCount,
    failureCount: result.failureCount,
    tokenCount:   entries.length,
    pipeline:     PUSH_PIPELINE_VERSION,
  }
}

function setCors(req, res) {
  const origin = req.get('Origin') || ''
  if (origin === WEB_APP_URL || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
    res.set('Access-Control-Allow-Origin', origin)
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
}

exports.sendPushNotification = onRequest({ timeoutSeconds: 30, invoker: 'public' }, async (req, res) => {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')
  const { userId, title, taskId, reminderId, test, token, platform } = req.body
  if (!userId) return res.status(400).json({ error: 'faltan campos' })
  if (!test && !taskId) return res.status(400).json({ error: 'faltan campos' })
  const result = await deliverReminderPush({
    userId, title, taskId: taskId || `test-${Date.now()}`, reminderId, test: !!test,
    tokenOnly: test && token ? token : null,
    tokenPlatform: platform || null,
  })
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

exports.onActivityLogCreated = onDocumentCreated('activity_log/{logId}', async (event) => {
  const data = event.data?.data()
  if (!data) return
  try {
    await notifyGroupMembersFromActivity(data)
  } catch (err) {
    console.error('[onActivityLogCreated]', err.message)
  }
})

Object.assign(exports, require('./mercadopago'))
Object.assign(exports, require('./aliados'))

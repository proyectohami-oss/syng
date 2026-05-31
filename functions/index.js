const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { onSchedule }                           = require('firebase-functions/v2/scheduler')
const { initializeApp }                        = require('firebase-admin/app')
const { getFirestore, Timestamp }              = require('firebase-admin/firestore')
const { getMessaging }                         = require('firebase-admin/messaging')

initializeApp()
const db        = getFirestore()
const messaging = getMessaging()

async function getUserTokens(uid) {
  const snap = await db.doc(`users/${uid}`).get()
  if (!snap.exists) return []
  return Object.keys(snap.data().fcmTokens || {})
}

async function getTokensForUsers(uids) {
  const arrays = await Promise.all(uids.map(getUserTokens))
  return arrays.flat()
}

function stringifyData(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v == null ? '' : String(v)])
  )
}

async function sendPush(tokens, title, body, data = {}) {
  if (!tokens.length) return
  const messages = tokens.map(token => ({
    token,
    notification: { title, body },
    data: stringifyData({ ...data, title, body }),
    webpush: {
      notification: { icon: '/icon-192.png', badge: '/icon-192.png', vibrate: [200, 100, 200] },
      fcmOptions: { link: data.url || '/' },
    },
  }))
  try {
    const result = await messaging.sendEach(messages)
    console.log(`[sendPush] ok:${result.successCount} fail:${result.failureCount}`)
  } catch (err) {
    console.error('[sendPush] error:', err)
  }
}

exports.sendReminders = onSchedule(
  { schedule: 'every 1 minutes', timeZone: 'America/Mexico_City' },
  async () => {
    const now  = new Date()
    const from = Timestamp.fromDate(new Date(now.getTime() - 60_000))
    const to   = Timestamp.fromDate(now)

    console.log('[sendReminders] now UTC:', now.toISOString())
    console.log('[sendReminders] buscando scheduledAt entre:', from.toDate().toISOString(), 'y', to.toDate().toISOString())

    const snap = await db.collection('tasks')
      .where('status',               '==', 'pending')
      .where('isDeleted',            '==', false)
      .where('reminder.scheduledAt', '>=', from)
      .where('reminder.scheduledAt', '<=', to)
      .get()

    console.log('[sendReminders] tareas encontradas:', snap.size)

    if (snap.empty) return

    await Promise.all(snap.docs.map(async taskDoc => {
      const task   = taskDoc.data()
      console.log('[sendReminders] procesando tarea:', task.title, 'scheduledAt:', task.reminder?.scheduledAt?.toDate?.()?.toISOString())
      const tokens = await getUserTokens(task.ownerId)
      console.log('[sendReminders] tokens del usuario:', tokens.length)
      if (!tokens.length) return
      await sendPush(tokens, '⏰ Recordatorio', task.title, {
        type: 'reminder', taskId: taskDoc.id, url: '/agenda',
      })
    }))
  }
)

exports.onGroupTaskCreated = onDocumentCreated('tasks/{taskId}', async event => {
  const task = event.data.data()
  if (!task.groupId || task.type !== 'group' || task.isDeleted) return
  const [groupSnap, actorSnap] = await Promise.all([
    db.doc(`groups/${task.groupId}`).get(),
    db.doc(`users/${task.ownerId}`).get(),
  ])
  if (!groupSnap.exists) return
  const group     = groupSnap.data()
  const actorName = actorSnap.data()?.displayName || 'Alguien'
  const otherUids = (group.memberIds || []).filter(u => u !== task.ownerId)
  const tokens    = await getTokensForUsers(otherUids)
  await sendPush(tokens, group.name, `${actorName} agregó: ${task.title}`, {
    type: 'group_task_created', groupId: task.groupId, taskId: event.params.taskId, url: `/pizarron/${task.groupId}`,
  })
})

exports.onGroupTaskUpdated = onDocumentUpdated('tasks/{taskId}', async event => {
  const before = event.data.before.data()
  const after  = event.data.after.data()
  if (!after.groupId || after.type !== 'group') return
  if (before.isDeleted && after.isDeleted) return
  let actorUid = after.ownerId
  let accion   = ''
  if (!before.isDeleted && after.isDeleted) {
    accion = `eliminó: ${after.title}`
  } else if (before.status === 'pending' && after.status === 'completed') {
    actorUid = after.completedBy || after.ownerId
    accion   = `completó: ${after.title}`
  } else if (before.status === 'completed' && after.status === 'pending') {
    accion = `reabrió: ${after.title}`
  } else if (before.title !== after.title || before.description !== after.description) {
    accion = `editó: ${after.title}`
  } else {
    return
  }
  const [groupSnap, actorSnap] = await Promise.all([
    db.doc(`groups/${after.groupId}`).get(),
    db.doc(`users/${actorUid}`).get(),
  ])
  if (!groupSnap.exists) return
  const group     = groupSnap.data()
  const actorName = actorSnap.data()?.displayName || 'Alguien'
  const otherUids = (group.memberIds || []).filter(u => u !== actorUid)
  const tokens    = await getTokensForUsers(otherUids)
  await sendPush(tokens, group.name, `${actorName} ${accion}`, {
    type: 'group_task_updated', groupId: after.groupId, taskId: event.params.taskId, url: `/pizarron/${after.groupId}`,
  })
})

exports.onGroupMembershipChanged = onDocumentUpdated('groups/{groupId}', async event => {
  const before = event.data.before.data()
  const after  = event.data.after.data()
  if (!before.memberIds || !after.memberIds) return
  const removedUids = before.memberIds.filter(uid => !after.memberIds.includes(uid))
  if (!removedUids.length) return
  await Promise.all(removedUids.map(async uid => {
    const tokens = await getUserTokens(uid)
    if (!tokens.length) return
    await sendPush(tokens, after.name, 'Ya no formas parte de este grupo', {
      type: 'group_removed', groupId: event.params.groupId, url: '/pizarrones',
    })
  }))
})

exports.dailySummary = onSchedule(
  { schedule: 'every 1 minutes', timeZone: 'America/Mexico_City' },
  async () => {
    const mxNow   = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
    const hh      = String(mxNow.getHours()).padStart(2, '0')
    const mm      = String(mxNow.getMinutes()).padStart(2, '0')
    const timeNow = `${hh}:${mm}`
    const usersSnap = await db.collection('users').where('notifPrefs.dailyTime', '==', timeNow).get()
    if (usersSnap.empty) return
    const dayStart = new Date(mxNow); dayStart.setHours(0, 0, 0, 0)
    const dayEnd   = new Date(mxNow); dayEnd.setHours(23, 59, 59, 999)
    await Promise.all(usersSnap.docs.map(async userDoc => {
      const user   = userDoc.data()
      const tokens = Object.keys(user.fcmTokens || {})
      if (!tokens.length) return
      const tasksSnap = await db.collection('tasks')
        .where('ownerId',   '==', userDoc.id)
        .where('type',      '==', 'personal')
        .where('status',    '==', 'pending')
        .where('isDeleted', '==', false)
        .where('dueDate',   '>=', Timestamp.fromDate(dayStart))
        .where('dueDate',   '<=', Timestamp.fromDate(dayEnd))
        .get()
      if (!tasksSnap.size) return
      const n = tasksSnap.size
      await sendPush(tokens, '📋 Tu día en Syng', `${n} tarea${n !== 1 ? 's' : ''} pendiente${n !== 1 ? 's' : ''} hoy`, {
        type: 'daily_summary', url: '/agenda',
      })
    }))
  }
)

exports.rolloverPendingTasks = onSchedule(
  { schedule: 'every day 00:05', timeZone: 'America/Mexico_City' },
  async () => {
    const mxNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
    const todayStart = new Date(mxNow)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(mxNow)
    todayEnd.setHours(23, 59, 59, 999)
    const cutoff = Timestamp.fromDate(todayStart)
    const newDue = Timestamp.fromDate(todayEnd)
    console.log('[rollover] moviendo tareas con dueDate <', cutoff.toDate().toISOString())
    const snap = await db.collection('tasks')
      .where('status',    '==', 'pending')
      .where('isDeleted', '==', false)
      .where('dueDate',   '<',  cutoff)
      .get()
    console.log('[rollover] tareas a mover:', snap.size)
    if (snap.empty) return
    const BATCH_SIZE = 499
    const docs = snap.docs
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = db.batch()
      docs.slice(i, i + BATCH_SIZE).forEach(doc => batch.update(doc.ref, { dueDate: newDue }))
      await batch.commit()
      console.log('[rollover] batch committed:', Math.floor(i/BATCH_SIZE)+1)
    }
    console.log('[rollover] done:', docs.length)
  }
)

const { onRequest } = require('firebase-functions/v2/https')

exports.rolloverPendingTasksNow = onRequest(
  { timeoutSeconds: 60 },
  async (req, res) => {
    const mxNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
    const todayStart = new Date(mxNow)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(mxNow)
    todayEnd.setHours(23, 59, 59, 999)
    const cutoff = Timestamp.fromDate(todayStart)
    const newDue = Timestamp.fromDate(todayEnd)
    const snap = await db.collection('tasks')
      .where('status',    '==', 'pending')
      .where('isDeleted', '==', false)
      .where('dueDate',   '<',  cutoff)
      .get()
    if (snap.empty) return res.json({ moved: 0, message: 'No hay tareas para mover' })
    const BATCH_SIZE = 499
    const docs = snap.docs
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = db.batch()
      docs.slice(i, i + BATCH_SIZE).forEach(doc => batch.update(doc.ref, { dueDate: newDue }))
      await batch.commit()
    }
    res.json({ moved: docs.length, newDueDate: todayEnd.toISOString() })
  }
)

exports.inspectTask = onRequest(
  { timeoutSeconds: 60 },
  async (req, res) => {
    const snap = await db.collection('tasks')
      .where('title', '==', 'Comprar regadera de Fergie')
      .get()
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json(results)
  }
)

exports.inspectReminders = onRequest(
  { timeoutSeconds: 60 },
  async (req, res) => {
    const snap = await db.collection('tasks')
      .where('status',    '==', 'pending')
      .where('isDeleted', '==', false)
      .get()

    const withReminder = snap.docs
      .map(d => d.data())
      .filter(t => t.reminder)
      .map(t => ({
        title: t.title,
        reminder: t.reminder,
        reminderType: typeof t.reminder,
        scheduledAt: t.reminder?.scheduledAt,
        scheduledAtType: typeof t.reminder?.scheduledAt,
        hasToDate: typeof t.reminder?.scheduledAt?.toDate === 'function',
      }))

    res.json({ total: withReminder.length, tasks: withReminder.slice(0, 5) })
  }
)

exports.inspectUserTokens = onRequest(
  { timeoutSeconds: 30 },
  async (req, res) => {
    const uid = req.query.uid
    if (!uid) return res.json({ error: 'falta uid' })
    const snap = await db.doc(`users/${uid}`).get()
    const tokens = snap.data()?.fcmTokens || {}
    res.json({ tokenCount: Object.keys(tokens).length, tokens: Object.keys(tokens) })
  }
)

// ─── Centro de Notificaciones ─────────────────────────────────────────────────

exports.onActivityLogCreated = onDocumentCreated('activity_log/{logId}', async event => {
  const log = event.data.data()
  const { event_action, actor_id, group_id, entity_id, metadata } = log

  // Solo procesar eventos de grupo
  if (!group_id) return

  // Obtener grupo y actor
  const [groupSnap, actorSnap] = await Promise.all([
    db.doc(`groups/${group_id}`).get(),
    db.doc(`users/${actor_id}`).get(),
  ])
  if (!groupSnap.exists) return

  const group     = groupSnap.data()
  const actorName = actorSnap.data()?.displayName || 'Alguien'
  const otherUids = (group.memberIds || []).filter(u => u !== actor_id)
  if (!otherUids.length) return

  // Construir mensaje humano
  const messages = {
    'task.completed': `${actorName} completó: ${metadata?.task_title || ''}`,
    'task.created':   `${actorName} agregó: ${metadata?.task_title || ''}`,
    'task.deleted':   `${actorName} eliminó: ${metadata?.task_title || ''}`,
    'member.joined':  `${actorName} se unió al grupo`,
    'member.left':    `${actorName} salió del grupo`,
  }
  const body = messages[event_action] || `${actorName} hizo algo en ${group.name}`
  const title = group.name
  const url   = `/pizarron/${group_id}`

  // Escribir notificación en inbox de cada miembro
  const { Timestamp: FTimestamp } = require('firebase-admin/firestore')
  const notifData = {
    type:      event_action,
    title,
    body,
    read:      false,
    createdAt: FTimestamp.now(),
    actorId:   actor_id,
    actorName,
    groupId:   group_id,
    taskId:    entity_id || null,
    actionUrl: url,
  }

  await Promise.all(otherUids.map(uid =>
    db.collection(`users/${uid}/notifications`).add({ ...notifData, userId: uid })
  ))

  // Mandar push FCM
  const tokens = await getTokensForUsers(otherUids)
  await sendPush(tokens, title, body, { type: event_action, groupId: group_id, url })

  console.log(`[onActivityLogCreated] ${event_action} → ${otherUids.length} miembros notificados`)
})

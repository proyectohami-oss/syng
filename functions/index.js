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
    data: stringifyData(data),
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

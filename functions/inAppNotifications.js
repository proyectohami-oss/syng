const { getFirestore, FieldValue } = require('firebase-admin/firestore')

const db = getFirestore()

async function saveInAppNotification(uid, { type, title, body, taskId, url, actionUrl }) {
  if (!uid) return
  const link = actionUrl || url || null
  await db.collection(`users/${uid}/notifications`).add({
    type: type || 'reminder',
    title: title || '',
    body: body || title || '',
    taskId: taskId || null,
    url: link,
    actionUrl: link,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  })
}

const GROUP_EVENT_COPY = {
  'task.created':   (actor, title, group) => `${actor} agregó «${title}» en ${group}`,
  'task.completed': (actor, title, group) => `${actor} completó «${title}» en ${group}`,
}

async function notifyGroupMembersFromActivity(data) {
  const { event_action, actor_id, group_id, metadata } = data
  const build = GROUP_EVENT_COPY[event_action]
  if (!build || !group_id || !actor_id) return

  const groupSnap = await db.doc(`groups/${group_id}`).get()
  if (!groupSnap.exists) return

  const group = groupSnap.data()
  const memberIds = group.memberIds || []
  const recipients = memberIds.filter(uid => uid !== actor_id)
  if (!recipients.length) return

  const actorSnap = await db.doc(`users/${actor_id}`).get()
  const actorName = actorSnap.data()?.displayName?.split(' ')[0] || 'Alguien'
  const taskTitle = metadata?.task_title || 'una tarea'
  const groupName = group.name || 'tu grupo'
  const body = build(actorName, taskTitle, groupName)
  const actionUrl = `/pizarron/${group_id}`

  await Promise.all(recipients.map(uid => saveInAppNotification(uid, {
    type: event_action,
    title: 'Actividad en grupo',
    body,
    actionUrl,
  })))
}

module.exports = { saveInAppNotification, notifyGroupMembersFromActivity }

import { logActivityEvent } from "./activityLog.service"
/**
 * Tasks service — CRUD puro de Firestore. Sin React, sin estado.
 */
import {
  doc, collection, setDoc, updateDoc, deleteDoc, serverTimestamp, deleteField,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { logActivity } from './activity.service'
import { applyReminderForTask } from './reminders.service'

export function generateTaskId() {
  return doc(collection(db, 'tasks')).id
}

export async function createTask({ id, title, description, type, ownerId, groupId, dueDate, actorName = '', reminder = null, reminderTime = null }) {
  await setDoc(doc(db, 'tasks', id), {
    id,
    title:       title.trim(),
    description: description?.trim() ?? '',
    status:      'pending',
    type,
    ownerId,
    groupId:     groupId ?? null,
    assignedTo:  null,
    dueDate:     dueDate ?? null,
    completedAt: null,
    completedBy: null,
    reminder:    reminder ?? null,
    reminderTime: reminderTime ?? reminder?.scheduledAt ?? null,
    isDeleted:   false,
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  })
  if (reminder?.scheduledAt && ownerId) {
    await applyReminderForTask({ taskId: id, userId: ownerId, title, reminder, dueDate })
  }
  if (groupId) {
    await logActivity({ groupId, type: 'task_created', actorUid: ownerId, actorName, targetName: title.trim() })
    await logActivityEvent({ eventAction: 'task.created', actorId: ownerId, groupId, entityType: 'task', metadata: { task_title: title.trim() } })
  }
}

/**
 * Actualiza campos de una tarea existente.
 * Acepta cualquier combinación de: title, description, type, groupId,
 * dueDate, assignedTo, status, completedAt, completedBy.
 * El campo updatedAt se sobreescribe siempre.
 */
export async function updateTask(taskId, updates) {
  const ref = doc(db, 'tasks', taskId)
  const ownerId = updates.ownerId
  const { ownerId: _owner, updatedAt: _ts, ...raw } = updates

  const payload = { updatedAt: serverTimestamp() }
  for (const [key, val] of Object.entries(raw)) {
    if (val !== undefined) payload[key] = val
  }
  if (Object.prototype.hasOwnProperty.call(raw, 'reminder') && raw.reminder === null) {
    payload.reminder = null
    payload.reminderTime = deleteField()
  }

  await updateDoc(ref, payload)

  try {
    if (raw.reminder?.scheduledAt && ownerId) {
      await applyReminderForTask({
        taskId,
        userId: ownerId,
        title: raw.title || raw.reminder.title || 'Recordatorio',
        reminder: raw.reminder,
        dueDate: raw.dueDate,
      })
    } else if (Object.prototype.hasOwnProperty.call(raw, 'reminder') && raw.reminder === null && ownerId) {
      await deleteDoc(doc(db, 'reminders', taskId)).catch(() => {})
    }
  } catch (remErr) {
    console.warn('[tasks.service] reminder sync failed:', remErr)
  }
}

export async function toggleTaskStatus(taskId, currentStatus, uid, groupId = null, actorName = '', taskTitle = '') {
  const ref          = doc(db, 'tasks', taskId)
  const isCompleting = currentStatus === 'pending'
  await updateDoc(ref, {
    status:      isCompleting ? 'completed' : 'pending',
    completedAt: isCompleting ? serverTimestamp() : null,
    completedBy: isCompleting ? uid : null,
    updatedAt:   serverTimestamp(),
  })
  if (groupId && isCompleting) {
    await logActivity({ groupId, type: 'task_completed', actorUid: uid, actorName, targetName: taskTitle })
    await logActivityEvent({ eventAction: "task.completed", actorId: uid, groupId: groupId, entityType: "task", entityId: taskId, metadata: { task_title: taskTitle } })
  }
}

export async function deleteTask(taskId) {
  await updateDoc(doc(db, 'tasks', taskId), {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  })
}

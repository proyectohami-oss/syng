import { logActivityEvent } from "./activityLog.service"
/**
 * Tasks service — CRUD puro de Firestore. Sin React, sin estado.
 */
import {
  doc, collection, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { logActivity } from './activity.service'

export function generateTaskId() {
  return doc(collection(db, 'tasks')).id
}

async function programarRecordatorio(taskId, reminder) {
  if (!reminder?.scheduledAt) return
  try {
    const scheduledAt = reminder.scheduledAt.toDate ? reminder.scheduledAt.toDate().toISOString() : new Date(reminder.scheduledAt).toISOString()
    await fetch('https://us-central1-syng-app.cloudfunctions.net/scheduleReminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, scheduledAt }),
    })
  } catch (e) {
    console.warn('[tasks] no se pudo programar recordatorio:', e.message)
  }
}

export async function createTask({ id, title, description, type, ownerId, groupId, dueDate, actorName = '', reminder = null }) {
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
    reminder:    reminder,
    isDeleted:   false,
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  })
  if (reminder) await programarRecordatorio(id, reminder)
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
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
  if (updates.reminder) await programarRecordatorio(taskId, updates.reminder)
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

/**
 * Tasks service — CRUD puro de Firestore. Sin React, sin estado.
 */
import {
  doc, collection, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'

export function generateTaskId() {
  return doc(collection(db, 'tasks')).id
}

export async function createTask({ id, title, description, type, ownerId, groupId, dueDate }) {
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
    isDeleted:   false,
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  })
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
}

export async function toggleTaskStatus(taskId, currentStatus, uid) {
  const ref          = doc(db, 'tasks', taskId)
  const isCompleting = currentStatus === 'pending'
  await updateDoc(ref, {
    status:      isCompleting ? 'completed' : 'pending',
    completedAt: isCompleting ? serverTimestamp() : null,
    completedBy: isCompleting ? uid : null,
    updatedAt:   serverTimestamp(),
  })
}

export async function deleteTask(taskId) {
  await updateDoc(doc(db, 'tasks', taskId), {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  })
}

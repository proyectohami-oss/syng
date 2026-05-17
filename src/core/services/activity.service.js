import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'

/**
 * Registra un evento social en el grupo.
 * type: 'member_joined' | 'task_created' | 'task_completed' | 'member_left'
 */
export async function logActivity({ groupId, type, actorUid, actorName, targetName = '' }) {
  try {
    await addDoc(collection(db, 'groups', groupId, 'activity'), {
      type,
      actorUid,
      actorName,
      targetName,
      createdAt: serverTimestamp(),
    })
  } catch (e) {
    console.warn('[activity] no se pudo registrar evento:', e.message)
  }
}

/**
 * Escucha los ultimos 10 eventos de actividad del grupo en tiempo real.
 * Retorna unsubscribe.
 */
export function listenActivity(groupId, onChange) {
  const q = query(
    collection(db, 'groups', groupId, 'activity'),
    orderBy('createdAt', 'desc'),
    limit(10)
  )
  return onSnapshot(q, snap => {
    const events = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    onChange(events)
  }, err => {
    console.warn('[activity] listener error:', err.message)
    onChange([])
  })
}

/**
 * Convierte un evento en texto humano.
 */
export function eventLabel(event) {
  const name   = event.actorName || 'Alguien'
  const target = event.targetName ? '"' + event.targetName + '"' : ''
  switch (event.type) {
    case 'member_joined':   return name + ' se unio al grupo'
    case 'member_left':     return name + ' salio del grupo'
    case 'task_created':    return name + ' creo ' + target
    case 'task_completed':  return name + ' completo ' + target
    default:                return name + ' hizo algo'
  }
}

/**
 * Tiempo relativo humano.
 */
export function timeAgo(createdAt) {
  if (!createdAt) return ''
  const ms   = Date.now() - (createdAt.toMillis ? createdAt.toMillis() : new Date(createdAt).getTime())
  const min  = Math.floor(ms / 60000)
  const h    = Math.floor(ms / 3600000)
  const days = Math.floor(ms / 86400000)
  if (min < 1)   return 'ahora'
  if (min < 60)  return 'hace ' + min + ' min'
  if (h < 24)    return 'hace ' + h + 'h'
  if (days === 1) return 'ayer'
  return 'hace ' + days + ' dias'
}

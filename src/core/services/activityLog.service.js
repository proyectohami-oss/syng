// src/core/services/activityLog.service.js

import { db } from '../../firebase'
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'

// ─── TTL por tipo de evento ───────────────────────────────────────────────────

const TTL_DAYS = {
  'system.error':        30,
  'notification.failed': 30,
  'member.joined':       90,
  'member.left':         90,
  'member.removed':      90,
  'member.role_changed': 90,
  'group.created':       90,
  'group.updated':       90,
  'group.archived':      90,
  'task.created':        90,
  'task.updated':        90,
  'task.completed':      90,
  'task.deleted':        90,
  'payment.recorded':   365,
  'payment.edited':     365,
  'payment.deleted':    365,
}

function getTtl(eventAction) {
  const days = TTL_DAYS[eventAction] ?? 90
  const date = new Date()
  date.setDate(date.getDate() + days)
  return Timestamp.fromDate(date)
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Registra un evento en activity_log/{logId}.
 *
 * @param {object} params
 * @param {string} params.eventAction     - 'task.created', 'member.joined', etc.
 * @param {string} params.actorId         - UID del usuario que origina el evento
 * @param {string} params.groupId         - ID del grupo afectado
 * @param {string} [params.actorRole]     - 'owner' | 'admin' | 'member' | 'system'
 * @param {string} [params.targetId]      - UID del usuario afectado (si difiere del actor)
 * @param {string} [params.entityType]    - 'task' | 'payment' | 'member' | 'invite'
 * @param {string} [params.entityId]      - ID del objeto afectado
 * @param {object} [params.metadata]      - Datos mínimos del evento
 */
export async function logActivityEvent({
  eventAction,
  actorId,
  groupId,
  actorRole,
  targetId,
  entityType,
  entityId,
  metadata,
}) {
  // Validación mínima — no registrar eventos incompletos
  if (!eventAction || !actorId || !groupId) {
    console.warn('[activityLog] evento ignorado — faltan campos obligatorios', {
      eventAction,
      actorId,
      groupId,
    })
    return null
  }

  const eventType = eventAction.split('.')[0] // 'task', 'member', 'payment', etc.

  const entry = {
    // Obligatorios
    event_type:        eventType,
    event_action:      eventAction,
    actor_id:          actorId,
    group_id:          groupId,
    timestamp:         serverTimestamp(),
    notification_sent: false,

    // Opcionales — solo se incluyen si tienen valor
    ...(actorRole  && { actor_role:  actorRole }),
    ...(targetId   && { target_id:   targetId }),
    ...(entityType && { entity_type: entityType }),
    ...(entityId   && { entity_id:   entityId }),
    ...(metadata   && { metadata }),

    // Estado para salidas
    summary_included: false,

    // TTL
    ttl_expires_at: getTtl(eventAction),
  }

  try {
    const ref = await addDoc(collection(db, 'activity_log'), entry)
    console.log('[activityLog] evento registrado:', eventAction, ref.id)
    return ref.id
  } catch (error) {
    // Nunca bloquear la operación principal por un fallo de log
    console.error('[activityLog] error al registrar evento', eventAction, error)
    return null
  }
}

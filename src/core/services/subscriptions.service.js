/**
 * Subscriptions service — plan activo del usuario (compartido con Syng Admin).
 *
 * /subscriptions/{uid}:
 *   userId:    string
 *   planId:    'gratis' | 'plus_individual' | 'plus_ilimitado' | 'familiar'
 *   status:    'active' | 'cancelled' | 'expired'
 *   source:    'auto' | 'payment' | 'admin'
 *   createdAt: Timestamp
 *   updatedAt: Timestamp
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'

export const DEFAULT_PLAN_ID = 'gratis'

export async function ensureSubscription(uid) {
  const ref  = doc(db, 'subscriptions', uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    return { id: snap.id, ...snap.data() }
  }

  const data = {
    userId:             uid,
    planId:             DEFAULT_PLAN_ID,
    status:             'active',
    source:             'auto',
    movementTotal:      0,
    movementMonth:      '',
    movementMonthCount: 0,
    createdAt:          serverTimestamp(),
    updatedAt:          serverTimestamp(),
  }

  await setDoc(ref, data)
  return { id: uid, ...data }
}

export function planDisplayName(plan, planId) {
  if (plan?.name) return plan.name
  const labels = {
    gratis:           'Gratis',
    plus_individual:  'Plus Individual',
    plus_ilimitado:   'Plus Ilimitado',
    familiar:         'Familiar',
  }
  return labels[planId] ?? planId ?? 'Gratis'
}

export function planPriceLabel(plan) {
  if (!plan) return ''
  const price = plan.price ?? plan.priceMonthly ?? plan.monthlyPrice ?? 0
  if (!price) return 'Gratis'
  const currency = plan.currency ?? 'MXN'
  return `$${price} ${currency}/mes`
}

export function planLimitLabel(plan, planId) {
  if (plan?.movementLimit != null) return String(plan.movementLimit)
  if (plan?.limit) return plan.limit
  const defaults = {
    gratis:          '150 movimientos únicos',
    plus_individual: '340 movimientos/mes',
    plus_ilimitado:  'Ilimitado',
    familiar:        'Hasta 5 miembros, ilimitado',
  }
  return defaults[planId] ?? ''
}

/**
 * Movimientos — límites por plan (Gratis: total, Plus: mensual, Ilimitado/Familiar: sin tope).
 *
 * Cuenta: crear tarea, editar tarea, marcar completada/pendiente.
 */
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'

export class PlanLimitError extends Error {
  constructor(message, meta = {}) {
    super(message)
    this.name = 'PlanLimitError'
    Object.assign(this, meta)
  }
}

export function currentMonthKey() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year:    'numeric',
    month:   '2-digit',
  }).formatToParts(new Date())
  const year  = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  return `${year}-${month}`
}

export function isMonthlyPlan(planId) {
  return planId === 'plus_individual'
}

export function isUnlimitedPlan(planId) {
  return planId === 'plus_ilimitado' || planId === 'familiar'
}

export function getMovementLimit(planId, plan, systemConfig) {
  if (isUnlimitedPlan(planId)) return null
  if (plan?.movementLimit != null) return plan.movementLimit
  const cfg = systemConfig?.limites?.[planId]
  if (cfg != null) return cfg
  if (planId === 'gratis') return 150
  if (planId === 'plus_individual') return 340
  return null
}

export function computePlanUsage(subscription, plan, planId, systemConfig) {
  const limit = getMovementLimit(planId, plan, systemConfig)
  if (limit == null) {
    return {
      usage: 0, limit: null, unlimited: true, atLimit: false,
      remaining: null, label: 'Ilimitado', percent: 0,
    }
  }

  const monthKey = currentMonthKey()
  let usage
  if (isMonthlyPlan(planId)) {
    usage = subscription?.movementMonth === monthKey
      ? (subscription?.movementMonthCount ?? 0)
      : 0
  } else {
    usage = subscription?.movementTotal ?? 0
  }

  const remaining = Math.max(0, limit - usage)
  const atLimit   = usage >= limit
  const percent   = limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : 0
  const label     = isMonthlyPlan(planId)
    ? `${usage} / ${limit} movimientos este mes`
    : `${usage} / ${limit} movimientos`

  return { usage, limit, unlimited: false, atLimit, remaining, label, percent, monthKey }
}

function limitMessage(planId, limit) {
  if (isMonthlyPlan(planId)) {
    return `Alcanzaste el límite de ${limit} movimientos este mes.`
  }
  return `Alcanzaste el límite de ${limit} movimientos del plan Gratis. Mejora tu plan para seguir organizándote.`
}

function buildMovementUpdates(data, planId) {
  if (isUnlimitedPlan(planId)) return null

  const monthKey = currentMonthKey()
  const updates  = { updatedAt: serverTimestamp() }

  if (isMonthlyPlan(planId)) {
    if (data.movementMonth === monthKey) {
      updates.movementMonth      = monthKey
      updates.movementMonthCount = (data.movementMonthCount ?? 0) + 1
    } else {
      updates.movementMonth      = monthKey
      updates.movementMonthCount = 1
    }
    return updates
  }

  updates.movementTotal = (data.movementTotal ?? 0) + 1
  return updates
}

export async function reserveMovement(uid, subscription, plan, planId, systemConfig) {
  if (!uid || !subscription) return

  const activePlanId = subscription.planId || planId || 'gratis'
  if (subscription.status && subscription.status !== 'active') {
    throw new PlanLimitError('Tu suscripción no está activa.', { planId: activePlanId })
  }

  const { atLimit, limit, usage, unlimited } = computePlanUsage(
    subscription, plan, activePlanId, systemConfig,
  )
  if (unlimited) return
  if (atLimit) {
    throw new PlanLimitError(limitMessage(activePlanId, limit), {
      usage, limit, planId: activePlanId,
    })
  }

  await runTransaction(db, async (tx) => {
    const ref  = doc(db, 'subscriptions', uid)
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Suscripción no encontrada')

    const data   = snap.data()
    const pid    = data.planId || activePlanId
    const check  = computePlanUsage({ ...data, id: uid }, plan, pid, systemConfig)

    if (!check.unlimited && check.atLimit) {
      throw new PlanLimitError(limitMessage(pid, check.limit), {
        usage: check.usage, limit: check.limit, planId: pid,
      })
    }

    const updates = buildMovementUpdates(data, pid)
    if (updates) tx.update(ref, updates)
  })
}

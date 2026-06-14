/**
 * Movimientos — límites por plan.
 *
 * Gratis: cupo total (no mensual).
 * Plus Individual: cupo mensual que NO se acumula — al cambiar de mes vuelve a 0
 *   (como minutos de telefonía). Al agotarlo: comprar más, cambiar plan o esperar reinicio.
 * Ilimitado / Familiar: sin tope.
 *
 * Cuenta: crear tarea, editar tarea, marcar completada/pendiente.
 */
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import {
  getDeviceId,
  markFreeTierExhausted,
  DEFAULT_FREE_MOVEMENTS,
} from './freeTier.service'

export { DEFAULT_FREE_MOVEMENTS }

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

/** Próximo reinicio mensual (día 1, hora MX). Los movimientos Plus no se acumulan. */
export function nextMonthResetLabel() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year:     'numeric',
    month:    '2-digit',
  }).formatToParts(new Date())
  const y = Number(parts.find(p => p.type === 'year')?.value)
  const m = Number(parts.find(p => p.type === 'month')?.value)
  const nextM = m === 12 ? 1 : m + 1
  const nextY = m === 12 ? y + 1 : y
  const d     = new Date(nextY, nextM - 1, 1)
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long' }).format(d)
}

export function getLimitRecoveryOptions(planId) {
  if (isMonthlyPlan(planId)) {
    const reset = nextMonthResetLabel()
    return {
      isMonthly: true,
      resetLabel: reset,
      options: [
        { id: 'buy_more',    label: 'Comprar más movimientos', sub: 'Próximamente', disabled: true },
        { id: 'change_plan', label: 'Cambiar de plan',         sub: 'Más movimientos o ilimitado' },
        { id: 'wait_reset',  label: 'Esperar al nuevo mes',    sub: `Se reinician el ${reset}` },
      ],
    }
  }
  return {
    isMonthly: false,
    resetLabel: null,
    options: [
      {
        id: 'change_plan',
        label: 'Elegir un plan de pago',
        sub: 'Tus tareas y datos se conservan',
      },
    ],
  }
}

export function isFreePlanExhausted(subscription, planId, plan, systemConfig) {
  if (planId !== 'gratis') return false
  const { atLimit } = computePlanUsage(subscription, plan, planId, systemConfig)
  return atLimit
}

export function assertFreeTierCanWrite(subscription, plan, planId, systemConfig) {
  if (isFreePlanExhausted(subscription, planId, plan, systemConfig)) {
    throw new PlanLimitError(
      'Plan Gratis agotado. Tus datos se conservan; elige un plan de pago en Perfil.',
      { planId: 'gratis', freeTierBlocked: true },
    )
  }
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
  if (planId === 'gratis') return DEFAULT_FREE_MOVEMENTS
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

  const resetLabel = isMonthlyPlan(planId) ? nextMonthResetLabel() : null

  return {
    usage, limit, unlimited: false, atLimit, remaining, label, percent, monthKey, resetLabel,
    recovery: getLimitRecoveryOptions(planId),
  }
}

function limitMessage(planId, limit) {
  if (isMonthlyPlan(planId)) {
    const reset = nextMonthResetLabel()
    return `Agotaste tus ${limit} movimientos de Plus Individual este mes (no se acumulan). Compra más, cambia de plan o espera al ${reset}.`
  }
  return `Usaste tus ${limit} movimientos gratis. Tus datos se conservan; elige un plan de pago para seguir usando Syng.`
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

export async function reserveMovement(uid, subscription, plan, planId, systemConfig, phoneNumber) {
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
    if (updates) {
      if (pid === 'gratis' && updates.movementTotal >= check.limit) {
        updates.freeTierBlocked = true
      }
      tx.update(ref, updates)
    }
  })

  if (activePlanId === 'gratis' && usage + 1 >= limit) {
    await markFreeTierExhausted(uid, phoneNumber, getDeviceId())
  }
}

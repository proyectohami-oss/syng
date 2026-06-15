/**
 * Promotores — validación de código en la App (escritura de comisiones solo en Cloud Functions).
 *
 * /users/{uid} campos relacionados:
 *   promotorCodigo:      string | null  — código aplicado antes del primer pago
 *   promotorId:          string | null  — id del promotor validado
 *   promotorCodigoUsado: boolean        — true tras primer pago con código
 */
import {
  collection, doc, getDocs, limit, query, updateDoc, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'

export function normalizePromotorCodigo(raw) {
  return (raw || '').trim().toUpperCase()
}

/** No puedes usar tu propio código (mismo email o mismo uid de aliado). */
export function isSelfReferral({ user, promotor }) {
  if (!promotor || !user) return false
  if (promotor.userId && promotor.userId === user.uid) return true
  const userEmail = (user.email || '').trim().toLowerCase()
  const aliadoEmail = (promotor.email || '').trim().toLowerCase()
  return Boolean(userEmail && aliadoEmail && userEmail === aliadoEmail)
}

export const SELF_REFERRAL_MSG =
  'Este código es tuyo — compártelo con alguien más (por ejemplo Fernanda) para que reciba el descuento y tú ganes comisión.'

export const ALIADOS_PAUSADO_MSG =
  'Aliados Syng está pausado temporalmente. Vuelve pronto — te avisaremos cuando esté activo de nuevo.'

export function isAliadosProgramActive(systemConfig) {
  return systemConfig?.aliados_activo !== false
}

export async function findPromotorByCodigo(codigo) {
  const normalized = normalizePromotorCodigo(codigo)
  if (!normalized) return null

  const snap = await getDocs(query(
    collection(db, 'promotores'),
    where('codigo', '==', normalized),
    limit(1),
  ))

  if (snap.empty) return null
  const data = snap.docs[0].data()
  if (data.activo === false) return null

  return { id: snap.docs[0].id, ...data }
}

export async function savePromotorCodigo(uid, promotor) {
  await updateDoc(doc(db, 'users', uid), {
    promotorCodigo: promotor.codigo,
    promotorId:     promotor.id,
    updatedAt:      serverTimestamp(),
  })
}

export async function clearPromotorCodigo(uid) {
  await updateDoc(doc(db, 'users', uid), {
    promotorCodigo: null,
    promotorId:     null,
    updatedAt:      serverTimestamp(),
  })
}

/** Aún puede ingresar o cambiar código (no usado en un pago con comisión). */
export function canEditAliadoCode(userData) {
  return !userData?.promotorCodigoUsado
}

/** Descuento en checkout: primera suscripción de pago confirmada por MP. */
export function qualifiesForAliadoDiscount({ subscription, userData }) {
  if (userData?.promotorCodigoUsado) return false
  if (subscription?.source === 'payment' && subscription?.planId !== 'gratis') return false
  return true
}

/** @deprecated usar qualifiesForAliadoDiscount */
export function canApplyPromotorCode(params) {
  return qualifiesForAliadoDiscount(params)
}

export function discountedPrice(price, descuentoPct) {
  const base = Number(price) || 0
  const pct  = Number(descuentoPct) || 0
  return Math.round(base * (1 - pct / 100) * 100) / 100
}

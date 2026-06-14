/**
 * Plan Gratis — anti-abuso sin datos invasivos.
 *
 * - Un teléfono verificado = una cuenta (ya enforced en users.service).
 * - Al agotar 270 movimientos se registra el teléfono en free_tier_by_phone.
 * - Identificador local anónimo (syng_device_id) enlaza el dispositivo;
 *   si ya agotó gratis en otra cuenta, la nueva cuenta gratis arranca bloqueada.
 *
 * Declarar en aviso de privacidad: prevención de fraude, dato técnico anónimo.
 */
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion,
} from 'firebase/firestore'
import { db } from '../../firebase'

export const DEFAULT_FREE_MOVEMENTS = 270

export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = crypto.randomUUID?.() ?? `d_${Date.now()}_${Math.random().toString(36).slice(2)}`
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

export async function isPhoneFreeTierExhausted(phoneNumber) {
  if (!phoneNumber) return false
  const snap = await getDoc(doc(db, 'free_tier_by_phone', phoneNumber))
  return snap.exists()
}

export async function isDeviceFreeTierExhausted(deviceId) {
  if (!deviceId) return false
  const snap = await getDoc(doc(db, 'device_links', deviceId))
  return snap.exists() && snap.data().freeExhausted === true
}

/** Registra el dispositivo y, si aplica, bloquea una suscripción gratis nueva. */
export async function syncFreeTierOnLogin(uid, phoneNumber, subscription) {
  if (!uid || !subscription || subscription.planId !== 'gratis') return

  const deviceId = getDeviceId()
  const limit = DEFAULT_FREE_MOVEMENTS
  const usage = subscription.movementTotal ?? 0

  if (deviceId) {
    const devRef = doc(db, 'device_links', deviceId)
    const devSnap = await getDoc(devRef)
    if (devSnap.exists()) {
      await updateDoc(devRef, {
        uids: arrayUnion(uid),
        updatedAt: serverTimestamp(),
      })
    } else {
      await setDoc(devRef, {
        uids: [uid],
        freeExhausted: false,
        updatedAt: serverTimestamp(),
      })
    }
  }

  if (usage >= limit || subscription.freeTierBlocked) return

  let blockReason = null

  if (phoneNumber && await isPhoneFreeTierExhausted(phoneNumber)) {
    const reg = (await getDoc(doc(db, 'free_tier_by_phone', phoneNumber))).data()
    if (reg?.uid && reg.uid !== uid) blockReason = 'phone'
  }

  if (!blockReason && deviceId && await isDeviceFreeTierExhausted(deviceId)) {
    const dev = (await getDoc(doc(db, 'device_links', deviceId))).data()
    if (dev?.exhaustedUid && dev.exhaustedUid !== uid) blockReason = 'device'
  }

  if (!blockReason) return

  await updateDoc(doc(db, 'subscriptions', uid), {
    movementTotal: limit,
    freeTierBlocked: true,
    freeTierBlockedReason: blockReason,
    updatedAt: serverTimestamp(),
  })
}

/** Marca teléfono y dispositivo al consumir el último movimiento gratis. */
export async function markFreeTierExhausted(uid, phoneNumber, deviceId) {
  const ts = serverTimestamp()

  if (phoneNumber) {
    const phoneRef = doc(db, 'free_tier_by_phone', phoneNumber)
    const phoneSnap = await getDoc(phoneRef)
    if (!phoneSnap.exists()) {
      await setDoc(phoneRef, {
        uid,
        exhaustedAt: ts,
        movementLimit: DEFAULT_FREE_MOVEMENTS,
      })
    }
  }

  if (deviceId) {
    const devRef = doc(db, 'device_links', deviceId)
    const devSnap = await getDoc(devRef)
    if (devSnap.exists()) {
      await updateDoc(devRef, {
        freeExhausted: true,
        exhaustedUid: uid,
        uids: arrayUnion(uid),
        exhaustedAt: ts,
        updatedAt: ts,
      })
    } else {
      await setDoc(devRef, {
        uids: [uid],
        freeExhausted: true,
        exhaustedUid: uid,
        exhaustedAt: ts,
        updatedAt: ts,
      })
    }
  }
}

export function freeTierBlockedMessage(reason) {
  if (reason === 'phone') {
    return 'Este número ya usó los 270 movimientos gratis de Syng. Inicia sesión con tu cuenta original o elige un plan de pago.'
  }
  if (reason === 'device') {
    return 'En este dispositivo ya se agotó el plan Gratis. Inicia sesión con tu cuenta original o elige un plan de pago.'
  }
  return 'El plan Gratis ya no está disponible para esta cuenta. Elige un plan de pago para seguir organizándote.'
}

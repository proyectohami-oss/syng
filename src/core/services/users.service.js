/**
 * Users service — user document management + FCM token registration.
 *
 * FCM TOKEN STRATEGY
 * ─────────────────
 * Each user document stores a `fcmTokens` map:
 *   /users/{uid}.fcmTokens: Map<token, { platform, createdAt, updatedAt }>
 *
 * Why a map and not an array?
 *   - Map<token, metadata> allows updating a token's metadata without
 *     scanning the whole array.
 *   - Firestore field mask updates work cleanly: `fcmTokens.${token}`.
 *   - Deletion is O(1): remove the field, not filter an array.
 *   - A user can have up to ~10 devices (Firestore document 1MB limit
 *     is effectively unreachable with token maps).
 *
 * Token lifecycle (client side):
 *   1. User logs in → request notification permission → get token → saveFcmToken()
 *   2. onTokenRefresh fires → saveFcmToken() with the new token
 *      (old token stays in the map — Cloud Functions clean up stale tokens
 *       when FCM returns UNREGISTERED error on send)
 *   3. User logs out → removeFcmToken() with the current token
 *
 * Cloud Functions will read fcmTokens to know where to send notifications.
 * They will also delete stale tokens when FCM reports them as invalid.
 *
 * USER DOCUMENT SCHEMA (for reference):
 * ─────────────────────────────────────
 * /users/{uid}:
 *   uid:         string
 *   displayName: string
 *   email:       string
 *   groupIds:    string[]          ← denormalized for L4 listener bootstrap
 *   fcmTokens:   Map<token, {     ← populated by this service
 *                  platform:   'web' | 'ios' | 'android'
 *                  createdAt:  Timestamp
 *                  updatedAt:  Timestamp
 *                }>
 *   phoneNumber: string | null      ← formato E.164: +521234567890
 *   createdAt:   Timestamp
 *   updatedAt:   Timestamp
 */
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  deleteField,
  query,
  collection,
  where,
  getDocs,
  limit,
} from 'firebase/firestore'
import { db } from '../../firebase'

/**
 * Create or overwrite a user document on first login.
 * Safe to call on every login — uses setDoc with merge:true.
 */
export async function upsertUser({ uid, displayName, email }) {
  const userRef  = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid,
      displayName: displayName ?? '',
      email:       email ?? '',
      groupIds:    [],
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    }, { merge: true })
  } else {
    // Ya existe — solo actualizar nombre, email y timezone del dispositivo
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City'
    await updateDoc(userRef, {
      displayName: displayName ?? '',
      email:       email ?? '',
      timezone,
      updatedAt:   serverTimestamp(),
    })
  }
}

/**
 * Register an FCM token for this user and device.
 *
 * Uses Firestore field mask update so concurrent devices don't
 * overwrite each other's tokens.
 *
 * @param {string} uid
 * @param {string} token
 * @param {'web'|'ios'|'android'} platform
 */
export async function saveFcmToken(uid, token, platform = 'web') {
  await setDoc(doc(db, 'users', uid), {
    [`fcmTokens.${token}`]: {
      platform,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

/**
 * Remove a specific FCM token (on logout or token invalidation).
 *
 * @param {string} uid
 * @param {string} token
 */
export async function removeFcmToken(uid, token) {
  await setDoc(doc(db, 'users', uid), {
    [`fcmTokens.${token}`]: deleteField(),
    updatedAt:              serverTimestamp(),
  }, { merge: true })
}

/**
 * Obtiene el token FCM local (delegado a fcm.service).
 * @deprecated usar getFcmToken de fcm.service
 */
export async function getLocalFcmToken() {
  const { getFcmToken } = await import('../notifications/fcm.service')
  const r = await getFcmToken()
  return r.ok ? r.token : null
}

export async function getLocalFcmTokenResult() {
  const { getFcmToken } = await import('../notifications/fcm.service')
  return getFcmToken()
}

export async function syncFcmToken(uid) {
  const { syncFcmToken: sync } = await import('../notifications/fcm.service')
  return sync(uid)
}

/**
 * Update display name (e.g., after profile edit).
 * Also updates the displayName field in the user's member sub-docs
 * is NOT done here — that's done by a Cloud Function trigger on
 * /users/{uid} writes (future work, don't do it client-side to avoid
 * N writes to N group member sub-docs).
 */
export async function updateDisplayName(uid, displayName) {
  await updateDoc(doc(db, 'users', uid), {
    displayName: displayName.trim(),
    updatedAt:   serverTimestamp(),
  })
}

/**
 * Normaliza un número de teléfono a formato E.164.
 * Asume México (+52) si no tiene código de país.
 * Ejemplos:
 *   9611234567      → +529611234567
 *   529611234567    → +529611234567
 *   +529611234567   → +529611234567
 */
export function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('52') && digits.length === 12) return `+${digits}`
  if (digits.length === 10) return `+52${digits}`
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`
  return `+${digits}`
}

/**
 * Verifica si un número ya está registrado por otro usuario.
 * Retorna true si está ocupado, false si está disponible.
 */
export async function isPhoneTaken(phoneNumber, currentUid) {
  const q = query(
    collection(db, 'users'),
    where('phoneNumber', '==', phoneNumber),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return false
  // Si el único resultado es el mismo usuario, no está ocupado
  return snap.docs[0].id !== currentUid
}

/**
 * Guarda el número de teléfono normalizado en el perfil del usuario.
 * Lanza error si el número ya está en uso por otro usuario.
 */
export async function updatePhoneNumber(uid, rawPhone) {
  const phoneNumber = normalizePhone(rawPhone)
  const taken = await isPhoneTaken(phoneNumber, uid)
  if (taken) throw new Error('Este número ya está registrado en otra cuenta.')
  await updateDoc(doc(db, 'users', uid), {
    phoneNumber,
    updatedAt: serverTimestamp(),
  })
  return phoneNumber
}

/**
 * Busca un usuario por número de teléfono normalizado.
 * Retorna { uid, displayName, phoneNumber } o null si no existe.
 */
export async function findUserByPhone(rawPhone) {
  const phoneNumber = normalizePhone(rawPhone)
  const q = query(
    collection(db, 'users'),
    where('phoneNumber', '==', phoneNumber),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { uid: d.id, displayName: d.data().displayName, phoneNumber: d.data().phoneNumber }
}

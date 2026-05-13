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
 *   createdAt:   Timestamp
 *   updatedAt:   Timestamp
 */
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore'
import { db } from '../../firebase'

/**
 * Create or overwrite a user document on first login.
 * Safe to call on every login — uses setDoc with merge:true.
 */
export async function upsertUser({ uid, displayName, email }) {
  await setDoc(
    doc(db, 'users', uid),
    {
      uid,
      displayName: displayName ?? '',
      email:       email ?? '',
      groupIds:    [],
      fcmTokens:   {},
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    },
    { merge: true } // preserves existing groupIds and fcmTokens on re-login
  )
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
  await updateDoc(doc(db, 'users', uid), {
    [`fcmTokens.${token}`]: {
      platform,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  })
}

/**
 * Remove a specific FCM token (on logout or token invalidation).
 *
 * @param {string} uid
 * @param {string} token
 */
export async function removeFcmToken(uid, token) {
  await updateDoc(doc(db, 'users', uid), {
    [`fcmTokens.${token}`]: deleteField(),
    updatedAt:              serverTimestamp(),
  })
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

/**
 * FCM — registro de token y service worker (única fuente de verdad).
 *
 * Flujo:
 *   1. Usuario concede permiso → getToken con VAPID
 *   2. Firebase usa /firebase-messaging-sw.js para push
 *   3. Token se guarda en /users/{uid}.fcmTokens
 */
import { saveFcmToken, removeFcmToken } from '../services/users.service'

export const FCM_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY
  || 'BBCXfEUieJEA9wdUgmDjiqjpKeD2E4_IKrXQNgShgGKBeAt0Y0ty3krLN_aZ4MgDWoaPBWvaE5lY7IxPOyvNanA'

function platform() {
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return 'ios'
  if (/android/i.test(navigator.userAgent)) return 'android'
  return 'web'
}

export async function getFcmToken() {
  if (typeof Notification === 'undefined') return { ok: false, reason: 'unsupported' }
  if (Notification.permission !== 'granted') return { ok: false, reason: 'permission' }
  if (!('serviceWorker' in navigator)) return { ok: false, reason: 'unsupported' }

  try {
    const { getMessaging, getToken } = await import('firebase/messaging')
    const { app } = await import('../../firebase')
    const messaging = getMessaging(app)

    await navigator.serviceWorker.ready
    const token = await getToken(messaging, { vapidKey: FCM_VAPID_KEY })

    if (!token) return { ok: false, reason: 'empty' }
    return { ok: true, token }
  } catch (err) {
    console.error('[FCM] getToken:', err)
    return { ok: false, reason: err?.code || err?.message || 'error' }
  }
}

export async function syncFcmToken(uid) {
  if (!uid) return { ok: false, reason: 'no_uid' }
  const result = await getFcmToken()
  if (!result.ok) return result
  await saveFcmToken(uid, result.token, platform())
  return result
}

export async function unsyncFcmToken(uid) {
  if (!uid) return
  const result = await getFcmToken()
  if (result.ok) await removeFcmToken(uid, result.token)
}

export function recordatorioPath(data) {
  if (data?.url) {
    if (data.url.startsWith('http')) {
      try { return new URL(data.url).pathname } catch { return '/agenda' }
    }
    return data.url
  }
  if (data?.taskId) return `/recordatorio/${data.taskId}`
  return '/agenda'
}

/** Muestra notificación en primer plano vía firebase-messaging-sw.js (requerido en iOS). */
export async function showForegroundNotification(title, body, url, taskId) {
  if (!('serviceWorker' in navigator)) return false
  const reg = await navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope')
    || await navigator.serviceWorker.getRegistration('/')
  if (!reg?.active) return false
  reg.active.postMessage({ type: 'SHOW_NOTIFICATION', title, body, url, taskId })
  return true
}

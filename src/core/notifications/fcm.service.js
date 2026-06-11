/**
 * FCM — registro de token y service worker (única fuente de verdad).
 *
 * sw-v2.js = caché PWA (scope /)
 * firebase-messaging-sw.js = push (scope /firebase-cloud-messaging-push-scope)
 * Hay que registrar explícitamente el SW de FCM; si no, getToken usa sw-v2 y
 * el iPhone nunca recibe push (solo Avisos in-app).
 */
import { saveFcmToken, removeFcmToken } from '../services/users.service'

export const FCM_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY
  || 'BBCXfEUieJEA9wdUgmDjiqjpKeD2E4_IKrXQNgShgGKBeAt0Y0ty3krLN_aZ4MgDWoaPBWvaE5lY7IxPOyvNanA'

const FCM_SW_URL   = '/firebase-messaging-sw.js'
const FCM_SW_SCOPE = '/firebase-cloud-messaging-push-scope'

function platform() {
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return 'ios'
  if (/android/i.test(navigator.userAgent)) return 'android'
  return 'web'
}

/** Registra el SW dedicado de FCM (separado del sw-v2.js de caché). */
export async function getFcmSwRegistration() {
  if (!('serviceWorker' in navigator)) return null

  let reg = await navigator.serviceWorker.getRegistration(FCM_SW_SCOPE)
  if (reg?.active) return reg

  try {
    reg = await navigator.serviceWorker.register(FCM_SW_URL, { scope: FCM_SW_SCOPE })
  } catch (err) {
    console.error('[FCM] register failed:', err)
    return null
  }

  const sw = reg.installing || reg.waiting
  if (sw && !reg.active) {
    await new Promise((resolve) => {
      const t = setTimeout(resolve, 8000)
      sw.addEventListener('statechange', (e) => {
        if (e.target.state === 'activated') { clearTimeout(t); resolve() }
      })
    })
  }

  return reg
}

export async function getFcmToken() {
  if (typeof Notification === 'undefined') return { ok: false, reason: 'unsupported' }
  if (Notification.permission !== 'granted') return { ok: false, reason: 'permission' }
  if (!('serviceWorker' in navigator)) return { ok: false, reason: 'unsupported' }

  try {
    const swReg = await getFcmSwRegistration()
    if (!swReg) return { ok: false, reason: 'no_sw' }

    const { getMessaging, getToken } = await import('firebase/messaging')
    const { app } = await import('../../firebase')
    const messaging = getMessaging(app)

    const token = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    })

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
  const reg = await getFcmSwRegistration()
  if (!reg?.active) return false
  reg.active.postMessage({ type: 'SHOW_NOTIFICATION', title, body, url, taskId })
  return true
}

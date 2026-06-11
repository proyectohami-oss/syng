/**
 * FCM — Universo B: sw-v2.js (scope /) recibe push en iOS PWA.
 */
import { removeFcmToken, replaceFcmToken } from '../services/users.service'

export const FCM_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY
  || 'BBCXfEUieJEA9wdUgmDjiqjpKeD2E4_IKrXQNgShgGKBeAt0Y0ty3krLN_aZ4MgDWoaPBWvaE5lY7IxPOyvNanA'

const FCM_SW_URL    = '/sw-v2.js'
const FCM_SW_SCOPE  = '/'
const STALE_SCOPE   = '/firebase-cloud-messaging-push-scope'

let swRegCache     = null
let staleCleaned   = false
let lastSync       = { token: null, at: 0 }
const SYNC_TTL_MS  = 120_000

function platform() {
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return 'ios'
  if (/android/i.test(navigator.userAgent)) return 'android'
  return 'web'
}

async function unregisterStaleFcmSw() {
  if (staleCleaned) return
  staleCleaned = true
  try {
    const stale = await navigator.serviceWorker.getRegistration(STALE_SCOPE)
    if (stale) await stale.unregister()
  } catch { /* ignore */ }
}

async function waitForActiveWorker(reg, timeoutMs = 2500) {
  if (reg?.active) return reg
  const sw = reg?.installing || reg?.waiting
  if (!sw) return reg
  await Promise.race([
    new Promise((resolve) => {
      sw.addEventListener('statechange', (e) => {
        if (e.target.state === 'activated') resolve()
      }, { once: true })
    }),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ])
  return reg
}

export async function getFcmSwRegistration() {
  if (!('serviceWorker' in navigator)) return null
  if (swRegCache?.active) return swRegCache

  await unregisterStaleFcmSw()

  let reg = await navigator.serviceWorker.getRegistration(FCM_SW_SCOPE)
  if (reg?.active) {
    swRegCache = reg
    return reg
  }

  await navigator.serviceWorker.ready
  reg = await navigator.serviceWorker.getRegistration(FCM_SW_SCOPE)

  if (!reg?.active) {
    try {
      reg = reg || await navigator.serviceWorker.register(FCM_SW_URL, { scope: FCM_SW_SCOPE })
    } catch (err) {
      console.error('[FCM] register failed:', err)
      return null
    }
  }

  reg = await waitForActiveWorker(reg)
  if (reg?.active) swRegCache = reg
  return reg
}

export async function getFcmToken() {
  if (typeof Notification === 'undefined') return { ok: false, reason: 'unsupported' }
  if (Notification.permission !== 'granted') return { ok: false, reason: 'permission' }
  if (!('serviceWorker' in navigator)) return { ok: false, reason: 'unsupported' }

  try {
    const swReg = await getFcmSwRegistration()
    if (!swReg?.active) return { ok: false, reason: 'no_sw' }

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

export async function syncFcmToken(uid, { force = false } = {}) {
  if (!uid) return { ok: false, reason: 'no_uid' }
  if (!force && lastSync.token && Date.now() - lastSync.at < SYNC_TTL_MS) {
    return { ok: true, token: lastSync.token, cached: true }
  }
  const result = await getFcmToken()
  if (!result.ok) return result
  await replaceFcmToken(uid, result.token, platform())
  lastSync = { token: result.token, at: Date.now() }
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

export async function showForegroundNotification(title, body, url, taskId) {
  const reg = await getFcmSwRegistration()
  if (!reg?.active) return false
  reg.active.postMessage({ type: 'SHOW_NOTIFICATION', title, body, url, taskId })
  return true
}

export function isStandalonePwa() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

const PUSH_API = '/api/test-push'

export async function getPushDiagnostics(userData) {
  const permission = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  const tokenCount = userData?.fcmTokens ? Object.keys(userData.fcmTokens).length : 0
  let swOk = false
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration(FCM_SW_SCOPE)
    swOk = !!reg?.active
  }
  return {
    permission,
    standalone: isStandalonePwa(),
    swOk,
    swControlled: !!navigator.serviceWorker.controller,
    tokenCount,
    ios: /iphone|ipad|ipod/i.test(navigator.userAgent),
    universe: 'B',
  }
}

export async function sendTestPush(uid) {
  if (!uid) return { ok: false, reason: 'no_uid' }
  const sync = await syncFcmToken(uid)
  if (!sync.ok) return { ok: false, phase: 'sync', reason: sync.reason }

  try {
    const res = await fetch(PUSH_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId: uid, token: sync.token }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, phase: 'server', reason: data.reason || data.error || `http_${res.status}` }
    }
    return { ok: !!data.push, phase: 'server', ...data }
  } catch (err) {
    return { ok: false, phase: 'server', reason: err.message || 'network_error' }
  }
}

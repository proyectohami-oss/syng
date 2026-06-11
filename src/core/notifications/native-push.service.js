/**
 * Push nativo — Capacitor Android/iOS (FCM vía plugin oficial).
 * Prueba $0 en Samsung antes de pagar Apple/Google.
 */
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { replaceFcmToken, removeFcmToken } from '../services/users.service'
import { recordatorioPath } from './push-utils'

export function isNativeApp() {
  return Capacitor.isNativePlatform()
}

export function nativePlatform() {
  const p = Capacitor.getPlatform()
  if (p === 'ios') return 'ios'
  if (p === 'android') return 'android'
  return 'web'
}

let listenersBound = false
let pendingUid     = null
let lastNativeToken = null
let tokenWaiters   = []

function resolveToken(token) {
  lastNativeToken = token
  tokenWaiters.splice(0).forEach((fn) => fn(token))
}

function waitForNativeToken(ms = 8000) {
  if (lastNativeToken) return Promise.resolve(lastNativeToken)
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(lastNativeToken), ms)
    tokenWaiters.push((tok) => { clearTimeout(t); resolve(tok) })
  })
}

function bindNativeListeners(uid) {
  pendingUid = uid
  if (listenersBound) return
  listenersBound = true

  PushNotifications.addListener('registration', async (token) => {
    if (!token.value) return
    resolveToken(token.value)
    const id = pendingUid
    if (id) await replaceFcmToken(id, token.value, nativePlatform())
  })

  PushNotifications.addListener('registrationError', (err) => {
    console.error('[NativePush] registrationError:', err)
  })

  PushNotifications.addListener('pushNotificationReceived', (notif) => {
    console.debug('[NativePush] foreground:', notif)
  })

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const data = action.notification?.data || {}
    window.location.assign(recordatorioPath(data))
  })
}

export async function requestNativePushPermission(uid) {
  if (!isNativeApp()) return { ok: false, reason: 'not_native' }
  if (!uid) return { ok: false, reason: 'no_uid' }

  bindNativeListeners(uid)

  let perm = await PushNotifications.checkPermissions()
  if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
    perm = await PushNotifications.requestPermissions()
  }
  if (perm.receive !== 'granted') {
    return { ok: false, reason: perm.receive === 'denied' ? 'denied' : 'permission' }
  }

  await PushNotifications.register()
  const token = await waitForNativeToken()
  if (!token) return { ok: false, reason: 'empty' }
  return { ok: true, token }
}

export async function syncNativeFcmToken(uid) {
  if (!isNativeApp()) return { ok: false, reason: 'not_native' }
  if (!uid) return { ok: false, reason: 'no_uid' }

  bindNativeListeners(uid)

  const perm = await PushNotifications.checkPermissions()
  if (perm.receive !== 'granted') {
    return { ok: false, reason: perm.receive === 'denied' ? 'denied' : 'permission' }
  }

  await PushNotifications.register()
  const token = await waitForNativeToken()
  if (!token) return { ok: false, reason: 'empty' }
  return { ok: true, token }
}

export async function unsyncNativeFcmToken(uid) {
  if (uid && lastNativeToken) await removeFcmToken(uid, lastNativeToken)
}

export async function getNativePushDiagnostics(userData) {
  const perm = await PushNotifications.checkPermissions()
  const tokenCount = userData?.fcmTokens ? Object.keys(userData.fcmTokens).length : 0
  return {
    permission: perm.receive === 'granted' ? 'granted' : perm.receive === 'denied' ? 'denied' : 'default',
    standalone: true,
    swOk: true,
    swControlled: true,
    tokenCount,
    ios: Capacitor.getPlatform() === 'ios',
    universe: 'native',
    platform: nativePlatform(),
  }
}

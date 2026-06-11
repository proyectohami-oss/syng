/**
 * Hook del ciclo de vida FCM — web (PWA) o nativo (Capacitor).
 */
import { useState, useEffect, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import {
  syncFcmToken,
  unsyncFcmToken,
  showForegroundNotification,
  recordatorioPath,
} from './fcm.service'
import {
  isNativeApp,
  requestNativePushPermission,
  syncNativeFcmToken,
  unsyncNativeFcmToken,
} from './native-push.service'
import { useCoreState } from '../hooks/useCoreData'

let listenerReady = false

async function bindForegroundListener() {
  if (listenerReady || isNativeApp()) return
  const { getMessaging, onMessage, isSupported } = await import('firebase/messaging')
  const { app } = await import('../../firebase')
  if (!(await isSupported())) return

  listenerReady = true
  const messaging = getMessaging(app)

  onMessage(messaging, async (payload) => {
    const data = payload.data || {}
    const title = payload.notification?.title || data.title || '⏰ Recordatorio'
    const body  = payload.notification?.body  || data.body  || ''
    const path  = recordatorioPath(data)
    const taskId = data.taskId || ''

    const shown = await showForegroundNotification(title, body, path, taskId)
    if (!shown && typeof Notification !== 'undefined') {
      const n = new Notification(title, { body, icon: '/icon-192.png', tag: `syng-${taskId}` })
      n.onclick = () => { window.focus(); window.location.assign(path); n.close() }
    }
  })
}

async function readNativePermission() {
  const perm = await PushNotifications.checkPermissions()
  if (perm.receive === 'granted') return 'granted'
  if (perm.receive === 'denied') return 'denied'
  return 'default'
}

export function usePushNotifications() {
  const uid = useCoreState().auth.user?.uid ?? null
  const native = isNativeApp()
  const isSupported = native
    || (typeof Notification !== 'undefined' && 'serviceWorker' in navigator)

  const [permissionState, setPermissionState] = useState(() => {
    if (!isSupported) return 'unsupported'
    if (native) return 'default'
    return Notification.permission
  })

  useEffect(() => {
    if (!native) return
    readNativePermission().then(setPermissionState)
  }, [native])

  const persist = useCallback(async (force = false) => {
    if (!uid || !isSupported) return { ok: false, reason: 'unsupported' }
    if (native) {
      const result = await syncNativeFcmToken(uid)
      if (result.ok) setPermissionState('granted')
      return result
    }
    if (Notification.permission !== 'granted') {
      return { ok: false, reason: 'permission' }
    }
    const result = await syncFcmToken(uid, { force })
    if (result.ok) await bindForegroundListener()
    return result
  }, [uid, isSupported, native])

  useEffect(() => { persist() }, [persist])

  useEffect(() => {
    if (!uid || !isSupported || native) return
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Notification.permission === 'granted') {
        persist(false)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [uid, isSupported, native, persist])

  const resyncToken = useCallback(() => persist(true), [persist])

  const requestPermission = useCallback(async () => {
    if (!uid || !isSupported) return { ok: false, reason: 'unsupported' }
    if (native) {
      const result = await requestNativePushPermission(uid)
      setPermissionState(result.ok ? 'granted' : (result.reason === 'denied' ? 'denied' : 'default'))
      return result
    }
    const perm = await Notification.requestPermission()
    setPermissionState(perm)
    if (perm !== 'granted') return { ok: false, reason: perm }
    return persist(true)
  }, [uid, isSupported, native, persist])

  const disableNotifications = useCallback(async () => {
    if (!uid) return
    if (native) await unsyncNativeFcmToken(uid)
    else await unsyncFcmToken(uid)
  }, [uid, native])

  return {
    isSupported,
    permissionState,
    requestPermission,
    disableNotifications,
    resyncToken,
    isNative: native,
  }
}

/**
 * Hook del ciclo de vida FCM — delega todo a fcm.service.js
 */
import { useState, useEffect, useCallback } from 'react'
import {
  syncFcmToken,
  unsyncFcmToken,
  showForegroundNotification,
  recordatorioPath,
} from './fcm.service'
import { useCoreState } from '../hooks/useCoreData'

let listenerReady = false

async function bindForegroundListener() {
  if (listenerReady) return
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

export function usePushNotifications() {
  const uid = useCoreState().auth.user?.uid ?? null
  const isSupported = typeof Notification !== 'undefined' && 'serviceWorker' in navigator

  const [permissionState, setPermissionState] = useState(() =>
    !isSupported ? 'unsupported' : Notification.permission,
  )

  const persist = useCallback(async () => {
    if (!uid || !isSupported || Notification.permission !== 'granted') {
      return { ok: false, reason: 'permission' }
    }
    const result = await syncFcmToken(uid)
    if (result.ok) await bindForegroundListener()
    return result
  }, [uid, isSupported])

  useEffect(() => { persist() }, [persist])

  useEffect(() => {
    if (!uid || !isSupported) return
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Notification.permission === 'granted') persist()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [uid, isSupported, persist])

  const requestPermission = useCallback(async () => {
    if (!uid || !isSupported) return { ok: false, reason: 'unsupported' }
    const perm = await Notification.requestPermission()
    setPermissionState(perm)
    if (perm !== 'granted') return { ok: false, reason: perm }
    return persist()
  }, [uid, isSupported, persist])

  const disableNotifications = useCallback(async () => {
    if (uid) await unsyncFcmToken(uid)
  }, [uid])

  return {
    isSupported,
    permissionState,
    requestPermission,
    disableNotifications,
    resyncToken: persist,
  }
}

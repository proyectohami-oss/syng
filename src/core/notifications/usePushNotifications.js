/**
 * usePushNotifications — FCM token + avisos visibles (incluye iOS PWA).
 */
import { useState, useEffect, useCallback } from 'react'
import { syncFcmToken, removeFcmToken, getLocalFcmTokenResult } from '../services/users.service'
import { useCoreState } from '../hooks/useCoreData'

function recordatorioPath(data) {
  if (data?.url) {
    if (data.url.startsWith('http')) {
      try { return new URL(data.url).pathname } catch { return '/agenda' }
    }
    return data.url
  }
  if (data?.taskId) return `/recordatorio/${data.taskId}`
  return '/agenda'
}

let foregroundListenerBound = false

async function showViaServiceWorker(title, body, url, taskId) {
  if (!('serviceWorker' in navigator)) return false
  const reg = await navigator.serviceWorker.ready
  if (!reg.active) return false
  reg.active.postMessage({ type: 'SHOW_NOTIFICATION', title, body, url, taskId })
  return true
}

async function bindForegroundListener(onTap) {
  if (foregroundListenerBound) return
  const fcm = await getMessaging()
  if (!fcm) return
  foregroundListenerBound = true
  fcm.onMessage(fcm.messaging, async (payload) => {
    const data = payload.data || {}
    const title = payload.notification?.title || data.title || '⏰ Recordatorio'
    const body  = payload.notification?.body  || data.body  || ''
    const path  = recordatorioPath(data)
    const taskId = data.taskId || ''

    const shown = await showViaServiceWorker(title, body, path, taskId)
    if (!shown && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const n = new Notification(title, {
        body,
        icon: '/icon-192.png',
        tag: taskId ? `syng-reminder-${taskId}` : 'syng-notif',
        renotify: true,
      })
      n.onclick = () => { window.focus(); onTap(path); n.close() }
    }
  })
}

async function getMessaging() {
  const { getMessaging: getFCMMessaging, onMessage, isSupported } = await import('firebase/messaging')
  const { app } = await import('../../firebase')
  if (!(await isSupported())) return null
  return { messaging: getFCMMessaging(app), onMessage }
}

export function usePushNotifications() {
  const state = useCoreState()
  const uid   = state.auth.user?.uid ?? null

  const isSupported = typeof Notification !== 'undefined' && 'serviceWorker' in navigator

  const [permissionState, setPermissionState] = useState(() => {
    if (!isSupported) return 'unsupported'
    return Notification.permission
  })

  useEffect(() => {
    if (!isSupported) return
    setPermissionState(Notification.permission)
  }, [isSupported])

  const persistToken = useCallback(async () => {
    if (!uid || !isSupported || Notification.permission !== 'granted') {
      return { ok: false, reason: 'permission' }
    }
    try {
      const result = await syncFcmToken(uid)
      if (result.ok) {
        await bindForegroundListener((path) => {
          window.location.assign(path)
        })
      }
      return result
    } catch (error) {
      console.error('[FCM] persistToken error:', error)
      return { ok: false, reason: 'error' }
    }
  }, [uid, isSupported])

  useEffect(() => {
    persistToken()
  }, [persistToken])

  useEffect(() => {
    if (!uid || !isSupported) return
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Notification.permission === 'granted') {
        persistToken()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [uid, isSupported, persistToken])

  const requestPermission = useCallback(async () => {
    if (!uid || !isSupported) return { ok: false, reason: 'unsupported' }
    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission)
      if (permission !== 'granted') return { ok: false, reason: permission }
      return persistToken()
    } catch (error) {
      console.error('[FCM] requestPermission error:', error)
      return { ok: false, reason: 'error' }
    }
  }, [uid, isSupported, persistToken])

  const disableNotifications = useCallback(async () => {
    if (!uid || !isSupported) return
    try {
      const result = await getLocalFcmTokenResult()
      if (result.ok) await removeFcmToken(uid, result.token)
    } catch (error) {
      console.error('[FCM] disableNotifications error:', error)
    }
  }, [uid, isSupported])

  return { isSupported, permissionState, requestPermission, disableNotifications, resyncToken: persistToken }
}

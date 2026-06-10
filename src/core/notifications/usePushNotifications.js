/**
 * usePushNotifications — FCM token + avisos visibles en primer plano.
 */
import { useState, useEffect, useCallback } from 'react'
import { syncFcmToken, removeFcmToken, getLocalFcmToken } from '../services/users.service'
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

async function bindForegroundListener(onTap) {
  if (foregroundListenerBound) return
  const fcm = await getMessaging()
  if (!fcm) return
  foregroundListenerBound = true
  fcm.onMessage(fcm.messaging, (payload) => {
    showForegroundNotification(payload, onTap)
  })
}

function showForegroundNotification(payload, onTap) {
  const data = payload.data || {}
  const title = payload.notification?.title || data.title || '⏰ Recordatorio'
  const body  = payload.notification?.body  || data.body  || ''
  const path  = recordatorioPath(data)

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    const n = new Notification(title, {
      body,
      icon: '/icon-192.png',
      tag: data.taskId ? `syng-reminder-${data.taskId}` : 'syng-notif',
      renotify: true,
    })
    n.onclick = () => { window.focus(); onTap(path); n.close() }
    return
  }
  onTap(path)
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
    if (!uid || !isSupported || Notification.permission !== 'granted') return null
    try {
      const token = await syncFcmToken(uid)
      if (token) {
        await bindForegroundListener((path) => {
          window.location.assign(path)
        })
      }
      return token
    } catch (error) {
      console.error('[FCM] persistToken error:', error)
      return null
    }
  }, [uid, isSupported])

  useEffect(() => { persistToken() }, [persistToken])

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
    if (!uid || !isSupported) return
    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission)
      if (permission !== 'granted') return
      await persistToken()
    } catch (error) {
      console.error('[FCM] requestPermission error:', error)
    }
  }, [uid, isSupported, persistToken])

  const disableNotifications = useCallback(async () => {
    if (!uid || !isSupported) return
    try {
      const token = await getLocalFcmToken()
      if (token) await removeFcmToken(uid, token)
    } catch (error) {
      console.error('[FCM] disableNotifications error:', error)
    }
  }, [uid, isSupported])

  return { isSupported, permissionState, requestPermission, disableNotifications }
}

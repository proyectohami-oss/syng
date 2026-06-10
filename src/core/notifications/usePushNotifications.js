/**
 * usePushNotifications — client-side FCM token lifecycle management.
 */
import { useState, useEffect, useCallback } from 'react'
import { syncFcmToken, removeFcmToken, getLocalFcmToken } from '../services/users.service'
import { useCoreState }                   from '../hooks/useCoreData'

async function getMessaging() {
  const { getMessaging: getFCMMessaging, onMessage } = await import('firebase/messaging')
  const { app } = await import('../../firebase')
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
        console.log('[FCM] token guardado en Firestore')
        const { messaging, onMessage } = await getMessaging()
        onMessage(messaging, (payload) => {
          console.debug('[FCM] Foreground message:', payload)
        })
      }
      return token
    } catch (error) {
      console.error('[FCM] persistToken error:', error)
      return null
    }
  }, [uid, isSupported])

  // Sincroniza token al iniciar sesión o cuando el permiso ya está otorgado
  useEffect(() => {
    persistToken()
  }, [persistToken])

  // Re-sincroniza si el token rota mientras la app está en background
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

  return {
    isSupported,
    permissionState,
    requestPermission,
    disableNotifications,
  }
}

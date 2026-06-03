/**
 * usePushNotifications — client-side FCM token lifecycle management.
 *
 * CURRENT STATE: Ready to activate. The hook exists and handles
 * the full token lifecycle, but does NOT auto-request permission.
 * Permission must be explicitly requested by the user (via a button
 * in settings or a contextual prompt after a relevant action).
 *
 * WHY NOT AUTO-REQUEST:
 *   Browsers show the permission dialog once. If the user denies it,
 *   it can never be re-requested programmatically. Asking too early
 *   (e.g., on first login) kills the chance permanently. The right
 *   moment is when the user has received value and understands why
 *   notifications are useful (e.g., after joining their first group,
 *   or after being assigned a task).
 *
 * HOW TO USE (when ready to integrate):
 *
 *   // In a settings screen or contextual prompt:
 *   const { requestPermission, permissionState, isSupported } = usePushNotifications()
 *
 *   if (!isSupported) return null
 *   if (permissionState === 'granted') return <NotificationsEnabledBadge />
 *
 *   return (
 *     <button onClick={requestPermission}>
 *       Activar notificaciones
 *     </button>
 *   )
 */
import { useState, useEffect, useCallback } from 'react'
import { saveFcmToken, removeFcmToken }      from '../services/users.service'
import { useCoreState }                      from '../hooks/useCoreData'

async function getMessaging() {
  const { getMessaging: getFCMMessaging, getToken, onMessage } = await import('firebase/messaging')
  const { app } = await import('../../firebase')
  return { messaging: getFCMMessaging(app), getToken, onMessage }
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

export function usePushNotifications() {
  const state = useCoreState()
  const uid   = state.auth.user?.uid ?? null

  const isSupported = typeof Notification !== 'undefined' && 'serviceWorker' in navigator

  const [permissionState, setPermissionState] = useState(() => {
    if (!isSupported) return 'unsupported'
    return Notification.permission
  })

  // Mantiene permissionState sincronizado con el estado real del navegador
  useEffect(() => {
    if (!isSupported) return
    setPermissionState(Notification.permission)
  }, [isSupported])

  // AUTO-SYNC TOKEN: Si el permiso ya está otorgado, recupera y guarda el token silenciosamente
  useEffect(() => {
    const syncTokenSilently = async () => {
      if (!uid || !isSupported || Notification.permission !== 'granted') return

      try {
        const { messaging, getToken, onMessage } = await getMessaging()
        const swReg = await navigator.serviceWorker.getRegistration()
        const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })

        console.log('[FCM] token obtenido:', token ? token.substring(0,20)+'...' : 'NULO')
        if (token) {
          await saveFcmToken(uid, token, 'web')
          console.log('[FCM] token guardado en Firestore')

          onMessage(messaging, (payload) => {
            console.debug('[FCM] Foreground message:', payload)
          })
        } else {
          console.warn('[FCM] No token received silently — check VAPID key')
        }
      } catch (error) {
        console.error('[FCM] Error in silent token synchronization:', error)
      }
    }

    syncTokenSilently()
  }, [uid, isSupported])

  // Solicita permiso explícitamente — solo llamar desde un gesto del usuario
  const requestPermission = useCallback(async () => {
    if (!uid || !isSupported) return

    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission)

      if (permission !== 'granted') return

      const { messaging, getToken, onMessage } = await getMessaging()

      const swReg = await navigator.serviceWorker.getRegistration()
        const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })
      if (!token) {
        console.warn('[FCM] No token received — check VAPID key and service worker')
        return
      }

      await saveFcmToken(uid, token, 'web')

      onMessage(messaging, (payload) => {
        console.debug('[FCM] Foreground message:', payload)
      })

    } catch (error) {
      console.error('[FCM] requestPermission error:', error)
    }
  }, [uid, isSupported])

  // Elimina el token al cerrar sesión o desactivar notificaciones
  const disableNotifications = useCallback(async () => {
    if (!uid || !isSupported) return
    try {
      const { messaging, getToken } = await getMessaging()
      const swReg = await navigator.serviceWorker.getRegistration()
        const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })
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

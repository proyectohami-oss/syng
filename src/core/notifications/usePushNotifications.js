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
 *
 * SETUP REQUIRED (before activating):
 *   1. Add VITE_FIREBASE_VAPID_KEY to .env
 *   2. Create public/firebase-messaging-sw.js (see template below)
 *   3. Call initializeNotifications() in firebase.js
 *
 * SERVICE WORKER TEMPLATE (public/firebase-messaging-sw.js):
 *   importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js')
 *   importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-messaging-compat.js')
 *   firebase.initializeApp({ ... }) // same config as firebase.js
 *   const messaging = firebase.messaging()
 *   messaging.onBackgroundMessage((payload) => {
 *     const { title, body } = payload.notification
 *     self.registration.showNotification(title, { body, icon: '/icon-192.png' })
 *   })
 */
import { useState, useEffect, useCallback } from 'react'
import { saveFcmToken, removeFcmToken }      from '../services/users.service'
import { useCoreState }                      from '../hooks/useCoreData'

/**
 * Lazily initialize Firebase Messaging to avoid importing it in the
 * main bundle (it's large and only needed when notifications are used).
 */
async function getMessaging() {
  const { getMessaging: getFCMMessaging, getToken, onMessage } = await import('firebase/messaging')
  const { app } = await import('../../firebase')
  return { messaging: getFCMMessaging(app), getToken, onMessage }
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

/**
 * @returns {{
 *   isSupported:      boolean,
 *   permissionState:  'default' | 'granted' | 'denied' | 'unsupported',
 *   requestPermission: () => Promise<void>,
 *   disableNotifications: () => Promise<void>,
 * }}
 */
export function usePushNotifications() {
  const state = useCoreState()
  const uid   = state.auth.user?.uid ?? null

  const isSupported = typeof Notification !== 'undefined' && 'serviceWorker' in navigator

  const [permissionState, setPermissionState] = useState(() => {
    if (!isSupported) return 'unsupported'
    return Notification.permission
  })

  // Keep permissionState in sync if user changes it in browser settings
  useEffect(() => {
    if (!isSupported) return
    setPermissionState(Notification.permission)
  }, [isSupported])

  /**
   * Request notification permission, get the FCM token,
   * and save it to Firestore.
   *
   * Call this in response to a user gesture (button click).
   * Never call on mount or login.
   */
  const requestPermission = useCallback(async () => {
    if (!uid || !isSupported) return

    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission)

      if (permission !== 'granted') return

      const { messaging, getToken, onMessage } = await getMessaging()

      const token = await getToken(messaging, { vapidKey: VAPID_KEY })
      if (!token) {
        console.warn('[FCM] No token received — check VAPID key and service worker')
        return
      }

      await saveFcmToken(uid, token, 'web')

      // Handle foreground messages (when app is open)
      // The actual notification display is handled by the service worker
      // when the app is in the background. For foreground, we dispatch
      // an in-app notification (future work: in-app notification center).
      onMessage(messaging, (payload) => {
        console.debug('[FCM] Foreground message:', payload)
        // TODO: dispatch in-app notification to CoreDataProvider
        // dispatch({ type: CORE_ACTIONS.NOTIFICATION_RECEIVED, payload })
      })

    } catch (error) {
      console.error('[FCM] requestPermission error:', error)
    }
  }, [uid, isSupported])

  /**
   * Remove this device's FCM token from Firestore.
   * Call on user logout or when user explicitly disables notifications.
   */
  const disableNotifications = useCallback(async () => {
    if (!uid || !isSupported) return
    try {
      const { messaging, getToken } = await getMessaging()
      const token = await getToken(messaging, { vapidKey: VAPID_KEY })
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

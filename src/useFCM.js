import { useEffect } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const VAPID_KEY = 'BNF4yjw5yr-itnHTX7B8Qq5PnNxtnXz8l6lluP4BXoHWtg0Nihfx_yAFpa8czJDezqK1ivw1dFkqgbzrxrKGMck'

export function useFCM(userId) {
  useEffect(() => {
    if (!userId) return
    if (!('Notification' in window)) return
    if (!('serviceWorker' in navigator)) return

    const init = async () => {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const messaging = getMessaging()
        const token = await getToken(messaging, { vapidKey: VAPID_KEY })
        if (!token) return

        await setDoc(
          doc(db, 'users', userId, 'fcmTokens', token.slice(-20)),
          { token, userId, updatedAt: Date.now() }
        )

        onMessage(messaging, payload => {
          const { title, body } = payload.notification || {}
          if (title) new Notification(title, { body, icon: '/icon-192.png' })
        })
      } catch(e) {
        console.log('FCM:', e.message)
      }
    }

    init()
  }, [userId])
}

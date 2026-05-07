import { useEffect } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const VAPID_PUBLIC = 'BKx2pFxMDsfFy1MT6-r-BAtt52b-xJ9V_uOER1HMGKgBQR0SRgcTlUhxrjqMtnRncEmd5yLRVsecxPJMUuYHXqc'

function urlBase64ToUint8Array(base64) {
  const pad = '='.repeat((4 - base64.length % 4) % 4)
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function useFCM(userId) {
  useEffect(() => {
    if (!userId) return
    if (!('Notification' in window)) return
    if (!('serviceWorker' in navigator)) return
    if (!('PushManager' in window)) return

    const init = async () => {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const reg = await navigator.serviceWorker.ready
        let sub = await reg.pushManager.getSubscription()
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
          })
        }

        const p256dh = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh'))))
        const auth = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth'))))

        await setDoc(doc(db, 'users', userId, 'pushSubs', userId), {
          endpoint: sub.endpoint,
          keys: { p256dh, auth },
          userId,
          updatedAt: Date.now()
        })
        console.log('✅ Push subscription guardada')
      } catch(e) {
        console.log('Push error:', e.message)
      }
    }

    init()
  }, [userId])
}

import { useCallback } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase'
import { isNativeApp } from '../core/notifications/native-push.service'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export function isStandalonePwa() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

export function isIOSWeb() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isAndroidWeb() {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

/**
 * Web/PWA: popup en desktop. Android: popup primero (evita bucle redirect). Nativa: redirect.
 */
export function beginGoogleSignIn() {
  if (isNativeApp()) {
    return signInWithRedirect(auth, googleProvider).then(() => ({ redirected: true }))
  }

  if (isAndroidWeb()) {
    return signInWithPopup(auth, googleProvider)
      .then((result) => {
        sessionStorage.setItem('justLoggedIn', '1')
        return { redirected: false, user: result.user }
      })
      .catch((err) => {
        console.warn('[Auth] Android popup falló, intentando redirect:', err?.code)
        return signInWithRedirect(auth, googleProvider).then(() => ({ redirected: true }))
      })
  }

  const popup = signInWithPopup(auth, googleProvider).then((result) => {
    sessionStorage.setItem('justLoggedIn', '1')
    return { redirected: false, user: result.user }
  })

  if (!isStandalonePwa()) return popup

  // PWA iOS: popup; redirect solo si no es iPhone (Safari ITP rompía el estado).
  return popup.catch((err) => {
    if (isIOSWeb()) throw err
    console.warn('[Auth] popup en PWA falló, intentando redirect:', err?.code)
    return signInWithRedirect(auth, googleProvider).then(() => ({ redirected: true }))
  })
}

export function useAuthActions() {

  const signInWithEmail = useCallback(async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    sessionStorage.setItem('justLoggedIn', '1')
    return result.user
  }, [])

  const signUpWithEmail = useCallback(async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName: displayName.trim() })
    sessionStorage.setItem('justLoggedIn', '1')
    return result.user
  }, [])

  const signOut = useCallback(async () => {
    try {
      const { isNativeApp, unsyncNativeFcmToken } = await import('../core/notifications/native-push.service')
      if (isNativeApp()) {
        if (auth.currentUser) await unsyncNativeFcmToken(auth.currentUser.uid)
      } else {
        const { unsyncFcmToken } = await import('../core/notifications/fcm.service')
        if (auth.currentUser) await unsyncFcmToken(auth.currentUser.uid)
      }
    } catch (_) {}
    await firebaseSignOut(auth)
  }, [])

  return { beginGoogleSignIn, signInWithEmail, signUpWithEmail, signOut, isStandalonePwa }
}

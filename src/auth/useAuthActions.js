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

const googleProvider = new GoogleAuthProvider()

export function isStandalonePwa() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

/**
 * Inicia Google Sign-In de forma SÍNCRONA (requerido en iOS Safari).
 * PWA instalada: popup primero (redirect falla en iOS), luego redirect.
 */
export function beginGoogleSignIn() {
  const popup = signInWithPopup(auth, googleProvider).then((result) => {
    sessionStorage.setItem('justLoggedIn', '1')
    return { redirected: false, user: result.user }
  })

  if (!isStandalonePwa()) return popup

  // App instalada: popup primero; si falla ("Unable to process request"), redirect
  return popup.catch((err) => {
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
      const { unsyncFcmToken } = await import('../core/notifications/fcm.service')
      if (auth.currentUser) await unsyncFcmToken(auth.currentUser.uid)
    } catch (_) {}
    await firebaseSignOut(auth)
  }, [])

  return { beginGoogleSignIn, signInWithEmail, signUpWithEmail, signOut, isStandalonePwa }
}

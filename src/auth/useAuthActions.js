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

function isStandalonePwa() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

export function useAuthActions() {

  /** @returns {{ redirected: true } | { redirected: false, user }} */
  const signInWithGoogle = useCallback(async () => {
    // Solo la app instalada en iPhone necesita redirect (popup da "Unable to process request")
    if (isStandalonePwa()) {
      await signInWithRedirect(auth, googleProvider)
      return { redirected: true }
    }
    const result = await signInWithPopup(auth, googleProvider)
    sessionStorage.setItem('justLoggedIn', '1')
    return { redirected: false, user: result.user }
  }, [])

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

  return { signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }
}

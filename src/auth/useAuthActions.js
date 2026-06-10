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

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function isStandalonePwa() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

/** iOS (Safari o app instalada) necesita redirect; popup falla o no persiste sesión. */
function needsGoogleRedirect() {
  return isIOS() || isStandalonePwa()
}

export function useAuthActions() {

  /** @returns {{ redirected: true } | { redirected: false, user }} */
  const signInWithGoogle = useCallback(async () => {
    if (needsGoogleRedirect()) {
      await signInWithRedirect(auth, googleProvider)
      return { redirected: true }
    }
    try {
      const result = await signInWithPopup(auth, googleProvider)
      sessionStorage.setItem('justLoggedIn', '1')
      return { redirected: false, user: result.user }
    } catch (err) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, googleProvider)
        return { redirected: true }
      }
      throw err
    }
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

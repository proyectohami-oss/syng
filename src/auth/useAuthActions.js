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

/**
 * Inicia Google Sign-In de forma SÍNCRONA (requerido en iOS Safari).
 * NO usar async/await antes de signInWithPopup — iOS bloquea el popup.
 *
 * @returns {Promise<{ redirected: boolean, user? }>}
 */
export function beginGoogleSignIn() {
  // Solo la app instalada en pantalla de inicio usa redirect
  if (isStandalonePwa()) {
    return signInWithRedirect(auth, googleProvider).then(() => ({ redirected: true }))
  }
  // Safari normal: popup (redirect falla por bloqueo cross-site de Apple)
  return signInWithPopup(auth, googleProvider).then((result) => {
    sessionStorage.setItem('justLoggedIn', '1')
    return { redirected: false, user: result.user }
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

  return { beginGoogleSignIn, signInWithEmail, signUpWithEmail, signOut }
}

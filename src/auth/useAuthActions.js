import { useCallback }                          from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
}                                               from 'firebase/auth'
import { auth }                                 from '../firebase'

const googleProvider = new GoogleAuthProvider()

/**
 * Detecta si el dispositivo es móvil/tablet.
 * En móvil usamos signInWithRedirect (más compatible).
 * En desktop usamos signInWithPopup (más conveniente).
 */
function isMobile() {
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i
    .test(navigator.userAgent)
}

function isStandalonePwa() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

export function useAuthActions() {

  const signInWithGoogle = useCallback(async () => {
    // iPhone/iPad instalado: popup falla con "Unable to process request" → redirect
    if (isMobile() || isStandalonePwa()) {
      await signInWithRedirect(auth, googleProvider)
      return null
    }
    const result = await signInWithPopup(auth, googleProvider)
    sessionStorage.setItem('justLoggedIn', '1')
    return result.user
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
      const { removeFcmToken, getLocalFcmToken } = await import('../core/services/users.service')
      if (auth.currentUser) {
        const token = await getLocalFcmToken()
        if (token) await removeFcmToken(auth.currentUser.uid, token)
      }
    } catch (_) { /* FCM no configurado aún */ }
    await firebaseSignOut(auth)
  }, [])

  return { signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }
}

import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { CORE_ACTIONS } from '../store/coreActions'
import { upsertUser } from '../services/users.service'
import { consumeGoogleRedirect, notifyAuthBootstrapped } from '../../auth/authBootstrap'

function dispatchUserData(dispatch, snap, firebaseUser) {
  if (snap?.exists()) {
    dispatch({
      type:     CORE_ACTIONS.SET_USER_DATA,
      userData: { id: snap.id, ...snap.data() },
    })
    return
  }
  dispatch({
    type:     CORE_ACTIONS.SET_USER_DATA,
    userData: {
      uid:         firebaseUser.uid,
      displayName: firebaseUser.displayName ?? '',
      email:       firebaseUser.email ?? '',
      phoneNumber: null,
    },
  })
}

async function loadUserProfile(dispatch, firebaseUser, onSnapshotReady) {
  dispatch({ type: CORE_ACTIONS.SET_AUTH_USER, user: firebaseUser })
  // Fallback inmediato — nunca bloquear la entrada por red lenta
  dispatchUserData(dispatch, null, firebaseUser)

  onSnapshotReady(firebaseUser)

  upsertUser({
    uid:         firebaseUser.uid,
    displayName: firebaseUser.displayName ?? '',
    email:       firebaseUser.email       ?? '',
  }).catch(error => console.error('[UserListener] upsertUser:', error))

  if (Capacitor.isNativePlatform()) {
    import('../notifications/fcm.service')
      .then(({ syncFcmToken }) => syncFcmToken(firebaseUser.uid))
      .catch(err => console.error('[UserListener] syncFcmToken:', err))
  } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    import('../notifications/fcm.service')
      .then(({ syncFcmToken }) => syncFcmToken(firebaseUser.uid))
      .catch(err => console.error('[UserListener] syncFcmToken:', err))
  }
}

export function useUserListener(dispatch) {
  const unsubUserDocRef = useRef(null)
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let bootDone = false
    function markBootstrapped() {
      if (bootDone) return
      bootDone = true
      notifyAuthBootstrapped()
    }

    const bootTimeoutRef = { id: null }

    let unsubAuth = null

    ;(async () => {
      try {
        await consumeGoogleRedirect()
      } catch (_) {}

      if (cancelled) return

      bootTimeoutRef.id = setTimeout(() => {
        if (bootstrappedRef.current) return
        bootstrappedRef.current = true
        markBootstrapped()
        dispatch({ type: CORE_ACTIONS.AUTH_BOOT_TIMEOUT })
      }, 3000)

      unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (bootTimeoutRef.id) clearTimeout(bootTimeoutRef.id)
        if (!bootstrappedRef.current) {
          bootstrappedRef.current = true
          markBootstrapped()
        }

        if (unsubUserDocRef.current) {
          unsubUserDocRef.current()
          unsubUserDocRef.current = null
        }

        if (!firebaseUser) {
          dispatch({ type: CORE_ACTIONS.SET_AUTH_USER, user: null })
          dispatch({ type: CORE_ACTIONS.SET_USER_DATA, userData: null })
          return
        }

        loadUserProfile(dispatch, firebaseUser, (user) => {
          unsubUserDocRef.current = onSnapshot(
            doc(db, 'users', user.uid),
            (snap) => dispatchUserData(dispatch, snap, user),
            (error) => console.error('[UserListener] snapshot:', error),
          )
        })
      })
    })()

    return () => {
      cancelled = true
      if (bootTimeoutRef.id) clearTimeout(bootTimeoutRef.id)
      unsubAuth?.()
      if (unsubUserDocRef.current) {
        unsubUserDocRef.current()
        unsubUserDocRef.current = null
      }
    }
  }, [dispatch])
}

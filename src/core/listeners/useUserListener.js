import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot, getDoc } from 'firebase/firestore'
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

async function loadUserProfile(dispatch, firebaseUser) {
  dispatch({ type: CORE_ACTIONS.SET_AUTH_USER, user: firebaseUser })
  try {
    await upsertUser({
      uid:         firebaseUser.uid,
      displayName: firebaseUser.displayName ?? '',
      email:       firebaseUser.email       ?? '',
    })
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
    dispatchUserData(dispatch, snap, firebaseUser)
  } catch (error) {
    console.error('[UserListener] upsertUser:', error)
    dispatchUserData(dispatch, null, firebaseUser)
  }
  if (Capacitor.isNativePlatform()) {
    import('../notifications/fcm.service')
      .then(({ syncFcmToken }) => syncFcmToken(firebaseUser.uid))
      .catch(err => console.error('[UserListener] syncFcmToken:', err))
  }
}

export function useUserListener(dispatch) {
  const unsubUserDocRef = useRef(null)
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    let unsubAuth = () => {}

    async function init() {
      await consumeGoogleRedirect()

      unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!bootstrappedRef.current) {
          bootstrappedRef.current = true
          notifyAuthBootstrapped()
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

        await loadUserProfile(dispatch, firebaseUser)

        unsubUserDocRef.current = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => dispatchUserData(dispatch, snap, firebaseUser),
          (error) => console.error('[UserListener] snapshot:', error),
        )
      })
    }

    init()

    return () => {
      unsubAuth()
      if (unsubUserDocRef.current) {
        unsubUserDocRef.current()
        unsubUserDocRef.current = null
      }
    }
  }, [dispatch])
}

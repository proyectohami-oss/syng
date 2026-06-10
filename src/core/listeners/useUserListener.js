import { useEffect, useRef } from 'react'
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth'
import { doc, onSnapshot, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { CORE_ACTIONS } from '../store/coreActions'
import { upsertUser } from '../services/users.service'

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

export function useUserListener(dispatch) {
  const unsubUserDocRef = useRef(null)

  useEffect(() => {
    let unsubAuth = () => {}
    let cancelled = false

    async function init() {
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) sessionStorage.setItem('justLoggedIn', '1')
      } catch (err) {
        console.error('[UserListener] getRedirectResult:', err)
      }

      if (cancelled) return

      unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (unsubUserDocRef.current) {
          unsubUserDocRef.current()
          unsubUserDocRef.current = null
        }

        if (!firebaseUser) {
          dispatch({ type: CORE_ACTIONS.SET_AUTH_USER, user: null })
          dispatch({ type: CORE_ACTIONS.SET_USER_DATA, userData: null })
          return
        }

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

        // FCM después de userData — no bloquea el login
        import('../notifications/fcm.service')
          .then(({ syncFcmToken }) => syncFcmToken(firebaseUser.uid))
          .catch(err => console.error('[UserListener] syncFcmToken:', err))

        unsubUserDocRef.current = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => dispatchUserData(dispatch, snap, firebaseUser),
          (error) => console.error('[UserListener] snapshot:', error),
        )
      })
    }

    init()

    return () => {
      cancelled = true
      unsubAuth()
      if (unsubUserDocRef.current) {
        unsubUserDocRef.current()
        unsubUserDocRef.current = null
      }
    }
  }, [dispatch])
}

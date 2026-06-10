import { useEffect, useRef } from 'react'
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { CORE_ACTIONS } from '../store/coreActions'
import { upsertUser } from '../services/users.service'
import { syncFcmToken } from '../notifications/fcm.service'

export function useUserListener(dispatch) {
  const unsubUserDocRef = useRef(null)

  useEffect(() => {
    let unsubAuth = () => {}

    async function init() {
      // Procesar redirect de Google ANTES de escuchar auth (crítico en iOS PWA)
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) sessionStorage.setItem('justLoggedIn', '1')
      } catch (err) {
        console.error('[UserListener] getRedirectResult:', err)
      }

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
          syncFcmToken(firebaseUser.uid).catch(err => {
            console.error('[UserListener] syncFcmToken:', err)
          })
        } catch (error) {
          console.error('[UserListener] upsertUser:', error)
        }

        unsubUserDocRef.current = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              dispatch({
                type:     CORE_ACTIONS.SET_USER_DATA,
                userData: { id: snap.id, ...snap.data() },
              })
            }
          },
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

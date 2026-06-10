import { useEffect, useRef }         from 'react'
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth'
import { doc, onSnapshot }           from 'firebase/firestore'
import { auth, db }                  from '../../firebase'
import { CORE_ACTIONS }              from '../store/coreActions'
import { upsertUser, syncFcmToken }  from '../services/users.service'

export function useUserListener(dispatch) {
  const unsubUserDocRef = useRef(null)

  useEffect(() => {
    /**
     * Manejar resultado del redirect de Google Sign-In en móvil.
     * getRedirectResult() resuelve con el usuario si viene de un redirect,
     * o con null si no hay redirect pendiente. Es seguro llamarlo siempre.
     */
    getRedirectResult(auth).catch(err => {
      // Error en el redirect (ej. popup cerrado, dominio no autorizado)
      console.error('[UserListener] getRedirectResult error:', err)
    })

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
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
          console.error('[UserListener] syncFcmToken failed:', err)
        })
      } catch (error) {
        console.error('[UserListener] upsertUser failed:', error)
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
        (error) => {
          console.error('[UserListener] snapshot error:', error)
        }
      )
    })

    return () => {
      unsubAuth()
      if (unsubUserDocRef.current) {
        unsubUserDocRef.current()
        unsubUserDocRef.current = null
      }
    }
  }, [dispatch])
}

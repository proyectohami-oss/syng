/**
 * Listener L2 — personal tasks for the authenticated user.
 *
 * Query: tasks WHERE ownerId == uid AND type == 'personal' AND isDeleted == false
 *
 * Uses docChanges() to patch the state Map incrementally,
 * so only changed documents trigger re-renders.
 */
import { useEffect, useRef } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { CORE_ACTIONS } from '../store/coreActions'

export function usePersonalTasksListener(uid, dispatch) {
  const unsubRef = useRef(null)

  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }

    if (!uid) {
      dispatch({ type: CORE_ACTIONS.SET_TASKS_LOADING, loading: false })
      return
    }

    dispatch({ type: CORE_ACTIONS.SET_TASKS_LOADING, loading: true })

    const q = query(
      collection(db, 'tasks'),
      where('ownerId',   '==', uid),
      where('type',      '==', 'personal'),
      where('isDeleted', '==', false)
    )

    unsubRef.current = onSnapshot(
      q,
      (snapshot) => {
        dispatch({
          type:    CORE_ACTIONS.APPLY_PERSONAL_TASK_CHANGES,
          changes: snapshot.docChanges(),
        })
        dispatch({
          type:      CORE_ACTIONS.SET_FROM_CACHE,
          fromCache: snapshot.metadata.fromCache,
        })
        dispatch({
          type:             CORE_ACTIONS.SET_PENDING_WRITES,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
        })
      },
      (error) => {
        console.error('[PersonalTasksListener] error:', error)
        dispatch({ type: CORE_ACTIONS.SET_TASKS_ERROR, error: error.message })
      }
    )

    return () => {
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
    }
  }, [uid, dispatch])
}

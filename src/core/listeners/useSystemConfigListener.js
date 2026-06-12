import { useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { CORE_ACTIONS } from '../store/coreActions'

export function useSystemConfigListener(uid, dispatch) {
  useEffect(() => {
    if (!uid) {
      dispatch({ type: CORE_ACTIONS.SET_SYSTEM_CONFIG, systemConfig: null })
      return
    }

    const unsub = onSnapshot(
      doc(db, 'system_config', 'main'),
      (snap) => {
        dispatch({
          type: CORE_ACTIONS.SET_SYSTEM_CONFIG,
          systemConfig: snap.exists() ? { id: snap.id, ...snap.data() } : null,
        })
      },
      (error) => console.error('[SystemConfigListener] snapshot:', error),
    )

    return () => unsub()
  }, [uid, dispatch])
}

/**
 * Detects network connectivity and dispatches SET_ONLINE_STATUS.
 *
 * navigator.onLine is not perfectly reliable (it can show online
 * when there's no actual internet), but combined with the Firestore
 * fromCache metadata it gives a useful composite signal.
 */
import { useEffect } from 'react'
import { CORE_ACTIONS } from '../store/coreActions'

export function useOnlineStatus(dispatch) {
  useEffect(() => {
    function handleOnline() {
      dispatch({ type: CORE_ACTIONS.SET_ONLINE_STATUS, online: true })
    }
    function handleOffline() {
      dispatch({ type: CORE_ACTIONS.SET_ONLINE_STATUS, online: false })
    }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial state
    dispatch({
      type:   CORE_ACTIONS.SET_ONLINE_STATUS,
      online: navigator.onLine,
    })

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [dispatch])
}

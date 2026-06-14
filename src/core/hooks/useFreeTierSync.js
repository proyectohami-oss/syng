import { useEffect } from 'react'
import { useCoreAuth } from '../hooks/useCoreData'
import { syncFreeTierOnLogin } from '../services/freeTier.service'

/** Al iniciar sesión, aplica reglas anti-abuso del plan Gratis. */
export function useFreeTierSync() {
  const auth = useCoreAuth()
  const uid  = auth.user?.uid
  const phone = auth.userData?.phoneNumber
  const sub  = auth.subscription

  useEffect(() => {
    if (!uid || !phone || !sub) return
    syncFreeTierOnLogin(uid, phone, sub).catch(err => {
      console.error('[useFreeTierSync]', err)
    })
  }, [uid, phone, sub?.planId, sub?.movementTotal, sub?.freeTierBlocked])
}

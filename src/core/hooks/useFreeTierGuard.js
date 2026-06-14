import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCoreAuth } from '../hooks/useCoreData'
import { computePlanUsage, isFreePlanExhausted } from '../services/movements.service'

const WRITE_ROUTE = /\/(nueva|editar)(\/|$)/

/** Rutas de solo lectura permitidas con plan Gratis agotado. */
function isReadRoute(pathname) {
  if (pathname.startsWith('/perfil')) return true
  if (pathname.startsWith('/recordatorio/')) return true
  if (pathname.startsWith('/agenda') && !WRITE_ROUTE.test(pathname)) return true
  if (pathname.startsWith('/pizarrones')) return true
  if (pathname.startsWith('/pizarron/') && !WRITE_ROUTE.test(pathname)) return true
  if (pathname.startsWith('/notificaciones')) return true
  if (pathname.startsWith('/resumen-diario')) return true
  if (pathname.startsWith('/bienvenido-de-vuelta')) return true
  return false
}

/**
 * Plan Gratis agotado: consulta libre, sin crear/editar.
 * Rutas de escritura redirigen a Perfil.
 */
export function FreeTierGate({ children }) {
  const auth     = useCoreAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const planId  = auth.subscription?.planId ?? 'gratis'
  const blocked = isFreePlanExhausted(auth.subscription, planId, auth.plan, auth.systemConfig)
  const writeRoute = WRITE_ROUTE.test(location.pathname)

  useEffect(() => {
    if (!blocked || !writeRoute) return
    navigate('/perfil', { replace: true })
  }, [blocked, writeRoute, navigate, location.pathname])

  return children
}

export function useFreeTierBlocked() {
  const auth = useCoreAuth()
  const planId = auth.subscription?.planId ?? 'gratis'
  return isFreePlanExhausted(auth.subscription, planId, auth.plan, auth.systemConfig)
}

export function useFreeTierUsage() {
  const auth = useCoreAuth()
  const planId = auth.subscription?.planId ?? 'gratis'
  const usage = computePlanUsage(auth.subscription, auth.plan, planId, auth.systemConfig)
  return { blocked: usage.atLimit && planId === 'gratis', usage, planId }
}

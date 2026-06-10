import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/** Abre /recordatorio/… cuando la app arranca desde una notificación (?redirect=). */
export function DeepLinkHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    if (!redirect || !redirect.startsWith('/')) return

    params.delete('redirect')
    const qs = params.toString()
    navigate(redirect + (qs ? `?${qs}` : ''), { replace: true })
  }, [navigate])

  return null
}

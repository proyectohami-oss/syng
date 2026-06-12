import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from './Toast'

const RETURN_KEY = 'syng_ios_cal_return'
const DEST_KEY = 'syng_ios_cal_dest'

/** Abre /recordatorio/… (?redirect=) y vuelve a agenda tras confirmar Calendario iOS. */
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

  useEffect(() => {
    function finishCalFlow() {
      try {
        if (sessionStorage.getItem(RETURN_KEY) !== '1') return
        sessionStorage.removeItem(RETURN_KEY)
        const dest = sessionStorage.getItem(DEST_KEY) || '/agenda'
        sessionStorage.removeItem(DEST_KEY)
        navigate(dest, { replace: true })
        showToast('Aviso listo en Calendario', '✓')
      } catch { /* ignore */ }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') finishCalFlow()
    }

    finishCalFlow()
    window.addEventListener('pageshow', finishCalFlow)
    window.addEventListener('focus', finishCalFlow)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('pageshow', finishCalFlow)
      window.removeEventListener('focus', finishCalFlow)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [navigate])

  return null
}

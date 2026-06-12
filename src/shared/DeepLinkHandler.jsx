import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const RETURN_KEY = 'syng_ios_cal_return'
const DEST_KEY = 'syng_ios_cal_dest'

export function markIosCalendarReturn(dest = '/agenda') {
  try {
    sessionStorage.setItem(RETURN_KEY, '1')
    sessionStorage.setItem(DEST_KEY, dest)
  } catch { /* ignore */ }
}

/** Abre /recordatorio/… (?redirect=) y vuelve a agenda tras confirmar Calendario iOS. */
export function DeepLinkHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    if (redirect?.startsWith('/')) {
      params.delete('redirect')
      const qs = params.toString()
      navigate(redirect + (qs ? `?${qs}` : ''), { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    function finishCalFlow() {
      try {
        if (sessionStorage.getItem(RETURN_KEY) !== '1') return
        sessionStorage.removeItem(RETURN_KEY)
        const dest = sessionStorage.getItem(DEST_KEY) || '/agenda'
        sessionStorage.removeItem(DEST_KEY)
        navigate(dest, { replace: true })
      } catch { /* ignore */ }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') {
        setTimeout(finishCalFlow, 300)
      }
    }

    window.addEventListener('pageshow', finishCalFlow)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('pageshow', finishCalFlow)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [navigate])

  return null
}

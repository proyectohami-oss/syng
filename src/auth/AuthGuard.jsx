import { useContext, useEffect, useState } from 'react'
import { useNavigate }                     from 'react-router-dom'
import { CoreAuthContext }                 from '../core/CoreDataProvider'
import { AuthScreen }                      from './AuthScreen'
import { PhoneSetupScreen }               from './PhoneSetupScreen'
import { BienvenidaScreen }               from '../modules/bienvenida/BienvenidaScreen'
import { SyngLogo } from '../shared/SyngLogo'
import { L } from '../shared/agendaEditorial'

function todayKey() {
  return 'syng_bienvenida_' + new Date().toDateString()
}

export function AuthGuard({ children }) {
  const auth     = useContext(CoreAuthContext)
  const navigate = useNavigate()
  const [showBienvenida, setShowBienvenida] = useState(false)

  useEffect(() => {
    if (!auth?.user || !auth?.userData) return

    const path = window.location.pathname

    const pendingUrl = sessionStorage.getItem('pendingUrl')
    if (pendingUrl && pendingUrl.startsWith('/')) {
      sessionStorage.removeItem('pendingUrl')
      navigate(pendingUrl, { replace: true })
      return
    }

    if (path.startsWith('/recordatorio/')) return

    if (sessionStorage.getItem('justLoggedIn') === '1') {
      sessionStorage.removeItem('justLoggedIn')
      const pendingInv = sessionStorage.getItem('pendingInvToken')
      if (pendingInv) {
        sessionStorage.removeItem('pendingInvToken')
        navigate(`/unirse?inv=${pendingInv}`, { replace: true })
        return
      }
    }

    const key = todayKey()
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
    }
  }, [auth?.user, auth?.userData, navigate])

  if (!auth || auth.loading) return <LoadingScreen />

  if (!auth.user) {
    const params = new URLSearchParams(window.location.search)
    const inv = params.get('inv')
    if (inv) sessionStorage.setItem('pendingInvToken', inv)
    const redirect = params.get('redirect')
    if (redirect?.startsWith('/')) sessionStorage.setItem('pendingUrl', redirect)
    else if (window.location.pathname.startsWith('/recordatorio/')) {
      sessionStorage.setItem('pendingUrl', window.location.pathname)
    }
    return <AuthScreen />
  }

  if (auth.userData && !auth.userData.phoneNumber) return <PhoneSetupScreen />

  if (!auth.userData) {
    return (
      <LoadingScreen
        message="Cargando tu perfil…"
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (showBienvenida) {
    return <BienvenidaScreen
      userData={auth.userData}
      tareasHoy={[]}
      tareasAyer={[]}
      onDone={() => setShowBienvenida(false)}
    />
  }

  return children
}

function LoadingScreen({ message, onRetry }) {
  return (
    <div style={{
      flex: 1, minHeight: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      background: L.ink,
      animation: 'syngFadeIn 0.3s ease',
    }}>
      <style>{'@keyframes syngFadeIn { from { opacity:0 } to { opacity:1 } }'}</style>
      <SyngLogo size="md" />
      {message && <p style={{ margin: 0, fontSize: 14, color: L.ivoryMuted }}>{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} style={{
          padding: '10px 20px', borderRadius: 2,
          border: `1px solid ${L.ivory}`, background: L.ivory,
          color: L.ink, fontSize: 13, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', cursor: 'pointer',
        }}>
          Reintentar
        </button>
      )}
    </div>
  )
}

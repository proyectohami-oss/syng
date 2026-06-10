import { useContext, useEffect, useState } from 'react'
import { useNavigate }                     from 'react-router-dom'
import { CoreAuthContext }                 from '../core/CoreDataProvider'
import { AuthScreen }                      from './AuthScreen'
import { PhoneSetupScreen }               from './PhoneSetupScreen'
import { BienvenidaScreen }               from '../modules/bienvenida/BienvenidaScreen'

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
      setShowBienvenida(true)
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
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: [
        'radial-gradient(ellipse at 92% 4%, rgba(255,200,150,0.28) 0%, transparent 48%)',
        'radial-gradient(ellipse at 8% 96%, rgba(150,180,255,0.22) 0%, transparent 48%)',
        'linear-gradient(168deg, #F7F8FC 0%, #F2F4FB 50%, #EEF1F8 100%)',
      ].join(', '),
      animation: 'syngFadeIn 0.3s ease',
    }}>
      <style>{'@keyframes syngFadeIn { from { opacity:0 } to { opacity:1 } }'}</style>
      <img src="/icon-192.png" alt="Syng" style={{ width:80, height:80, borderRadius:18, boxShadow:'0 8px 24px rgba(45,58,140,0.18)' }} />
      {message && <p style={{ margin:0, fontSize:14, color:'#5B6480' }}>{message}</p>}
      {onRetry && (
        <button onClick={onRetry} style={{
          padding:'10px 20px', borderRadius:12, border:'none',
          background:'#2D3A8C', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer',
        }}>
          Reintentar
        </button>
      )}
    </div>
  )
}

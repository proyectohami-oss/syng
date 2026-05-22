import { useContext, useEffect } from 'react'
import { useNavigate }           from 'react-router-dom'
import { CoreAuthContext }        from '../core/CoreDataProvider'
import { AuthScreen }            from './AuthScreen'
import { PhoneSetupScreen }      from './PhoneSetupScreen'

export function AuthGuard({ children }) {
  const auth     = useContext(CoreAuthContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (auth?.user && auth?.userData) {
      const path = window.location.pathname
      /* Si la URL es una fecha específica, volver al calendario */
      if (path.match(/\/agenda\/\d{4}-\d{2}-\d{2}/)) {
        navigate('/agenda', { replace: true })
      }
    }
  }, [auth?.user, auth?.userData])

  if (!auth || auth.loading) return <LoadingScreen />
  if (!auth.user) return <AuthScreen />
  if (auth.userData && !auth.userData.phoneNumber) return <PhoneSetupScreen />
  if (!auth.userData) return <LoadingScreen />

  return children
}

function LoadingScreen() {
  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: [
        'radial-gradient(ellipse at 92% 4%, rgba(255,200,150,0.28) 0%, transparent 48%)',
        'radial-gradient(ellipse at 8% 96%, rgba(150,180,255,0.22) 0%, transparent 48%)',
        'linear-gradient(168deg, #F7F8FC 0%, #F2F4FB 50%, #EEF1F8 100%)',
      ].join(', '),
      animation: 'syngFadeIn 0.3s ease',
    }}>
      <style>{'@keyframes syngFadeIn { from { opacity:0 } to { opacity:1 } }'}</style>
      <img src="/icon-192.png" alt="Syng" style={{ width:80, height:80, borderRadius:18, boxShadow:'0 8px 24px rgba(45,58,140,0.18)' }} />
    </div>
  )
}

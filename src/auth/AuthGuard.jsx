import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCoreAuth, useCoreTasks } from '../core/hooks/useCoreData'
import { AuthScreen } from './AuthScreen'
import { PhoneSetupScreen } from './PhoneSetupScreen'
import { BienvenidaScreen } from '../modules/bienvenida/BienvenidaScreen'
import {
  getBienvenidaTaskSnapshot,
  bienvenidaStorageKey,
  shouldSkipBienvenidaPath,
} from '../modules/bienvenida/bienvenidaTasks'
import { SyngLogo } from '../shared/SyngLogo'
import { L } from '../shared/agendaEditorial'

export function AuthGuard({ children }) {
  const auth = useCoreAuth()
  const tasks = useCoreTasks()
  const navigate = useNavigate()
  const [showBienvenida, setShowBienvenida] = useState(false)
  const [gateReady, setGateReady] = useState(false)

  const snapshot = useMemo(
    () => (showBienvenida ? getBienvenidaTaskSnapshot(tasks) : null),
    [showBienvenida, tasks],
  )

  useEffect(() => {
    if (!auth?.user || !auth?.userData?.phoneNumber) {
      setGateReady(false)
      setShowBienvenida(false)
      return
    }

    const path = window.location.pathname

    const pendingUrl = sessionStorage.getItem('pendingUrl')
    if (pendingUrl && pendingUrl.startsWith('/')) {
      sessionStorage.removeItem('pendingUrl')
      navigate(pendingUrl, { replace: true })
      setGateReady(true)
      return
    }

    if (sessionStorage.getItem('justLoggedIn') === '1') {
      sessionStorage.removeItem('justLoggedIn')
      const pendingInv = sessionStorage.getItem('pendingInvToken')
      if (pendingInv) {
        sessionStorage.removeItem('pendingInvToken')
        navigate(`/unirse?inv=${pendingInv}`, { replace: true })
        setGateReady(true)
        return
      }
    }

    if (shouldSkipBienvenidaPath(path)) {
      setGateReady(true)
      return
    }

    if (localStorage.getItem(bienvenidaStorageKey())) {
      setGateReady(true)
      return
    }

    if (tasks.loading) return

    setShowBienvenida(true)
    setGateReady(true)
  }, [auth?.user, auth?.userData?.phoneNumber, navigate, tasks.loading])

  function finishBienvenida() {
    localStorage.setItem(bienvenidaStorageKey(), '1')
    setShowBienvenida(false)
  }

  if (!auth || auth.loading) return <LoadingScreen message="Iniciando Syng…" />

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

  if (!auth.userData) return <LoadingScreen message="Cargando tu perfil…" />

  if (showBienvenida && snapshot) {
    return (
      <BienvenidaScreen
        userData={auth.userData}
        tareasHoy={snapshot.tareasHoy}
        tareasAyer={snapshot.tareasAyer}
        onDone={finishBienvenida}
      />
    )
  }

  if (!gateReady && !shouldSkipBienvenidaPath(window.location.pathname)) {
    return <LoadingScreen message="Preparando tu día…" />
  }

  return children
}

function LoadingScreen({ message }) {
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
    </div>
  )
}

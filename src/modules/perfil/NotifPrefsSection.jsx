import { useState, useEffect, useCallback } from 'react'
import { usePushNotifications } from '../../core/notifications/usePushNotifications'
import { getPushDiagnostics, sendTestPush } from '../../core/notifications/fcm.service'
import { useCoreAuth } from '../../core/hooks/useCoreData'
import { showToast } from '../../shared/Toast'
import { A, L } from '../../shared/agendaEditorial'

const isIOS        = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

function Check({ ok, label }) {
  return (
    <div style={checkRow}>
      <span style={{ color: ok ? '#6ee7a0' : '#E05252', fontSize: 14, width: 18 }}>{ok ? '✓' : '✗'}</span>
      <span style={{ fontSize: 13, color: L.ivoryMuted }}>{label}</span>
    </div>
  )
}

function NotifStatus({ state }) {
  if (state === 'granted') {
    return (
      <div style={statusRow}>
        <span style={dot('#22C55E')} />
        <span style={statusText}>Activas en este dispositivo</span>
      </div>
    )
  }
  if (state === 'denied') {
    return (
      <div style={statusRow}>
        <span style={dot('#E05252')} />
        <span style={{ ...statusText, color: '#E05252' }}>
          Bloqueadas — Ajustes → Notificaciones → Syng
        </span>
      </div>
    )
  }
  if (state === 'unsupported') {
    return (
      <div style={statusRow}>
        <span style={dot('#94a3b8')} />
        <span style={statusText}>No disponibles aquí</span>
      </div>
    )
  }
  return (
    <div style={statusRow}>
      <span style={dot('#f59e0b')} />
      <span style={statusText}>Sin activar</span>
    </div>
  )
}

export function NotifPrefsSection() {
  const auth = useCoreAuth()
  const uid  = auth.user?.uid
  const { isSupported, permissionState, requestPermission, resyncToken, isNative } = usePushNotifications()

  const [prompt,      setPrompt]      = useState(null)
  const [installed,   setInstalled]   = useState(false)
  const [showModal,   setShowModal]   = useState(false)
  const [installing,  setInstalling]  = useState(false)
  const [activating,  setActivating]  = useState(false)
  const [testing,     setTesting]     = useState(false)
  const [diag,        setDiag]        = useState(null)
  const [lastTest,    setLastTest]    = useState(null)

  const refreshDiag = useCallback(async () => {
    setDiag(await getPushDiagnostics(auth.userData))
  }, [auth.userData])

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return }
    if (window.__installPrompt) setPrompt(window.__installPrompt)
    const onPrompt = (e) => { e.preventDefault(); window.__installPrompt = e; setPrompt(e) }
    const onDone   = () => { setInstalled(true); window.__installPrompt = null }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onDone)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onDone)
    }
  }, [])

  useEffect(() => { refreshDiag() }, [refreshDiag])

  async function handleInstall() {
    if (isIOS()) { setShowModal(true); return }
    if (!prompt) return
    setInstalling(true)
    try {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') { setInstalled(true); window.__installPrompt = null }
    } finally { setInstalling(false); setPrompt(null) }
  }

  async function handleActivate() {
    setActivating(true)
    try {
      const result = await requestPermission()
      if (result?.ok) showToast('Notificaciones conectadas', '✓')
      else showToast(toastForReason(result?.reason), '⚠️')
      await refreshDiag()
    } finally { setActivating(false) }
  }

  async function handleResync() {
    setActivating(true)
    try {
      const result = await resyncToken()
      if (result?.ok) showToast('Conexión verificada', '✓')
      else showToast(toastForReason(result?.reason), '⚠️')
      await refreshDiag()
    } finally { setActivating(false) }
  }

  async function handleTestPush() {
    setTesting(true)
    setLastTest(null)
    try {
      const result = await sendTestPush(uid)
      setLastTest(result)
      if (result.ok) {
        showToast('Servidor envió — cierra Syng y revisa si sonó', '✓')
      } else if (result.phase === 'sync') {
        showToast(toastForReason(result.reason), '⚠️')
      } else if (result.reason === 'no_tokens') {
        showToast('Sin token — toca Verificar conexión primero', '⚠️')
      } else {
        showToast(`Servidor: ${result.reason || 'error'} (${result.successCount ?? 0}/${result.tokenCount ?? '?'})`, '⚠️')
      }
      await refreshDiag()
    } finally { setTesting(false) }
  }

  function toastForReason(reason) {
    if (reason === 'not_installed') return 'Abre Syng desde el ícono en tu pantalla de inicio'
    if (reason === 'permission' || reason === 'denied') return 'Permiso bloqueado — ve a Ajustes → Syng'
    if (reason === 'no_sw') return 'Espera 5 segundos e intenta de nuevo'
    if (reason === 'unsupported') return 'Notificaciones no disponibles aquí'
    if (reason === 'empty') return 'No se obtuvo token — intenta de nuevo'
    if (reason?.includes('token-subscribe')) return 'Clave VAPID incorrecta en Vercel'
    if (reason?.includes('failed-service-worker')) return 'Cierra y abre Syng desde el ícono'
    if (reason === 'Load failed' || reason === 'network_error') return 'Sin conexión — cierra y abre Syng desde el ícono'
    if (reason === 'proxy_error') return 'Error del servidor — intenta en unos segundos'
    if (reason) return `Error: ${reason}`
    return 'Abre Syng desde el ícono de inicio'
  }

  const ios        = isIOS()
  const canInstall = !installed && (!!prompt || ios)
  const notifState = !isSupported ? 'unsupported' : permissionState
  const allOk      = diag && diag.permission === 'granted' && diag.standalone && diag.swOk && diag.tokenCount > 0

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:12 }}>

      <div style={A.section}>
        <p style={A.sectionLabel}>
          {isNative ? 'App nativa — recordatorios' : 'Universo B — recordatorios'}
        </p>
        <div style={{ padding:'12px 16px 14px' }}>
          <NotifStatus state={notifState} />

          {diag && permissionState === 'granted' && (
            <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:6 }}>
              <Check ok={diag.permission === 'granted'} label="Permiso del iPhone" />
              <Check ok={diag.standalone} label="App instalada en inicio" />
              <Check ok={diag.swOk} label="Canal de push activo" />
              {diag.swControlled != null && !isNative && (
                <Check ok={diag.swControlled} label="SW controla la app" />
              )}
              {isNative && diag.platform && (
                <Check ok label={`Plataforma: ${diag.platform}`} />
              )}
              <Check ok={diag.tokenCount > 0} label={`Token en servidor (${diag.tokenCount})`} />
            </div>
          )}

          {lastTest && (
            <p style={{
              margin: '12px 0 0',
              fontSize: 12,
              lineHeight: 1.5,
              color: lastTest.ok ? '#6ee7a0' : '#E05252',
              background: lastTest.ok ? 'rgba(52,199,89,0.08)' : 'rgba(224,82,82,0.08)',
              padding: '8px 10px',
              borderRadius: 2,
              border: `1px solid ${lastTest.ok ? 'rgba(52,199,89,0.25)' : 'rgba(224,82,82,0.25)'}`,
            }}>
              {lastTest.ok
                ? `Última prueba: OK (${lastTest.successCount} dispositivo(s))`
                : `Última prueba: falló${lastTest.reason ? ` — ${lastTest.reason}` : ''}`}
            </p>
          )}

          {isSupported && permissionState === 'default' && (
            <button onClick={handleActivate} disabled={activating} style={{ ...A.btnPrimary, width: '100%', marginTop: 14 }}>
              {activating ? 'Activando…' : 'Activar recordatorios'}
            </button>
          )}

          {isSupported && permissionState === 'granted' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              <button onClick={handleTestPush} disabled={testing || activating} style={{ ...A.btnPrimary, width: '100%' }}>
                {testing ? 'Enviando prueba…' : 'Enviar prueba ahora'}
              </button>
              <button onClick={handleResync} disabled={activating || testing} style={A.btnOutline}>
                {activating ? 'Verificando…' : 'Verificar conexión'}
              </button>
            </div>
          )}

          {allOk && (
            <p style={{ margin: '12px 0 0', fontSize: 12, color: L.ivoryFaint, lineHeight: 1.5 }}>
              Syng te avisará cuando toque una tarea — aunque cierres la app.
            </p>
          )}
        </div>
      </div>

      {canInstall && !installed && (
        <div style={A.section}>
          <p style={A.sectionLabel}>Instalar app</p>
          <div style={{ padding: '12px 16px 14px' }}>
            <button onClick={handleInstall} disabled={installing} style={{ ...A.btnPrimary, width: '100%' }}>
              {installing ? 'Instalando…' : ios ? 'Cómo instalar Syng en iPhone' : 'Instalar Syng — Gratis'}
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <>
          <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001, background: L.ink, borderRadius: '2px 2px 0 0', padding: '28px 24px 48px', borderTop: `1px solid ${L.champagneBorder}` }}>
            <div style={{ width: 40, height: 2, background: L.champagneBorder, margin: '0 auto 24px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ margin: 0, fontFamily: L.serif, fontSize: 20, color: L.ivory }}>Instala Syng en iPhone</p>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: `1px solid ${L.champagneBorder}`, borderRadius: 2, width: 32, height: 32, fontSize: 16, cursor: 'pointer', color: L.ivoryMuted }}>✕</button>
            </div>
            {[
              { n: '1', title: 'Toca Compartir', desc: 'El ícono ⎋ en la barra de Safari' },
              { n: '2', title: 'Agregar a inicio', desc: 'Desplázate y toca "Agregar a pantalla de inicio"' },
              { n: '3', title: 'Abre Syng', desc: 'Toca el ícono de Syng en tu pantalla de inicio' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 14, marginBottom: 14, background: L.champagneLight, border: `1px solid ${L.champagneBorder}`, borderRadius: 2, padding: '14px 16px' }}>
                <div style={{ minWidth: 36, height: 36, borderRadius: 2, background: L.champagne, color: L.ink, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.n}</div>
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 500, color: L.ivory }}>{s.title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: L.ivoryMuted, lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              </div>
            ))}
            <button onClick={() => setShowModal(false)} style={{ ...A.btnPrimary, width: '100%', marginTop: 8 }}>Entendido</button>
          </div>
        </>
      )}
    </div>
  )
}

const dot = (color) => ({
  width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0, marginTop: 4,
})
const statusRow = { display: 'flex', gap: 10, alignItems: 'flex-start' }
const statusText = { margin: 0, fontSize: 14, color: L.ivory, lineHeight: 1.5 }
const checkRow = { display: 'flex', gap: 8, alignItems: 'center' }

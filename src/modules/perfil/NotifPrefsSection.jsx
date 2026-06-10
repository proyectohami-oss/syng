import { useState, useEffect } from 'react'
import { usePushNotifications } from '../../core/notifications/usePushNotifications'
import { showToast } from '../../shared/Toast'

const isIOS        = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

function NotifStatus({ state }) {
  if (state === 'granted') {
    return (
      <div style={statusRow}>
        <span style={dot('#22C55E')} />
        <span style={statusText}>Activas — recibirás recordatorios en este dispositivo</span>
      </div>
    )
  }
  if (state === 'denied') {
    return (
      <div style={statusRow}>
        <span style={dot('#E05252')} />
        <span style={{ ...statusText, color: '#7c2d12' }}>
          Bloqueadas — ve a Ajustes → Notificaciones → Syng y actívalas
        </span>
      </div>
    )
  }
  if (state === 'unsupported') {
    return (
      <div style={statusRow}>
        <span style={dot('#94a3b8')} />
        <span style={statusText}>No disponibles en este navegador</span>
      </div>
    )
  }
  return (
    <div style={statusRow}>
      <span style={dot('#f59e0b')} />
      <span style={statusText}>Sin activar — toca el botón de abajo</span>
    </div>
  )
}

export function NotifPrefsSection() {
  const { isSupported, permissionState, requestPermission, resyncToken } = usePushNotifications()
  const [prompt,     setPrompt]     = useState(null)
  const [installed,  setInstalled]  = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [installing, setInstalling] = useState(false)
  const [activating, setActivating] = useState(false)

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
      else if (result?.reason === 'no_token') showToast('No se pudo conectar — cierra y abre Syng', '⚠️')
      else if (result?.reason === 'denied') showToast('Permiso bloqueado en Ajustes', '⚠️')
    } finally { setActivating(false) }
  }

  async function handleResync() {
    setActivating(true)
    try {
      const token = await resyncToken()
      if (token) showToast('Conexión verificada', '✓')
      else showToast('Sin conexión — cierra Syng y ábrela de nuevo', '⚠️')
    } finally { setActivating(false) }
  }

  const ios        = isIOS()
  const canInstall = !installed && (!!prompt || ios)
  const notifState = !isSupported ? 'unsupported' : permissionState

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:12 }}>

      {/* NOTIFICACIONES — siempre visible */}
      <div style={section}>
        <p style={sectionLabel}>NOTIFICACIONES</p>
        <div style={{ padding:'12px 16px 14px' }}>
          <NotifStatus state={notifState} />
          {isSupported && permissionState === 'default' && (
            <button onClick={handleActivate} disabled={activating} style={{ ...btnBlue, marginTop:14 }}>
              {activating ? 'Activando…' : '🔔 Activar notificaciones'}
            </button>
          )}
          {isSupported && permissionState === 'granted' && (
            <button onClick={handleResync} disabled={activating} style={{ ...btnOutline, marginTop:14 }}>
              {activating ? 'Verificando…' : 'Verificar conexión'}
            </button>
          )}
        </div>
      </div>

      {/* INSTALAR */}
      {canInstall && (
        <div style={section}>
          <p style={sectionLabel}>INSTALAR APP</p>
          <div style={{ padding:'12px 16px 14px' }}>
            <button onClick={handleInstall} disabled={installing} style={btnBlue}>
              {installing ? 'Instalando…' : ios ? 'Cómo instalar Syng en iPhone' : 'Instalar Syng — Gratis'}
            </button>
          </div>
        </div>
      )}

      {installed && (
        <div style={{ ...section, background:'rgba(220,252,231,0.85)', border:'1.5px solid rgba(34,197,94,0.25)' }}>
          <p style={{ margin:0, padding:'14px 16px', fontSize:14, fontWeight:600, color:'#1a5c38' }}>
            ✓ App instalada en este dispositivo
          </p>
        </div>
      )}

      {showModal && (
        <>
          <div onClick={() => setShowModal(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000 }} />
          <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:1001, background:'#fff', borderRadius:'24px 24px 0 0', padding:'28px 24px 48px' }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'rgba(13,18,64,0.15)', margin:'0 auto 24px' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <p style={{ margin:0, fontSize:20, fontWeight:700, color:'#0D1240' }}>Instala Syng en iPhone</p>
              <button onClick={() => setShowModal(false)} style={{ background:'rgba(13,18,64,0.07)', border:'none', borderRadius:'50%', width:32, height:32, fontSize:18, cursor:'pointer' }}>✕</button>
            </div>
            {[
              { n:'1', title:'Toca Compartir', desc:'El ícono ⎋ en la barra de Safari' },
              { n:'2', title:'Agregar a inicio', desc:'Desplázate y toca "Agregar a pantalla de inicio"' },
              { n:'3', title:'Abre Syng', desc:'Toca el ícono de Syng en tu pantalla de inicio' },
            ].map(s => (
              <div key={s.n} style={{ display:'flex', gap:14, marginBottom:14, background:'rgba(61,79,168,0.04)', borderRadius:14, padding:'14px 16px' }}>
                <div style={{ minWidth:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#3D4FA8,#2D3A8C)', color:'#fff', fontSize:16, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{s.n}</div>
                <div>
                  <p style={{ margin:'0 0 3px', fontSize:15, fontWeight:700, color:'#0D1240' }}>{s.title}</p>
                  <p style={{ margin:0, fontSize:13, color:'rgba(13,18,64,0.5)', lineHeight:1.5 }}>{s.desc}</p>
                </div>
              </div>
            ))}
            <button onClick={() => setShowModal(false)} style={{ ...btnBlue, marginTop:8 }}>Entendido</button>
          </div>
        </>
      )}
    </div>
  )
}

const section = {
  background:'rgba(255,255,255,0.82)',
  backdropFilter:'blur(20px)',
  WebkitBackdropFilter:'blur(20px)',
  borderRadius:16,
  margin:'0 16px',
  overflow:'hidden',
  border:'1px solid rgba(255,255,255,0.65)',
  boxShadow:'0 4px 16px rgba(13,18,64,0.05), inset 0 1px 0 rgba(255,255,255,0.90)',
}
const sectionLabel = {
  margin:0, fontSize:11, fontWeight:600,
  color:'rgba(13,18,64,0.32)',
  letterSpacing:'0.08em',
  padding:'10px 16px 4px',
}
const btnBlue = {
  width:'100%', minHeight:48, borderRadius:14, border:'none',
  background:'linear-gradient(135deg,#3D4FA8,#2D3A8C)',
  color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer',
}
const btnOutline = {
  width:'100%', minHeight:44, borderRadius:14,
  border:'1.5px solid rgba(45,58,140,0.25)',
  background:'rgba(255,255,255,0.6)',
  color:'#2D3A8C', fontSize:14, fontWeight:600, cursor:'pointer',
}
const dot = (color) => ({
  width:10, height:10, borderRadius:'50%', background:color, flexShrink:0, marginTop:4,
})
const statusRow = { display:'flex', gap:10, alignItems:'flex-start' }
const statusText = { margin:0, fontSize:14, color:'#0D1240', lineHeight:1.5 }

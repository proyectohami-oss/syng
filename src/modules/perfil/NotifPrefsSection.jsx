import { useState, useEffect } from 'react'
import { usePushNotifications } from '../../core/notifications/usePushNotifications'

const isIOS        = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

export function NotifPrefsSection() {
  const { isSupported, permissionState, requestPermission } = usePushNotifications()
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
    try { await requestPermission() } finally { setActivating(false) }
  }

  const ios        = isIOS()
  const canInstall = !installed && (!!prompt || ios)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px' }}>

      {/* INSTALAR */}
      {canInstall && (
        <div style={card}>
          <p style={label}>📲  INSTALAR APP</p>
          <button onClick={handleInstall} disabled={installing} style={btnBlue}>
            {installing ? 'Instalando…' : ios ? 'Cómo instalar Syng en iPhone' : 'Instalar Syng — Gratis'}
          </button>
        </div>
      )}

      {installed && (
        <div style={{ ...card, background:'rgba(220,252,231,0.9)', border:'1.5px solid rgba(34,197,94,0.3)' }}>
          <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#1a5c38' }}>✓ App instalada en este dispositivo</p>
        </div>
      )}

      {/* Notificaciones — activar si no están activas */}
      {isSupported && permissionState === 'default' && installed && (
        <div style={card}>
          <p style={label}>🔔  NOTIFICACIONES</p>
          <p style={{ ...muted, marginBottom:12 }}>Activa las notificaciones para recibir recordatorios de tus grupos.</p>
          <button onClick={handleActivate} disabled={activating} style={btnBlue}>
            {activating ? 'Activando…' : '🔔 Activar notificaciones'}
          </button>
        </div>
      )}

      {isSupported && permissionState === 'denied' && (
        <div style={card}>
          <div style={alertBox}>
            <span>⚠️</span>
            <p style={{ margin:0, fontSize:13, color:'#7c2d12', lineHeight:1.5 }}>
              Notificaciones bloqueadas. Ve a Configuración y actívalas para Syng.
            </p>
          </div>
        </div>
      )}

      {/* MODAL iOS */}
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

const card     = { background:'rgba(255,255,255,0.88)', borderRadius:18, padding:'18px 20px', boxShadow:'0 2px 12px rgba(13,18,64,0.07)' }
const label    = { margin:'0 0 14px', fontSize:11, fontWeight:700, color:'rgba(13,18,64,0.35)', letterSpacing:'0.09em' }
const btnBlue  = { width:'100%', minHeight:50, borderRadius:14, border:'none', background:'linear-gradient(135deg,#3D4FA8,#2D3A8C)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }
const muted    = { margin:0, fontSize:13, color:'rgba(13,18,64,0.5)', lineHeight:1.6 }
const alertBox = { display:'flex', gap:10, alignItems:'flex-start', background:'rgba(254,226,226,0.8)', borderRadius:12, padding:'12px 14px' }

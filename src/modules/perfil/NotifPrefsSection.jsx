import { useState, useEffect } from 'react'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { usePushNotifications } from '../../core/notifications/usePushNotifications'

const isIOS        = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

function formatTime(t) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export function NotifPrefsSection() {
  const { isSupported, permissionState, requestPermission } = usePushNotifications()
  const [prompt,     setPrompt]     = useState(null)
  const [installed,  setInstalled]  = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [installing, setInstalling] = useState(false)
  const [activating, setActivating] = useState(false)
  const [dailyTime,  setDailyTime]  = useState('')
  const [status,     setStatus]     = useState('')

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

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    getDoc(doc(db, 'users', uid)).then(snap => {
      const t = snap.data()?.notifPrefs?.dailyTime
      if (t) setDailyTime(t)
    })
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

  async function handleTimeChange(e) {
    const time = e.target.value
    setDailyTime(time)
    if (!time) return
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      await updateDoc(doc(db, 'users', uid), { 'notifPrefs.dailyTime': time })
      setStatus('saved')
      setTimeout(() => setStatus(''), 2500)
    } catch {}
  }

  const ios = isIOS()
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

      {/* NOTIFICACIONES */}
      <div style={card}>
        <p style={label}>🔔  NOTIFICACIONES</p>

        {!isSupported && (
          <p style={muted}>Instala la app primero para activar notificaciones.</p>
        )}

        {isSupported && permissionState === 'denied' && (
          <div style={alertBox}>
            <span>⚠️</span>
            <p style={{ margin:0, fontSize:13, color:'#7c2d12', lineHeight:1.5 }}>
              Notificaciones bloqueadas. Ve a Configuración y actívalas para Syng.
            </p>
          </div>
        )}

        {isSupported && permissionState === 'default' && (
          <>
            <p style={{ ...muted, marginBottom:12 }}>Recibe recordatorios de tus tareas y novedades de tus grupos.</p>
            <button onClick={handleActivate} disabled={activating} style={btnBlue}>
              {activating ? 'Activando…' : '🔔 Activar notificaciones'}
            </button>
          </>
        )}

        {isSupported && permissionState === 'granted' && (
          <>
            <div style={chip}>✓ Notificaciones activas</div>
            <div style={divider} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div>
                <p style={{ margin:0, fontSize:15, fontWeight:600, color:'#0D1240' }}>Resumen diario</p>
                <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(13,18,64,0.45)' }}>
                  {dailyTime ? `Te avisamos a las ${formatTime(dailyTime)}` : 'Elige la hora'}
                </p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {status === 'saved' && <span style={{ fontSize:12, color:'#2D3A8C', fontWeight:700 }}>✓</span>}
                <input type="time" value={dailyTime} onChange={handleTimeChange} style={timeInput} />
              </div>
            </div>
          </>
        )}
      </div>

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
const chip     = { display:'inline-flex', alignItems:'center', gap:6, background:'rgba(220,252,231,0.9)', color:'#166534', fontSize:13, fontWeight:700, borderRadius:20, padding:'5px 12px', marginBottom:14 }
const divider  = { height:1, background:'rgba(13,18,64,0.07)', margin:'0 0 14px' }
const timeInput= { border:'1.5px solid rgba(45,58,140,0.2)', borderRadius:12, padding:'8px 12px', fontSize:15, color:'#0D1240', background:'rgba(255,255,255,0.95)', outline:'none', minWidth:95, minHeight:44, cursor:'pointer', fontWeight:600 }

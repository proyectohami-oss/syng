/**
 * NotifPrefsSection — instalación PWA + notificaciones. Diseño pro.
 */
import { useState, useEffect } from 'react'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { usePushNotifications } from '../../core/notifications/usePushNotifications'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
}
function formatTime(t) {
  const [h, m] = t.split(':').map(Number)
  const ap  = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`
}

export function NotifPrefsSection() {
  const { isSupported, permissionState, requestPermission } = usePushNotifications()
  const [dailyTime,   setDailyTime]   = useState('')
  const [status,      setStatus]      = useState('')
  const [activating,  setActivating]  = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed,   setInstalled]   = useState(isStandalone)
  const [installing,  setInstalling]  = useState(false)

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return }
    if (window.__installPrompt) {
      setInstallPrompt(window.__installPrompt)
    }
    function handler(e) {
      e.preventDefault()
      window.__installPrompt = e
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      window.__installPrompt = null
    })
    return () => window.removeEventListener('beforeinstallprompt', handler)
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
    if (!installPrompt) return
    setInstalling(true)
    try {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') {
        setInstalled(true)
        window.__installPrompt = null
      }
    } finally {
      setInstalling(false)
      setInstallPrompt(null)
    }
  }

  async function handleActivate() {
    setActivating(true)
    try { await requestPermission() }
    finally { setActivating(false) }
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
    } catch { setStatus('error') }
  }

  const ios        = isIOS()
  const standalone = isStandalone()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {!installed && (
        <div style={card}>
          <div style={cardHeader}>
            <span style={sectionIcon}>📲</span>
            <span style={sectionLabel}>Instalar app</span>
          </div>

          {installPrompt && (
            <button
              onClick={handleInstall}
              disabled={installing}
              style={{ ...btnPrimary, opacity: installing ? 0.7 : 1, transition: 'all 0.15s ease' }}
            >
              <span style={btnInner}>
                {installing ? (
                  <><Spinner /> Instalando…</>
                ) : (
                  <><span>Instalar Syng</span><span style={badge}>Gratis</span></>
                )}
              </span>
            </button>
          )}

          {ios && !standalone && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={installTitle}>Instala Syng en tu iPhone</p>
              {[
                { n: '1', icon: '□↑', text: 'Toca el botón Compartir en Safari' },
                { n: '2', icon: '＋', text: 'Selecciona "Agregar a pantalla de inicio"' },
                { n: '3', icon: '🏠', text: 'Abre Syng desde tu pantalla de inicio' },
              ].map(step => (
                <div key={step.n} style={stepRow}>
                  <div style={stepNum}>{step.n}</div>
                  <p style={stepText}><strong>{step.icon}</strong> {step.text}</p>
                </div>
              ))}
            </div>
          )}

          {!installPrompt && !ios && !standalone && (
            <p style={mutedText}>Abre Syng en Chrome para instalarla en tu dispositivo.</p>
          )}
        </div>
      )}

      {installed && (
        <div style={{ ...card, ...successCard }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>✓</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1a5c38' }}>App instalada</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(26,92,56,0.7)' }}>Syng está en tu pantalla de inicio</p>
            </div>
          </div>
        </div>
      )}

      <div style={card}>
        <div style={cardHeader}>
          <span style={sectionIcon}>🔔</span>
          <span style={sectionLabel}>Notificaciones</span>
        </div>

        {!isSupported && ios && !standalone && (
          <p style={mutedText}>Instala la app primero para activar notificaciones.</p>
        )}

        {!isSupported && !ios && (
          <p style={mutedText}>Tu navegador no soporta notificaciones push.</p>
        )}

        {isSupported && permissionState === 'denied' && (
          <div style={alertBox}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#7c2d12' }}>Notificaciones bloqueadas</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(124,45,18,0.8)', lineHeight: 1.5 }}>
                Ve a Configuración de tu dispositivo y actívalas para Syng.
              </p>
            </div>
          </div>
        )}

        {isSupported && permissionState === 'default' && (
          <>
            <p style={{ ...mutedText, marginBottom: 12 }}>
              Recibe recordatorios de tus tareas y novedades de tus grupos.
            </p>
            <button
              onClick={handleActivate}
              disabled={activating}
              style={{ ...btnPrimary, opacity: activating ? 0.7 : 1, transition: 'opacity 0.15s ease' }}
            >
              <span style={btnInner}>
                {activating ? <><Spinner /> Activando…</> : '🔔 Activar notificaciones'}
              </span>
            </button>
          </>
        )}

        {isSupported && permissionState === 'granted' && (
          <>
            <div style={activeChip}>
              <span style={{ fontSize: 13 }}>✓</span>
              <span>Notificaciones activas</span>
            </div>
            <div style={divider} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0D1240' }}>Resumen diario</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(13,18,64,0.45)' }}>
                  {dailyTime ? `Te avisamos a las ${formatTime(dailyTime)}` : 'Elige la hora de tu resumen'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {status === 'saved' && (
                  <span style={{ fontSize: 12, color: '#2D3A8C', fontWeight: 700 }}>✓ Guardado</span>
                )}
                <input type="time" value={dailyTime} onChange={handleTimeChange} style={timeInput} />
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 14, height: 14,
      border: '2px solid rgba(255,255,255,0.35)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

const card        = { background: 'rgba(255,255,255,0.88)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 2px 12px rgba(13,18,64,0.07)' }
const successCard = { background: 'rgba(220,252,231,0.9)', border: '1.5px solid rgba(34,197,94,0.3)' }
const cardHeader  = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }
const sectionIcon = { fontSize: 16 }
const sectionLabel= { fontSize: 11, fontWeight: 700, color: 'rgba(13,18,64,0.35)', letterSpacing: '0.09em', textTransform: 'uppercase' }
const btnPrimary  = { width: '100%', minHeight: 50, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #3D4FA8 0%, #2D3A8C 100%)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const btnInner    = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }
const badge       = { background: 'rgba(255,255,255,0.22)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }
const installTitle= { margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: '#0D1240' }
const stepRow     = { display: 'flex', alignItems: 'flex-start', gap: 12 }
const stepNum     = { minWidth: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #3D4FA8, #2D3A8C)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }
const stepText    = { margin: 0, fontSize: 13, color: 'rgba(13,18,64,0.65)', lineHeight: 1.55 }
const mutedText   = { margin: 0, fontSize: 13, color: 'rgba(13,18,64,0.5)', lineHeight: 1.6 }
const alertBox    = { display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(254,226,226,0.8)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(252,165,165,0.4)' }
const activeChip  = { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(220,252,231,0.9)', color: '#166534', fontSize: 13, fontWeight: 700, borderRadius: 20, padding: '5px 12px', marginBottom: 14 }
const divider     = { height: 1, background: 'rgba(13,18,64,0.07)', margin: '0 0 14px' }
const timeInput   = { border: '1.5px solid rgba(45,58,140,0.2)', borderRadius: 12, padding: '8px 12px', fontSize: 15, color: '#0D1240', background: 'rgba(255,255,255,0.95)', outline: 'none', minWidth: 95, minHeight: 44, cursor: 'pointer', fontWeight: 600 }

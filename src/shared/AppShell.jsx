/**
 * AppShell — layout principal de la app.
 *
 * ARQUITECTURA MÓVIL:
 * NO usa position:fixed para la barra inferior.
 * En lugar de eso, usa un flex column donde la barra siempre
 * es el último elemento — más confiable en iOS Safari PWA.
 *
 * Layout móvil:
 *   ┌─────────────────────────┐
 *   │  main (flex:1, scroll)  │
 *   ├─────────────────────────┤
 *   │  bottom nav (flex:0)    │  ← siempre visible, nunca se mueve
 *   └─────────────────────────┘
 *
 * Layout desktop:
 *   ┌──────────┬──────────────┐
 *   │ sidebar  │ main content │
 *   └──────────┴──────────────┘
 */
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useCoreAuth, useCoreGroups } from '../core/hooks/useCoreData'
import { usePushNotifications }    from '../core/notifications/usePushNotifications'
import { useAuthActions }             from '../auth/useAuthActions'
import { useShellChrome }             from './ShellChromeContext'

async function shareApp() {
  const data = {
    title: 'Syng',
    text:  'Estoy organizando mi vida y proyectos con Syng. Pruébala:',
    url:   'https://syng-psi.vercel.app',
  }
  if (navigator.share) {
    try { await navigator.share(data) } catch {}
  } else {
    try {
      await navigator.clipboard.writeText(data.url)
      alert('Link copiado al portapapeles')
    } catch {
      alert('https://syng-psi.vercel.app')
    }
  }
}

// Íconos SVG planos para la barra de navegación
const ICONS = {
  agenda: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#2D3A8C' : 'rgba(13,18,64,0.38)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  pizarrones: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#2D3A8C' : 'rgba(13,18,64,0.38)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  compartir: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#2D3A8C' : 'rgba(13,18,64,0.38)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  avisos: (active, badge) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#2D3A8C' : 'rgba(13,18,64,0.38)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      {badge > 0 && <circle cx="18" cy="5" r="4" fill="#E53E3E" stroke="white" strokeWidth="1.5"/>}
    </svg>
  ),
  perfil: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#2D3A8C' : 'rgba(13,18,64,0.38)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  microfono: (escuchando) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={escuchando ? '#ffffff' : '#2D3A8C'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3"/><path d="M19 10a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
    </svg>
  ),
}

const NAV_ITEMS = [
  { key:'agenda',     label:'Mi Agenda',  path:'/agenda' },
  { key:'pizarrones', label:'Pizarrones', path:'/pizarrones' },
  { key:'compartir',  label:'Compartir',  path:'/compartir' },
  { key:'avisos',     label:'Avisos',     path:'/notificaciones' },
  { key:'perfil',     label:'Perfil',     path:'/perfil' },
]

export function AppShell({ children }) {
  const auth      = useCoreAuth()
  const groupsCtx = useCoreGroups()
  usePushNotifications()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { signOut } = useAuthActions()
  const { hideBottomNav } = useShellChrome()
  const hideNav = hideBottomNav || location.pathname.startsWith('/recordatorio/')
  const [unreadCount, setUnreadCount] = useState(0)
  useEffect(() => {
    const uid = auth?.user?.uid
    if (!uid) return
    const q = query(collection(db, `users/${uid}/notifications`), where('read', '==', false))
    return onSnapshot(q, snap => setUnreadCount(snap.size))
  }, [auth?.user?.uid])
  const [signingOut, setSigningOut] = useState(false)
  const [syngEscuchando, setSyngEscuchando] = useState(false)
  const [syngCargando, setSyngCargando]       = useState(false)
  const [historial, setHistorial]             = useState([])
  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const tieneSyngAI      = false // Pendiente app nativa — oculto en web

  async function toggleSyng() {
    if (syngCargando) return

    if (syngEscuchando) {
      // Detener grabación
      mediaRecorderRef.current?.stop()
      setSyngEscuchando(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setSyngCargando(true)

        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const formData = new FormData()
          formData.append('file', blob, 'audio.webm')
          formData.append('uid', auth.user.uid)

          // 1. Whisper — voz a texto
          const vozRes = await fetch('https://us-central1-syng-app.cloudfunctions.net/syngAiVoz', {
            method: 'POST',
            body: formData,
          })
          const vozData = await vozRes.json()
          const texto = vozData.texto

          if (!texto) {
            setSyngCargando(false)
            return
          }

          // 2. Claude — texto a respuesta
          const chatRes = await fetch('https://syngaichat-nufa4puqvq-uc.a.run.app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: auth.user.uid, message: texto, history: historial, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
          })
          const chatData = await chatRes.json()
          setHistorial(chatData.history || [])

          // 3. Voz nativa del iPhone — texto a voz
          const utterance = new SpeechSynthesisUtterance(chatData.reply)
          utterance.lang = 'es-MX'
          utterance.rate = 1.0
          utterance.pitch = 1.0
          window.speechSynthesis.speak(utterance)

        } catch (err) {
          console.error('[Syng AI] error:', err)
        } finally {
          setSyngCargando(false)
        }
      }

      mediaRecorder.start()
      setSyngEscuchando(true)

    } catch (err) {
      console.error('[Syng AI] no se pudo acceder al micrófono:', err)
    }
  }

  const user   = auth.user
  const groups = Array.from(groupsCtx.list.values())

  function isActive(path) {
    if (path === '/agenda') return location.pathname === '/agenda' || location.pathname.startsWith('/agenda/')
    return location.pathname.startsWith(path)
  }

  async function handleSignOut() {
    setSigningOut(true)
    try { await signOut() } finally { setSigningOut(false) }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      overflow: 'hidden',
      /* Fondo sistema Syng — azul-blanco neutro con luz atmosférica suave */
      background: [
        'radial-gradient(ellipse at 92% 4%,  rgba(255,200,150,0.28) 0%, transparent 48%)',
        'radial-gradient(ellipse at 8%  96%,  rgba(150,180,255,0.22) 0%, transparent 48%)',
        'linear-gradient(168deg, #F7F8FC 0%, #F2F4FB 50%, #EEF1F8 100%)',
      ].join(', '),
      backgroundAttachment: 'fixed',
    }}>

      {/* ── Sidebar desktop ─────────────────────────────────────────── */}
      <nav className="desktop-sidebar" aria-label="Navegación principal" style={{
        width: 220,
        flexShrink: 0,
        borderRight: '1px solid rgba(13,18,64,0.07)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 8px 12px',
        gap: 2,
        overflowY: 'auto',
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>

        {/* Logo */}
        <div
          onClick={() => navigate('/agenda')}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 10px 16px', cursor:'pointer' }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(145deg, #3D4FA8, #2D3A8C)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(45,58,140,0.28)',
          }}>S</div>
          <span style={{ fontSize:15, fontWeight:700, color:'#0D1240', letterSpacing:'-0.01em' }}>Syng</span>
        </div>

        {/* Nav items */}
        {NAV_ITEMS.map(item => (
          <button key={item.label} onClick={() => navigate(item.path)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '9px 10px', borderRadius: 10,
            border: 'none', textAlign: 'left', cursor: 'pointer',
            fontSize: 13,
            fontWeight: isActive(item.path) ? 600 : 400,
            background: isActive(item.path) ? 'rgba(45,58,140,0.10)' : 'transparent',
            color:      isActive(item.path) ? '#2D3A8C' : '#5B6480',
            transition: 'background 0.15s',
          }}>
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:22 }}>{ICONS[item.key]?.(isActive(item.path))}</span>
            {item.label}
          </button>
        ))}

        {/* Grupos */}
        {groups.length > 0 && (
          <div style={{ marginTop:16 }}>
            <p style={{ margin:'0 0 4px', padding:'0 10px', fontSize:10, fontWeight:600, color:'rgba(13,18,64,0.30)', letterSpacing:'0.08em' }}>MIS GRUPOS</p>
            {groups.map(g => {
              const active = location.pathname === `/pizarron/${g.id}`
              return (
                <button key={g.id} onClick={() => navigate(`/pizarron/${g.id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '8px 10px', borderRadius: 10,
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  background: active ? 'rgba(45,58,140,0.10)' : 'transparent',
                  color:      active ? '#2D3A8C' : '#5B6480',
                  transition: 'background 0.15s',
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(45,58,140,0.10)',
                    color: '#2D3A8C',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {g.name[0].toUpperCase()}
                  </span>
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.name}</span>
                </button>
              )
            })}
          </div>
        )}

        <div style={{ flex:1 }} />

        {/* Usuario */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 8px', borderTop:'1px solid rgba(13,18,64,0.07)' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(45,58,140,0.10)',
            color: '#2D3A8C',
            fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {(user?.displayName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#0D1240' }}>
              {user?.displayName || user?.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'rgba(13,18,64,0.30)', padding:4 }}
            title="Cerrar sesión"
          >⎋</button>
        </div>
      </nav>

      {/* ── Contenido + nav móvil ────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, background:'transparent' }}>

        <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0, background:'transparent', isolation:'isolate' }}>
          {children}
        </main>

        {/* Mobile bottom nav — oculta en pantallas de foco (ej. recordatorio iOS) */}
        {!hideNav && <nav className="mobile-bottom-nav" aria-label="Navegación móvil" style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderTop: '1px solid rgba(255,255,255,0.60)',
          flexShrink: 0,
          boxShadow: '0 -8px 32px rgba(13,18,64,0.07)',
          alignItems: 'center',
        }}>
          {NAV_ITEMS.slice(0,2).map(item => (
            <button
              key={item.label}
              onClick={() => item.path === '/compartir' ? shareApp() : navigate(item.path)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                border: 'none', background: 'transparent', cursor: 'pointer',
                padding: '8px 4px', minHeight: 56,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {ICONS[item.key]?.(isActive(item.path))}
              </span>
              <span style={{
                fontSize: 10, lineHeight: 1,
                fontWeight: isActive(item.path) ? 600 : 400,
                color: isActive(item.path) ? '#2D3A8C' : 'rgba(13,18,64,0.38)',
                transition: 'color 0.12s ease',
              }}>{item.label}</span>
            </button>
          ))}

          {/* Botón Syng AI — micrófono central */}
          {tieneSyngAI && (
            <button
              onClick={toggleSyng}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                border: 'none', background: 'transparent', cursor: 'pointer',
                padding: '4px 4px 8px', minHeight: 56,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{
                width: 42, height: 42,
                borderRadius: '50%',
                background: syngCargando
                  ? 'linear-gradient(145deg, #856404, #A07800)'
                  : syngEscuchando
                  ? 'linear-gradient(145deg, #3D4FA8, #2D3A8C)'
                  : 'linear-gradient(145deg, #EEF1F8, #E4E8F5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: syngCargando
                  ? '0 4px 16px rgba(133,100,4,0.45)'
                  : syngEscuchando
                  ? '0 4px 16px rgba(45,58,140,0.45)'
                  : '0 2px 8px rgba(13,18,64,0.12)',
                transition: 'all 0.2s ease',
              }}>
                {ICONS.microfono(syngEscuchando)}
              </span>
              <span style={{
                fontSize: 10, lineHeight: 1, fontWeight: 600,
                color: syngCargando ? '#856404' : syngEscuchando ? '#2D3A8C' : 'rgba(13,18,64,0.38)',
              }}>{syngCargando ? '...' : syngEscuchando ? 'Escucha' : 'Syng'}</span>
            </button>
          )}

          {NAV_ITEMS.slice(2).map(item => (
            <button
              key={item.label}
              onClick={() => item.path === '/compartir' ? shareApp() : navigate(item.path)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                border: 'none', background: 'transparent', cursor: 'pointer',
                padding: '8px 4px', minHeight: 56,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {ICONS[item.key]?.(isActive(item.path), item.key === 'avisos' ? unreadCount : 0)}
                {item.key === 'avisos' && unreadCount > 0 && (
                  <span style={{
                    position:'absolute', top:-4, right:-6,
                    background:'#E53E3E', color:'#fff',
                    fontSize:9, fontWeight:700,
                    borderRadius:10, minWidth:15, height:15,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    padding:'0 3px', lineHeight:1,
                  }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </span>
              <span style={{
                fontSize: 10, lineHeight: 1,
                fontWeight: isActive(item.path) ? 600 : 400,
                color: isActive(item.path) ? '#2D3A8C' : 'rgba(13,18,64,0.38)',
                transition: 'color 0.12s ease',
              }}>{item.label}</span>
            </button>
          ))}
        </nav>}
      </div>
    </div>
  )
}

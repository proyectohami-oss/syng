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
import { useCoreAuth, useCoreGroups } from '../core/hooks/useCoreData'
import { useAuthActions }             from '../auth/useAuthActions'
import { useState, useEffect }        from 'react'

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

const NAV_ITEMS = [
  { emoji:'📅', label:'Mi Agenda',  path:'/agenda' },
  { emoji:'📌', label:'Pizarrones', path:'/pizarrones' },
  // { emoji:'🛒', label:'Súper',      path:'/super' },
  { emoji:'📤', label:'Compartir',  path:'/compartir' },
  { emoji:'🔔', label:'Avisos',     path:'/notificaciones' },
  { emoji:'👤', label:'Perfil',     path:'/perfil' },
]

export function AppShell({ children }) {
  const auth      = useCoreAuth()
  const groupsCtx = useCoreGroups()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { signOut } = useAuthActions()
  const [signingOut, setSigningOut] = useState(false)

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
      paddingTop: 'env(safe-area-inset-top)',
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
            <span style={{ fontSize:18 }}>{item.emoji}</span>
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

        {/* Mobile bottom nav */}
        <nav className="mobile-bottom-nav" aria-label="Navegación móvil" style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderTop: '1px solid rgba(255,255,255,0.60)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          flexShrink: 0,
          boxShadow: '0 -8px 32px rgba(13,18,64,0.07)',
        }}>
          {NAV_ITEMS.map(item => (
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
              <span style={{
                fontSize: 22, lineHeight: 1,
                filter: isActive(item.path) ? 'none' : 'grayscale(40%) opacity(0.60)',
                transform: isActive(item.path) ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.12s ease',
                display: 'block',
              }}>{item.emoji}</span>
              <span style={{
                fontSize: 10, lineHeight: 1,
                fontWeight: isActive(item.path) ? 600 : 400,
                color: isActive(item.path) ? '#2D3A8C' : 'rgba(13,18,64,0.38)',
                transition: 'color 0.12s ease',
              }}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

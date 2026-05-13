import { useNavigate, useLocation } from 'react-router-dom'
import { useCoreAuth, useCoreGroups } from '../core/hooks/useCoreData'
import { useAuthActions }           from '../auth/useAuthActions'
import { useState }                 from 'react'

// Navegación principal — sin "Inicio" por ahora
const NAV_ITEMS = [
  { emoji:'📅', label:'Mi Agenda',  path:'/agenda' },
  { emoji:'📌', label:'Pizarrones', path:'/pizarrones' },
  { emoji:'🛒', label:'Súper',      path:'/super' },
  { emoji:'🎁', label:'Compartir',  path:'/compartir' },
  { emoji:'👤', label:'Perfil',     path:'/perfil' },
]

// Mobile — 4 tabs (sin Inicio ni Compartir)
const MOBILE_ITEMS = [
  { emoji:'📅', label:'Agenda',     path:'/agenda' },
  { emoji:'📌', label:'Pizarrones', path:'/pizarrones' },
  { emoji:'🛒', label:'Súper',      path:'/super' },
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
    <div style={shell}>

      {/* ── Sidebar desktop ─────────────────────────────────── */}
      <nav style={sidebar} aria-label="Navegación principal">

        {/* Logo */}
        <div style={logoArea} onClick={() => navigate('/agenda')} role="button" tabIndex={0}>
          <div style={logoMark}>S</div>
          <span style={{ fontSize:15, fontWeight:700, color:'#111' }}>Syng</span>
        </div>

        {/* Nav principal */}
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                width:'100%', padding:'9px 10px', borderRadius:10,
                border:'none', textAlign:'left', cursor:'pointer',
                fontSize:13, fontWeight: isActive(item.path) ? 600 : 400,
                background: isActive(item.path) ? '#EDE9FE' : 'transparent',
                color:      isActive(item.path) ? '#5B3DF6' : '#374151',
              }}
            >
              <span style={{ fontSize:18 }}>{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Pizarrones del usuario — solo aquí, no en nav principal */}
        {groups.length > 0 && (
          <div style={{ marginTop:16 }}>
            <p style={sectionLabel}>MIS GRUPOS</p>
            {groups.map(g => {
              const active = location.pathname === `/pizarron/${g.id}`
              return (
                <button
                  key={g.id}
                  onClick={() => navigate(`/pizarron/${g.id}`)}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    width:'100%', padding:'8px 10px', borderRadius:10,
                    border:'none', cursor:'pointer', textAlign:'left',
                    fontSize:13, fontWeight: active ? 600 : 400,
                    background: active ? '#EDE9FE' : 'transparent',
                    color:      active ? '#5B3DF6' : '#374151',
                  }}
                >
                  <span style={{
                    width:22, height:22, borderRadius:'50%',
                    background:'#EDE9FE', color:'#5B3DF6',
                    fontSize:11, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink:0,
                  }}>
                    {g.name[0].toUpperCase()}
                  </span>
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {g.name}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div style={{ flex:1 }} />

        {/* Usuario */}
        <div style={userArea}>
          <div style={avatar}>
            {(user?.displayName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#111' }}>
              {user?.displayName || user?.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9ca3af', padding:4 }}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            ⎋
          </button>
        </div>
      </nav>

      {/* ── Contenido principal ──────────────────────────────── */}
      <main style={mainArea}>
        {children}
      </main>

      {/* ── Barra mobile inferior ────────────────────────────── */}
      <nav style={bottomBar} aria-label="Navegación móvil">
        {MOBILE_ITEMS.map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:3,
              border:'none', background:'transparent', cursor:'pointer',
              padding:'8px 4px',
              minHeight: 60,              // área táctil completa
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{
              fontSize: 24, lineHeight: 1,
              filter: isActive(item.path) ? 'none' : 'grayscale(30%) opacity(0.7)',
              transition: 'filter 0.1s, transform 0.1s',
              transform: isActive(item.path) ? 'scale(1.1)' : 'scale(1)',
              display: 'block',
            }}>{item.emoji}</span>
            <span style={{
              fontSize: 11,
              fontWeight: isActive(item.path) ? 600 : 400,
              color: isActive(item.path) ? '#5B3DF6' : '#9ca3af',
              letterSpacing: '-0.01em',
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}

const shell    = { display:'flex', height:'100%', overflow:'hidden' }
const mainArea = { flex:1, overflow:'hidden', display:'flex', flexDirection:'column', minWidth:0 }
const sidebar  = {
  width:220, flexShrink:0,
  borderRight:'1px solid #f3f4f6',
  display:'flex', flexDirection:'column',
  padding:'16px 8px 12px', gap:2, overflowY:'auto',
}
const bottomBar = { display:'none' }
const logoArea  = {
  display:'flex', alignItems:'center', gap:10,
  padding:'4px 10px 16px', cursor:'pointer',
}
const logoMark = {
  width:30, height:30, borderRadius:8,
  background:'#5B3DF6', color:'#fff',
  fontSize:16, fontWeight:700,
  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
}
const sectionLabel = {
  margin:'0 0 4px', padding:'0 10px',
  fontSize:10, fontWeight:600, color:'#d1d5db',
  letterSpacing:'0.08em',
}
const userArea = {
  display:'flex', alignItems:'center', gap:8,
  padding:'10px 8px', borderTop:'1px solid #f3f4f6', marginTop:4,
}
const avatar = {
  width:30, height:30, borderRadius:'50%', flexShrink:0,
  background:'#EDE9FE', color:'#5B3DF6',
  fontSize:13, fontWeight:600,
  display:'flex', alignItems:'center', justifyContent:'center',
}

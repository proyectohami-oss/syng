import { useState, useEffect, useRef } from 'react'
import { TEXTOS } from './idiomas'
import { auth, googleProvider, db } from './firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, getDocs, updateDoc, setDoc, arrayUnion, collection, onSnapshot } from 'firebase/firestore'
import Pizarron from './Pizarron'
import PantallaInvitacion from './PantallaInvitacion'
import ListaTareas from './ListaTareas'
import ListaSuper from './ListaSuper'
import MiAgenda from './MiAgenda'

const TEMA = {
  oscuro: {
    bg: '#070712', bgCard: '#18183A', bgCardAlt: '#1E1E42', bgInput: '#22224A',
    header: 'linear-gradient(135deg,#534AB7,#2D2B6B)', headerSolido: '#534AB7',
    texto: '#F0F0FF', textoSub: '#9090B8', textoMuted: 'rgba(255,255,255,0.45)',
    borde: 'rgba(255,255,255,0.13)', bordeInput: 'rgba(255,255,255,0.2)',
    acento: '#7B6EF6', acentoVerde: '#2ECC9A',
    navBg: '#0E0E24', navBorde: 'rgba(255,255,255,0.12)',
    sombra: '0 4px 24px rgba(0,0,0,0.7)', nombre: 'oscuro',
    statPendBg: '#201C48', statCompBg: '#0C2E24',
  },
  claro: {
    bg: '#F5F5F7', bgCard: '#FFFFFF', bgCardAlt: '#F0F0F8', bgInput: '#F5F5F7',
    header: 'linear-gradient(135deg,#534AB7,#185FA5)', headerSolido: '#534AB7',
    texto: '#1C1C2E', textoSub: '#666680', textoMuted: 'rgba(0,0,0,0.28)',
    borde: '#EAEAEA', bordeInput: '#D8D8E8',
    acento: '#534AB7', acentoVerde: '#0F6E56',
    navBg: '#FFFFFF', navBorde: '#EAEAEA',
    sombra: '0 2px 12px rgba(0,0,0,0.07)', nombre: 'claro',
    statPendBg: '#EEF0FF', statCompBg: '#E6F7F2',
  },
}

const IDIOMAS = [
  { codigo:'es', bandera:'🇲🇽', nombre:'Español' },
  { codigo:'en', bandera:'🇺🇸', nombre:'English' },
  { codigo:'fr', bandera:'🇫🇷', nombre:'Français' },
  { codigo:'de', bandera:'🇩🇪', nombre:'Deutsch' },
  { codigo:'it', bandera:'🇮🇹', nombre:'Italiano' },
  { codigo:'pt', bandera:'🇧🇷', nombre:'Português' },
  { codigo:'ja', bandera:'🇯🇵', nombre:'日本語' },
  { codigo:'zh', bandera:'🇨🇳', nombre:'中文' },
]


// ─── SINYI ────────────────────────────────────────────────────
function Sinyi() { return null }

// ─── SELECTOR IDIOMA ──────────────────────────────────────────
function SelectorIdioma({ idioma, onChange, tema }) {
  const th = tema || TEMA.claro
  return (
    <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'8px', marginBottom:'24px' }}>
      {IDIOMAS.map(l => (
        <button key={l.codigo} onClick={() => onChange(l.codigo)} style={{ fontSize:'22px', padding:'6px 10px', borderRadius:'12px', cursor:'pointer', border: idioma===l.codigo ? `2px solid ${th.acento}` : `2px solid ${th.borde}`, background: idioma===l.codigo ? `${th.acento}22` : 'transparent', transition:'all 0.2s' }} title={l.nombre}>{l.bandera}</button>
      ))}
    </div>
  )
}

// ─── BARRA NAVEGACIÓN ─────────────────────────────────────────
function NavBar({ pantalla, onIrPantalla, th, t }) {
  const items = [
    { key:'inicio', label:t.inicio, icon:'🏠' },
    { key:'pizarron', label:t.pizarron, icon:'📅' },
    { key:'listasuper', label:t.super2, icon:'🛒' },
    { key:'compartir', label:t.compartir, icon:'📤', accion: () => { if(navigator.share){ navigator.share({title:'Syng',text:'Te comparto Syng, mi asistente inteligente de vida',url:'https://syng-psi.vercel.app'}) } else { navigator.clipboard.writeText('https://syng-psi.vercel.app') } } },
    { key:'perfil', label:t.perfil, icon:'👤' },
  ]
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, background: th.nombre==='oscuro' ? 'rgba(6,6,15,0.85)' : th.navBg, borderTop: th.nombre==='oscuro' ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${th.navBorde}`, backdropFilter: th.nombre==='oscuro' ? 'blur(20px)' : 'none', display:'flex', zIndex:50, paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
      {items.map(item => {
        const activo = pantalla === item.key
        return (
          <button key={item.key} onClick={() => item.accion ? item.accion() : onIrPantalla(item.key)} style={{ flex:1, padding:'10px 0 8px', background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', color: activo ? th.acento : th.textoSub, transition:'color 0.2s' }}>
            <span style={{ fontSize:'20px', lineHeight:1 }}>{item.icon}</span>
            <span style={{ fontSize:'10px', fontWeight: activo ? '700' : '400' }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── PANTALLA PERFIL ──────────────────────────────────────────
function PantallaPerfil({ user, idioma, tema, t, onCambiarIdioma, onToggleTema, onSalir, onNavegar }) {
  const th = TEMA[tema]
  const nombre = user?.displayName || user?.email?.split('@')[0] || 'Usuario'
  const email = user?.email || ''
  const iniciales = nombre.trim().split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('')
  const idiomaActual = IDIOMAS.find(l => l.codigo === idioma)
  const [pwaPrompt, setPwaPrompt] = useState(null)
  const [pwaInstalada, setPwaInstalada] = useState(() => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)
  const [pwaIos, setPwaIos] = useState(false)
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false)
  useEffect(() => {
    const esIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const esStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (esStandalone) { setPwaInstalada(true); return }
    if (esIos) { setPwaIos(true); return }
    const handler = (e) => { e.preventDefault(); setPwaPrompt(e); console.log('PWA prompt capturado') }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setPwaInstalada(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  const instalarPwa = async () => {
    if (pwaPrompt) { pwaPrompt.prompt(); const r = await pwaPrompt.userChoice; if (r.outcome === 'accepted') setPwaInstalada(true); setPwaPrompt(null) }
  }
  return (
    <div style={{ minHeight:'100vh', background:th.bg, fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', paddingBottom:'80px' }}>
      <div style={{ background:th.header, padding:'48px 20px 36px 20px', textAlign:'center' }}>
        <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'3px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:'28px', fontWeight:'800', color:'white' }}>{iniciales||'👤'}</div>
        <div style={{ color:'white', fontSize:'20px', fontWeight:'700' }}>{nombre}</div>
        <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'14px', marginTop:'4px' }}>{email}</div>
      </div>
      <div style={{ padding:'24px 16px' }}>
        <div style={{ fontSize:'11px', fontWeight:'700', color:th.textoSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px', paddingLeft:'4px' }}>{t.apariencia}</div>
        <div style={{ background:th.bgCard, borderRadius:'18px', overflow:'hidden', boxShadow:th.sombra, marginBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:`1px solid ${th.borde}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${th.acento}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>☀️</div>
              <span style={{ fontSize:'15px', fontWeight:'500', color:th.texto }}>{t.modoOscuro}</span>
            </div>
            <div onClick={onToggleTema} style={{ width:'52px', height:'30px', borderRadius:'15px', background:tema==='oscuro'?th.acento:'#ccc', position:'relative', cursor:'pointer', transition:'background 0.3s', flexShrink:0 }}>
              <div style={{ position:'absolute', top:'3px', left:tema==='oscuro'?'24px':'3px', width:'24px', height:'24px', borderRadius:'50%', background:'white', transition:'left 0.3s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }} />
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${th.acento}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🕐</div>
              <span style={{ fontSize:'15px', fontWeight:'500', color:th.texto }}>{t.idioma}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', color:th.textoSub, fontSize:'14px' }}>
              <span>{idiomaActual?.bandera}</span><span>{idiomaActual?.nombre}</span><span style={{ fontSize:'12px' }}>›</span>
            </div>
          </div>
        </div>
        <div style={{ background:th.bgCard, borderRadius:'18px', padding:'16px 20px', boxShadow:th.sombra, marginBottom:'20px' }}>
          <SelectorIdioma idioma={idioma} onChange={onCambiarIdioma} tema={th} />
        </div>
        <div style={{ marginBottom:'20px' }}>
            <div style={{ fontSize:'11px', fontWeight:'700', color:th.textoSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px', paddingLeft:'4px' }}>App</div>
            <div style={{ background:th.bgCard, borderRadius:'18px', overflow:'hidden', boxShadow:th.sombra }}>
              <div onClick={pwaPrompt ? instalarPwa : () => setMostrarInstrucciones(true)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${th.acento}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>📲</div>
                  <div>
                    <div style={{ fontSize:'15px', fontWeight:'500', color:th.texto }}>{t.instalarSyng}</div>
                    <div style={{ fontSize:'12px', color:th.textoSub }}>{t.instalarDesc}</div>
                  </div>
                </div>
                <span style={{ color:th.acento, fontSize:'16px' }}>›</span>
              </div>
          </div>
        </div>
        {mostrarInstrucciones && (
          <div onClick={() => setMostrarInstrucciones(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:300, padding:'0 0 90px 0' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:th.bgCard, borderRadius:'24px 24px 0 0', padding:'32px 24px 28px', width:'100%', maxWidth:'400px' }}>
              <div style={{ textAlign:'center', marginBottom:'20px' }}>
                <div style={{ fontSize:'40px', marginBottom:'12px' }}>📲</div>
                <div style={{ fontSize:'18px', fontWeight:'700', color:th.texto, marginBottom:'8px' }}>{t.instalarTitulo}</div>
                <div style={{ fontSize:'14px', color:th.textoSub, lineHeight:'1.4' }}>{pwaIos ? t.instalarIos : t.instalarAndroid}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <button onClick={pwaPrompt ? instalarPwa : () => setMostrarInstrucciones(false)} style={{ width:'100%', padding:'15px', background:th.acento, border:'none', borderRadius:'14px', color:'white', fontSize:'15px', fontWeight:'600', cursor:'pointer' }}>{pwaPrompt ? 'Instalar' : 'Entendido'}</button>
                <button onClick={() => setMostrarInstrucciones(false)} style={{ width:'100%', padding:'15px', background:'transparent', border:'none', borderRadius:'14px', color:th.textoSub, fontSize:'15px', cursor:'pointer' }}>{t.ahoraNO}</button>
              </div>
            </div>
          </div>
        )}
        <div style={{ fontSize:'11px', fontWeight:'700', color:th.textoSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px', paddingLeft:'4px' }}>{t.cuentaLabel}</div>
        <div style={{ background:th.bgCard, borderRadius:'18px', overflow:'hidden', boxShadow:th.sombra, marginBottom:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:`1px solid ${th.borde}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${th.acento}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>👤</div>
              <span style={{ fontSize:'15px', fontWeight:'500', color:th.texto }}>{t.miPerfil}</span>
            </div>
            <span style={{ color:th.textoSub, fontSize:'16px' }}>›</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${th.acento}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🔒</div>
              <span style={{ fontSize:'15px', fontWeight:'500', color:th.texto }}>{t.privacidad}</span>
            </div>
            <span style={{ color:th.textoSub, fontSize:'16px' }}>›</span>
          </div>
        </div>
        <div style={{ background:th.bgCard, borderRadius:'18px', overflow:'hidden', boxShadow:th.sombra, marginBottom:'20px' }}>
          <div onClick={()=>{ if(navigator.share){ navigator.share({title:'Syng',text:'Te comparto Syng, mi asistente inteligente de vida',url:'https://syng-psi.vercel.app'}) } else { navigator.clipboard.writeText('https://syng-psi.vercel.app'); alert('Link copiado') }}} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', cursor:'pointer' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${th.acento}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>⬆</div>
              <span style={{ fontSize:'15px', fontWeight:'500', color:th.texto }}>{t.compartirSyng}</span>
            </div>
            <span style={{ color:th.textoSub, fontSize:'16px' }}>›</span>
          </div>
        </div>
        <button onClick={onSalir} style={{ width:'100%', padding:'16px', background:'rgba(197,48,48,0.15)', border:'none', borderRadius:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', color:'#E53935' }}>
          <span style={{ fontSize:'20px' }}>↪</span>
          <span style={{ fontSize:'15px', fontWeight:'600' }}>{t.cerrarSesion}</span>
        </button>
        <div style={{ textAlign:'center', marginTop:'32px', color:th.textoMuted, fontSize:'12px' }}>{t.version}</div>
      </div>
      <NavBar pantalla="perfil" onIrPantalla={onNavegar} th={th} t={t} />
    </div>
  )
}

// ─── PANTALLA HOME ────────────────────────────────────────────
function PantallaHome({ user, t, th, onIrPantalla, userId }) {
  const nombre = user?.displayName?.split(' ')[0] || 'bienvenido'
  const iniciales = (user?.displayName||user?.email||'U').trim().split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('')
  const hoy = new Date()
  const diasSemana = t.diasSemanaLargo
  const mesesHome = t.mesesLargo
  const fechaStr = `${diasSemana[hoy.getDay()]}, ${hoy.getDate()} ${mesesHome[hoy.getMonth()]}`
  const [pendientesHoy, setPendientesHoy] = useState(0)
  const [completadasHoy, setCompletatdasHoy] = useState(0)
  const [desglosePizarrones, setDesglosePizarrones] = useState([])
  const [modalStats, setModalStats] = useState(null)
  const [mostrarBannerSinyi, setMostrarBannerSinyi] = useState(true)
  const activarSinyi = () => {
    setMostrarBannerSinyi(false)
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))
    window.dispatchEvent(new CustomEvent('sinyi:activar'))
  }

  useEffect(() => {
    if (!userId) return
    const hoyKey = `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}`
    let unsubs = []
    let datosGrupos = {}
    const recalcular = () => {
      const todos = Object.values(datosGrupos)
      setPendientesHoy(todos.reduce((s, g) => s + g.pendientes, 0))
      setCompletatdasHoy(todos.reduce((s, g) => s + g.completadas, 0))
      setDesglosePizarrones(todos.filter(g => g.pendientes > 0 || g.completadas > 0))
    }
    const suscribir = (ref, nombre, grupoId) => {
      const unsub = onSnapshot(ref, snap => {
        const d = snap.docs.find(d => d.id === hoyKey)
        const items = d?.data()?.items || []
        datosGrupos[grupoId] = { nombre, grupoId, pendientes: items.filter(i => !i.realizada).length, completadas: items.filter(i => i.realizada).length }
        recalcular()
      })
      unsubs.push(unsub)
    }
    suscribir(collection(db, 'users', userId, 'pizarron'), t.personal, 'personal')
    getDocs(collection(db, 'users', userId, 'misGrupos')).then(snap => {
      snap.docs.forEach(d => {
        const data = d.data()
        if (!data.modulo || data.modulo === 'pizarron') suscribir(collection(db, 'grupos', d.id, 'pizarron'), data.nombre || 'Grupo', d.id)
      })
    })
    return () => unsubs.forEach(u => u())
  }, [userId])

  const esOscuro = th.nombre === 'oscuro'

  return (
    <div style={{ minHeight:'100vh', background: esOscuro ? '#06060F' : th.bg, fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', paddingBottom:'80px', position:'relative', overflow:'hidden' }}>
      {/* Orbes glassmorphism - solo modo oscuro */}
      {esOscuro && <>
        <div style={{ position:'fixed', top:'-80px', left:'-60px', width:'280px', height:'280px', borderRadius:'50%', background:'radial-gradient(circle, rgba(123,110,246,0.2) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'fixed', top:'250px', right:'-80px', width:'260px', height:'260px', borderRadius:'50%', background:'radial-gradient(circle, rgba(46,204,154,0.13) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'fixed', bottom:'100px', left:'20px', width:'180px', height:'180px', borderRadius:'50%', background:'radial-gradient(circle, rgba(123,110,246,0.1) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      </>}

      {/* Header */}
      <div style={{ background: esOscuro ? 'linear-gradient(135deg,rgba(83,74,183,0.9),rgba(45,43,107,0.85))' : th.header, padding:'16px 20px 28px 20px', position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', color:'white', fontWeight:'800' }}>∞</div>
            <div style={{ color:'white', fontSize:'22px', fontWeight:'800', letterSpacing:'-0.5px' }}>Syng</div>
          </div>
          <button onClick={() => onIrPantalla('perfil')} style={{ width:'42px', height:'42px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'15px', fontWeight:'700', cursor:'pointer' }}>
            {iniciales||'👤'}
          </button>
        </div>
        <div style={{ marginTop:'20px' }}>
          <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'13px' }}>{fechaStr}</div>
          <div style={{ color:'white', fontSize:'24px', fontWeight:'800', marginTop:'2px' }}>{t.hola}, {nombre}.</div>
          <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'14px', marginTop:'2px' }}>{pendientesHoy} {t.pendientesHoy}</div>
        </div>
      </div>


      {/* Contenido */}
      <div style={{ padding:'20px 16px', display:'flex', flexDirection:'column', gap:'16px', position:'relative', zIndex:1 }}>

        {/* Stats */}
        <div style={{ display:'flex', gap:'12px' }}>
          <div onClick={() => setModalStats('pendientes')} style={{ flex:1, background: esOscuro ? 'rgba(123,110,246,0.12)' : th.statPendBg, border: esOscuro ? '1px solid rgba(123,110,246,0.3)' : 'none', borderRadius:'18px', padding:'18px 16px', backdropFilter: esOscuro ? 'blur(10px)' : 'none', cursor:'pointer' }}>
            <div style={{ fontSize:'28px', fontWeight:'800', color: esOscuro ? '#A89EFF' : th.acento }}>{pendientesHoy}</div>
            <div style={{ fontSize:'12px', color: esOscuro ? 'rgba(168,158,255,0.7)' : th.textoSub, marginTop:'4px' }}>{t.pendientes}</div>
          </div>
          <div onClick={() => setModalStats('completadas')} style={{ flex:1, background: esOscuro ? 'rgba(46,204,154,0.1)' : th.statCompBg, border: esOscuro ? '1px solid rgba(46,204,154,0.25)' : 'none', borderRadius:'18px', padding:'18px 16px', backdropFilter: esOscuro ? 'blur(10px)' : 'none', cursor:'pointer' }}>
            <div style={{ fontSize:'28px', fontWeight:'800', color: esOscuro ? '#5EDFB8' : th.acentoVerde }}>{completadasHoy}</div>
            <div style={{ fontSize:'12px', color: esOscuro ? 'rgba(94,223,184,0.7)' : th.textoSub, marginTop:'4px' }}>{t.completadas}</div>
          </div>
        </div>

        {/* Label */}
        <div onClick={() => onIrPantalla('miagenda')} style={{ background: esOscuro ? 'rgba(255,255,255,0.04)' : th.bgCard, border: esOscuro ? '1px solid rgba(123,110,246,0.35)' : 'none', borderRadius:'18px', padding:'18px 16px', boxShadow: esOscuro ? 'none' : th.sombra, cursor:'pointer', display:'flex', alignItems:'center', gap:'14px' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'14px', background: esOscuro ? 'rgba(123,110,246,0.2)' : th.acento+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>📅</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'16px', fontWeight:'700', color: esOscuro ? '#A89EFF' : th.acento }}>{t.miAgenda}</div>
            <div style={{ color: esOscuro ? 'rgba(255,255,255,0.4)' : th.textoSub, fontSize:'13px', marginTop:'2px' }}>{t.miAgendaDesc}</div>
          </div>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: esOscuro ? '#7B6EF6' : th.acento, opacity:0.7 }} />
        </div>
        <div style={{ fontSize:'11px', fontWeight:'700', color: esOscuro ? 'rgba(255,255,255,0.35)' : th.textoSub, textTransform:'uppercase', letterSpacing:'0.08em', paddingLeft:'4px', marginBottom:'-4px' }}>{t.misModulos}</div>

        {/* Pizarrón */}
        <div onClick={() => onIrPantalla('pizarron')} style={{ background: esOscuro ? 'rgba(255,255,255,0.04)' : th.bgCard, border: esOscuro ? '1px solid rgba(123,110,246,0.35)' : 'none', borderRadius:'18px', padding:'18px 16px', boxShadow: esOscuro ? 'none' : th.sombra, cursor:'pointer', display:'flex', alignItems:'center', gap:'14px', backdropFilter: esOscuro ? 'blur(12px)' : 'none' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'14px', background: esOscuro ? 'rgba(123,110,246,0.2)' : `${th.acento}22`, border: esOscuro ? '1px solid rgba(123,110,246,0.3)' : 'none', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>▦</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'16px', fontWeight:'700', color: esOscuro ? '#A89EFF' : th.acento }}>{t.pizarron}</div>
            <div style={{ color: esOscuro ? 'rgba(255,255,255,0.4)' : th.textoSub, fontSize:'13px', marginTop:'2px' }}>{t.pizarronDesc}</div>
          </div>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: esOscuro ? '#7B6EF6' : th.acento, opacity:0.7 }} />
        </div>

        {/* Lista del Súper */}
        <div onClick={() => onIrPantalla('listasuper')} style={{ background: esOscuro ? 'rgba(255,255,255,0.04)' : th.bgCard, border: esOscuro ? '1px solid rgba(46,204,154,0.3)' : 'none', borderRadius:'18px', padding:'18px 16px', boxShadow: esOscuro ? 'none' : th.sombra, cursor:'pointer', display:'flex', alignItems:'center', gap:'14px', backdropFilter: esOscuro ? 'blur(12px)' : 'none' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'14px', background: esOscuro ? 'rgba(46,204,154,0.15)' : `${th.acentoVerde}22`, border: esOscuro ? '1px solid rgba(46,204,154,0.25)' : 'none', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>◫</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'16px', fontWeight:'700', color: esOscuro ? '#5EDFB8' : th.acentoVerde }}>{t.super}</div>
            <div style={{ color: esOscuro ? 'rgba(255,255,255,0.4)' : th.textoSub, fontSize:'13px', marginTop:'2px' }}>{t.superDesc}</div>
          </div>
          <div style={{ width:'24px', height:'24px', borderRadius:'50%', background: esOscuro ? '#2ECC9A' : th.acentoVerde, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', color: esOscuro ? '#04342C' : 'white' }}>0</div>
        </div>

        {/* Espacio reservado */}
        <div style={{ background: esOscuro ? 'rgba(255,255,255,0.02)' : th.bgCard, border: esOscuro ? '1px solid rgba(255,255,255,0.08)' : 'none', borderRadius:'18px', padding:'18px 16px', opacity:0.35, minHeight:'72px', backdropFilter: esOscuro ? 'blur(8px)' : 'none' }} />
      </div>

      <Sinyi idioma={'es'} nombre={nombre} pantalla={'inicio'} />
      {modalStats && (
        <div onClick={() => setModalStats(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:300, padding:'0 0 90px 0' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: esOscuro ? '#1A1A35' : 'white', borderRadius:'20px 20px 0 0', padding:'24px 20px', width:'100%', maxWidth:'400px' }}>
            <div style={{ fontSize:'13px', fontWeight:'700', color: esOscuro ? 'rgba(255,255,255,0.5)' : '#888', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'16px' }}>
              {modalStats === 'pendientes' ? t.pendientesPizarron : t.completadasPizarron}
            </div>
            {desglosePizarrones.filter(g => modalStats === 'pendientes' ? g.pendientes > 0 : g.completadas > 0).length === 0 && (
              <div style={{ color: esOscuro ? 'rgba(255,255,255,0.4)' : '#aaa', fontSize:'14px', textAlign:'center', padding:'12px 0' }}>{t.sinTareas}</div>
            )}
            {desglosePizarrones.filter(g => modalStats === 'pendientes' ? g.pendientes > 0 : g.completadas > 0).map(g => (
              <div key={g.grupoId} onClick={() => { setModalStats(null); localStorage.setItem('syng_grupo_activo_pizarron', g.grupoId); onIrPantalla('pizarron') }} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', marginBottom:'8px', borderRadius:'14px', background: esOscuro ? 'rgba(255,255,255,0.06)' : '#f5f5f7', cursor:'pointer' }}>
                <div style={{ fontSize:'15px', fontWeight:'600', color: esOscuro ? 'white' : '#2C2C2A' }}>{g.nombre}</div>
                <div style={{ fontSize:'22px', fontWeight:'800', color: modalStats === 'pendientes' ? (esOscuro ? '#A89EFF' : '#534AB7') : (esOscuro ? '#5EDFB8' : '#2ECC9A') }}>
                  {modalStats === 'pendientes' ? g.pendientes : g.completadas}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <NavBar pantalla="inicio" onIrPantalla={onIrPantalla} th={th} t={t} />
    </div>
  )
}

// ─── APP PRINCIPAL ────────────────────────────────────────────
export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [pantalla, setPantalla] = useState('inicio')
  const [idioma, setIdioma] = useState(() => localStorage.getItem('syng_idioma') || 'es')
  const [tema, setTema] = useState(() => localStorage.getItem('syng_tema') || 'claro')
  const [invId, setInvId] = useState(null)
  const [invData, setInvData] = useState(null)
  const [invCargando, setInvCargando] = useState(false)
  const [grupoDestino, setGrupoDestino] = useState(null)
  const t = TEXTOS[idioma] || TEXTOS.es
  const th = TEMA[tema] || TEMA.oscuro
  const cambiarIdioma = (cod) => { setIdioma(cod); localStorage.setItem('syng_idioma', cod) }
  const toggleTema = () => { const nuevo = tema==='oscuro'?'claro':'oscuro'; setTema(nuevo); localStorage.setItem('syng_tema', nuevo) }
  const navegar = (destino) => { setPantalla(destino) }
  useEffect(() => {
    const h = (e) => { if (e.detail?.destino) setPantalla(e.detail.destino) }
    window.addEventListener('syng:navegar', h)
    return () => window.removeEventListener('syng:navegar', h)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('invitacion')
    if (!id) return
    setInvId(id); setInvCargando(true)
    const cargarInv = async () => {
      try {
        const invSnap = await getDoc(doc(db,'invitaciones',id))
        if (!invSnap.exists()) { setInvId(null); setInvCargando(false); return }
        const inv = invSnap.data()
        if (inv.usado) { setInvId(null); setInvCargando(false); return }
        const gSnap = await getDoc(doc(db,'grupos',inv.grupoId))
        if (!gSnap.exists()) { setInvId(null); setInvCargando(false); return }
        const grupo = gSnap.data()
        setInvData({ grupoId:inv.grupoId, modulo:inv.modulo, grupoNombre:grupo.nombre, adminNombre:grupo.adminNombre||'un administrador' })
      } catch { setInvId(null) }
      setInvCargando(false)
    }
    cargarInv()
  }, [])

  const procesarInvitacion = async (u, inv) => {
    if (!u || !inv) return
    try {
      const gSnap = await getDoc(doc(db,'grupos',inv.grupoId))
      if (!gSnap.exists()) return
      const grupo = gSnap.data()
      const yaMiembro = (grupo.miembros||[]).some(m => m.uid===u.uid)
      if (!yaMiembro) {
        await updateDoc(doc(db,'grupos',inv.grupoId), { miembros: arrayUnion({ uid:u.uid, email:u.email||'', nombre:u.displayName||u.email?.split('@')[0]||'Usuario', rol:'miembro' }) })
        await setDoc(doc(db,'users',u.uid,'misGrupos',inv.grupoId), { nombre:grupo.nombre, modulo:inv.modulo })
      }
      const invSnap = await getDoc(doc(db,'invitaciones',invId||''))
      if (invSnap.exists() && !invSnap.data().usado) await updateDoc(doc(db,'invitaciones',invId), { usado:true })
      window.history.replaceState({},'',window.location.pathname)
      setInvId(null); setInvData(null)
      setGrupoDestino({ grupoId:inv.grupoId, modulo:inv.modulo })
    } catch(e) { console.error(e) }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      const invPendiente = invData || JSON.parse(localStorage.getItem('syng_inv_pendiente')||'null')
      if (u && invPendiente) { localStorage.removeItem('syng_inv_pendiente'); await procesarInvitacion(u, invPendiente) }
    })
    return unsub
  }, [invData])

  useEffect(() => {
    if (user && grupoDestino) {
      localStorage.setItem('syng_grupo_activo_pizarron', grupoDestino.grupoId)
      setPantalla(grupoDestino.modulo==='pizarron'?'pizarron':'listasuper')
      setGrupoDestino(null)
    }
  }, [user, grupoDestino])

  const handleEmailAuth = async () => {
    if (!email||!password) { setError(t.errorCampos); return }
    setLoading(true); setError('')
    try { if (isLogin) await signInWithEmailAndPassword(auth,email,password); else await createUserWithEmailAndPassword(auth,email,password) }
    catch { setError(t.errorCred) }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true); setError('')
    try { await signInWithPopup(auth,googleProvider) } catch { setError(t.errorGoogle) }
    setLoading(false)
  }

  useEffect(() => { const h=()=>setPantalla('inicio'); window.addEventListener('popstate',h); return()=>window.removeEventListener('popstate',h) },[])
  useEffect(() => { if(pantalla!=='inicio') window.history.pushState({pantalla},'') },[pantalla])

  if (invCargando) return <div style={{ minHeight:'100vh', background:th.bg, display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ color:th.textoSub, fontSize:'15px' }}>Cargando invitación...</div></div>

  if (invData && !user) return (
    <PantallaInvitacion invData={invData}
      onEntrar={async()=>{ if(user&&!user.isAnonymous){await procesarInvitacion(user,invData)}else{localStorage.setItem('syng_grupo_activo_pizarron',invData.grupoId);window.history.replaceState({},'',window.location.pathname);setInvId(null);setInvData(null);setPantalla('pizarron')} }}
      onIrLogin={()=>{ window.history.replaceState({},'',window.location.pathname);setInvId(null);setInvData(null) }} />
  )

  if (user && pantalla==='miagenda') return <MiAgenda userId={user.uid} tema={tema} idioma={idioma} t={t} onVolver={()=>setPantalla('inicio')} onNavegar={navegar} />
  if (user && pantalla==='listatareas') return <div style={{paddingBottom:'80px'}}><ListaTareas onVolver={()=>setPantalla('inicio')} /><NavBar pantalla='listatareas' onIrPantalla={navegar} th={th} t={t} /></div>
  if (user && pantalla==='listasuper')  return <div style={{paddingBottom:'80px'}}><ListaSuper onVolver={()=>setPantalla('inicio')} tema={tema} idioma={idioma} /><NavBar pantalla='listasuper' onIrPantalla={navegar} th={th} t={t} /></div>
  if (pantalla==='pizarron') return <div style={{paddingBottom:'80px'}}><Pizarron onVolver={()=>setPantalla('inicio')} tema={tema} idioma={idioma} /><NavBar pantalla='pizarron' onIrPantalla={navegar} th={th} t={t} /></div>

  if (user && pantalla==='perfil') return (
    <PantallaPerfil user={user} idioma={idioma} tema={tema} t={t}
      onCambiarIdioma={cambiarIdioma} onToggleTema={toggleTema}
      onSalir={()=>{ signOut(auth); setPantalla('inicio') }}
      onNavegar={navegar} />
  )

  if (user) return <PantallaHome user={user} t={t} th={th} onIrPantalla={navegar} userId={user.uid} />

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#534AB7 0%,#185FA5 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'28px', padding:'40px 32px', width:'100%', maxWidth:'380px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ fontSize:'42px', fontWeight:'800', background:'linear-gradient(135deg,#534AB7,#185FA5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:'4px' }}>Syng</div>
          <div style={{ color:'#888', fontSize:'14px' }}>{t.slogan}</div>
        </div>
        <div style={{ fontSize:'12px', color:'#888', textAlign:'center', marginBottom:'10px' }}>{t.eligeIdioma}</div>
        <SelectorIdioma idioma={idioma} onChange={cambiarIdioma} />
        <div style={{ display:'flex', background:'#f5f5f7', borderRadius:'12px', padding:'4px', marginBottom:'20px' }}>
          <button onClick={()=>setIsLogin(true)} style={{ flex:1, padding:'8px', border:'none', borderRadius:'10px', background:isLogin?'white':'transparent', color:isLogin?'#534AB7':'#888', fontWeight:isLogin?'600':'400', cursor:'pointer', fontSize:'14px', boxShadow:isLogin?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>{t.iniciar}</button>
          <button onClick={()=>setIsLogin(false)} style={{ flex:1, padding:'8px', border:'none', borderRadius:'10px', background:!isLogin?'white':'transparent', color:!isLogin?'#534AB7':'#888', fontWeight:!isLogin?'600':'400', cursor:'pointer', fontSize:'14px', boxShadow:!isLogin?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>{t.registrar}</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'20px' }}>
          <input type="email" placeholder={t.correo} value={email} onChange={e=>setEmail(e.target.value)} style={{ padding:'14px 16px', borderRadius:'12px', border:'1.5px solid #e5e5e5', fontSize:'16px', outline:'none' }} />
          <input type="password" placeholder={t.contrasena} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleEmailAuth()} style={{ padding:'14px 16px', borderRadius:'12px', border:'1.5px solid #e5e5e5', fontSize:'16px', outline:'none' }} />
        </div>
        {error && <div style={{ color:'red', fontSize:'13px', marginBottom:'12px', textAlign:'center' }}>{error}</div>}
        <button onClick={handleEmailAuth} disabled={loading} style={{ width:'100%', padding:'15px', background:'linear-gradient(135deg,#534AB7,#185FA5)', color:'white', border:'none', borderRadius:'14px', fontSize:'16px', fontWeight:'600', cursor:'pointer', marginBottom:'20px' }}>
          {loading ? t.cargando : isLogin ? t.entrar : t.crear}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
          <div style={{ flex:1, height:'1px', background:'#e5e5e5' }} />
          <span style={{ color:'#aaa', fontSize:'13px' }}>{t.oCon}</span>
          <div style={{ flex:1, height:'1px', background:'#e5e5e5' }} />
        </div>
        <button onClick={handleGoogle} disabled={loading} style={{ width:'100%', padding:'13px', background:'white', border:'1.5px solid #e5e5e5', borderRadius:'14px', fontSize:'15px', fontWeight:'500', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
          {t.google}
        </button>
      </div>
    </div>
  )
}

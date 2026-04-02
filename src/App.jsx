import { useState, useEffect, useRef } from 'react'
import { auth, googleProvider } from './firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth'
import Pizarron from './Pizarron'
import ListaTareas from './ListaTareas'
import ListaSuper from './ListaSuper'

const CLAUDE_KEY = 'sk-ant-api03-LWDSxhOjmqvG75bG9nOMtJuaW-bfjw1GT3qvAELc30t25mOJpMZ8zzYCCtQidO2uG3Gn4IO0VB4HfNMTUTmHEA-6VmcWwAA'

function Sinyi({ idioma, nombre, pantalla }) {
  const [estado, setEstado] = useState('idle')
  const [ondas, setOndas] = useState([0.3,0.5,0.8,0.5,0.3])
  const wakeRef = useRef(null)
  const activadaRef = useRef(false)
  const voz = { es:'es-MX', en:'en-US', fr:'fr-FR', de:'de-DE', it:'it-IT', pt:'pt-BR', ja:'ja-JP', zh:'zh-CN' }[idioma] || 'es-MX'

  const hablar = (texto) => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(texto)
    u.lang = voz; u.rate = 1.05; u.pitch = 1.15
    const vs = window.speechSynthesis.getVoices()
    const v = vs.find(x => x.lang.startsWith(idioma) && x.name.toLowerCase().includes('female')) || vs.find(x => x.lang.startsWith(idioma))
    if (v) u.voice = v
    u.onstart = () => setEstado('hablando')
    u.onend = () => { setEstado('idle'); activadaRef.current = false; iniciarWake() }
    window.speechSynthesis.speak(u)
  }

  const preguntarClaude = async (texto) => {
    setEstado('pensando')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 150,
          system: 'Eres Sinyi, asistente de voz de la app Syng. Eres una mujer inteligente y carismatica. Responde siempre en espanol mexicano, muy breve, maximo 2 oraciones cortas. No digas que eres IA.',
          messages: [{ role: 'user', content: texto }],
        }),
      })
      const data = await res.json()
      const respuesta = data?.content?.[0]?.text || 'No te escuche bien.'
      hablar(respuesta)
    } catch(e) {
      hablar('Tuve un problema. Intentalo de nuevo.')
    }
  }

  const escucharComando = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR(); rec.lang = voz; rec.continuous = false
    rec.onresult = (e) => {
      const texto = e.results[0][0].transcript
      setEstado('idle')
      preguntarClaude(texto)
    }
    rec.onerror = () => { setEstado('idle'); activadaRef.current = false; iniciarWake() }
    try { rec.start(); setEstado('escuchando') } catch {}
  }

  const iniciarWake = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (wakeRef.current) try { wakeRef.current.stop() } catch {}
    const rec = new SR(); rec.lang = voz; rec.continuous = true
    rec.onresult = (e) => {
      const txt = e.results[e.results.length-1][0].transcript.toLowerCase()
      if (!activadaRef.current && txt.includes('sinyi')) {
        activadaRef.current = true; rec.stop()
        hablar('Dime, en que te ayudo')
        setTimeout(escucharComando, 1000)
      }
    }
    rec.onerror = () => setTimeout(iniciarWake, 2000)
    rec.onend = () => { if (!activadaRef.current) setTimeout(iniciarWake, 500) }
    try { rec.start() } catch {}
    wakeRef.current = rec
  }

  useEffect(() => {
    window.speechSynthesis.getVoices()
    iniciarWake()
    return () => { if (wakeRef.current) try { wakeRef.current.stop() } catch {}; window.speechSynthesis.cancel() }
  }, [idioma])

  useEffect(() => {
    if (estado === 'escuchando' || estado === 'hablando') {
      const iv = setInterval(() => setOndas([0.2,0.4,0.8,0.4,0.2].map(() => 0.2 + Math.random()*0.8)), 150)
      return () => clearInterval(iv)
    }
  }, [estado])

  const color = estado === 'escuchando' ? '#185FA5' : estado === 'pensando' ? '#0F6E56' : '#534AB7'

  return (
    <>
      <button onClick={() => { if (estado==='idle') { activadaRef.current=true; hablar('Dime, en que te ayudo'); setTimeout(escucharComando,900) } else { window.speechSynthesis.cancel(); setEstado('idle') } }}
        style={{ position:'fixed', bottom:'28px', right:'24px', width:'58px', height:'58px', borderRadius:'50%', border:'2px solid '+color, background: estado!=='idle'?color+'22':'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
        {estado==='escuchando'||estado==='hablando' ? (
          <div style={{ display:'flex', alignItems:'center', gap:'3px', height:'22px' }}>
            {ondas.map((h,i) => <div key={i} style={{ width:'3px', height:h*20+'px', background:color, borderRadius:'2px', transition:'height 0.1s' }} />)}
          </div>
        ) : estado==='pensando' ? (
          <div style={{ display:'flex', gap:'4px' }}>
            {[0,1,2].map(i => <div key={i} style={{ width:'6px', height:'6px', borderRadius:'50%', background:color, animation:'bounce 0.8s ease-in-out '+i*0.15+'s infinite' }} />)}
          </div>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="11" rx="3" fill={color}/>
            <path d="M5 10a7 7 0 0 0 14 0" stroke={color} strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
            <line x1="9" y1="21" x2="15" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>
      {estado!=='idle' && (
        <div style={{ position:'fixed', bottom:'98px', right:'16px', background:'white', borderRadius:'14px', padding:'8px 14px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)', fontSize:'13px', color, fontWeight:'500', zIndex:9998, display:'flex', alignItems:'center', gap:'8px' }}>
          {estado==='escuchando'?'👂 Escuchando...':estado==='pensando'?'🧠 Pensando...':'🔊 Sinyi habla'}
        </div>
      )}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
    </>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [pantalla, setPantalla] = useState('inicio')
  const [idioma, setIdioma] = useState(() => localStorage.getItem('syng_idioma') || 'es')

  const banderas = [{c:'es',b:'🇲🇽'},{c:'en',b:'🇺🇸'},{c:'fr',b:'🇫🇷'},{c:'de',b:'🇩🇪'},{c:'it',b:'🇮🇹'},{c:'pt',b:'🇧🇷'},{c:'ja',b:'🇯🇵'},{c:'zh',b:'🇨🇳'}]
  const cambiarIdioma = (cod) => { setIdioma(cod); localStorage.setItem('syng_idioma', cod) }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return unsub
  }, [])

  const handleEmailAuth = async () => {
    if (!email || !password) { setError('Escribe tu correo y contrasena'); return }
    setLoading(true); setError('')
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password)
      else await createUserWithEmailAndPassword(auth, email, password)
    } catch (e) { setError('Correo o contrasena incorrectos') }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true); setError('')
    try { await signInWithPopup(auth, googleProvider) }
    catch (e) { setError('Error al iniciar con Google') }
    setLoading(false)
  }

  const nombre = user?.displayName?.split(' ')[0] || 'bienvenido'

  if (user && pantalla === 'listatareas') return <ListaTareas onVolver={() => setPantalla('inicio')} />
  if (user && pantalla === 'listasuper') return <ListaSuper onVolver={() => setPantalla('inicio')} />
  if (user && pantalla === 'pizarron') return <Pizarron onVolver={() => setPantalla('inicio')} />

  if (user) return (
    <div style={{ minHeight:'100vh', background:'#f5f5f7', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ background:'linear-gradient(135deg,#534AB7,#185FA5)', padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ color:'white', fontSize:'24px', fontWeight:'800' }}>Syng</div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ color:'rgba(255,255,255,0.8)', fontSize:'14px' }}>{user.displayName || user.email}</span>
          <button onClick={() => signOut(auth)} style={{ background:'rgba(255,255,255,0.2)', color:'white', border:'none', borderRadius:'20px', padding:'6px 14px', fontSize:'13px', cursor:'pointer' }}>Salir</button>
        </div>
      </div>
      <div style={{ padding:'24px' }}>
        <div style={{ fontSize:'22px', fontWeight:'700', color:'#2C2C2A', marginBottom:'6px' }}>Hola, {nombre}!</div>
        <div style={{ color:'#888', fontSize:'15px', marginBottom:'16px' }}>Que quieres organizar hoy?</div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'24px' }}>
          {banderas.map(l => <button key={l.c} onClick={() => cambiarIdioma(l.c)} style={{ fontSize:'22px', padding:'4px 8px', borderRadius:'10px', border: idioma===l.c?'2px solid #534AB7':'2px solid transparent', background: idioma===l.c?'rgba(83,74,183,0.1)':'transparent', cursor:'pointer' }}>{l.b}</button>)}
        </div>
        <div onClick={() => setPantalla('pizarron')} style={{ background:'white', borderRadius:'20px', padding:'24px', marginBottom:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', cursor:'pointer' }}>
          <div style={{ fontSize:'18px', fontWeight:'700', color:'#185FA5', marginBottom:'4px' }}>Pizarron Interactivo</div>
          <div style={{ color:'#888', fontSize:'14px' }}>Calendario colaborativo en tiempo real</div>
        </div>
        <div onClick={() => setPantalla('listatareas')} style={{ background:'white', borderRadius:'20px', padding:'24px', marginBottom:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', cursor:'pointer' }}>
          <div style={{ fontSize:'18px', fontWeight:'700', color:'#534AB7', marginBottom:'4px' }}>Lista de Tareas</div>
          <div style={{ color:'#888', fontSize:'14px' }}>Tu lista personal estilo libreta</div>
        </div>
        <div onClick={() => setPantalla('listasuper')} style={{ background:'white', borderRadius:'20px', padding:'24px', marginBottom:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', cursor:'pointer' }}>
          <div style={{ fontSize:'18px', fontWeight:'700', color:'#0F6E56', marginBottom:'4px' }}>Lista del Super</div>
          <div style={{ color:'#888', fontSize:'14px' }}>Lista de compras colaborativa con catalogo</div>
        </div>
      </div>
      <Sinyi idioma={idioma} nombre={nombre} pantalla={pantalla} />
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#534AB7 0%,#185FA5 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'28px', padding:'40px 32px', width:'100%', maxWidth:'380px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ fontSize:'42px', fontWeight:'800', background:'linear-gradient(135deg,#534AB7,#185FA5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Syng</div>
          <div style={{ color:'#888', fontSize:'14px' }}>Sinyi - Sincroniza tu mundo</div>
        </div>
        <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:'8px', marginBottom:'20px' }}>
          {banderas.map(l => <button key={l.c} onClick={() => cambiarIdioma(l.c)} style={{ fontSize:'22px', padding:'4px 8px', borderRadius:'10px', border: idioma===l.c?'2px solid #534AB7':'2px solid transparent', background: idioma===l.c?'rgba(83,74,183,0.1)':'transparent', cursor:'pointer' }}>{l.b}</button>)}
        </div>
        <div style={{ display:'flex', background:'#f5f5f7', borderRadius:'12px', padding:'4px', marginBottom:'20px' }}>
          <button onClick={() => setIsLogin(true)} style={{ flex:1, padding:'8px', border:'none', borderRadius:'10px', background:isLogin?'white':'transparent', color:isLogin?'#534AB7':'#888', cursor:'pointer', fontSize:'14px' }}>Iniciar sesion</button>
          <button onClick={() => setIsLogin(false)} style={{ flex:1, padding:'8px', border:'none', borderRadius:'10px', background:!isLogin?'white':'transparent', color:!isLogin?'#534AB7':'#888', cursor:'pointer', fontSize:'14px' }}>Registrarse</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'20px' }}>
          <input placeholder="Correo electronico" value={email} onChange={e=>setEmail(e.target.value)} style={{ padding:'14px 16px', borderRadius:'12px', border:'1.5px solid #e5e5e5', fontSize:'16px', outline:'none' }} />
          <input type="password" placeholder="Contrasena" value={password} onChange={e=>setPassword(e.target.value)} style={{ padding:'14px 16px', borderRadius:'12px', border:'1.5px solid #e5e5e5', fontSize:'16px', outline:'none' }} />
        </div>
        {error && <div style={{ color:'red', fontSize:'13px', marginBottom:'12px', textAlign:'center' }}>{error}</div>}
        <button onClick={handleEmailAuth} disabled={loading} style={{ width:'100%', padding:'15px', background:'linear-gradient(135deg,#534AB7,#185FA5)', color:'white', border:'none', borderRadius:'14px', fontSize:'16px', cursor:'pointer', marginBottom:'20px' }}>
          {loading?'Cargando...':isLogin?'Entrar':'Crear cuenta'}
        </button>
        <button onClick={handleGoogle} disabled={loading} style={{ width:'100%', padding:'13px', background:'white', border:'1.5px solid #e5e5e5', borderRadius:'14px', fontSize:'15px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          Continuar con Google
        </button>
      </div>
    </div>
  )
}
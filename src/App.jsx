import { useState, useEffect, useRef } from 'react'
import { auth, googleProvider } from './firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth'
import Pizarron from './Pizarron'
import ListaTareas from './ListaTareas'
import ListaSuper from './ListaSuper'

// ─── IDIOMAS ──────────────────────────────────────────────────
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

const TEXTOS = {
  es: {
    hola:'Hola', queOrganizar:'¿Qué quieres organizar hoy?', salir:'Salir',
    pizarron:'Pizarrón Interactivo', pizarronDesc:'Calendario colaborativo en tiempo real',
    tareas:'Lista de Tareas', tareasDesc:'Tu lista personal estilo libreta',
    super:'Lista del Súper', superDesc:'Lista de compras colaborativa con catálogo',
    iniciar:'Iniciar sesión', registrar:'Registrarse', correo:'Correo electrónico',
    contrasena:'Contraseña', entrar:'Entrar', crear:'Crear cuenta',
    oCon:'o continúa con', google:'Continuar con Google', cargando:'Cargando...',
    errorCred:'Correo o contraseña incorrectos', errorCampos:'Escribe tu correo y contraseña',
    errorGoogle:'Error al iniciar con Google', eligeIdioma:'Elige tu idioma',
    slogan:'Sincroniza tu mundo', configuracion:'Configuración', guardado:'Idioma guardado',
    vozVoz:'es-MX',
    sinyiSaludo:'¿En qué te puedo ayudar?', sinyiDime:'Dime, ¿en qué te ayudo?',
    sinyiError:'No te escuché bien. ¿Puedes repetirlo?',
    sinyiSistema:'Eres Sinyi, asistente de voz de la app Syng. Eres una mujer inteligente y cálida. Responde siempre en español mexicano, muy breve, máximo 2 oraciones. No digas que eres IA.',
  },
  en: {
    hola:'Hello', queOrganizar:'What do you want to organize today?', salir:'Sign out',
    pizarron:'Interactive Board', pizarronDesc:'Collaborative calendar in real time',
    tareas:'Task List', tareasDesc:'Your personal notebook-style list',
    super:'Shopping List', superDesc:'Collaborative shopping list with catalog',
    iniciar:'Sign in', registrar:'Sign up', correo:'Email address',
    contrasena:'Password', entrar:'Sign in', crear:'Create account',
    oCon:'or continue with', google:'Continue with Google', cargando:'Loading...',
    errorCred:'Wrong email or password', errorCampos:'Please enter your email and password',
    errorGoogle:'Error signing in with Google', eligeIdioma:'Choose your language',
    slogan:'Sync your world', configuracion:'Settings', guardado:'Language saved',
    vozVoz:'en-US',
    sinyiSaludo:'How can I help you?', sinyiDime:'Tell me, how can I help?',
    sinyiError:"I didn't hear you. Can you repeat that?",
    sinyiSistema:'You are Sinyi, voice assistant of the Syng app. You are an intelligent and warm woman. Always respond in English, very briefly, maximum 2 sentences. Do not say you are AI.',
  },
  fr: {
    hola:'Bonjour', queOrganizar:"Que voulez-vous organiser aujourd'hui?", salir:'Déconnexion',
    pizarron:'Tableau Interactif', pizarronDesc:'Calendrier collaboratif en temps réel',
    tareas:'Liste de Tâches', tareasDesc:'Votre liste personnelle style carnet',
    super:'Liste de Courses', superDesc:'Liste de courses collaborative avec catalogue',
    iniciar:'Se connecter', registrar:"S'inscrire", correo:'Adresse e-mail',
    contrasena:'Mot de passe', entrar:'Connexion', crear:'Créer un compte',
    oCon:'ou continuer avec', google:'Continuer avec Google', cargando:'Chargement...',
    errorCred:'E-mail ou mot de passe incorrect', errorCampos:'Veuillez entrer votre e-mail et mot de passe',
    errorGoogle:'Erreur de connexion avec Google', eligeIdioma:'Choisissez votre langue',
    slogan:'Synchronisez votre monde', configuracion:'Paramètres', guardado:'Langue sauvegardée',
    vozVoz:'fr-FR',
    sinyiSaludo:'Comment puis-je vous aider?', sinyiDime:'Dites-moi, comment puis-je aider?',
    sinyiError:"Je n'ai pas entendu. Pouvez-vous répéter?",
    sinyiSistema:"Vous êtes Sinyi, assistante vocale de l'app Syng. Vous êtes une femme intelligente et chaleureuse. Répondez toujours en français, très brièvement, maximum 2 phrases.",
  },
  de: {
    hola:'Hallo', queOrganizar:'Was möchtest du heute organisieren?', salir:'Abmelden',
    pizarron:'Interaktives Board', pizarronDesc:'Kollaborativer Kalender in Echtzeit',
    tareas:'Aufgabenliste', tareasDesc:'Deine persönliche notizbuchähnliche Liste',
    super:'Einkaufsliste', superDesc:'Kollaborative Einkaufsliste mit Katalog',
    iniciar:'Anmelden', registrar:'Registrieren', correo:'E-Mail-Adresse',
    contrasena:'Passwort', entrar:'Anmelden', crear:'Konto erstellen',
    oCon:'oder weiter mit', google:'Mit Google fortfahren', cargando:'Wird geladen...',
    errorCred:'Falsche E-Mail oder Passwort', errorCampos:'Bitte E-Mail und Passwort eingeben',
    errorGoogle:'Fehler bei Google-Anmeldung', eligeIdioma:'Wähle deine Sprache',
    slogan:'Synchronisiere deine Welt', configuracion:'Einstellungen', guardado:'Sprache gespeichert',
    vozVoz:'de-DE',
    sinyiSaludo:'Wie kann ich dir helfen?', sinyiDime:'Sag mir, wie kann ich helfen?',
    sinyiError:'Ich habe dich nicht gehört. Kannst du wiederholen?',
    sinyiSistema:'Du bist Sinyi, Sprachassistentin der Syng App. Du bist eine intelligente und warmherzige Frau. Antworte immer auf Deutsch, sehr kurz, maximal 2 Sätze.',
  },
  it: {
    hola:'Ciao', queOrganizar:'Cosa vuoi organizzare oggi?', salir:'Esci',
    pizarron:'Lavagna Interattiva', pizarronDesc:'Calendario collaborativo in tempo reale',
    tareas:'Lista Attività', tareasDesc:'La tua lista personale stile taccuino',
    super:'Lista della Spesa', superDesc:'Lista della spesa collaborativa con catalogo',
    iniciar:'Accedi', registrar:'Registrati', correo:'Indirizzo email',
    contrasena:'Password', entrar:'Accedi', crear:'Crea account',
    oCon:'o continua con', google:'Continua con Google', cargando:'Caricamento...',
    errorCred:'Email o password errati', errorCampos:'Inserisci email e password',
    errorGoogle:'Errore accesso con Google', eligeIdioma:'Scegli la tua lingua',
    slogan:'Sincronizza il tuo mondo', configuracion:'Impostazioni', guardado:'Lingua salvata',
    vozVoz:'it-IT',
    sinyiSaludo:'Come posso aiutarti?', sinyiDime:'Dimmi, come posso aiutarti?',
    sinyiError:'Non ti ho sentito. Puoi ripetere?',
    sinyiSistema:"Sei Sinyi, assistente vocale dell'app Syng. Sei una donna intelligente e calorosa. Rispondi sempre in italiano, molto brevemente, massimo 2 frasi.",
  },
  pt: {
    hola:'Olá', queOrganizar:'O que você quer organizar hoje?', salir:'Sair',
    pizarron:'Quadro Interativo', pizarronDesc:'Calendário colaborativo em tempo real',
    tareas:'Lista de Tarefas', tareasDesc:'Sua lista pessoal estilo caderno',
    super:'Lista de Compras', superDesc:'Lista de compras colaborativa com catálogo',
    iniciar:'Entrar', registrar:'Cadastrar', correo:'Endereço de e-mail',
    contrasena:'Senha', entrar:'Entrar', crear:'Criar conta',
    oCon:'ou continue com', google:'Continuar com Google', cargando:'Carregando...',
    errorCred:'E-mail ou senha incorretos', errorCampos:'Digite seu e-mail e senha',
    errorGoogle:'Erro ao entrar com Google', eligeIdioma:'Escolha seu idioma',
    slogan:'Sincronize seu mundo', configuracion:'Configurações', guardado:'Idioma salvo',
    vozVoz:'pt-BR',
    sinyiSaludo:'Como posso te ajudar?', sinyiDime:'Me diga, como posso ajudar?',
    sinyiError:'Não ouvi bem. Pode repetir?',
    sinyiSistema:'Você é Sinyi, assistente de voz do app Syng. Você é uma mulher inteligente e calorosa. Responda sempre em português, muito brevemente, máximo 2 frases.',
  },
  ja: {
    hola:'こんにちは', queOrganizar:'今日は何を整理しますか？', salir:'ログアウト',
    pizarron:'インタラクティブボード', pizarronDesc:'リアルタイム共同カレンダー',
    tareas:'タスクリスト', tareasDesc:'個人用ノートスタイルリスト',
    super:'買い物リスト', superDesc:'カタログ付き共同買い物リスト',
    iniciar:'ログイン', registrar:'登録', correo:'メールアドレス',
    contrasena:'パスワード', entrar:'ログイン', crear:'アカウント作成',
    oCon:'または', google:'Googleで続ける', cargando:'読み込み中...',
    errorCred:'メールまたはパスワードが正しくありません', errorCampos:'メールとパスワードを入力してください',
    errorGoogle:'Googleログインエラー', eligeIdioma:'言語を選択',
    slogan:'世界を同期する', configuracion:'設定', guardado:'言語を保存しました',
    vozVoz:'ja-JP',
    sinyiSaludo:'どのようにお手伝いできますか？', sinyiDime:'どうぞ、お手伝いします',
    sinyiError:'よく聞こえませんでした。もう一度言っていただけますか？',
    sinyiSistema:'あなたはSinyiです。Syngアプリの音声アシスタントです。インテリジェントで温かみのある女性として、常に日本語で簡潔に、最大2文で回答してください。',
  },
  zh: {
    hola:'你好', queOrganizar:'今天想整理什么？', salir:'退出',
    pizarron:'互动白板', pizarronDesc:'实时协作日历',
    tareas:'任务列表', tareasDesc:'个人笔记本式列表',
    super:'购物清单', superDesc:'带目录的协作购物清单',
    iniciar:'登录', registrar:'注册', correo:'电子邮件地址',
    contrasena:'密码', entrar:'登录', crear:'创建账户',
    oCon:'或继续使用', google:'使用Google继续', cargando:'加载中...',
    errorCred:'电子邮件或密码错误', errorCampos:'请输入您的电子邮件和密码',
    errorGoogle:'Google登录错误', eligeIdioma:'选择您的语言',
    slogan:'同步你的世界', configuracion:'设置', guardado:'语言已保存',
    vozVoz:'zh-CN',
    sinyiSaludo:'我能帮您什么？', sinyiDime:'请说，我能帮您什么？',
    sinyiError:'我没有听清楚。您能重复一遍吗？',
    sinyiSistema:'你是Sinyi，Syng应用的语音助手。你是一位聪明热情的女性。始终用中文回答，非常简短，最多2句话。',
  },
}

// ─── SINYI ────────────────────────────────────────────────────
function Sinyi({ idioma, nombre, pantalla }) {
  const t = TEXTOS[idioma] || TEXTOS.es
  const [estado, setEstado] = useState('idle') // idle | escuchando | pensando | hablando
  const [ondas, setOndas] = useState([0.3,0.5,0.8,0.5,0.3])
  const recRef = useRef(null)
  const wakeRef = useRef(null)
  const activadaRef = useRef(false)

  const hablar = (texto) => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(texto)
    u.lang = t.vozVoz
    u.rate = 1.05
    u.pitch = 1.15
    const voces = window.speechSynthesis.getVoices()
    const voz = voces.find(v => v.lang.startsWith(idioma) && v.name.toLowerCase().includes('female'))
      || voces.find(v => v.lang.startsWith(idioma))
      || voces.find(v => v.lang.startsWith('es'))
    if (voz) u.voice = voz
    u.onstart = () => setEstado('hablando')
    u.onend = () => { setEstado('idle'); activadaRef.current = false; iniciarWake() }
    window.speechSynthesis.speak(u)
  }

  const preguntarClaude = async (texto) => {
    setEstado('pensando')
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || ''
    if (!apiKey) {
      setTimeout(() => hablar(t.sinyiSaludo), 300)
      return
    }
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 150,
          system: t.sinyiSistema + ` El usuario se llama ${nombre}. Están en: ${pantalla}.`,
          messages: [{ role:'user', content: texto }],
        }),
      })
      const data = await res.json()
      hablar(data?.content?.[0]?.text || t.sinyiError)
    } catch {
      hablar(t.sinyiError)
    }
  }

  const escucharComando = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = t.vozVoz
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e) => {
      setEstado('idle')
      preguntarClaude(e.results[0][0].transcript)
    }
    rec.onerror = () => { setEstado('idle'); hablar(t.sinyiError); activadaRef.current = false; iniciarWake() }
    rec.onend = () => { if (estado === 'escuchando') setEstado('idle') }
    recRef.current = rec
    try { rec.start(); setEstado('escuchando') } catch {}
  }

  const iniciarWake = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return
    if (wakeRef.current) try { wakeRef.current.stop() } catch {}
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = t.vozVoz
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e) => {
      const txt = e.results[e.results.length-1][0].transcript.toLowerCase()
      if (!activadaRef.current && (txt.includes('sinyi') || txt.includes('siniy'))) {
        activadaRef.current = true
        rec.stop()
        hablar(t.sinyiDime)
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
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    iniciarWake()
    return () => {
      if (wakeRef.current) try { wakeRef.current.stop() } catch {}
      if (recRef.current) try { recRef.current.stop() } catch {}
      window.speechSynthesis.cancel()
    }
  }, [idioma])

  useEffect(() => {
    if (estado === 'escuchando' || estado === 'hablando') {
      const iv = setInterval(() => setOndas(ondas.map(() => 0.2 + Math.random() * 0.8)), 150)
      return () => clearInterval(iv)
    }
  }, [estado])

  const activarManual = () => {
    if (estado === 'hablando') { window.speechSynthesis.cancel(); setEstado('idle'); return }
    if (estado === 'idle') { activadaRef.current = true; hablar(t.sinyiDime); setTimeout(escucharComando, 1000) }
  }

  const color = estado === 'escuchando' ? '#185FA5' : estado === 'pensando' ? '#0F6E56' : '#534AB7'

  return (
    <>
      <button onClick={activarManual} title="Sinyi" style={{
        position:'fixed', bottom:'28px', right:'24px',
        width:'58px', height:'58px', borderRadius:'50%',
        border:`2px solid ${color}`,
        background: estado !== 'idle' ? `${color}22` : 'white',
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        zIndex:9999, transition:'all 0.3s',
        boxShadow: estado !== 'idle' ? `0 0 0 6px ${color}22, 0 4px 20px ${color}44` : '0 4px 16px rgba(0,0,0,0.15)',
      }}>
        {estado === 'escuchando' || estado === 'hablando' ? (
          <div style={{ display:'flex', alignItems:'center', gap:'3px', height:'22px' }}>
            {ondas.map((h,i) => <div key={i} style={{ width:'3px', height:`${h*20}px`, background:color, borderRadius:'2px', transition:'height 0.1s' }} />)}
          </div>
        ) : estado === 'pensando' ? (
          <div style={{ display:'flex', gap:'4px' }}>
            {[0,1,2].map(i => <div key={i} style={{ width:'6px', height:'6px', borderRadius:'50%', background:color, animation:`bounce 0.8s ease-in-out ${i*0.15}s infinite` }} />)}
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
      {estado !== 'idle' && (
        <div style={{
          position:'fixed', bottom:'98px', right:'16px',
          background:'white', borderRadius:'14px', padding:'8px 14px',
          boxShadow:'0 4px 20px rgba(0,0,0,0.12)', border:`1px solid ${color}33`,
          fontSize:'13px', color, fontWeight:'500', zIndex:9998,
          display:'flex', alignItems:'center', gap:'8px',
          fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',
        }}>
          {estado === 'escuchando' ? '👂' : estado === 'pensando' ? '🧠' : '🔊'}
          {estado === 'escuchando' ? 'Escuchando...' : estado === 'pensando' ? 'Pensando...' : 'Sinyi...'}
        </div>
      )}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
    </>
  )
}

// ─── SELECTOR DE IDIOMA ───────────────────────────────────────
function SelectorIdioma({ idioma, onChange }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'8px', marginBottom:'24px' }}>
      {IDIOMAS.map(l => (
        <button key={l.codigo} onClick={() => onChange(l.codigo)} style={{
          fontSize:'22px', padding:'6px 10px', borderRadius:'12px', cursor:'pointer',
          border: idioma === l.codigo ? '2px solid #534AB7' : '2px solid #e5e5e5',
          background: idioma === l.codigo ? 'rgba(83,74,183,0.1)' : 'transparent',
          transition:'all 0.2s',
        }} title={l.nombre}>{l.bandera}</button>
      ))}
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
  const [mostrarConfig, setMostrarConfig] = useState(false)

  const t = TEXTOS[idioma] || TEXTOS.es

  const cambiarIdioma = (cod) => {
    setIdioma(cod)
    localStorage.setItem('syng_idioma', cod)
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return unsub
  }, [])

  const handleEmailAuth = async () => {
    if (!email || !password) { setError(t.errorCampos); return }
    setLoading(true); setError('')
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password)
      else await createUserWithEmailAndPassword(auth, email, password)
    } catch { setError(t.errorCred) }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true); setError('')
    try { await signInWithPopup(auth, googleProvider) }
    catch { setError(t.errorGoogle) }
    setLoading(false)
  }

  const nombre = user?.displayName?.split(' ')[0] || 'bienvenido'

  // ── Módulos ──
  if (user && pantalla === 'listatareas') return <ListaTareas onVolver={() => setPantalla('inicio')} />
  if (user && pantalla === 'listasuper')  return <ListaSuper  onVolver={() => setPantalla('inicio')} />
  if (user && pantalla === 'pizarron')    return <Pizarron    onVolver={() => setPantalla('inicio')} />

  // ── Pantalla principal ──
  if (user) return (
    <div style={{ minHeight:'100vh', background:'#f5f5f7', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ background:'linear-gradient(135deg,#534AB7,#185FA5)', padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ color:'white', fontSize:'24px', fontWeight:'800' }}>Syng</div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ color:'rgba(255,255,255,0.8)', fontSize:'14px' }}>{user.displayName || user.email}</span>
          <button onClick={() => setMostrarConfig(!mostrarConfig)} style={{ background:'rgba(255,255,255,0.2)', color:'white', border:'none', borderRadius:'20px', padding:'6px 12px', fontSize:'13px', cursor:'pointer' }}>
            {IDIOMAS.find(l => l.codigo === idioma)?.bandera}
          </button>
          <button onClick={() => signOut(auth)} style={{ background:'rgba(255,255,255,0.2)', color:'white', border:'none', borderRadius:'20px', padding:'6px 14px', fontSize:'13px', cursor:'pointer' }}>{t.salir}</button>
        </div>
      </div>

      {mostrarConfig && (
        <div style={{ background:'white', padding:'20px 24px', borderBottom:'1px solid #e5e5e5' }}>
          <div style={{ fontSize:'13px', color:'#888', marginBottom:'12px', textAlign:'center' }}>{t.eligeIdioma}</div>
          <SelectorIdioma idioma={idioma} onChange={(cod) => { cambiarIdioma(cod); setMostrarConfig(false) }} />
        </div>
      )}

      <div style={{ padding:'24px' }}>
        <div style={{ fontSize:'22px', fontWeight:'700', color:'#2C2C2A', marginBottom:'6px' }}>
          {t.hola}, {nombre}!
        </div>
        <div style={{ color:'#888', fontSize:'15px', marginBottom:'28px' }}>{t.queOrganizar}</div>

        <div onClick={() => setPantalla('pizarron')} style={{ background:'white', borderRadius:'20px', padding:'24px', marginBottom:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', cursor:'pointer' }}>
          <div style={{ fontSize:'18px', fontWeight:'700', color:'#185FA5', marginBottom:'4px' }}>{t.pizarron}</div>
          <div style={{ color:'#888', fontSize:'14px' }}>{t.pizarronDesc}</div>
        </div>

        <div onClick={() => setPantalla('listatareas')} style={{ background:'white', borderRadius:'20px', padding:'24px', marginBottom:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', cursor:'pointer' }}>
          <div style={{ fontSize:'18px', fontWeight:'700', color:'#534AB7', marginBottom:'4px' }}>{t.tareas}</div>
          <div style={{ color:'#888', fontSize:'14px' }}>{t.tareasDesc}</div>
        </div>

        <div onClick={() => setPantalla('listasuper')} style={{ background:'white', borderRadius:'20px', padding:'24px', marginBottom:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', cursor:'pointer' }}>
          <div style={{ fontSize:'18px', fontWeight:'700', color:'#0F6E56', marginBottom:'4px' }}>{t.super}</div>
          <div style={{ color:'#888', fontSize:'14px' }}>{t.superDesc}</div>
        </div>
      </div>

      <Sinyi idioma={idioma} nombre={nombre} pantalla={pantalla} />
    </div>
  )

  // ── Login ──
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#534AB7 0%,#185FA5 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'28px', padding:'40px 32px', width:'100%', maxWidth:'380px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ fontSize:'42px', fontWeight:'800', background:'linear-gradient(135deg,#534AB7,#185FA5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:'4px' }}>Syng</div>
          <div style={{ color:'#888', fontSize:'14px' }}>Sinyi · {t.slogan}</div>
        </div>

        <div style={{ fontSize:'12px', color:'#888', textAlign:'center', marginBottom:'10px' }}>{t.eligeIdioma}</div>
        <SelectorIdioma idioma={idioma} onChange={cambiarIdioma} />

        <div style={{ display:'flex', background:'#f5f5f7', borderRadius:'12px', padding:'4px', marginBottom:'20px' }}>
          <button onClick={() => setIsLogin(true)} style={{ flex:1, padding:'8px', border:'none', borderRadius:'10px', background:isLogin?'white':'transparent', color:isLogin?'#534AB7':'#888', fontWeight:isLogin?'600':'400', cursor:'pointer', fontSize:'14px', boxShadow:isLogin?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>{t.iniciar}</button>
          <button onClick={() => setIsLogin(false)} style={{ flex:1, padding:'8px', border:'none', borderRadius:'10px', background:!isLogin?'white':'transparent', color:!isLogin?'#534AB7':'#888', fontWeight:!isLogin?'600':'400', cursor:'pointer', fontSize:'14px', boxShadow:!isLogin?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>{t.registrar}</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'20px' }}>
          <input type="email" placeholder={t.correo} value={email} onChange={e=>setEmail(e.target.value)} style={{ padding:'14px 16px', borderRadius:'12px', border:'1.5px solid #e5e5e5', fontSize:'16px', outline:'none' }} />
          <input type="password" placeholder={t.contrasena} value={password} onChange={e=>setPassword(e.target.value)} style={{ padding:'14px 16px', borderRadius:'12px', border:'1.5px solid #e5e5e5', fontSize:'16px', outline:'none' }} />
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
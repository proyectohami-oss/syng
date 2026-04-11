import { useState, useEffect, useRef } from 'react'
import { auth, googleProvider, db } from './firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore'
import Pizarron from './Pizarron'
import ListaTareas from './ListaTareas'
import ListaSuper from './ListaSuper'

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
  const [estado, setEstado] = useState('idle')
  const [ondas, setOndas] = useState([0.3,0.5,0.8,0.5,0.3])
  const recRef = useRef(null)
  const wakeRef = useRef(null)
  const activadaRef = useRef(false)

  const hablar = (texto) => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(texto)
    u.lang = t.vozVoz; u.rate = 1.05; u.pitch = 1.15
    const voces = window.speechSynthesis.getVoices()
    const voz = voces.find(v => v.lang.startsWith(idioma) && v.name.toLowerCase().includes('female'))
      || voces.find(v => v.lang.startsWith(idioma)) || voces.find(v => v.lang.startsWith('es'))
    if (voz) u.voice = voz
    u.onstart = () => setEstado('hablando')
    u.onend = () => { setEstado('idle'); activadaRef.current = false; iniciarWake() }
    window.speechSynthesis.speak(u)
  }

  const preguntarClaude = async (texto) => {
    setEstado('pensando')
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || ''
    if (!apiKey) { setTimeout(() => hablar(t.sinyiSaludo), 300); return }
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 150, system: t.sinyiSistema + ` El usuario se llama ${nombre}. Están en: ${pantalla}.`, messages: [{ role:'user', content: texto }] }),
      })
      const data = await res.json()
      hablar(data?.content?.[0]?.text || t.sinyiError)
    } catch { hablar(t.sinyiError) }
  }

  const escucharComando = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = t.vozVoz; rec.continuous = false; rec.interimResults = false
    rec.onresult = (e) => { setEstado('idle'); preguntarClaude(e.results[0][0].transcript) }
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
    rec.lang = t.vozVoz; rec.continuous = true; rec.interimResults = false
    rec.onresult = (e) => {
      const txt = e.results[e.results.length-1][0].transcript.toLowerCase()
      if (!activadaRef.current && (txt.includes('sinyi') || txt.includes('siniy'))) {
        activadaRef.current = true; rec.stop(); hablar(t.sinyiDime); setTimeout(escucharComando, 1000)
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
      <button onClick={activarManual} title="Sinyi" style={{ position:'fixed', bottom:'28px', right:'24px', width:'58px', height:'58px', borderRadius:'50%', border:`2px solid ${color}`, background: estado !== 'idle' ? `${color}22` : 'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, transition:'all 0.3s', boxShadow: estado !== 'idle' ? `0 0 0 6px ${color}22, 0 4px 20px ${color}44` : '0 4px 16px rgba(0,0,0,0.15)' }}>
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
        <div style={{ position:'fixed', bottom:'98px', right:'16px', background:'white', borderRadius:'14px', padding:'8px 14px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)', border:`1px solid ${color}33`, fontSize:'13px', color, fontWeight:'500', zIndex:9998, display:'flex', alignItems:'center', gap:'8px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
          {estado === 'escuchando' ? '👂' : estado === 'pensando' ? '🧠' : '🔊'}
          {estado === 'escuchando' ? 'Escuchando...' : estado === 'pensando' ? 'Pensando...' : 'Sinyi...'}
        </div>
      )}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
    </>
  )
}

function SelectorIdioma({ idioma, onChange }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'8px', marginBottom:'24px' }}>
      {IDIOMAS.map(l => (
        <button key={l.codigo} onClick={() => onChange(l.codigo)} style={{ fontSize:'22px', padding:'6px 10px', borderRadius:'12px', cursor:'pointer', border: idioma === l.codigo ? '2px solid #534AB7' : '2px solid #e5e5e5', background: idioma === l.codigo ? 'rgba(83,74,183,0.1)' : 'transparent', transition:'all 0.2s' }} title={l.nombre}>{l.bandera}</button>
      ))}
    </div>
  )
}

// ─── PANTALLA DE INVITACIÓN ───────────────────────────────────
function PantallaInvitacion({ invData, onEntrar, onGoogle, onRegistrar }) {
  const [mostrarLogin, setMostrarLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async () => {
    if (!email || !password) { setError('Escribe tu correo y contraseña'); return }
    setLoading(true); setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // onAuthStateChanged en App detectará el login y procesará la invitación
    } catch { setError('Correo o contraseña incorrectos') }
    setLoading(false)
  }

  const handleGoogleInv = async () => {
    setLoading(true); setError('')
    try { await signInWithPopup(auth, googleProvider) }
    catch { setError('Error al iniciar con Google') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#1a3a6b 0%,#2563a8 50%,#1a5a8a 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* Logo */}
      <div style={{ fontSize:'28px', fontWeight:'800', color:'white', letterSpacing:'2px', marginBottom:'40px' }}>SYNG</div>

      {/* Icono grupo */}
      <div style={{ width:'120px', height:'120px', borderRadius:'28px', background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'28px' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="7" r="4" fill="white" opacity="0.9"/>
          <circle cx="17" cy="9" r="3" fill="white" opacity="0.6"/>
          <path d="M1 21c0-4 3.6-7 8-7s8 3 8 7" fill="white" opacity="0.9"/>
          <path d="M17 14c2.2.5 4 2.5 4 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        </svg>
      </div>

      {/* Nombre del grupo */}
      <div style={{ fontSize:'32px', fontWeight:'800', color:'white', marginBottom:'8px', textAlign:'center' }}>
        {invData.grupoNombre}
      </div>
      <div style={{ fontSize:'16px', color:'rgba(255,255,255,0.75)', marginBottom:'24px' }}>
        Has sido invitado a unirte
      </div>

      {/* Invitado por */}
      <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:'16px', padding:'14px 24px', marginBottom:'32px', textAlign:'center', backdropFilter:'blur(8px)' }}>
        <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.6)', marginBottom:'4px' }}>Invitado por</div>
        <div style={{ fontSize:'15px', color:'white', fontWeight:'600' }}>{invData.adminNombre}</div>
      </div>

      {!mostrarLogin ? (
        <>
          {/* Botón entrar */}
          <button onClick={onEntrar} style={{ width:'100%', maxWidth:'320px', padding:'16px', background:'white', border:'none', borderRadius:'16px', fontSize:'17px', fontWeight:'700', color:'#1a3a6b', cursor:'pointer', marginBottom:'28px', WebkitTapHighlightColor:'transparent' }}>
            Entrar al grupo
          </button>

          {/* Conéctate también con */}
          <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.55)', marginBottom:'16px', letterSpacing:'0.03em' }}>
            Conéctate también con
          </div>

          <div style={{ display:'flex', gap:'20px', marginBottom:'28px' }}>
            {/* Apple — deshabilitado por ahora */}
            <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'black', display:'flex', alignItems:'center', justifyContent:'center', opacity:0.4 }} title="Próximamente">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>

            {/* Google */}
            <button onClick={handleGoogleInv} disabled={loading} style={{ width:'60px', height:'60px', borderRadius:'50%', background:'#EA4335', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>
          </div>

          {/* Ya tienes cuenta / Regístrate */}
          <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.6)' }}>
            ¿Ya tienes cuenta?{' '}
            <span onClick={() => setMostrarLogin(true)} style={{ color:'white', fontWeight:'600', cursor:'pointer', textDecoration:'underline' }}>
              Inicia sesión
            </span>
            {'  ·  '}
            <span onClick={onRegistrar} style={{ color:'white', fontWeight:'600', cursor:'pointer', textDecoration:'underline' }}>
              Regístrate
            </span>
          </div>

          {error && <div style={{ color:'#ffb3b3', fontSize:'13px', marginTop:'12px', textAlign:'center' }}>{error}</div>}
        </>
      ) : (
        /* Mini login con correo */
        <div style={{ width:'100%', maxWidth:'320px', background:'rgba(255,255,255,0.12)', borderRadius:'20px', padding:'20px', backdropFilter:'blur(8px)' }}>
          <input type="email" placeholder="Correo electrónico" value={email} onChange={e=>setEmail(e.target.value)}
            style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', border:'none', fontSize:'15px', outline:'none', marginBottom:'10px', boxSizing:'border-box' }}/>
          <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleEmailLogin()}
            style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', border:'none', fontSize:'15px', outline:'none', marginBottom:'12px', boxSizing:'border-box' }}/>
          {error && <div style={{ color:'#ffb3b3', fontSize:'12px', marginBottom:'10px', textAlign:'center' }}>{error}</div>}
          <button onClick={handleEmailLogin} disabled={loading} style={{ width:'100%', padding:'13px', background:'white', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:'700', color:'#1a3a6b', cursor:'pointer', marginBottom:'10px', WebkitTapHighlightColor:'transparent' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <button onClick={() => setMostrarLogin(false)} style={{ width:'100%', padding:'10px', background:'none', border:'none', color:'rgba(255,255,255,0.7)', fontSize:'13px', cursor:'pointer' }}>
            Cancelar
          </button>
        </div>
      )}
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

  // Invitación
  const [invId, setInvId] = useState(null)
  const [invData, setInvData] = useState(null) // { grupoNombre, adminNombre, grupoId, modulo }
  const [invCargando, setInvCargando] = useState(false)
  const [grupoDestino, setGrupoDestino] = useState(null) // para navegar al grupo tras login

  const t = TEXTOS[idioma] || TEXTOS.es

  const cambiarIdioma = (cod) => { setIdioma(cod); localStorage.setItem('syng_idioma', cod) }

  // Detectar invitación en la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('invitacion') || sessionStorage.getItem('syng_inv')
    if (!id) return
    // Si estamos en WebView (WhatsApp, Instagram, etc) — redirigir a Safari
    const ua = navigator.userAgent
    const esWebView = /FBAN|FBAV|Instagram|WhatsApp|MicroMessenger/.test(ua) || 
      ((/iPhone|iPod|iPad/.test(ua)) && !/Safari/.test(ua))
    if (esWebView) {
      window.location.href = 'https://syng-psi.vercel.app/?invitacion=' + id
      return
    }
    if (params.get('invitacion')) sessionStorage.setItem('syng_inv', id)
    setInvId(id)
    setInvCargando(true)
    const cargarInv = async () => {
      try {
        const invSnap = await getDoc(doc(db, 'invitaciones', id))
        if (!invSnap.exists()) { setInvId(null); setInvCargando(false); return }
        const inv = invSnap.data()
        if (inv.usado) { setInvId(null); setInvCargando(false); return }
        const gSnap = await getDoc(doc(db, 'grupos', inv.grupoId))
        if (!gSnap.exists()) { setInvId(null); setInvCargando(false); return }
        const grupo = gSnap.data()
        setInvData({ grupoId: inv.grupoId, modulo: inv.modulo, grupoNombre: grupo.nombre, adminNombre: grupo.adminNombre || 'un administrador' })
      } catch(e) { console.error('ERROR INV:', e); setInvId(null) }
      setInvCargando(false)
    }
    cargarInv()
  }, [])

  // Procesar invitación cuando el usuario ya está logueado
  const procesarInvitacion = async (u, inv) => {
    if (!u || !inv) return
    try {
      const gSnap = await getDoc(doc(db, 'grupos', inv.grupoId))
      if (!gSnap.exists()) return
      const grupo = gSnap.data()
      const yaMiembro = (grupo.miembros || []).some(m => m.uid === u.uid)
      if (!yaMiembro) {
        await updateDoc(doc(db, 'grupos', inv.grupoId), {
          miembros: arrayUnion({ uid: u.uid, email: u.email || '', nombre: u.displayName || u.email?.split('@')[0] || 'Usuario', rol: 'miembro' })
        })
        await setDoc(doc(db, 'users', u.uid, 'misGrupos', inv.grupoId), {
          nombre: grupo.nombre, modulo: inv.modulo
        })
      }
      const invSnap = await getDoc(doc(db, 'invitaciones', invId || ''))
      if (invSnap.exists() && !invSnap.data().usado) {
        await updateDoc(doc(db, 'invitaciones', invId), { usado: true })
      }
      window.history.replaceState({}, '', window.location.pathname)
      sessionStorage.removeItem('syng_inv')
      setInvId(null); setInvData(null)
      setGrupoDestino({ grupoId: inv.grupoId, modulo: inv.modulo })
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      // NO procesar invitación automáticamente — solo cuando el usuario toca "Entrar"
    })
    return unsub
  }, [invData])

  // Navegar al grupo destino cuando ya esté listo
  useEffect(() => {
    if (user && grupoDestino) {
      setPantalla(grupoDestino.modulo === 'pizarron' ? 'pizarron' : 'listasuper')
      setGrupoDestino(null)
    }
  }, [user, grupoDestino])

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

  // Pantalla de invitación — tiene prioridad sobre todo
  if (invCargando) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#1a3a6b,#2563a8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'white', fontSize:'15px', opacity:0.7 }}>Cargando invitación...</div>
    </div>
  )

  if (invData) return (
    <PantallaInvitacion
      invData={invData}
      userActual={user}
      onEntrar={async () => {
        // Flujo 1: usuario ya logueado — procesar invitación y entrar al grupo
        if (user && !user.isAnonymous) {
          await procesarInvitacion(user, invData)
          return
        }
        // Flujo 2: sin cuenta — entrar como anónimo
        try {
          const { signInAnonymously } = await import('firebase/auth')
          const cred = await signInAnonymously(auth)
          const uid = cred.user.uid
          const { updateDoc, arrayUnion, setDoc, doc, getDoc } = await import('firebase/firestore')
          const gSnap = await getDoc(doc(db, 'grupos', invData.grupoId))
          if (gSnap.exists()) {
            const grupo = gSnap.data()
            const yaMiembro = (grupo.miembros || []).some(m => m.uid === uid)
            if (!yaMiembro) {
              await updateDoc(doc(db, 'grupos', invData.grupoId), {
                miembros: arrayUnion({ uid, email: '', nombre: 'Invitado', rol: 'miembro' })
              })
              await setDoc(doc(db, 'users', uid, 'misGrupos', invData.grupoId), {
                nombre: grupo.nombre, modulo: invData.modulo
              })
            }
          }
          window.history.replaceState({}, '', window.location.pathname)
          setGrupoDestino({ grupoId: invData.grupoId, modulo: invData.modulo })
          setInvId(null); setInvData(null)
        } catch(e) { console.error(e) }
      }}
      onGoogle={async () => {
        setLoading(true)
        try { await signInWithPopup(auth, googleProvider) }
        catch { }
        setLoading(false)
      }}
      onRegistrar={() => {
        window.history.replaceState({}, '', window.location.pathname)
        setInvId(null)
      }}
    />
  )

  // Módulos
  if (user && pantalla === 'listatareas') return <ListaTareas onVolver={() => setPantalla('inicio')} />
  if (user && pantalla === 'listasuper')  return <ListaSuper  onVolver={() => setPantalla('inicio')} />
  if (user && pantalla === 'pizarron')    return <Pizarron    onVolver={() => setPantalla('inicio')} />

  // Pantalla principal
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
        <div style={{ fontSize:'22px', fontWeight:'700', color:'#2C2C2A', marginBottom:'6px' }}>{t.hola}, {nombre}!</div>
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

  // Login
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
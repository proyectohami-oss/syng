import { useState, useEffect, useRef } from 'react'
import { auth, googleProvider, db } from './firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore'
import Pizarron from './Pizarron'
import PantallaInvitacion from './PantallaInvitacion'
import ListaTareas from './ListaTareas'
import ListaSuper from './ListaSuper'

// ─── TEMA ──────────────────────────────────────────────────────
const TEMA = {
  oscuro: {
    bg: '#0D0D1A',
    bgCard: '#1A1A2E',
    bgCardAlt: '#16213E',
    bgInput: '#1E1E35',
    header: 'linear-gradient(135deg,#534AB7,#2D2B6B)',
    headerSolido: '#534AB7',
    texto: '#F0F0FF',
    textoSub: '#9090B8',
    textoMuted: 'rgba(255,255,255,0.45)',
    borde: 'rgba(255,255,255,0.08)',
    bordeInput: 'rgba(255,255,255,0.15)',
    acento: '#7B6EF6',
    acentoVerde: '#2ECC9A',
    navBg: '#13132A',
    navBorde: 'rgba(255,255,255,0.08)',
    sombra: '0 4px 24px rgba(0,0,0,0.5)',
    nombre: 'oscuro',
  },
  claro: {
    bg: '#F5F5F7',
    bgCard: '#FFFFFF',
    bgCardAlt: '#F0F0F8',
    bgInput: '#F5F5F7',
    header: 'linear-gradient(135deg,#534AB7,#185FA5)',
    headerSolido: '#534AB7',
    texto: '#1C1C2E',
    textoSub: '#666680',
    textoMuted: 'rgba(0,0,0,0.28)',
    borde: '#EAEAEA',
    bordeInput: '#D8D8E8',
    acento: '#534AB7',
    acentoVerde: '#0F6E56',
    navBg: '#FFFFFF',
    navBorde: '#EAEAEA',
    sombra: '0 2px 12px rgba(0,0,0,0.07)',
    nombre: 'claro',
  },
}

// ─── IDIOMAS ───────────────────────────────────────────────────
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
    hola:'Hola', queOrganizar:'¿Qué quieres organizar hoy?', salir:'Cerrar sesión',
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
    perfil:'Perfil', modoOscuro:'Modo oscuro', modoClaro:'Modo claro',
    idioma:'Idioma', privacidad:'Privacidad', cerrarSesion:'Cerrar sesión',
    apariencia:'Apariencia',
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
    perfil:'Profile', modoOscuro:'Dark mode', modoClaro:'Light mode',
    idioma:'Language', privacidad:'Privacy', cerrarSesion:'Sign out',
    apariencia:'Appearance',
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
    perfil:'Profil', modoOscuro:'Mode sombre', modoClaro:'Mode clair',
    idioma:'Langue', privacidad:'Confidentialité', cerrarSesion:'Déconnexion',
    apariencia:'Apparence',
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
    perfil:'Profil', modoOscuro:'Dunkelmodus', modoClaro:'Hellmodus',
    idioma:'Sprache', privacidad:'Datenschutz', cerrarSesion:'Abmelden',
    apariencia:'Erscheinungsbild',
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
    perfil:'Profilo', modoOscuro:'Modalità scura', modoClaro:'Modalità chiara',
    idioma:'Lingua', privacidad:'Privacy', cerrarSesion:'Esci',
    apariencia:'Aspetto',
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
    perfil:'Perfil', modoOscuro:'Modo escuro', modoClaro:'Modo claro',
    idioma:'Idioma', privacidad:'Privacidade', cerrarSesion:'Sair',
    apariencia:'Aparência',
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
    perfil:'プロフィール', modoOscuro:'ダークモード', modoClaro:'ライトモード',
    idioma:'言語', privacidad:'プライバシー', cerrarSesion:'ログアウト',
    apariencia:'外観',
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
    perfil:'个人资料', modoOscuro:'深色模式', modoClaro:'浅色模式',
    idioma:'语言', privacidad:'隐私', cerrarSesion:'退出',
    apariencia:'外观',
  },
}

// ─── SINYI ────────────────────────────────────────────────────
function Sinyi({ idioma, nombre, pantalla }) {
  const t = TEXTOS[idioma] || TEXTOS.es
  const recRef = useRef(null)
  const wakeRef = useRef(null)
  const activadaRef = useRef(false)
  const historiaRef = useRef([])

  const hoy = new Date()
  const diasSemana = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
  const fechaHoy = `${hoy.getDate()}/${hoy.getMonth()+1}/${hoy.getFullYear()}`

  const sistemaSinyi = `Eres Sinyi, el asistente inteligente de Syng. Eres como J.A.R.V.I.S. — un mayordomo brillante, con humor fino y sarcasmo elegante. Eres directo, eficiente y ocasionalmente irónico pero siempre leal. Tratas al usuario como a un igual inteligente.

Hoy es ${diasSemana[hoy.getDay()]} ${fechaHoy}. El usuario se llama ${nombre}. Están en: ${pantalla}.

CAPACIDADES:
- Puedes agregar tareas al Pizarrón: {"accion":"agregar_tarea","texto":"la tarea","fecha":"hoy|mañana|YYYY-M-D"}
- Puedes agregar productos a la Lista del Súper: {"accion":"agregar_producto","producto":"nombre","departamento":"Lácteos|Carnes y embutidos|Frutas y verduras|Abarrotes|Panadería|Bebidas|Limpieza|Higiene personal|Congelados|Snacks y dulces|Artículos de cocina|Bebés|Mascotas|Farmacia básica"}
- Para consultas generales responde con tu conocimiento.

Si detectas una acción de Syng responde SOLO con el JSON seguido de tu comentario en voz. Ejemplo: {"accion":"agregar_tarea","texto":"reunión con Jorge","fecha":"mañana"} Listo, jefe.

Máximo 2 oraciones. Sin asteriscos ni emojis en el texto hablado.`

  const saludos = ['Dígame.', '¿En qué puedo ayudarle?', 'A sus órdenes.', 'Aquí estoy.', '¿Qué necesita?', 'Con usted.', 'Dime.', '¿En qué le ayudo?']

  const ejecutarAccion = (accion) => {
    if (accion.accion === 'agregar_tarea') {
      const fecha = accion.fecha
      let dia, mes, anio
      if (fecha === 'hoy') { dia=hoy.getDate(); mes=hoy.getMonth(); anio=hoy.getFullYear() }
      else if (fecha === 'mañana') { const m=new Date(hoy); m.setDate(m.getDate()+1); dia=m.getDate(); mes=m.getMonth(); anio=m.getFullYear() }
      else { const p=fecha.split('-').map(Number); anio=p[0]; mes=p[1]-1; dia=p[2] }
      window.dispatchEvent(new CustomEvent('sinyi:agregar_tarea', { detail: { texto: accion.texto, dia, mes, anio } }))
    } else if (accion.accion === 'agregar_producto') {
      window.dispatchEvent(new CustomEvent('sinyi:agregar_producto', { detail: { producto: accion.producto, departamento: accion.departamento || 'Abarrotes' } }))
    }
  }

  const hablar = (texto) => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(texto)
    u.lang = t.vozVoz; u.rate = 1.05; u.pitch = 1.1
    const voces = window.speechSynthesis.getVoices()
    const voz = voces.find(v => v.lang.startsWith(idioma) && v.name.toLowerCase().includes('female'))
      || voces.find(v => v.lang.startsWith(idioma)) || voces.find(v => v.lang.startsWith('es'))
    if (voz) u.voice = voz
    u.onend = () => { activadaRef.current = false; setTimeout(iniciarWake, 300) }
    window.speechSynthesis.speak(u)
  }

  const preguntarClaude = async (texto) => {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || ''
    if (!apiKey) { hablar('No tengo acceso a mi núcleo de procesamiento.'); return }
    historiaRef.current = [...historiaRef.current, { role:'user', content: texto }].slice(-6)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 200, system: sistemaSinyi, messages: historiaRef.current }),
      })
      const data = await res.json()
      const respuesta = data?.content?.[0]?.text || 'No logré procesar eso.'
      const jsonMatch = respuesta.match(/\{[^}]+\}/)
      if (jsonMatch) {
        try {
          const accion = JSON.parse(jsonMatch[0])
          ejecutarAccion(accion)
          const textoVoz = respuesta.replace(jsonMatch[0], '').trim()
          historiaRef.current = [...historiaRef.current, { role:'assistant', content: textoVoz }].slice(-6)
          hablar(textoVoz)
        } catch { hablar(respuesta) }
      } else {
        historiaRef.current = [...historiaRef.current, { role:'assistant', content: respuesta }].slice(-6)
        hablar(respuesta)
      }
    } catch { hablar('Hubo un fallo en el sistema. Nada que no pueda arreglarse.') }
  }

  const escucharComando = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = t.vozVoz; rec.continuous = false; rec.interimResults = false
    rec.onresult = (e) => { preguntarClaude(e.results[0][0].transcript) }
    rec.onerror = () => { activadaRef.current = false; iniciarWake() }
    rec.onend = () => {}
    recRef.current = rec
    try { rec.start() } catch {}
  }

  const iniciarWake = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return
    if (wakeRef.current) try { wakeRef.current.stop() } catch {}
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = t.vozVoz; rec.continuous = true; rec.interimResults = false
    rec.onresult = (e) => {
      const txt = e.results[e.results.length-1][0].transcript.toLowerCase()
      if (!activadaRef.current && (txt.includes('sinyi') || txt.includes('siniy') || txt.includes('sing') || txt.includes('syng') || txt.includes('siny') || txt.includes('singi') || txt.includes('sin yi'))) {
        activadaRef.current = true
        rec.stop()
        hablar(saludos[Math.floor(Math.random() * saludos.length)])
        setTimeout(escucharComando, 800)
      }
    }
    rec.onerror = () => setTimeout(iniciarWake, 2000)
    rec.onend = () => { if (!activadaRef.current) setTimeout(iniciarWake, 500) }
    try { rec.start() } catch {}
    wakeRef.current = rec
  }

  useEffect(() => {
    const handleActivar = () => {
      if (activadaRef.current) return
      activadaRef.current = true
      if (wakeRef.current) try { wakeRef.current.stop() } catch {}
      hablar(saludos[Math.floor(Math.random() * saludos.length)])
      setTimeout(escucharComando, 800)
    }
    window.addEventListener('sinyi:activar', handleActivar)
    return () => window.removeEventListener('sinyi:activar', handleActivar)
  }, [])

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

  return <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
}

// ─── SELECTOR IDIOMA ──────────────────────────────────────────
function SelectorIdioma({ idioma, onChange, tema }) {
  const th = tema || TEMA.claro
  return (
    <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'8px', marginBottom:'24px' }}>
      {IDIOMAS.map(l => (
        <button key={l.codigo} onClick={() => onChange(l.codigo)} style={{ fontSize:'22px', padding:'6px 10px', borderRadius:'12px', cursor:'pointer', border: idioma === l.codigo ? `2px solid ${th.acento}` : `2px solid ${th.borde}`, background: idioma === l.codigo ? `${th.acento}22` : 'transparent', transition:'all 0.2s' }} title={l.nombre}>{l.bandera}</button>
      ))}
    </div>
  )
}

// ─── PANTALLA PERFIL ──────────────────────────────────────────
function PantallaPerfil({ user, idioma, tema, t, onCambiarIdioma, onToggleTema, onSalir, onVolver }) {
  const th = TEMA[tema]
  const nombre = user?.displayName || user?.email?.split('@')[0] || 'Usuario'
  const email = user?.email || ''
  const iniciales = nombre.trim().split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('')

  const itemStyle = {
    display:'flex', alignItems:'center', gap:'16px',
    padding:'16px 20px', borderBottom:`1px solid ${th.borde}`,
    background:'transparent', border:'none', width:'100%', textAlign:'left',
    cursor:'pointer', color: th.texto,
  }

  return (
    <div style={{ minHeight:'100vh', background: th.bg, fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', paddingBottom:'100px' }}>
      {/* Header morado siempre */}
      <div style={{ background: th.header, padding:'0 0 32px 0' }}>
        <div style={{ display:'flex', alignItems:'center', padding:'16px 20px 0 20px' }}>
          <button onClick={onVolver} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:'36px', height:'36px', color:'white', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
          <div style={{ flex:1, textAlign:'center', color:'white', fontSize:'17px', fontWeight:'700' }}>{t.perfil}</div>
          <div style={{ width:'36px' }} />
        </div>
        {/* Avatar */}
        <div style={{ textAlign:'center', marginTop:'24px' }}>
          <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'3px solid rgba(255,255,255,0.5)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:'28px', fontWeight:'800', color:'white' }}>{iniciales || '👤'}</div>
          <div style={{ color:'white', fontSize:'20px', fontWeight:'700' }}>{nombre}</div>
          <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'14px', marginTop:'4px' }}>{email}</div>
        </div>
      </div>

      {/* Secciones */}
      <div style={{ padding:'24px 16px' }}>

        {/* Apariencia */}
        <div style={{ fontSize:'11px', fontWeight:'700', color: th.textoSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px', paddingLeft:'4px' }}>{t.apariencia}</div>
        <div style={{ background: th.bgCard, borderRadius:'18px', overflow:'hidden', boxShadow: th.sombra, marginBottom:'20px' }}>
          <div style={{ ...itemStyle, justifyContent:'space-between', cursor:'default' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <span style={{ fontSize:'22px' }}>{tema === 'oscuro' ? '🌙' : '☀️'}</span>
              <span style={{ fontSize:'16px', fontWeight:'500' }}>{tema === 'oscuro' ? t.modoOscuro : t.modoClaro}</span>
            </div>
            {/* Toggle */}
            <div onClick={onToggleTema} style={{ width:'52px', height:'30px', borderRadius:'15px', background: tema === 'oscuro' ? th.acento : '#ddd', position:'relative', cursor:'pointer', transition:'background 0.3s', flexShrink:0 }}>
              <div style={{ position:'absolute', top:'3px', left: tema === 'oscuro' ? '24px' : '3px', width:'24px', height:'24px', borderRadius:'50%', background:'white', transition:'left 0.3s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }} />
            </div>
          </div>
        </div>

        {/* Idioma */}
        <div style={{ fontSize:'11px', fontWeight:'700', color: th.textoSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px', paddingLeft:'4px' }}>{t.idioma}</div>
        <div style={{ background: th.bgCard, borderRadius:'18px', padding:'16px 20px', boxShadow: th.sombra, marginBottom:'20px' }}>
          <SelectorIdioma idioma={idioma} onChange={onCambiarIdioma} tema={th} />
        </div>

        {/* Cuenta */}
        <div style={{ fontSize:'11px', fontWeight:'700', color: th.textoSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px', paddingLeft:'4px' }}>Cuenta</div>
        <div style={{ background: th.bgCard, borderRadius:'18px', overflow:'hidden', boxShadow: th.sombra }}>
          <button onClick={onSalir} style={{ ...itemStyle, color:'#E53935', borderBottom:'none' }}>
            <span style={{ fontSize:'22px' }}>🚪</span>
            <span style={{ fontSize:'16px', fontWeight:'500' }}>{t.cerrarSesion}</span>
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', marginTop:'40px', color: th.textoMuted, fontSize:'12px' }}>
          Syng · hecho con amor
        </div>
      </div>
    </div>
  )
}

// ─── PANTALLA HOME ────────────────────────────────────────────
function PantallaHome({ user, t, th, tema, onIrPantalla, onIrPerfil }) {
  const nombre = user?.displayName?.split(' ')[0] || 'bienvenido'

  const hoy = new Date()
  const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const fechaStr = `${diasSemana[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]}`

  const iniciales = (user?.displayName || user?.email || 'U').trim().split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('')

  return (
    <div style={{ minHeight:'100vh', background: th.bg, fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', paddingBottom:'30px' }}>
      {/* Header */}
      <div style={{ background: th.header, padding:'16px 20px 28px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'13px' }}>{fechaStr}</div>
            <div style={{ color:'white', fontSize:'26px', fontWeight:'800', letterSpacing:'-0.5px' }}>Syng</div>
          </div>
          <button onClick={onIrPerfil} style={{ width:'42px', height:'42px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'16px', fontWeight:'700', cursor:'pointer' }}>
            {iniciales || '👤'}
          </button>
        </div>

        {/* Saludo */}
        <div style={{ marginTop:'20px' }}>
          <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'15px' }}>{t.hola}, {nombre} 👋</div>
          <div style={{ color:'white', fontSize:'20px', fontWeight:'700', marginTop:'2px' }}>{t.queOrganizar}</div>
        </div>
      </div>

      {/* Tarjetas módulos */}
      <div style={{ padding:'24px 16px', display:'flex', flexDirection:'column', gap:'16px' }}>

        {/* Pizarrón */}
        <div onClick={() => onIrPantalla('pizarron')} style={{ background: th.bgCard, borderRadius:'22px', padding:'22px', boxShadow: th.sombra, cursor:'pointer', overflow:'hidden', position:'relative' }}>
          <div style={{ position:'absolute', top:'-20px', right:'-10px', fontSize:'80px', opacity:0.06 }}>📅</div>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <div style={{ width:'52px', height:'52px', borderRadius:'16px', background:`${th.acento}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', flexShrink:0 }}>📅</div>
            <div>
              <div style={{ fontSize:'17px', fontWeight:'700', color: th.acento, marginBottom:'3px' }}>{t.pizarron}</div>
              <div style={{ color: th.textoSub, fontSize:'13px' }}>{t.pizarronDesc}</div>
            </div>
            <div style={{ marginLeft:'auto', color: th.textoSub, fontSize:'18px' }}>›</div>
          </div>
        </div>

        {/* Lista del Súper */}
        <div onClick={() => onIrPantalla('listasuper')} style={{ background: th.bgCard, borderRadius:'22px', padding:'22px', boxShadow: th.sombra, cursor:'pointer', overflow:'hidden', position:'relative' }}>
          <div style={{ position:'absolute', top:'-20px', right:'-10px', fontSize:'80px', opacity:0.06 }}>🛒</div>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <div style={{ width:'52px', height:'52px', borderRadius:'16px', background:`${th.acentoVerde}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', flexShrink:0 }}>🛒</div>
            <div>
              <div style={{ fontSize:'17px', fontWeight:'700', color: th.acentoVerde, marginBottom:'3px' }}>{t.super}</div>
              <div style={{ color: th.textoSub, fontSize:'13px' }}>{t.superDesc}</div>
            </div>
            <div style={{ marginLeft:'auto', color: th.textoSub, fontSize:'18px' }}>›</div>
          </div>
        </div>

        {/* Espacio reservado — sin etiqueta */}
        <div style={{ background: th.bgCard, borderRadius:'22px', padding:'22px', boxShadow: th.sombra, opacity:0.4, minHeight:'72px' }} />

      </div>

      <Sinyi idioma={'es'} nombre={nombre} pantalla={'inicio'} />
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
  const [tema, setTema] = useState(() => localStorage.getItem('syng_tema') || 'oscuro')

  // Invitación
  const [invId, setInvId] = useState(null)
  const [invData, setInvData] = useState(null)
  const [invCargando, setInvCargando] = useState(false)
  const [grupoDestino, setGrupoDestino] = useState(null)

  const t = TEXTOS[idioma] || TEXTOS.es
  const th = TEMA[tema] || TEMA.oscuro

  const cambiarIdioma = (cod) => { setIdioma(cod); localStorage.setItem('syng_idioma', cod) }
  const toggleTema = () => {
    const nuevo = tema === 'oscuro' ? 'claro' : 'oscuro'
    setTema(nuevo)
    localStorage.setItem('syng_tema', nuevo)
  }

  // Detectar invitación en la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('invitacion')
    if (!id) return
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
      } catch { setInvId(null) }
      setInvCargando(false)
    }
    cargarInv()
  }, [])

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
        await setDoc(doc(db, 'users', u.uid, 'misGrupos', inv.grupoId), { nombre: grupo.nombre, modulo: inv.modulo })
      }
      const invSnap = await getDoc(doc(db, 'invitaciones', invId || ''))
      if (invSnap.exists() && !invSnap.data().usado) {
        await updateDoc(doc(db, 'invitaciones', invId), { usado: true })
      }
      window.history.replaceState({}, '', window.location.pathname)
      setInvId(null); setInvData(null)
      setGrupoDestino({ grupoId: inv.grupoId, modulo: inv.modulo })
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      const invPendiente = invData || JSON.parse(localStorage.getItem('syng_inv_pendiente') || 'null')
      if (u && invPendiente) {
        localStorage.removeItem('syng_inv_pendiente')
        await procesarInvitacion(u, invPendiente)
      }
    })
    return unsub
  }, [invData])

  useEffect(() => {
    if (user && grupoDestino) {
      localStorage.setItem('syng_grupo_activo_pizarron', grupoDestino.grupoId)
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

  useEffect(() => {
    const handlePopState = () => setPantalla('inicio')
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (pantalla !== 'inicio') window.history.pushState({ pantalla }, '')
  }, [pantalla])

  // Cargando invitación
  if (invCargando) return (
    <div style={{ minHeight:'100vh', background: th.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color: th.textoSub, fontSize:'15px' }}>Cargando invitación...</div>
    </div>
  )

  // Pantalla de invitación
  if (invData && !user) return (
    <PantallaInvitacion
      invData={invData}
      onEntrar={async () => {
        if (user && !user.isAnonymous) {
          await procesarInvitacion(user, invData)
        } else {
          localStorage.setItem('syng_grupo_activo_pizarron', invData.grupoId)
          window.history.replaceState({}, '', window.location.pathname)
          setInvId(null); setInvData(null)
          setPantalla('pizarron')
        }
      }}
      onIrLogin={() => {
        window.history.replaceState({}, '', window.location.pathname)
        setInvId(null); setInvData(null)
      }}
    />
  )

  // Módulos
  if (user && pantalla === 'listatareas') return <ListaTareas onVolver={() => setPantalla('inicio')} />
  if (user && pantalla === 'listasuper')  return <ListaSuper  onVolver={() => setPantalla('inicio')} tema={tema} />
  if (pantalla === 'pizarron')    return <Pizarron    onVolver={() => setPantalla('inicio')} tema={tema} />

  // Pantalla perfil
  if (user && pantalla === 'perfil') return (
    <PantallaPerfil
      user={user}
      idioma={idioma}
      tema={tema}
      t={t}
      onCambiarIdioma={cambiarIdioma}
      onToggleTema={toggleTema}
      onSalir={() => { signOut(auth); setPantalla('inicio') }}
      onVolver={() => setPantalla('inicio')}
    />
  )

  // Pantalla principal
  if (user) return (
    <PantallaHome
      user={user}
      t={t}
      th={th}
      tema={tema}
      onIrPantalla={setPantalla}
      onIrPerfil={() => setPantalla('perfil')}
    />
  )

  // Login
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
          <button onClick={() => setIsLogin(true)} style={{ flex:1, padding:'8px', border:'none', borderRadius:'10px', background:isLogin?'white':'transparent', color:isLogin?'#534AB7':'#888', fontWeight:isLogin?'600':'400', cursor:'pointer', fontSize:'14px', boxShadow:isLogin?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>{t.iniciar}</button>
          <button onClick={() => setIsLogin(false)} style={{ flex:1, padding:'8px', border:'none', borderRadius:'10px', background:!isLogin?'white':'transparent', color:!isLogin?'#534AB7':'#888', fontWeight:!isLogin?'600':'400', cursor:'pointer', fontSize:'14px', boxShadow:!isLogin?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>{t.registrar}</button>
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

import { useState, useEffect, useRef } from 'react'

const TEXTOS_DEMO = {
  es: {
    historia: 'Compramos un pizarrón para casa. Funcionaba, pero había que estar frente a él para verlo. Un día con demasiados pendientes fue la gota que derramó el vaso — necesitábamos algo mejor.',
    historiaLabel: '¿Por qué existe Syng?',
    tagline: 'Tu vida organizada,\nen tiempo real.',
    sub: 'Del pizarrón físico de casa a una app que conecta a tu familia, tu equipo y tu mundo.',
    modulos: [
      { icon: '▦', titulo: 'Pizarrón', desc: 'Tareas del día por grupo. Familia, trabajo, amigos. Todos en tiempo real.' },
      { icon: '📅', titulo: 'Mi Agenda', desc: 'Una sola vista con todos tus pendientes del día. Sin perderte nada.' },
      { icon: '🛒', titulo: 'Lista del Súper', desc: 'Van al súper y todos saben qué comprar. Sin olvidos, sin gastos de más.' },
    ],
    mercadoLabel: 'Para quién es Syng',
    mercado: ['Familias', 'Empresas', 'Gobierno', 'Equipos de trabajo'],
    planes: [
      { nombre: 'Gratis', precio: '$0', desc: 'Para empezar' },
      { nombre: 'Básico', precio: '$X/mes', desc: 'Más grupos', destacado: true },
      { nombre: 'Pro', precio: '$XX/mes', desc: 'Ilimitado' },
    ],
    cta: 'Empieza gratis →',
    ctaSub: 'Sin tarjeta de crédito · Cancela cuando quieras',
    toca: 'Toca la pantalla',
    demoTareas: ['Llevar a Alexa al médico', 'Pagar el recibo de luz', 'Llamar a mamá', 'Reunión de trabajo 3pm', 'Comprar pan'],
    demoDeps: ['Lácteos', 'Frutas y verduras', 'Abarrotes'],
    demoProductos: ['Leche entera', 'Queso fresco', 'Aguacate', 'Jitomate', 'Arroz', 'Frijol'],
    demoNotif: '¡Mamá marcó "Leche entera" como comprada!',
  },
  en: {
    historia: 'We bought a whiteboard for home. It worked, but you had to be right in front of it. One day with too many tasks was the last straw — we needed something better.',
    historiaLabel: 'Why does Syng exist?',
    tagline: 'Your life organized,\nin real time.',
    sub: 'From a physical whiteboard at home to an app that connects your family, your team and your world.',
    modulos: [
      { icon: '▦', titulo: 'Board', desc: 'Daily tasks by group. Family, work, friends. All in real time.' },
      { icon: '📅', titulo: 'My Agenda', desc: 'One single view with all your daily tasks. Miss nothing.' },
      { icon: '🛒', titulo: 'Shopping List', desc: 'Everyone knows what to buy. No forgotten items, no overspending.' },
    ],
    mercadoLabel: 'Who is Syng for',
    mercado: ['Families', 'Companies', 'Government', 'Work teams'],
    planes: [
      { nombre: 'Free', precio: '$0', desc: 'Get started' },
      { nombre: 'Basic', precio: '$X/mo', desc: 'More groups', destacado: true },
      { nombre: 'Pro', precio: '$XX/mo', desc: 'Unlimited' },
    ],
    cta: 'Start for free →',
    ctaSub: 'No credit card · Cancel anytime',
    toca: 'Tap the screen',
    demoTareas: ['Take Alex to doctor', 'Pay electricity bill', 'Call mom', 'Work meeting 3pm', 'Buy bread'],
    demoDeps: ['Dairy', 'Fruits & Vegetables', 'Pantry'],
    demoProductos: ['Whole milk', 'Fresh cheese', 'Avocado', 'Tomato', 'Rice', 'Beans'],
    demoNotif: 'Mom marked "Whole milk" as bought!',
  },
  fr: {
    historia: 'Nous avons acheté un tableau blanc pour la maison. Ça marchait, mais il fallait être devant pour le voir. Un jour avec trop de tâches fut la goutte qui a fait déborder le vase.',
    historiaLabel: 'Pourquoi Syng existe-t-il?',
    tagline: 'Votre vie organisée,\nen temps réel.',
    sub: 'Du tableau blanc physique à une app qui connecte votre famille, votre équipe et votre monde.',
    modulos: [
      { icon: '▦', titulo: 'Tableau', desc: 'Tâches du jour par groupe. Famille, travail, amis. Tout en temps réel.' },
      { icon: '📅', titulo: 'Mon Agenda', desc: 'Une seule vue avec toutes vos tâches. Ne ratez rien.' },
      { icon: '🛒', titulo: 'Liste de courses', desc: 'Tout le monde sait quoi acheter. Sans oublis, sans dépenses excessives.' },
    ],
    mercadoLabel: 'Pour qui est Syng',
    mercado: ['Familles', 'Entreprises', 'Gouvernement', 'Équipes de travail'],
    planes: [
      { nombre: 'Gratuit', precio: '0€', desc: 'Pour commencer' },
      { nombre: 'Basique', precio: 'X€/mois', desc: 'Plus de groupes', destacado: true },
      { nombre: 'Pro', precio: 'XX€/mois', desc: 'Illimité' },
    ],
    cta: 'Commencer gratuitement →',
    ctaSub: 'Sans carte de crédit · Annulez quand vous voulez',
    toca: 'Touchez l\'écran',
    demoTareas: ['Emmener Alex chez le médecin', 'Payer la facture d\'électricité', 'Appeler maman', 'Réunion de travail 15h', 'Acheter du pain'],
    demoDeps: ['Produits laitiers', 'Fruits et légumes', 'Épicerie'],
    demoProductos: ['Lait entier', 'Fromage frais', 'Avocat', 'Tomate', 'Riz', 'Haricots'],
    demoNotif: 'Maman a marqué "Lait entier" comme acheté!',
  },
  de: {
    historia: 'Wir kauften ein Whiteboard für zu Hause. Es funktionierte, aber man musste davor stehen. Ein Tag mit zu vielen Aufgaben war der Tropfen, der das Fass zum Überlaufen brachte.',
    historiaLabel: 'Warum gibt es Syng?',
    tagline: 'Dein Leben organisiert,\nin Echtzeit.',
    sub: 'Vom physischen Whiteboard zu einer App, die deine Familie, dein Team und deine Welt verbindet.',
    modulos: [
      { icon: '▦', titulo: 'Tafel', desc: 'Tagesaufgaben nach Gruppe. Familie, Arbeit, Freunde. Alles in Echtzeit.' },
      { icon: '📅', titulo: 'Mein Kalender', desc: 'Eine Übersicht mit allen täglichen Aufgaben. Nichts verpassen.' },
      { icon: '🛒', titulo: 'Einkaufsliste', desc: 'Alle wissen, was zu kaufen ist. Keine vergessenen Artikel, keine Mehrausgaben.' },
    ],
    mercadoLabel: 'Für wen ist Syng',
    mercado: ['Familien', 'Unternehmen', 'Behörden', 'Arbeitsteams'],
    planes: [
      { nombre: 'Kostenlos', precio: '0€', desc: 'Zum Starten' },
      { nombre: 'Basis', precio: 'X€/Mo', desc: 'Mehr Gruppen', destacado: true },
      { nombre: 'Pro', precio: 'XX€/Mo', desc: 'Unbegrenzt' },
    ],
    cta: 'Kostenlos starten →',
    ctaSub: 'Keine Kreditkarte · Jederzeit kündigen',
    toca: 'Bildschirm berühren',
    demoTareas: ['Alex zum Arzt bringen', 'Stromrechnung bezahlen', 'Mama anrufen', 'Arbeitsmeeting 15 Uhr', 'Brot kaufen'],
    demoDeps: ['Milchprodukte', 'Obst & Gemüse', 'Vorratskammer'],
    demoProductos: ['Vollmilch', 'Frischkäse', 'Avocado', 'Tomate', 'Reis', 'Bohnen'],
    demoNotif: 'Mama hat "Vollmilch" als gekauft markiert!',
  },
  it: {
    historia: 'Abbiamo comprato una lavagna per casa. Funzionava, ma bisognava essere davanti per vederla. Un giorno con troppi impegni fu la goccia che fece traboccare il vaso.',
    historiaLabel: 'Perché esiste Syng?',
    tagline: 'La tua vita organizzata,\nin tempo reale.',
    sub: 'Dalla lavagna fisica di casa a un\'app che connette la tua famiglia, il tuo team e il tuo mondo.',
    modulos: [
      { icon: '▦', titulo: 'Lavagna', desc: 'Attività del giorno per gruppo. Famiglia, lavoro, amici. Tutto in tempo reale.' },
      { icon: '📅', titulo: 'La mia Agenda', desc: 'Un\'unica vista con tutte le attività giornaliere. Non perdere nulla.' },
      { icon: '🛒', titulo: 'Lista della spesa', desc: 'Tutti sanno cosa comprare. Senza dimenticare nulla, senza spese extra.' },
    ],
    mercadoLabel: 'Per chi è Syng',
    mercado: ['Famiglie', 'Aziende', 'Governo', 'Team di lavoro'],
    planes: [
      { nombre: 'Gratuito', precio: '0€', desc: 'Per iniziare' },
      { nombre: 'Base', precio: 'X€/mese', desc: 'Più gruppi', destacado: true },
      { nombre: 'Pro', precio: 'XX€/mese', desc: 'Illimitato' },
    ],
    cta: 'Inizia gratis →',
    ctaSub: 'Senza carta di credito · Annulla quando vuoi',
    toca: 'Tocca lo schermo',
    demoTareas: ['Portare Alex dal medico', 'Pagare la bolletta', 'Chiamare la mamma', 'Riunione di lavoro 15:00', 'Comprare il pane'],
    demoDeps: ['Latticini', 'Frutta e verdura', 'Dispensa'],
    demoProductos: ['Latte intero', 'Formaggio fresco', 'Avocado', 'Pomodoro', 'Riso', 'Fagioli'],
    demoNotif: 'La mamma ha segnato "Latte intero" come acquistato!',
  },
  pt: {
    historia: 'Compramos um quadro branco para casa. Funcionava, mas precisávamos estar na frente dele para ver algo. Um dia com tarefas demais foi a gota d\'água — precisávamos de algo melhor.',
    historiaLabel: 'Por que o Syng existe?',
    tagline: 'Sua vida organizada,\nem tempo real.',
    sub: 'Do quadro branco físico em casa a um app que conecta sua família, sua equipe e seu mundo.',
    modulos: [
      { icon: '▦', titulo: 'Quadro', desc: 'Tarefas do dia por grupo. Família, trabalho, amigos. Tudo em tempo real.' },
      { icon: '📅', titulo: 'Minha Agenda', desc: 'Uma única visão com todas as tarefas do dia. Não perca nada.' },
      { icon: '🛒', titulo: 'Lista de compras', desc: 'Todos sabem o que comprar. Sem esquecimentos, sem gastos extras.' },
    ],
    mercadoLabel: 'Para quem é o Syng',
    mercado: ['Famílias', 'Empresas', 'Governo', 'Equipes de trabalho'],
    planes: [
      { nombre: 'Grátis', precio: 'R$0', desc: 'Para começar' },
      { nombre: 'Básico', precio: 'R$X/mês', desc: 'Mais grupos', destacado: true },
      { nombre: 'Pro', precio: 'R$XX/mês', desc: 'Ilimitado' },
    ],
    cta: 'Comece grátis →',
    ctaSub: 'Sem cartão de crédito · Cancele quando quiser',
    toca: 'Toque a tela',
    demoTareas: ['Levar Alex ao médico', 'Pagar conta de luz', 'Ligar para a mamãe', 'Reunião de trabalho 15h', 'Comprar pão'],
    demoDeps: ['Laticínios', 'Frutas e verduras', 'Mercearia'],
    demoProductos: ['Leite integral', 'Queijo fresco', 'Abacate', 'Tomate', 'Arroz', 'Feijão'],
    demoNotif: 'Mamãe marcou "Leite integral" como comprado!',
  },
  ja: {
    historia: '家にホワイトボードを買いました。使えましたが、見るには目の前にいる必要がありました。やることが多すぎた一日が決定打になり、もっと良いものが必要でした。',
    historiaLabel: 'Syngはなぜ生まれたか',
    tagline: 'あなたの生活を整理、\nリアルタイムで。',
    sub: '家のホワイトボードから、家族・チーム・世界をつなぐアプリへ。',
    modulos: [
      { icon: '▦', titulo: 'ボード', desc: 'グループ別の日課。家族、仕事、友人。すべてリアルタイムで。' },
      { icon: '📅', titulo: 'マイアジェンダ', desc: '今日のすべてのタスクを一目で。何も見逃さない。' },
      { icon: '🛒', titulo: 'ショッピングリスト', desc: '全員が何を買うか知っている。忘れ物なし、無駄な出費なし。' },
    ],
    mercadoLabel: 'Syngは誰のためか',
    mercado: ['家族', '企業', '政府', 'チーム'],
    planes: [
      { nombre: '無料', precio: '¥0', desc: 'まず試す' },
      { nombre: 'ベーシック', precio: '¥X/月', desc: 'グループ追加', destacado: true },
      { nombre: 'プロ', precio: '¥XX/月', desc: '無制限' },
    ],
    cta: '無料で始める →',
    ctaSub: 'クレジットカード不要 · いつでもキャンセル可',
    toca: '画面をタップ',
    demoTareas: ['Alexを病院に連れて行く', '電気代を払う', 'お母さんに電話する', '仕事会議 15時', 'パンを買う'],
    demoDeps: ['乳製品', '果物と野菜', '食料品'],
    demoProductos: ['全乳', 'フレッシュチーズ', 'アボカド', 'トマト', '米', '豆'],
    demoNotif: 'お母さんが「全乳」を購入済みにしました！',
  },
  zh: {
    historia: '我们在家买了一块白板。能用，但必须站在它面前才能看到内容。有一天待办事项太多，那就成了压垮骆驼的最后一根稻草——我们需要更好的东西。',
    historiaLabel: 'Syng为什么存在？',
    tagline: '您的生活井井有条，\n实时同步。',
    sub: '从家里的实体白板到连接您的家人、团队和世界的应用程序。',
    modulos: [
      { icon: '▦', titulo: '白板', desc: '按组分类的日常任务。家人、工作、朋友。全部实时同步。' },
      { icon: '📅', titulo: '我的日程', desc: '一目了然查看所有日常任务。不错过任何事情。' },
      { icon: '🛒', titulo: '购物清单', desc: '每个人都知道要买什么。不遗漏，不超支。' },
    ],
    mercadoLabel: 'Syng适合谁',
    mercado: ['家庭', '企业', '政府', '工作团队'],
    planes: [
      { nombre: '免费', precio: '¥0', desc: '开始使用' },
      { nombre: '基础', precio: '¥X/月', desc: '更多群组', destacado: true },
      { nombre: '专业', precio: '¥XX/月', desc: '无限制' },
    ],
    cta: '免费开始 →',
    ctaSub: '无需信用卡 · 随时取消',
    toca: '点击屏幕',
    demoTareas: ['带Alex去看医生', '缴纳电费', '给妈妈打电话', '下午3点工作会议', '买面包'],
    demoDeps: ['乳制品', '水果蔬菜', '粮食'],
    demoProductos: ['全脂牛奶', '新鲜奶酪', '牛油果', '西红柿', '大米', '豆子'],
    demoNotif: '妈妈把"全脂牛奶"标记为已购买！',
  },
}

const LANG_MAP = {
  'es': 'es', 'es-MX': 'es', 'es-ES': 'es', 'es-AR': 'es', 'es-CO': 'es',
  'en': 'en', 'en-US': 'en', 'en-GB': 'en', 'en-AU': 'en',
  'fr': 'fr', 'fr-FR': 'fr', 'fr-CA': 'fr',
  'de': 'de', 'de-DE': 'de', 'de-AT': 'de',
  'it': 'it', 'it-IT': 'it',
  'pt': 'pt', 'pt-BR': 'pt', 'pt-PT': 'pt',
  'ja': 'ja', 'ja-JP': 'ja',
  'zh': 'zh', 'zh-CN': 'zh', 'zh-TW': 'zh',
}

function detectarIdioma() {
  const lang = navigator.language || navigator.languages?.[0] || 'es'
  return LANG_MAP[lang] || LANG_MAP[lang.split('-')[0]] || 'es'
}

// Escenas del modo attract
const ESCENAS = ['pizarron', 'lista', 'agenda', 'notif']

export default function PantallaDemo({ onEntrar }) {
  const [idioma] = useState(() => detectarIdioma())
  const tx = TEXTOS_DEMO[idioma] || TEXTOS_DEMO.es

  const [tocado, setTocado] = useState(false)
  const [escena, setEscena] = useState(0)
  const [tareasVisibles, setTareasVisibles] = useState([])
  const [productosVisibles, setProductosVisibles] = useState([])
  const [tareasDone, setTareasDone] = useState([])
  const [productosDone, setProductosDone] = useState([])
  const [mostrarNotif, setMostrarNotif] = useState(false)
  const timerRef = useRef(null)

  // Motor de animación attract
  useEffect(() => {
    if (tocado) return
    let escenaActual = 0
    let paso = 0

    const avanzar = () => {
      const e = ESCENAS[escenaActual]

      if (e === 'pizarron') {
        if (paso < tx.demoTareas.length) {
          setEscena(0)
          setTareasVisibles(prev => [...prev, tx.demoTareas[paso]])
          paso++
          timerRef.current = setTimeout(avanzar, 700)
        } else if (paso < tx.demoTareas.length + 3) {
          const idx = paso - tx.demoTareas.length
          setTareasDone(prev => [...prev, tx.demoTareas[idx]])
          paso++
          timerRef.current = setTimeout(avanzar, 600)
        } else {
          paso = 0; escenaActual = 1
          setTareasVisibles([]); setTareasDone([])
          timerRef.current = setTimeout(avanzar, 800)
        }
      } else if (e === 'lista') {
        if (paso < tx.demoProductos.length) {
          setEscena(1)
          setProductosVisibles(prev => [...prev, tx.demoProductos[paso]])
          paso++
          timerRef.current = setTimeout(avanzar, 600)
        } else if (paso < tx.demoProductos.length + 4) {
          const idx = paso - tx.demoProductos.length
          setProductosDone(prev => [...prev, tx.demoProductos[idx]])
          paso++
          timerRef.current = setTimeout(avanzar, 500)
        } else {
          paso = 0; escenaActual = 2
          setProductosVisibles([]); setProductosDone([])
          timerRef.current = setTimeout(avanzar, 800)
        }
      } else if (e === 'agenda') {
        setEscena(2)
        paso++
        if (paso > 4) {
          paso = 0; escenaActual = 3
          timerRef.current = setTimeout(avanzar, 3000)
        } else {
          timerRef.current = setTimeout(avanzar, 800)
        }
      } else if (e === 'notif') {
        setEscena(3)
        setMostrarNotif(true)
        timerRef.current = setTimeout(() => {
          setMostrarNotif(false)
          paso = 0; escenaActual = 0
          timerRef.current = setTimeout(avanzar, 1000)
        }, 3000)
      }
    }

    timerRef.current = setTimeout(avanzar, 1000)
    return () => clearTimeout(timerRef.current)
  }, [tocado, idioma])

  const handleToque = () => {
    clearTimeout(timerRef.current)
    setTocado(true)
  }

  const S = {
    pantalla: {
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#0A1628 0%,#142B52 40%,#1D1D5C 70%,#2D1B6E 100%)',
      fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
    },
    header: {
      padding: '40px 24px 24px',
      textAlign: 'center',
    },
    logo: {
      fontSize: '32px',
      fontWeight: '800',
      letterSpacing: '0.1em',
      marginBottom: '20px',
      opacity: 0.95,
    },
    tagline: {
      fontSize: '28px',
      fontWeight: '800',
      lineHeight: 1.2,
      marginBottom: '12px',
      whiteSpace: 'pre-line',
    },
    sub: {
      fontSize: '15px',
      opacity: 0.7,
      lineHeight: 1.6,
      maxWidth: '300px',
      margin: '0 auto',
    },
    demoBox: {
      margin: '24px 20px',
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '20px',
      overflow: 'hidden',
      minHeight: '260px',
    },
    demoHeader: {
      padding: '12px 16px',
      background: 'rgba(255,255,255,0.08)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      fontSize: '12px',
      fontWeight: '700',
      opacity: 0.7,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    dot: (color) => ({
      width: '8px', height: '8px',
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
    }),
    tareaItem: (done) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 16px',
      borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      animation: 'fadeIn 0.4s ease',
      opacity: done ? 0.5 : 1,
    }),
    check: (done) => ({
      width: '20px', height: '20px',
      borderRadius: '50%',
      border: done ? 'none' : '1.5px solid rgba(255,255,255,0.4)',
      background: done ? '#2ECC9A' : 'transparent',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
    }),
    historia: {
      margin: '0 20px 20px',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '16px',
      padding: '18px 20px',
    },
    historiaLabel: {
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '0.1em',
      opacity: 0.5,
      textTransform: 'uppercase',
      marginBottom: '10px',
    },
    historiaText: {
      fontSize: '14px',
      lineHeight: 1.65,
      opacity: 0.9,
    },
    divider: {
      height: '1px',
      background: 'rgba(255,255,255,0.12)',
      margin: '4px 20px 20px',
    },
    modulosGrid: {
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginBottom: '20px',
    },
    modulo: {
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '14px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
    },
    moduloIcon: (bg) => ({
      width: '44px', height: '44px',
      borderRadius: '12px',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      flexShrink: 0,
    }),
    planes: {
      display: 'flex',
      gap: '8px',
      padding: '0 20px',
      marginBottom: '24px',
    },
    plan: (destacado) => ({
      flex: 1,
      background: destacado ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
      border: destacado ? '1.5px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.12)',
      borderRadius: '12px',
      padding: '12px 8px',
      textAlign: 'center',
    }),
    ctaArea: {
      padding: '4px 20px 48px',
    },
    ctaBtn: {
      width: '100%',
      padding: '18px',
      background: 'white',
      color: '#185FA5',
      border: 'none',
      borderRadius: '16px',
      fontSize: '17px',
      fontWeight: '800',
      cursor: 'pointer',
      marginBottom: '12px',
      letterSpacing: '-0.3px',
    },
    ctaSub: {
      textAlign: 'center',
      fontSize: '12px',
      opacity: 0.55,
    },
    notifBanner: {
      position: 'fixed',
      top: '20px',
      left: '20px',
      right: '20px',
      background: 'linear-gradient(135deg,#2ECC9A,#1D9E75)',
      borderRadius: '14px',
      padding: '14px 16px',
      fontSize: '13px',
      fontWeight: '600',
      color: 'white',
      zIndex: 999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      animation: 'slideDown 0.4s ease',
    },
    tocaMensaje: {
      position: 'fixed',
      bottom: '120px',
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: '13px',
      opacity: 0.5,
      animation: 'pulse 2s infinite',
    },
  }

  const renderDemo = () => {
    if (escena === 0 || escena === 2) {
      return (
        <div>
          <div style={S.demoHeader}>
            <div style={S.dot('#7B6EF6')} />
            {escena === 0 ? (idioma === 'es' ? 'Pizarrón · Familia' : 'Board · Family') : (idioma === 'es' ? 'Mi Agenda · Hoy' : 'My Agenda · Today')}
          </div>
          {tareasVisibles.map((t, i) => (
            <div key={i} style={S.tareaItem(tareasDone.includes(t))}>
              <div style={S.check(tareasDone.includes(t))}>
                {tareasDone.includes(t) && '✓'}
              </div>
              <span style={{ fontSize: '14px', textDecoration: tareasDone.includes(t) ? 'line-through' : 'none' }}>{t}</span>
            </div>
          ))}
          {escena === 2 && tx.demoTareas.slice(0, 3).map((t, i) => (
            <div key={i} style={S.tareaItem(i < 2)}>
              <div style={S.check(i < 2)}>{i < 2 && '✓'}</div>
              <span style={{ fontSize: '14px', textDecoration: i < 2 ? 'line-through' : 'none', opacity: i < 2 ? 0.5 : 1 }}>{t}</span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', opacity: 0.4, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                {i === 0 ? (idioma === 'es' ? 'Familia' : 'Family') : i === 1 ? (idioma === 'es' ? 'Trabajo' : 'Work') : (idioma === 'es' ? 'Personal' : 'Personal')}
              </span>
            </div>
          ))}
        </div>
      )
    }

    if (escena === 1 || escena === 3) {
      return (
        <div>
          <div style={S.demoHeader}>
            <div style={S.dot('#2ECC9A')} />
            {idioma === 'es' ? 'Lista del Súper · Familia' : 'Shopping List · Family'}
          </div>
          {productosVisibles.map((p, i) => (
            <div key={i} style={S.tareaItem(productosDone.includes(p))}>
              <div style={{ ...S.check(productosDone.includes(p)), borderRadius: '5px' }}>
                {productosDone.includes(p) && '✓'}
              </div>
              <span style={{ fontSize: '14px', textDecoration: productosDone.includes(p) ? 'line-through' : 'none' }}>{p}</span>
            </div>
          ))}
        </div>
      )
    }
  }

  return (
    <div style={S.pantalla} onClick={!tocado ? handleToque : undefined}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>

      {mostrarNotif && (
        <div style={S.notifBanner}>
          <span style={{ fontSize: '18px' }}>🔔</span>
          {tx.demoNotif}
        </div>
      )}

      <div style={S.header}>
        <div style={S.logo}>SYNG</div>
        <div style={S.tagline}>{tx.tagline}</div>
        <div style={S.sub}>{tx.sub}</div>
      </div>

      {!tocado ? (
        <>
          <div style={S.demoBox}>{renderDemo()}</div>
          <div style={S.tocaMensaje}>👆 {tx.toca}</div>
        </>
      ) : (
        <>
          <div style={S.historia}>
            <div style={S.historiaLabel}>{tx.historiaLabel}</div>
            <div style={S.historiaText}>{tx.historia}</div>
          </div>

          <div style={S.modulosGrid}>
            {tx.modulos.map((m, i) => (
              <div key={i} style={S.modulo}>
                <div style={S.moduloIcon(i === 0 ? 'rgba(123,110,246,0.3)' : i === 1 ? 'rgba(46,204,154,0.3)' : 'rgba(255,185,0,0.25)')}>
                  {m.icon}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '3px' }}>{m.titulo}</div>
                  <div style={{ fontSize: '12px', opacity: 0.65, lineHeight: 1.4 }}>{m.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={S.divider} />

          <div style={{ padding: '0 20px', marginBottom: '10px', fontSize: '11px', fontWeight: '700', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{tx.mercadoLabel}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 20px', marginBottom: '20px' }}>
            {tx.mercado.map((m, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '5px 14px', fontSize: '13px', fontWeight: '500' }}>{m}</div>
            ))}
          </div>

          <div style={S.divider} />

          <div style={{ padding: '0 20px', marginBottom: '12px', fontSize: '11px', fontWeight: '700', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Planes</div>
          <div style={S.planes}>
            {tx.planes.map((p, i) => (
              <div key={i} style={S.plan(p.destacado)}>
                <div style={{ fontSize: '10px', fontWeight: '700', opacity: 0.6, textTransform: 'uppercase', marginBottom: '4px' }}>{p.nombre}</div>
                <div style={{ fontSize: '17px', fontWeight: '800', marginBottom: '2px' }}>{p.precio}</div>
                <div style={{ fontSize: '10px', opacity: 0.55, lineHeight: 1.3 }}>{p.desc}</div>
              </div>
            ))}
          </div>

          <div style={S.ctaArea}>
            <button style={S.ctaBtn} onClick={onEntrar}>{tx.cta}</button>
            <div style={S.ctaSub}>{tx.ctaSub}</div>
          </div>
        </>
      )}
    </div>
  )
}

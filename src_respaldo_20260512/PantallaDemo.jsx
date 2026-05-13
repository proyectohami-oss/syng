import { useState, useEffect, useRef } from 'react'

const TEXTOS_DEMO = {
  es: {
    historia: 'Compramos un pizarrón para casa. Funcionaba, pero había que estar frente a él para verlo. Un día con demasiados pendientes fue la gota que derramó el vaso — necesitábamos algo mejor. Syng nació de esa necesidad real.',
    historiaLabel: '¿Por qué existe Syng?',
    tagline: 'Tu vida organizada,\nen tiempo real.',
    sub: 'Del pizarrón físico de casa a una app que conecta a tu familia, tu equipo y tu mundo.',
    mercadoLabel: 'Para quién es Syng',
    mercado: ['Familias', 'Empresas', 'Gobierno', 'Equipos de trabajo'],
    planes: [
      { nombre: 'Gratis', precio: '$0', desc: 'Para empezar' },
      { nombre: 'Básico', precio: '$X/mes', desc: 'Más grupos', destacado: true },
      { nombre: 'Pro', precio: '$XX/mes', desc: 'Ilimitado' },
    ],
    cta: 'Empieza gratis →',
    ctaSub: 'Sin tarjeta · Cancela cuando quieras',
    modBtns: ['Pizarrón', 'Mi Agenda', 'Lista del Súper'],
    modDescs: [
      'Tareas del día por grupo. Familia, trabajo, amigos. Todos en tiempo real.',
      'Una sola vista con todos tus pendientes. Sin perderte nada del día.',
      'Van al súper y todos saben qué comprar. Sin olvidos, sin gastos de más.',
    ],
    grupoLabel: 'Familia',
    demoTareas: ['Llevar a Alexa al médico', 'Pagar recibo de luz', 'Llamar a mamá', 'Reunión de trabajo 3pm', 'Comprar pan de dulce'],
    demoProductos: ['Leche entera', 'Queso fresco', 'Aguacate', 'Jitomate', 'Arroz', 'Frijol negro'],
    demoAgenda: ['Alexa al médico · Familia', 'Pagar recibo · Personal', 'Reunión 3pm · Trabajo', 'Llamar a mamá · Familia'],
    demoNotif: '¡Mamá marcó "Leche entera" como comprada!',
    instalarBtn: 'Instalar Syng en mi dispositivo',
    instalarTitulo: 'Instalar Syng',
    instalarIos: 'En Safari, toca el botón Compartir ↑ y luego "Agregar a pantalla de inicio"',
    instalarAndroid: 'En Chrome, toca el menú ⋮ y luego "Agregar a pantalla de inicio"',
    instalarOk: 'Entendido',
  },
  en: {
    historia: 'We bought a whiteboard for home. It worked, but you had to stand in front of it. One day with too many tasks was the last straw — we needed something better. Syng was born from that real need.',
    historiaLabel: 'Why does Syng exist?',
    tagline: 'Your life organized,\nin real time.',
    sub: 'From a physical whiteboard at home to an app that connects your family, your team and your world.',
    mercadoLabel: 'Who is Syng for',
    mercado: ['Families', 'Companies', 'Government', 'Work teams'],
    planes: [
      { nombre: 'Free', precio: '$0', desc: 'Get started' },
      { nombre: 'Basic', precio: '$X/mo', desc: 'More groups', destacado: true },
      { nombre: 'Pro', precio: '$XX/mo', desc: 'Unlimited' },
    ],
    cta: 'Start for free →',
    ctaSub: 'No credit card · Cancel anytime',
    modBtns: ['Board', 'My Agenda', 'Shopping List'],
    modDescs: [
      'Daily tasks by group. Family, work, friends. All in real time.',
      'One view with all your daily tasks. Miss nothing.',
      'Everyone knows what to buy. No forgotten items, no overspending.',
    ],
    grupoLabel: 'Family',
    demoTareas: ['Take Alex to doctor', 'Pay electricity bill', 'Call mom', 'Work meeting 3pm', 'Buy bread'],
    demoProductos: ['Whole milk', 'Fresh cheese', 'Avocado', 'Tomato', 'Rice', 'Black beans'],
    demoAgenda: ['Alex to doctor · Family', 'Pay bill · Personal', 'Meeting 3pm · Work', 'Call mom · Family'],
    demoNotif: 'Mom marked "Whole milk" as bought!',
    instalarBtn: 'Install Syng on my device',
    instalarTitulo: 'Install Syng',
    instalarIos: 'In Safari, tap the Share button ↑ and then "Add to Home Screen"',
    instalarAndroid: 'In Chrome, tap the ⋮ menu and then "Add to Home Screen"',
    instalarOk: 'Got it',
  },
  fr: {
    historia: 'Nous avons acheté un tableau blanc pour la maison. Un jour avec trop de tâches fut la goutte qui a fait déborder le vase. Syng est né de ce besoin réel.',
    historiaLabel: 'Pourquoi Syng existe-t-il?',
    tagline: 'Votre vie organisée,\nen temps réel.',
    sub: 'Du tableau blanc physique à une app qui connecte votre famille, votre équipe et votre monde.',
    mercadoLabel: 'Pour qui est Syng',
    mercado: ['Familles', 'Entreprises', 'Gouvernement', 'Équipes'],
    planes: [
      { nombre: 'Gratuit', precio: '0€', desc: 'Pour commencer' },
      { nombre: 'Basique', precio: 'X€/mois', desc: 'Plus de groupes', destacado: true },
      { nombre: 'Pro', precio: 'XX€/mois', desc: 'Illimité' },
    ],
    cta: 'Commencer gratuitement →',
    ctaSub: 'Sans carte · Annulez quand vous voulez',
    modBtns: ['Tableau', 'Mon Agenda', 'Liste de courses'],
    modDescs: [
      'Tâches du jour par groupe. Famille, travail, amis. Tout en temps réel.',
      'Une vue unique avec toutes vos tâches. Ne ratez rien.',
      'Tout le monde sait quoi acheter. Sans oublis.',
    ],
    grupoLabel: 'Famille',
    demoTareas: ['Emmener Alex chez le médecin', 'Payer la facture', 'Appeler maman', 'Réunion 15h', 'Acheter du pain'],
    demoProductos: ['Lait entier', 'Fromage frais', 'Avocat', 'Tomate', 'Riz', 'Haricots'],
    demoAgenda: ['Alex médecin · Famille', 'Facture · Personnel', 'Réunion 15h · Travail', 'Maman · Famille'],
    demoNotif: 'Maman a marqué "Lait entier" comme acheté!',
    instalarBtn: 'Installer Syng sur mon appareil',
    instalarTitulo: 'Installer Syng',
    instalarIos: 'Dans Safari, appuyez sur Partager ↑ puis "Sur l\'écran d\'accueil"',
    instalarAndroid: 'Dans Chrome, appuyez sur ⋮ puis "Ajouter à l\'écran d\'accueil"',
    instalarOk: 'Compris',
  },
  de: {
    historia: 'Wir kauften ein Whiteboard für zu Hause. Ein Tag mit zu vielen Aufgaben war der Tropfen, der das Fass zum Überlaufen brachte. Syng entstand aus diesem echten Bedarf.',
    historiaLabel: 'Warum gibt es Syng?',
    tagline: 'Dein Leben organisiert,\nin Echtzeit.',
    sub: 'Vom physischen Whiteboard zu einer App, die deine Familie, dein Team und deine Welt verbindet.',
    mercadoLabel: 'Für wen ist Syng',
    mercado: ['Familien', 'Unternehmen', 'Behörden', 'Teams'],
    planes: [
      { nombre: 'Kostenlos', precio: '0€', desc: 'Zum Starten' },
      { nombre: 'Basis', precio: 'X€/Mo', desc: 'Mehr Gruppen', destacado: true },
      { nombre: 'Pro', precio: 'XX€/Mo', desc: 'Unbegrenzt' },
    ],
    cta: 'Kostenlos starten →',
    ctaSub: 'Keine Kreditkarte · Jederzeit kündigen',
    modBtns: ['Tafel', 'Mein Kalender', 'Einkaufsliste'],
    modDescs: [
      'Tagesaufgaben nach Gruppe. Familie, Arbeit, Freunde. Alles in Echtzeit.',
      'Eine Übersicht mit allen täglichen Aufgaben. Nichts verpassen.',
      'Alle wissen, was zu kaufen ist. Keine Mehrausgaben.',
    ],
    grupoLabel: 'Familie',
    demoTareas: ['Alex zum Arzt', 'Stromrechnung bezahlen', 'Mama anrufen', 'Meeting 15 Uhr', 'Brot kaufen'],
    demoProductos: ['Vollmilch', 'Frischkäse', 'Avocado', 'Tomate', 'Reis', 'Bohnen'],
    demoAgenda: ['Alex Arzt · Familie', 'Rechnung · Persönlich', 'Meeting 15h · Arbeit', 'Mama · Familie'],
    demoNotif: 'Mama hat "Vollmilch" als gekauft markiert!',
    instalarBtn: 'Syng auf meinem Gerät installieren',
    instalarTitulo: 'Syng installieren',
    instalarIos: 'In Safari, tippe auf Teilen ↑ und dann "Zum Home-Bildschirm"',
    instalarAndroid: 'In Chrome, tippe auf ⋮ und dann "Zum Startbildschirm hinzufügen"',
    instalarOk: 'Verstanden',
  },
  it: {
    historia: 'Abbiamo comprato una lavagna per casa. Un giorno con troppi impegni fu la goccia che fece traboccare il vaso. Syng è nato da questo bisogno reale.',
    historiaLabel: 'Perché esiste Syng?',
    tagline: 'La tua vita organizzata,\nin tempo reale.',
    sub: 'Dalla lavagna fisica di casa a un\'app che connette la tua famiglia, il tuo team e il tuo mondo.',
    mercadoLabel: 'Per chi è Syng',
    mercado: ['Famiglie', 'Aziende', 'Governo', 'Team di lavoro'],
    planes: [
      { nombre: 'Gratuito', precio: '0€', desc: 'Per iniziare' },
      { nombre: 'Base', precio: 'X€/mese', desc: 'Più gruppi', destacado: true },
      { nombre: 'Pro', precio: 'XX€/mese', desc: 'Illimitato' },
    ],
    cta: 'Inizia gratis →',
    ctaSub: 'Senza carta · Annulla quando vuoi',
    modBtns: ['Lavagna', 'La mia Agenda', 'Lista della spesa'],
    modDescs: [
      'Attività del giorno per gruppo. Famiglia, lavoro, amici. Tutto in tempo reale.',
      'Un\'unica vista con tutte le attività. Non perdere nulla.',
      'Tutti sanno cosa comprare. Senza dimenticare nulla.',
    ],
    grupoLabel: 'Famiglia',
    demoTareas: ['Portare Alex dal medico', 'Pagare la bolletta', 'Chiamare la mamma', 'Riunione 15:00', 'Comprare il pane'],
    demoProductos: ['Latte intero', 'Formaggio fresco', 'Avocado', 'Pomodoro', 'Riso', 'Fagioli'],
    demoAgenda: ['Alex medico · Famiglia', 'Bolletta · Personale', 'Riunione 15h · Lavoro', 'Mamma · Famiglia'],
    demoNotif: 'La mamma ha segnato "Latte intero" come acquistato!',
    instalarBtn: 'Installa Syng sul mio dispositivo',
    instalarTitulo: 'Installa Syng',
    instalarIos: 'In Safari, tocca Condividi ↑ e poi "Aggiungi alla schermata Home"',
    instalarAndroid: 'In Chrome, tocca ⋮ e poi "Aggiungi alla schermata Home"',
    instalarOk: 'Capito',
  },
  pt: {
    historia: 'Compramos um quadro branco para casa. Um dia com tarefas demais foi a gota d\'água — precisávamos de algo melhor. O Syng nasceu dessa necessidade real.',
    historiaLabel: 'Por que o Syng existe?',
    tagline: 'Sua vida organizada,\nem tempo real.',
    sub: 'Do quadro branco físico em casa a um app que conecta sua família, sua equipe e seu mundo.',
    mercadoLabel: 'Para quem é o Syng',
    mercado: ['Famílias', 'Empresas', 'Governo', 'Equipes de trabalho'],
    planes: [
      { nombre: 'Grátis', precio: 'R$0', desc: 'Para começar' },
      { nombre: 'Básico', precio: 'R$X/mês', desc: 'Mais grupos', destacado: true },
      { nombre: 'Pro', precio: 'R$XX/mês', desc: 'Ilimitado' },
    ],
    cta: 'Comece grátis →',
    ctaSub: 'Sem cartão · Cancele quando quiser',
    modBtns: ['Quadro', 'Minha Agenda', 'Lista de compras'],
    modDescs: [
      'Tarefas do dia por grupo. Família, trabalho, amigos. Tudo em tempo real.',
      'Uma única visão com todas as tarefas. Não perca nada.',
      'Todos sabem o que comprar. Sem esquecimentos.',
    ],
    grupoLabel: 'Família',
    demoTareas: ['Levar Alex ao médico', 'Pagar conta de luz', 'Ligar para a mamãe', 'Reunião 15h', 'Comprar pão'],
    demoProductos: ['Leite integral', 'Queijo fresco', 'Abacate', 'Tomate', 'Arroz', 'Feijão preto'],
    demoAgenda: ['Alex médico · Família', 'Conta · Pessoal', 'Reunião 15h · Trabalho', 'Mamãe · Família'],
    demoNotif: 'Mamãe marcou "Leite integral" como comprado!',
    instalarBtn: 'Instalar Syng no meu dispositivo',
    instalarTitulo: 'Instalar Syng',
    instalarIos: 'No Safari, toque em Compartilhar ↑ e depois "Adicionar à Tela de Início"',
    instalarAndroid: 'No Chrome, toque em ⋮ e depois "Adicionar à tela inicial"',
    instalarOk: 'Entendido',
  },
  ja: {
    historia: '家にホワイトボードを買いました。やることが多すぎた一日が決定打になり、もっと良いものが必要でした。Syngはその本物のニーズから生まれました。',
    historiaLabel: 'Syngはなぜ生まれたか',
    tagline: 'あなたの生活を整理、\nリアルタイムで。',
    sub: '家のホワイトボードから、家族・チーム・世界をつなぐアプリへ。',
    mercadoLabel: 'Syngは誰のためか',
    mercado: ['家族', '企業', '政府', 'チーム'],
    planes: [
      { nombre: '無料', precio: '¥0', desc: 'まず試す' },
      { nombre: 'ベーシック', precio: '¥X/月', desc: 'グループ追加', destacado: true },
      { nombre: 'プロ', precio: '¥XX/月', desc: '無制限' },
    ],
    cta: '無料で始める →',
    ctaSub: 'カード不要 · いつでもキャンセル可',
    modBtns: ['ボード', 'マイアジェンダ', '買い物リスト'],
    modDescs: [
      'グループ別の日課。家族、仕事、友人。すべてリアルタイムで。',
      '今日のすべてのタスクを一目で。何も見逃さない。',
      '全員が何を買うか知っている。忘れ物なし。',
    ],
    grupoLabel: '家族',
    demoTareas: ['Alexを病院に連れて行く', '電気代を払う', 'お母さんに電話', '仕事会議 15時', 'パンを買う'],
    demoProductos: ['全乳', 'フレッシュチーズ', 'アボカド', 'トマト', '米', '黒豆'],
    demoAgenda: ['Alex病院 · 家族', '電気代 · 個人', '会議15時 · 仕事', 'お母さん · 家族'],
    demoNotif: 'お母さんが「全乳」を購入済みにしました！',
    instalarBtn: 'Syngをデバイスにインストール',
    instalarTitulo: 'Syngをインストール',
    instalarIos: 'Safariで共有ボタン↑をタップし「ホーム画面に追加」を選択',
    instalarAndroid: 'Chromeで⋮をタップし「ホーム画面に追加」を選択',
    instalarOk: 'わかった',
  },
  zh: {
    historia: '我们在家买了一块白板。有一天待办事项太多，那就成了压垮骆驼的最后一根稻草。Syng就是从这个真实需求中诞生的。',
    historiaLabel: 'Syng为什么存在？',
    tagline: '您的生活井井有条，\n实时同步。',
    sub: '从家里的实体白板到连接您的家人、团队和世界的应用程序。',
    mercadoLabel: 'Syng适合谁',
    mercado: ['家庭', '企业', '政府', '工作团队'],
    planes: [
      { nombre: '免费', precio: '¥0', desc: '开始使用' },
      { nombre: '基础', precio: '¥X/月', desc: '更多群组', destacado: true },
      { nombre: '专业', precio: '¥XX/月', desc: '无限制' },
    ],
    cta: '免费开始 →',
    ctaSub: '无需信用卡 · 随时取消',
    modBtns: ['白板', '我的日程', '购物清单'],
    modDescs: [
      '按组分类的日常任务。家人、工作、朋友。全部实时同步。',
      '一目了然查看所有日常任务。不错过任何事情。',
      '每个人都知道要买什么。不遗漏。',
    ],
    grupoLabel: '家庭',
    demoTareas: ['带Alex去看医生', '缴纳电费', '给妈妈打电话', '下午3点会议', '买面包'],
    demoProductos: ['全脂牛奶', '新鲜奶酪', '牛油果', '西红柿', '大米', '黑豆'],
    demoAgenda: ['Alex看医生 · 家庭', '缴费 · 个人', '会议15时 · 工作', '妈妈 · 家庭'],
    demoNotif: '妈妈把"全脂牛奶"标记为已购买！',
    instalarBtn: '在我的设备上安装Syng',
    instalarTitulo: '安装Syng',
    instalarIos: '在Safari中，点击分享按钮↑，然后选择"添加到主屏幕"',
    instalarAndroid: '在Chrome中，点击⋮菜单，然后选择"添加到主屏幕"',
    instalarOk: '明白了',
  },
}

const LANG_MAP = {
  'es':'es','es-MX':'es','es-ES':'es','es-AR':'es','es-CO':'es','es-CL':'es',
  'en':'en','en-US':'en','en-GB':'en','en-AU':'en','en-CA':'en',
  'fr':'fr','fr-FR':'fr','fr-CA':'fr',
  'de':'de','de-DE':'de','de-AT':'de',
  'it':'it','it-IT':'it',
  'pt':'pt','pt-BR':'pt','pt-PT':'pt',
  'ja':'ja','ja-JP':'ja',
  'zh':'zh','zh-CN':'zh','zh-TW':'zh',
}

const COLORES = [
  { acento: '#534AB7', claro: '#EEF2FF', borde: '#C5BCE8', dot: '#534AB7' },
  { acento: '#0F6E56', claro: '#E6F7F2', borde: '#A8DDD0', dot: '#2ECC9A' },
  { acento: '#0891B2', claro: '#E0F7FA', borde: '#80DEEA', dot: '#0891B2' },
]

function detectarIdioma() {
  const lang = navigator.language || navigator.languages?.[0] || 'es'
  return LANG_MAP[lang] || LANG_MAP[lang.split('-')[0]] || 'es'
}

export default function PantallaDemo({ onEntrar }) {
  const [idioma] = useState(() => detectarIdioma())
  const tx = TEXTOS_DEMO[idioma] || TEXTOS_DEMO.es

  const [modulo, setModulo] = useState(0)
  const [items, setItems] = useState([])
  const [done, setDone] = useState([])
  const [notif, setNotif] = useState(false)
  const t1 = useRef(null)
  const t2 = useRef(null)

  // PWA install
  const [pwaPrompt, setPwaPrompt] = useState(null)
  const [pwaIos, setPwaIos] = useState(false)
  const [pwaInstalada, setPwaInstalada] = useState(false)
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false)

  useEffect(() => {
    const esStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (esStandalone) { setPwaInstalada(true); return }
    const esIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (esIos) { setPwaIos(true); return }
    const handler = (e) => { e.preventDefault(); setPwaPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setPwaInstalada(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const instalarPwa = async () => {
    if (pwaPrompt) {
      pwaPrompt.prompt()
      const r = await pwaPrompt.userChoice
      if (r.outcome === 'accepted') setPwaInstalada(true)
      setPwaPrompt(null)
    } else {
      setMostrarInstrucciones(true)
    }
  }

  function animar(mod) {
    clearTimeout(t1.current)
    clearTimeout(t2.current)
    setItems([])
    setDone([])
    setNotif(false)

    const lista = mod === 0 ? tx.demoTareas : mod === 1 ? tx.demoAgenda : tx.demoProductos
    let i = 0

    function agregar() {
      if (i < lista.length) {
        const idx = i
        setItems(prev => [...prev, lista[idx]])
        i++
        t1.current = setTimeout(agregar, 550)
      } else {
        let d = 0
        function marcar() {
          if (d < Math.min(3, lista.length)) {
            const idx = d
            setDone(prev => [...prev, lista[idx]])
            d++
            t1.current = setTimeout(marcar, 480)
          } else if (mod === 2) {
            t2.current = setTimeout(() => {
              setNotif(true)
              setTimeout(() => setNotif(false), 3000)
            }, 400)
          }
        }
        t1.current = setTimeout(marcar, 600)
      }
    }

    t1.current = setTimeout(agregar, 200)
  }

  useEffect(() => {
    animar(0)
    return () => { clearTimeout(t1.current); clearTimeout(t2.current) }
  }, [idioma])

  function cambiarModulo(i) {
    setModulo(i)
    animar(i)
  }

  const col = COLORES[modulo]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F5F7',
      fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
      color: '#1C1C2E',
    }}>
      <style>{`
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sd{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        .fi{animation:fi 0.3s ease}
      `}</style>

      {/* Notificación */}
      {notif && (
        <div style={{
          position: 'fixed', top: '16px', left: '16px', right: '16px',
          background: 'linear-gradient(135deg,#2ECC9A,#0F6E56)',
          borderRadius: '14px', padding: '13px 16px',
          fontSize: '13px', fontWeight: '600', color: 'white',
          zIndex: 999, display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          animation: 'sd 0.3s ease',
        }}>
          <span>🔔</span>{tx.demoNotif}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#534AB7,#185FA5)',
        padding: '48px 24px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '30px', fontWeight: '800', letterSpacing: '0.1em', color: 'white', marginBottom: '14px' }}>SYNG</div>
        <div style={{ fontSize: '24px', fontWeight: '800', color: 'white', lineHeight: 1.25, marginBottom: '10px', whiteSpace: 'pre-line' }}>{tx.tagline}</div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>{tx.sub}</div>
      </div>

      <div style={{ padding: '24px 16px 48px' }}>

        {/* Historia */}
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '18px 20px', marginBottom: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          borderLeft: '4px solid #534AB7',
        }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#534AB7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
            {tx.historiaLabel}
          </div>
          <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#444' }}>{tx.historia}</div>
        </div>

        {/* Botones de módulo */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {tx.modBtns.map((btn, i) => (
            <button key={i} onClick={() => cambiarModulo(i)} style={{
              flex: 1, padding: '10px 4px',
              background: modulo === i ? col.claro : 'white',
              border: modulo === i ? `2px solid ${col.acento}` : '1.5px solid #E5E5E5',
              borderRadius: '12px', color: modulo === i ? col.acento : '#888',
              fontSize: '11px', fontWeight: modulo === i ? '700' : '500',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: modulo === i ? `0 2px 8px ${col.acento}22` : 'none',
            }}>{btn}</button>
          ))}
        </div>

        {/* Descripción módulo */}
        <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.5, marginBottom: '12px', minHeight: '38px' }}>
          {tx.modDescs[modulo]}
        </div>

        {/* Demo box */}
        <div style={{
          background: 'white', borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          overflow: 'hidden', marginBottom: '24px',
          border: `1px solid ${col.borde}`,
        }}>
          <div style={{
            padding: '10px 16px', background: col.claro,
            borderBottom: `1px solid ${col.borde}`,
            fontSize: '12px', fontWeight: '700', color: col.acento,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.dot }} />
            {tx.modBtns[modulo]} · {tx.grupoLabel}
          </div>
          <div style={{ minHeight: '160px' }}>
            {items.map((item, i) => {
              const isDone = done.includes(item)
              return (
                <div key={i} className="fi" style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 16px',
                  borderBottom: '0.5px solid #F0F0F0',
                  background: isDone ? '#FAFAFA' : 'white',
                }}>
                  <div style={{
                    width: '20px', height: '20px',
                    borderRadius: modulo === 2 ? '5px' : '50%',
                    border: isDone ? 'none' : `1.5px solid ${col.borde}`,
                    background: isDone ? col.dot : 'white',
                    flexShrink: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '11px', color: 'white',
                  }}>{isDone ? '✓' : ''}</div>
                  <span style={{
                    fontSize: '14px',
                    color: isDone ? '#BBB' : '#1C1C2E',
                    textDecoration: isDone ? 'line-through' : 'none',
                    flex: 1,
                  }}>{item}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Para quién */}
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          {tx.mercadoLabel}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
          {tx.mercado.map((m, i) => (
            <div key={i} style={{
              background: 'white', border: '1.5px solid #E5E5E5',
              borderRadius: '20px', padding: '6px 16px',
              fontSize: '13px', fontWeight: '500', color: '#444',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>{m}</div>
          ))}
        </div>

        {/* Divisor */}
        <div style={{ height: '1px', background: '#EBEBEB', marginBottom: '24px' }} />

        {/* Planes */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          {tx.planes.map((p, i) => (
            <div key={i} onClick={onEntrar} style={{
              flex: 1, textAlign: 'center', cursor: 'pointer',
              background: p.destacado ? 'linear-gradient(135deg,#534AB7,#185FA5)' : 'white',
              border: p.destacado ? 'none' : '1.5px solid #E5E5E5',
              borderRadius: '14px', padding: '14px 8px',
              boxShadow: p.destacado ? '0 4px 16px rgba(83,74,183,0.3)' : '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: p.destacado ? 'rgba(255,255,255,0.7)' : '#999', textTransform: 'uppercase', marginBottom: '4px' }}>{p.nombre}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: p.destacado ? 'white' : '#1C1C2E', marginBottom: '3px' }}>{p.precio}</div>
              <div style={{ fontSize: '10px', color: p.destacado ? 'rgba(255,255,255,0.65)' : '#999' }}>{p.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', fontSize:'12px', color:'#888', marginBottom:'16px', fontStyle:'italic' }}>Comienza gratis hoy, desbloquea más cuando lo necesites</div>

        {/* CTA — sin tocar */}
        <button onClick={onEntrar} style={{
          width: '100%', padding: '18px',
          background: 'linear-gradient(135deg,#534AB7,#185FA5)',
          color: 'white', border: 'none', borderRadius: '16px',
          fontSize: '17px', fontWeight: '800', cursor: 'pointer',
          marginBottom: '8px',
          boxShadow: '0 6px 20px rgba(83,74,183,0.35)',
          letterSpacing: '-0.3px',
        }}>{tx.cta}</button>
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#AAA', marginBottom: '16px' }}>{tx.ctaSub}</div>

        {/* ── NUEVO: Botón instalar app ── */}
        {!pwaInstalada && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
              <div style={{ flex:1, height:'1px', background:'#E5E5E5' }} />
              <span style={{ color:'#AAA', fontSize:'13px' }}>o</span>
              <div style={{ flex:1, height:'1px', background:'#E5E5E5' }} />
            </div>
            <button onClick={instalarPwa} style={{
              width: '100%', padding: '16px',
              background: 'linear-gradient(135deg,#2A3A8C,#0F1540)',
              color: 'white', border: 'none', borderRadius: '16px',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: '0 4px 16px rgba(42,58,140,0.35)',
            }}>
              <svg width="22" height="22" viewBox="0 0 100 100">
                <rect width="100" height="100" rx="22" fill="rgba(255,255,255,0.15)"/>
                <text x="52" y="58" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="52" fontWeight="300" fill="white">4</text>
                <circle cx="52" cy="76" r="6" fill="#7B6EF6"/>
              </svg>
              {tx.instalarBtn}
            </button>
          </>
        )}

        {/* Modal instrucciones */}
        {mostrarInstrucciones && (
          <div onClick={() => setMostrarInstrucciones(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:500 }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'24px 24px 0 0', padding:'32px 24px 48px', width:'100%', maxWidth:'400px' }}>
              <div style={{ textAlign:'center', marginBottom:'24px' }}>
                <svg width="64" height="64" viewBox="0 0 100 100" style={{ marginBottom:'12px' }}>
                  <defs><linearGradient id="lgInst" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2A3A8C"/><stop offset="100%" stopColor="#0F1540"/></linearGradient></defs>
                  <rect width="100" height="100" rx="22" fill="url(#lgInst)"/>
                  <text x="52" y="58" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="52" fontWeight="300" fill="white">4</text>
                  <circle cx="52" cy="76" r="6" fill="#7B6EF6"/>
                </svg>
                <div style={{ fontSize:'18px', fontWeight:'700', color:'#1C1C2E', marginBottom:'10px' }}>{tx.instalarTitulo}</div>
                <div style={{ fontSize:'14px', color:'#666', lineHeight:'1.6' }}>
                  {pwaIos ? tx.instalarIos : tx.instalarAndroid}
                </div>
              </div>
              <button onClick={() => setMostrarInstrucciones(false)} style={{ width:'100%', padding:'15px', background:'linear-gradient(135deg,#534AB7,#185FA5)', border:'none', borderRadius:'14px', color:'white', fontSize:'15px', fontWeight:'600', cursor:'pointer' }}>
                {tx.instalarOk}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

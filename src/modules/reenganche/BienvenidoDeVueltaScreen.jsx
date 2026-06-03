import { useNavigate } from 'react-router-dom'

const mensajes = [
  {
    emoji: '☀️',
    titulo: 'Llevas unos días libre.',
    sub: 'Ya sabes cómo se siente cuando todo está en orden.',
    frase: 'Tener todo bajo control... nadie te lo quita.',
  },
  {
    emoji: '💪',
    titulo: 'Hay días para soltar.',
    sub: 'Y hay días para agarrar el control y decir: hoy sí.',
    frase: 'El que organiza su vida, disfruta más sus descansos.',
  },
  {
    emoji: '🌤️',
    titulo: 'Tu agenda te extraña.',
    sub: 'Sabes lo bien que se siente cuando todo fluye.',
    frase: 'Los que llegan lejos no son los más talentosos. Son los más constantes.',
  },
  {
    emoji: '🎯',
    titulo: 'Hoy puede ser ese día.',
    sub: 'El que después recuerdas como "fue cuando empecé a tomar las riendas".',
    frase: 'Hay personas que nacieron sin nada y llegaron a lo más alto. Su secreto: decidieron organizarse y no parar.',
  },
]

export function BienvenidoDeVueltaScreen() {
  const navigate = useNavigate()
  const msg = mensajes[Math.floor(Math.random() * mensajes.length)]

  return (
    <div style={screen}>
      <div style={card}>

        <div style={emojiWrap}>{msg.emoji}</div>
        <h1 style={titulo}>{msg.titulo}</h1>
        <p style={sub}>{msg.sub}</p>

        <div style={divider} />

        <div style={fraseWrap}>
          <p style={fraseText}>"{msg.frase}"</p>
          <p style={fraseSyng}>— Syng</p>
        </div>

        <div style={divider} />

        <button onClick={() => navigate('/agenda')} style={btnPrimary}>
          Vamos, organiza tu día
        </button>

        <button onClick={() => navigate('/')} style={btnSecondary}>
          Ahorita no
        </button>

      </div>
    </div>
  )
}

const screen      = { minHeight:'100svh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 20px', background:'linear-gradient(158deg, #F0F3FF 0%, #E8EDF8 100%)' }
const card        = { width:'100%', maxWidth:400, background:'rgba(255,255,255,0.92)', borderRadius:28, padding:'44px 28px 36px', boxShadow:'0 8px 40px rgba(13,18,64,0.10), 0 2px 8px rgba(13,18,64,0.06)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.75)', textAlign:'center' }
const emojiWrap   = { fontSize:64, marginBottom:20, lineHeight:1 }
const titulo      = { margin:'0 0 10px', fontSize:24, fontWeight:800, color:'#0D1240', letterSpacing:'-0.03em', lineHeight:1.25 }
const sub         = { margin:0, fontSize:15, color:'rgba(13,18,64,0.55)', lineHeight:1.65, fontWeight:400 }
const divider     = { height:1, background:'rgba(13,18,64,0.07)', margin:'24px 0' }
const fraseWrap   = { padding:'16px 20px', borderRadius:16, background:'rgba(45,58,140,0.04)', border:'1px solid rgba(45,58,140,0.07)' }
const fraseText   = { margin:'0 0 8px', fontSize:14, color:'rgba(13,18,64,0.55)', lineHeight:1.65, fontStyle:'italic' }
const fraseSyng   = { margin:0, fontSize:11, fontWeight:700, color:'rgba(45,58,140,0.40)', letterSpacing:'0.05em' }
const btnPrimary  = { display:'block', width:'100%', padding:'16px', borderRadius:16, border:'none', background:'linear-gradient(135deg,#3D4FA8,#2D3A8C)', color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', marginBottom:10, boxShadow:'0 4px 20px rgba(45,58,140,0.30)', WebkitTapHighlightColor:'transparent' }
const btnSecondary= { display:'block', width:'100%', padding:'14px', borderRadius:16, border:'1.5px solid rgba(13,18,64,0.10)', background:'transparent', color:'rgba(13,18,64,0.40)', fontSize:14, fontWeight:500, cursor:'pointer', WebkitTapHighlightColor:'transparent' }

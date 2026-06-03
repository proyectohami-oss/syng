import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCoreAuth } from '../../core/hooks/useCoreData'

function formatHora(dueTime) {
  if (!dueTime) return ''
  const [h, m] = dueTime.split(':').map(Number)
  const ap  = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2,'0')} ${ap}`
}

const frases = [
  'Las personas organizadas no nacen así — lo deciden cada día.',
  'Un paso a la vez. Hoy completaste uno.',
  'Tu futuro se construye en momentos como este.',
  'Organized people aren\'t born that way — they decide to be.',
  'Lo que se agenda, se logra.',
]

export function RecordatorioScreen() {
  const { taskId }  = useParams()
  const navigate    = useNavigate()
  const auth        = useCoreAuth()
  const uid         = auth?.user?.uid
  const [task,       setTask]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [completing, setCompleting] = useState(false)
  const [done,       setDone]       = useState(false)
  const frase = frases[Math.floor(Math.random() * frases.length)]

  useEffect(() => {
    if (!taskId) return
    getDoc(doc(db, 'tasks', taskId)).then(snap => {
      if (snap.exists()) setTask({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
  }, [taskId])

  async function handleComplete() {
    if (!task || !uid) return
    setCompleting(true)
    await updateDoc(doc(db, 'tasks', taskId), {
      status:      'completed',
      completedAt: serverTimestamp(),
      completedBy: uid,
      updatedAt:   serverTimestamp(),
    })
    setDone(true)
    setCompleting(false)
  }

  if (loading) return (
    <div style={screen}>
      <div style={card}>
        <p style={{ color:'rgba(13,18,64,0.4)', fontSize:14, textAlign:'center' }}>Cargando...</p>
      </div>
    </div>
  )

  if (!task) return (
    <div style={screen}>
      <div style={card}>
        <p style={{ color:'rgba(13,18,64,0.4)', fontSize:14, textAlign:'center', marginBottom:20 }}>Tarea no encontrada.</p>
        <button onClick={() => navigate('/agenda')} style={btnSecondary}>Ir a mi agenda</button>
      </div>
    </div>
  )

  const hora = formatHora(task.reminder?.dueTime)

  return (
    <div style={screen}>

      {/* Card principal */}
      <div style={card}>

        {/* Header */}
        <div style={header}>
          <div style={iconWrap}>🔔</div>
          <p style={label}>RECORDATORIO</p>
        </div>

        {/* Tarea */}
        <h1 style={titulo}>{task.title}</h1>

        {hora && (
          <p style={horaStyle}>Hoy · {hora}</p>
        )}

        {task.description ? (
          <p style={desc}>{task.description}</p>
        ) : null}

        <div style={divider} />

        {/* Acciones */}
        {done ? (
          <div style={completedWrap}>
            <div style={completedBadge}>✅ ¡Listo! Tarea completada</div>
            <p style={completedMsg}>Así se construye el éxito — un pendiente menos.</p>
          </div>
        ) : (
          <button onClick={handleComplete} disabled={completing} style={btnPrimary}>
            {completing ? 'Completando...' : '✅ Marcar como completada'}
          </button>
        )}

        <button onClick={() => navigate('/agenda')} style={btnSecondary}>
          📅 Ver mi día completo
        </button>

        {/* Frase */}
        <div style={fraseWrap}>
          <p style={fraseText}>"{frase}"</p>
          <p style={fraseSyng}>— Syng</p>
        </div>

      </div>
    </div>
  )
}

const screen       = { minHeight:'100svh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 20px', background:'linear-gradient(158deg, #F0F3FF 0%, #E8EDF8 100%)' }
const card         = { width:'100%', maxWidth:400, background:'rgba(255,255,255,0.92)', borderRadius:28, padding:'36px 28px 32px', boxShadow:'0 8px 40px rgba(13,18,64,0.10), 0 2px 8px rgba(13,18,64,0.06)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.75)' }
const header       = { display:'flex', flexDirection:'column', alignItems:'center', marginBottom:20 }
const iconWrap     = { fontSize:44, marginBottom:10, filter:'drop-shadow(0 4px 12px rgba(45,58,140,0.18))' }
const label        = { margin:0, fontSize:11, fontWeight:700, color:'rgba(13,18,64,0.35)', letterSpacing:'0.1em' }
const titulo       = { margin:'0 0 6px', fontSize:22, fontWeight:700, color:'#0D1240', letterSpacing:'-0.02em', lineHeight:1.35, textAlign:'center' }
const horaStyle    = { margin:'0 0 16px', fontSize:14, color:'rgba(13,18,64,0.45)', fontWeight:500, textAlign:'center' }
const desc         = { margin:'0 0 16px', fontSize:14, color:'rgba(13,18,64,0.55)', lineHeight:1.6, textAlign:'center' }
const divider      = { height:1, background:'rgba(13,18,64,0.07)', margin:'0 0 20px' }
const btnPrimary   = { display:'block', width:'100%', padding:'15px', borderRadius:16, border:'none', background:'linear-gradient(135deg,#3D4FA8,#2D3A8C)', color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', marginBottom:10, boxShadow:'0 4px 16px rgba(45,58,140,0.25)', WebkitTapHighlightColor:'transparent' }
const btnSecondary = { display:'block', width:'100%', padding:'14px', borderRadius:16, border:'1.5px solid rgba(13,18,64,0.10)', background:'rgba(255,255,255,0.8)', color:'rgba(13,18,64,0.55)', fontSize:14, fontWeight:500, cursor:'pointer', WebkitTapHighlightColor:'transparent' }
const completedWrap  = { marginBottom:10 }
const completedBadge = { display:'block', width:'100%', padding:'14px', borderRadius:16, background:'rgba(220,252,231,0.9)', color:'#166534', fontSize:15, fontWeight:600, textAlign:'center', marginBottom:8, border:'1px solid rgba(34,197,94,0.2)' }
const completedMsg   = { margin:0, fontSize:13, color:'rgba(13,18,64,0.45)', textAlign:'center', fontStyle:'italic' }
const fraseWrap    = { marginTop:24, padding:'16px 20px', borderRadius:16, background:'rgba(45,58,140,0.04)', border:'1px solid rgba(45,58,140,0.07)' }
const fraseText    = { margin:'0 0 6px', fontSize:13, color:'rgba(13,18,64,0.50)', lineHeight:1.6, fontStyle:'italic', textAlign:'center' }
const fraseSyng    = { margin:0, fontSize:11, fontWeight:700, color:'rgba(45,58,140,0.40)', textAlign:'center', letterSpacing:'0.05em' }

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCoreAuth } from '../../core/hooks/useCoreData'

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function hoy() {
  const d = new Date()
  return `${d.getDate()} de ${MESES[d.getMonth()]}`
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

export function ResumenDiarioScreen() {
  const navigate = useNavigate()
  const auth     = useCoreAuth()
  const uid      = auth?.user?.uid
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const now      = new Date()
    const dayStart = new Date(now); dayStart.setHours(0,0,0,0)
    const dayEnd   = new Date(now); dayEnd.setHours(23,59,59,999)

    getDocs(query(
      collection(db, 'tasks'),
      where('ownerId',   '==', uid),
      where('status',    '==', 'pending'),
      where('isDeleted', '==', false),
      where('dueDate',   '>=', Timestamp.fromDate(dayStart)),
      where('dueDate',   '<=', Timestamp.fromDate(dayEnd)),
    )).then(snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [uid])

  const n = tasks.length

  return (
    <div style={screen}>
      <div style={card}>

        <div style={header}>
          <div style={iconWrap}>📋</div>
          <p style={labelStyle}>TU DÍA EN SYNG</p>
          <p style={fechaStyle}>{hoy()}</p>
        </div>

        {!loading && (
          <div style={conteoWrap}>
            <span style={conteoNum}>{n}</span>
            <span style={conteoLabel}>{n === 1 ? 'tarea pendiente' : 'tareas pendientes'}</span>
          </div>
        )}

        <div style={divider} />

        {loading ? (
          <p style={muted}>Cargando tu día...</p>
        ) : tasks.length === 0 ? (
          <p style={muted}>No tienes tareas pendientes hoy. 🎉</p>
        ) : (
          <div style={{ marginBottom:20 }}>
            {tasks.map(t => (
              <div key={t.id} style={taskRow}>
                <div style={taskCircle} />
                <p style={taskTitle}>{t.title}</p>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => navigate(`/agenda/${toDateKey(new Date())}`)} style={btnPrimary}>
          📅 Organizar mi día
        </button>

        <button onClick={() => navigate('/')} style={btnSecondary}>
          Cerrar
        </button>

        <div style={fraseWrap}>
          <p style={fraseText}>"Lo que se agenda, se logra. Hoy tienes {n} oportunidad{n !== 1 ? 'es' : ''} de avanzar."</p>
          <p style={fraseSyng}>— Syng</p>
        </div>

      </div>
    </div>
  )
}

const screen      = { minHeight:'100svh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 20px', background:'linear-gradient(158deg, #F0F3FF 0%, #E8EDF8 100%)' }
const card        = { width:'100%', maxWidth:400, background:'rgba(255,255,255,0.92)', borderRadius:28, padding:'36px 28px 32px', boxShadow:'0 8px 40px rgba(13,18,64,0.10), 0 2px 8px rgba(13,18,64,0.06)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.75)' }
const header      = { display:'flex', flexDirection:'column', alignItems:'center', marginBottom:20 }
const iconWrap    = { fontSize:44, marginBottom:10, filter:'drop-shadow(0 4px 12px rgba(45,58,140,0.18))' }
const labelStyle  = { margin:0, fontSize:11, fontWeight:700, color:'rgba(13,18,64,0.35)', letterSpacing:'0.1em' }
const fechaStyle  = { margin:'4px 0 0', fontSize:16, fontWeight:600, color:'#0D1240' }
const conteoWrap  = { display:'flex', alignItems:'baseline', gap:8, justifyContent:'center', marginBottom:20 }
const conteoNum   = { fontSize:48, fontWeight:800, color:'#2D3A8C', lineHeight:1, letterSpacing:'-0.04em' }
const conteoLabel = { fontSize:16, color:'rgba(13,18,64,0.50)', fontWeight:500 }
const divider     = { height:1, background:'rgba(13,18,64,0.07)', margin:'0 0 20px' }
const taskRow     = { display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(13,18,64,0.05)' }
const taskCircle  = { width:8, height:8, borderRadius:'50%', background:'#2D3A8C', flexShrink:0 }
const taskTitle   = { margin:0, fontSize:14, color:'#0D1240', fontWeight:500, lineHeight:1.4 }
const muted       = { margin:'0 0 20px', fontSize:14, color:'rgba(13,18,64,0.45)', textAlign:'center' }
const btnPrimary  = { display:'block', width:'100%', padding:'15px', borderRadius:16, border:'none', background:'linear-gradient(135deg,#3D4FA8,#2D3A8C)', color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', marginBottom:10, boxShadow:'0 4px 16px rgba(45,58,140,0.25)', WebkitTapHighlightColor:'transparent' }
const btnSecondary= { display:'block', width:'100%', padding:'14px', borderRadius:16, border:'1.5px solid rgba(13,18,64,0.10)', background:'rgba(255,255,255,0.8)', color:'rgba(13,18,64,0.55)', fontSize:14, fontWeight:500, cursor:'pointer', WebkitTapHighlightColor:'transparent' }
const fraseWrap   = { marginTop:24, padding:'16px 20px', borderRadius:16, background:'rgba(45,58,140,0.04)', border:'1px solid rgba(45,58,140,0.07)' }
const fraseText   = { margin:'0 0 6px', fontSize:13, color:'rgba(13,18,64,0.50)', lineHeight:1.6, fontStyle:'italic', textAlign:'center' }
const fraseSyng   = { margin:0, fontSize:11, fontWeight:700, color:'rgba(45,58,140,0.40)', textAlign:'center', letterSpacing:'0.05em' }

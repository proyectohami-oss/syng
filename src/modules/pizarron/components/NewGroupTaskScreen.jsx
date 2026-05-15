import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate }      from 'react-router-dom'
import { Timestamp }                   from 'firebase/firestore'
import { useTasks }                    from '../../../core/hooks/useTasks'
import { usePizarronView }             from '../hooks/usePizarronView'
import { RepeatDayPicker }             from '../../../shared/RepeatDayPicker'

const MESES = ['enero','febrero','marzo','abril','mayo','junio',
               'julio','agosto','septiembre','octubre','noviembre','diciembre']

function labelFecha(ds) {
  if (!ds) return 'Elegir fecha'
  const [y,m,d] = ds.split('-').map(Number)
  return `${d} de ${MESES[m-1]} de ${y}`
}

export function NewGroupTaskScreen() {
  const { id: groupId } = useParams()
  const navigate        = useNavigate()
  const { createTask }  = useTasks()
  const { group }       = usePizarronView(groupId)
  const inputRef        = useRef(null)

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const [title,      setTitle]      = useState('')
  const [dateStr,    setDateStr]    = useState(todayStr)
  const [showDate,   setShowDate]   = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)
  const [repeatDays, setRepeatDays] = useState(new Set())

  const puedeGuardar = !!title.trim()

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  function handleSave() {
    if (!title.trim()) return
    const dueDate = dateStr
      ? Timestamp.fromDate(new Date(dateStr + 'T23:59:59'))
      : null
    navigate(-1)
    if (repeatDays.size > 0) {
      Array.from(repeatDays).sort().forEach(day => {
        createTask({ title: title.trim(), type:'group', groupId, dueDate: Timestamp.fromDate(new Date(day + 'T23:59:59')) }).catch(console.error)
      })
    } else {
      createTask({ title: title.trim(), type:'group', groupId, dueDate }).catch(console.error)
    }
  }

  return (
    <div style={screen}>

      {/* Header */}
      <div style={header}>
        <button onClick={() => navigate(-1)} style={btnBack}>Cancelar</button>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <span style={{ fontSize:15, fontWeight:600, color:'#111' }}>Nueva tarea</span>
          {group && <span style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{group.name}</span>}
        </div>
        <button
          onClick={handleSave}
          disabled={!puedeGuardar}
          style={{ background:'none', border:'none', fontSize:16, fontWeight:600, cursor: puedeGuardar ? 'pointer' : 'default', color: puedeGuardar ? '#5B3DF6' : '#c4b5fd', padding:'0 4px' }}
        >
          {repeatDays.size > 0 ? `Crear ${repeatDays.size}` : 'Crear'}
        </button>
      </div>

      {/* Contenido */}
      <div style={body}>
        <textarea
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="¿Qué quieren hacer?"
          rows={3}
          style={textArea}
        />

        {/* Fecha */}
        <div style={row} onClick={() => setShowDate(v=>!v)}>
          <span>📅</span>
          <span style={rLbl}>Fecha</span>
          <span style={rVal}>{labelFecha(dateStr)}</span>
          <span style={arr}>›</span>
        </div>
        {showDate && (
          <input
            type="date" value={dateStr}
            onChange={e => { setDateStr(e.target.value); setShowDate(false) }}
            style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:16, marginBottom:8, fontFamily:'inherit' }}
          />
        )}

        {/* Repetir */}
        <div style={row} onClick={() => setShowRepeat(true)}>
          <span>🔁</span>
          <span style={rLbl}>Repetir</span>
          <span style={{ ...rVal, color: repeatDays.size > 0 ? '#5B3DF6' : '#6b7280' }}>
            {repeatDays.size === 0 ? 'No repetir' : `${repeatDays.size} día${repeatDays.size !== 1 ? 's' : ''} seleccionado${repeatDays.size !== 1 ? 's' : ''}`}
          </span>
          <span style={arr}>›</span>
        </div>
      </div>

      {showRepeat && (
        <RepeatDayPicker
          selectedDays={repeatDays}
          onChange={days => setRepeatDays(days)}
          onClose={() => setShowRepeat(false)}
        />
      )}
    </div>
  )
}

const screen   = { display:'flex', flexDirection:'column', flex:1, minHeight:0, background:'#fff' }
const header   = { flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #f3f4f6' }
const btnBack  = { background:'none', border:'none', fontSize:16, color:'#6b7280', cursor:'pointer', padding:'0 4px' }
const body     = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'16px 20px' }
const textArea = { width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:16, color:'#111', fontFamily:'inherit', resize:'none', outline:'none', marginBottom:14 }
const row      = { display:'flex', alignItems:'center', gap:10, padding:'13px 0', borderBottom:'1px solid #f3f4f6', cursor:'pointer' }
const rLbl     = { fontSize:14, color:'#111', flex:1 }
const rVal     = { fontSize:14, color:'#6b7280' }
const arr      = { fontSize:16, color:'#d1d5db' }

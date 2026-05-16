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

function toDateStr(dueDate) {
  if (!dueDate) return ''
  const d = dueDate.toDate ? dueDate.toDate() : new Date(dueDate)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function NewGroupTaskScreen() {
  const { id: groupId, date, taskId } = useParams()
  const navigate       = useNavigate()
  const { createTask, updateTask } = useTasks()
  const { group, tasks }           = usePizarronView(groupId)
  const inputRef = useRef(null)

  const isEdit = !!taskId
  const task   = isEdit ? tasks.find(t => t.id === taskId) : null

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const [title,      setTitle]      = useState('')
  const [dateStr,    setDateStr]    = useState(date ?? todayStr)
  const [showDate,   setShowDate]   = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)
  const [repeatDays, setRepeatDays] = useState(new Set())
  const [ready,      setReady]      = useState(!isEdit)

  // Precargar datos en modo edición
  useEffect(() => {
    if (isEdit && task) {
      setTitle(task.title ?? '')
      setDateStr(toDateStr(task.dueDate) || todayStr)
      setReady(true)
    }
  }, [task?.id])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [ready])

  const puedeGuardar = !!title.trim()

  function handleSave() {
    if (!title.trim()) return
    const dueDate = dateStr
      ? Timestamp.fromDate(new Date(dateStr + 'T23:59:59'))
      : null
    navigate(-1)

    if (isEdit && task) {
      updateTask(task, { title: title.trim(), dueDate }).catch(console.error)
    } else if (repeatDays.size > 0) {
      Array.from(repeatDays).sort().forEach(day => {
        createTask({ title: title.trim(), type:'group', groupId, dueDate: Timestamp.fromDate(new Date(day + 'T23:59:59')) }).catch(console.error)
      })
    } else {
      createTask({ title: title.trim(), type:'group', groupId, dueDate }).catch(console.error)
    }
  }

  if (isEdit && !ready) {
    return (
      <div style={{ display:'flex', flex:1, alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:24, height:24, borderRadius:'50%', border:'3px solid #e5e7eb', borderTopColor:'#5B3DF6', animation:'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={screen}>
      <div style={header}>
        <button onClick={() => navigate(-1)} style={btnBack}>Cancelar</button>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <span style={{ fontSize:15, fontWeight:600, color:'#111' }}>
            {isEdit ? 'Editar tarea' : 'Nueva tarea'}
          </span>
          {group && <span style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{group.name}</span>}
        </div>
        <button
          onClick={handleSave}
          disabled={!puedeGuardar}
          style={{ background:'none', border:'none', fontSize:16, fontWeight:600, cursor: puedeGuardar ? 'pointer' : 'default', color: puedeGuardar ? '#5B3DF6' : '#c4b5fd', padding:'0 4px' }}
        >
          {isEdit ? 'Guardar' : repeatDays.size > 0 ? `Crear ${repeatDays.size}` : 'Crear'}
        </button>
      </div>

      <div style={body}>
        <textarea
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="¿Qué quieren hacer?"
          rows={3}
          style={textArea}
        />

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

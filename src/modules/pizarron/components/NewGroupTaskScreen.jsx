import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate }      from 'react-router-dom'
import { Timestamp }                   from 'firebase/firestore'
import { useTasks }                    from '../../../core/hooks/useTasks'
import { usePizarronView }             from '../hooks/usePizarronView'
import { useCoreState }                from '../../../core/hooks/useCoreData'
import { RepeatDayPicker }             from '../../../shared/RepeatDayPicker'
import { ReminderPicker }              from '../../../shared/ReminderPicker'

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
  const state                      = useCoreState()
  const groups                     = Array.from(state.groups.list.values())
  const inputRef = useRef(null)

  const isEdit = !!taskId
  const task   = isEdit ? tasks.find(t => t.id === taskId) : null

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const [title,         setTitle]         = useState('')
  const [dateStr,       setDateStr]       = useState(date ?? todayStr)
  const [showDate,      setShowDate]      = useState(false)
  const [showRepeat,    setShowRepeat]    = useState(false)
  const [repeatDays,    setRepeatDays]    = useState(new Set())
  const [ready,         setReady]         = useState(!isEdit)
  const [reminder,      setReminder]      = useState(null)
  const [showReminder,  setShowReminder]  = useState(false)
  const [targetGroupId, setTargetGroupId] = useState(groupId)
  const [showGroup,     setShowGroup]     = useState(false)

  useEffect(() => {
    if (isEdit && task) {
      setTitle(task.title ?? '')
      setDateStr(toDateStr(task.dueDate) || todayStr)
      if (task.reminder) setReminder(task.reminder)
      setTargetGroupId(task.groupId || groupId)
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

    const finalGroupId = isEdit ? targetGroupId : groupId
    if (isEdit && task) {
      updateTask(task, { title: title.trim(), dueDate, reminder: reminder ?? null, groupId: finalGroupId, type: finalGroupId ? 'group' : 'personal' }).catch(console.error)
      if (repeatDays.size > 0) {
        Array.from(repeatDays).sort().forEach(day => {
          createTask({ title: title.trim(), type:'group', groupId, dueDate: Timestamp.fromDate(new Date(day + 'T23:59:59')) }).catch(console.error)
        })
      }
    } else if (repeatDays.size > 0) {
      Array.from(repeatDays).sort().forEach(day => {
        createTask({ title: title.trim(), type:'group', groupId, dueDate: Timestamp.fromDate(new Date(day + 'T23:59:59')) }).catch(console.error)
      })
    } else {
      createTask({ title: title.trim(), type:'group', groupId, dueDate, reminder: reminder ?? null }).catch(console.error)
    }
  }

  if (isEdit && !ready) {
    return (
      <div style={{ display:'flex', flex:1, alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:24, height:24, borderRadius:'50%', border:'3px solid rgba(13,18,64,0.10)', borderTopColor:'#2D3A8C', animation:'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={screen}>

      {/* Header */}
      <div style={header}>
        <button onClick={() => navigate(-1)} style={btnBack}>Cancelar</button>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <span style={{ fontSize:15, fontWeight:600, color:'#0D1240', letterSpacing:'-0.01em' }}>
            {isEdit ? 'Editar tarea' : 'Nueva tarea'}
          </span>
          {group && <span style={{ fontSize:11, color:'rgba(13,18,64,0.38)', marginTop:1 }}>{group.name}</span>}
        </div>
        <button
          onClick={handleSave}
          disabled={!puedeGuardar}
          style={{
            background:'none', border:'none', fontSize:16, fontWeight:600,
            cursor: puedeGuardar ? 'pointer' : 'default',
            color: puedeGuardar ? '#2D3A8C' : 'rgba(45,58,140,0.28)',
            padding:'0 4px',
            transition:'color 0.15s',
          }}
        >
          {isEdit ? 'Guardar' : repeatDays.size > 0 ? `Crear ${repeatDays.size}` : 'Crear'}
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

        {isEdit && (
          <>
            <div style={row} onClick={() => setShowGroup(v=>!v)}>
              <span>👥</span>
              <span style={rLbl}>Grupo</span>
              <span style={{ ...rVal, color:'rgba(13,18,64,0.55)' }}>{groups.find(g => g.id === targetGroupId)?.name || 'Personal'}</span>
              <span style={arr}>›</span>
            </div>
            {showGroup && (
              <div style={picker}>
                {groups.map(g => (
                  <div key={g.id}
                    onClick={() => { setTargetGroupId(g.id); setShowGroup(false) }}
                    style={opt(targetGroupId === g.id)}>
                    {g.name}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

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
            style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:12, border:'1.5px solid rgba(13,18,64,0.10)', fontSize:16, marginBottom:8, fontFamily:'inherit', background:'rgba(255,255,255,0.80)', outline:'none', color:'#0D1240' }}
          />
        )}

        <div style={row} onClick={() => setShowReminder(true)}>
          <span>🔔</span>
          <span style={rLbl}>Recordatorio</span>
          <span style={{ ...rVal, color: reminder ? '#2D3A8C' : 'rgba(13,18,64,0.40)' }}>
            {reminder
              ? (reminder.dueTime
                  ? (() => { const [h,m]=reminder.dueTime.split(':').map(Number); const ap=h>=12?'PM':'AM'; const h12=h%12||12; return `${h12}:${String(m).padStart(2,'0')} ${ap} • ${reminder.label}` })()
                  : reminder.label)
              : 'Sin recordatorio'}
          </span>
          <span style={arr}>›</span>
        </div>

        <div style={row} onClick={() => setShowRepeat(true)}>
          <span>🔁</span>
          <span style={rLbl}>Repetir</span>
          <span style={{ ...rVal, color: repeatDays.size > 0 ? '#2D3A8C' : 'rgba(13,18,64,0.40)' }}>
            {repeatDays.size === 0 ? 'No repetir' : `${repeatDays.size} día${repeatDays.size !== 1 ? 's' : ''} seleccionado${repeatDays.size !== 1 ? 's' : ''}`}
          </span>
          <span style={arr}>›</span>
        </div>
      </div>

      {showReminder && (
        <ReminderPicker
          dateStr={dateStr}
          reminder={reminder}
          onChange={r => setReminder(r)}
          onClose={() => setShowReminder(false)}
        />
      )}

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

const screen   = { display:'flex', flexDirection:'column', flex:1, minHeight:0, background:'transparent' }
const header   = { flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid rgba(13,18,64,0.07)', background:'transparent' }
const btnBack  = { background:'none', border:'none', fontSize:16, color:'rgba(13,18,64,0.40)', cursor:'pointer', padding:'0 4px' }
const body     = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'16px 20px' }
const textArea = { width:'100%', boxSizing:'border-box', padding:'11px 14px', borderRadius:12, border:'1.5px solid rgba(13,18,64,0.10)', fontSize:16, color:'#0D1240', fontFamily:'inherit', resize:'none', outline:'none', marginBottom:14, background:'rgba(255,255,255,0.80)', boxShadow:'inset 0 1px 3px rgba(13,18,64,0.04)', lineHeight:1.5 }
const row      = { display:'flex', alignItems:'center', gap:10, padding:'13px 0', borderBottom:'1px solid rgba(13,18,64,0.07)', cursor:'pointer' }
const rLbl     = { fontSize:14, color:'#0D1240', flex:1 }
const rVal     = { fontSize:14, color:'rgba(13,18,64,0.40)' }
const arr      = { fontSize:16, color:'rgba(13,18,64,0.20)' }
const picker   = { background:'rgba(255,255,255,0.80)', borderRadius:12, overflow:'hidden', marginBottom:4, border:'1px solid rgba(13,18,64,0.08)' }
const opt      = sel => ({ padding:'11px 16px', fontSize:14, cursor:'pointer', borderBottom:'1px solid rgba(13,18,64,0.06)', color: sel ? '#2D3A8C' : '#0D1240', fontWeight: sel ? 600 : 400, background: sel ? 'rgba(45,58,140,0.08)' : 'transparent' })

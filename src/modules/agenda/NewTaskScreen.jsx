import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate }               from 'react-router-dom'
import { Timestamp }                            from 'firebase/firestore'
import { useTasks }                             from '../../core/hooks/useTasks'
import { useCoreState }                         from '../../core/hooks/useCoreData'
import { RepeatDayPicker }                      from '../../shared/RepeatDayPicker'
import { ReminderPicker }                       from '../../shared/ReminderPicker'

const MESES = ['enero','febrero','marzo','abril','mayo','junio',
               'julio','agosto','septiembre','octubre','noviembre','diciembre']

function labelFecha(ds) {
  if (!ds) return 'Elegir fecha'
  const [y,m,d] = ds.split('-').map(Number)
  return `${d} de ${MESES[m-1]} de ${y}`
}

export function NewTaskScreen() {
  const { date }  = useParams()
  const navigate  = useNavigate()
  const { createTask } = useTasks()
  const state     = useCoreState()
  const inputRef  = useRef(null)

  const groups = useMemo(() => Array.from(state.groups.list.values()), [state.groups.list])

  const [title,       setTitle]       = useState('')
  const [groupId,     setGroupId]     = useState('')
  const [dateStr,     setDateStr]     = useState(date ?? '')
  const [showGroup,   setShowGroup]   = useState(false)
  const [showDate,    setShowDate]    = useState(false)
  const [showRepeat,  setShowRepeat]  = useState(false)
  const [repeatDays,  setRepeatDays]  = useState(new Set())
  const [reminder,    setReminder]    = useState(null)
  const [showReminder,setShowReminder]= useState(false)

  const grupoLabel  = groups.find(g => g.id === groupId)?.name ?? 'Personal'
  const puedeGuardar = !!title.trim()

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  function handleSave() {
    if (!title.trim()) return
    const type = groupId ? 'group' : 'personal'
    const gId  = groupId || null
    const dueDate = dateStr
      ? Timestamp.fromDate(new Date(dateStr + 'T23:59:59'))
      : null
    navigate(-1)
    if (repeatDays.size > 0) {
      Array.from(repeatDays).sort().forEach(day => {
        createTask({ title: title.trim(), type, groupId: gId, dueDate: Timestamp.fromDate(new Date(day + 'T23:59:59')), reminder: reminder ?? null }).catch(console.error)
      })
    } else {
      createTask({ title: title.trim(), type, groupId: gId, dueDate, reminder: reminder ?? null }).catch(console.error)
    }
  }

  return (
    <div style={screen}>

      {/* Header */}
      <div style={header}>
        <button onClick={() => navigate(-1)} style={btnBack}>Cancelar</button>
        <span style={{ fontSize:16, fontWeight:600, color:'#0D1240', letterSpacing:'-0.01em' }}>Nueva tarea</span>
        <button
          onClick={handleSave}
          disabled={!puedeGuardar}
          style={{
            background: 'none', border: 'none', fontSize: 16, fontWeight: 600,
            cursor: puedeGuardar ? 'pointer' : 'default',
            color: puedeGuardar ? '#2D3A8C' : 'rgba(45,58,140,0.30)',
            padding: '0 4px',
            transition: 'color 0.15s',
          }}
        >
          {repeatDays.size > 0 ? `Crear ${repeatDays.size} tarea${repeatDays.size !== 1 ? 's' : ''}` : 'Crear tarea'}
        </button>
      </div>

      {/* Contenido */}
      <div style={body}>
        <textarea
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="¿Qué quieres hacer?"
          rows={3}
          style={textArea}
        />

        {/* Grupo */}
        <div style={row} onClick={() => { setShowGroup(v=>!v); setShowDate(false) }}>
          <span>👥</span>
          <span style={rLbl}>Grupo</span>
          <span style={rVal}>{grupoLabel}</span>
          <span style={arr}>›</span>
        </div>
        {showGroup && (
          <div style={picker}>
            <div style={opt(groupId === '')} onClick={() => { setGroupId(''); setShowGroup(false) }}>Personal</div>
            {groups.map(g => (
              <div key={g.id} style={opt(groupId === g.id)} onClick={() => { setGroupId(g.id); setShowGroup(false) }}>{g.name}</div>
            ))}
          </div>
        )}

        {/* Fecha */}
        <div style={row} onClick={() => { setShowDate(v=>!v); setShowGroup(false) }}>
          <span>📅</span>
          <span style={rLbl}>Fecha</span>
          <span style={rVal}>{labelFecha(dateStr)}</span>
          <span style={arr}>›</span>
        </div>
        {showDate && (
          <input
            type="date" value={dateStr}
            onChange={e => { setDateStr(e.target.value); setShowDate(false) }}
            style={{
              width:'100%', boxSizing:'border-box',
              padding:'10px 14px', borderRadius:12,
              border:'1.5px solid rgba(13,18,64,0.12)',
              fontSize:16, marginBottom:8, fontFamily:'inherit',
              color:'#0D1240', background:'#FAFBFE',
              outline:'none',
            }}
          />
        )}

        {/* Recordatorio */}
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

        {/* Repetir */}
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
const header   = {
  flexShrink: 0, display:'flex', alignItems:'center', justifyContent:'space-between',
  padding:'14px 20px',
  borderBottom:'1px solid rgba(13,18,64,0.07)',
  background:'transparent',
}
const btnBack  = {
  background:'none', border:'none', fontSize:16,
  color:'rgba(13,18,64,0.40)', cursor:'pointer', padding:'0 4px',
}
const body     = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'16px 20px' }
const textArea = {
  width:'100%', boxSizing:'border-box',
  padding:'12px 14px', borderRadius:14,
  border:'1.5px solid rgba(13,18,64,0.10)',
  fontSize:16, color:'#0D1240', fontFamily:'inherit',
  resize:'none', outline:'none', marginBottom:14,
  background:'rgba(255,255,255,0.80)',
  boxShadow:'inset 0 1px 3px rgba(13,18,64,0.04)',
  lineHeight:1.5,
}
const row    = { display:'flex', alignItems:'center', gap:10, padding:'13px 0', borderBottom:'1px solid rgba(13,18,64,0.06)', cursor:'pointer' }
const rLbl   = { fontSize:14, color:'#0D1240', flex:1, fontWeight:400 }
const rVal   = { fontSize:14, color:'rgba(13,18,64,0.40)' }
const arr    = { fontSize:16, color:'rgba(13,18,64,0.20)' }
const picker = { background:'rgba(255,255,255,0.80)', borderRadius:12, overflow:'hidden', marginBottom:4, border:'1px solid rgba(13,18,64,0.08)' }
const opt    = sel => ({
  padding:'11px 16px', fontSize:14, cursor:'pointer',
  borderBottom:'1px solid rgba(13,18,64,0.06)',
  color:      sel ? '#2D3A8C' : '#0D1240',
  fontWeight: sel ? 600 : 400,
  background: sel ? 'rgba(45,58,140,0.08)' : 'transparent',
})

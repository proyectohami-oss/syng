/**
 * TaskFormNew — formulario de tarea.
 * Estructura: header fijo + contenido scrollable + footer fijo
 */
import { useState, useMemo, useEffect } from 'react'
import { useKeyboardOffset } from '../pwa/useKeyboardOffset'
import { Timestamp }         from 'firebase/firestore'
import { useTasks }          from '../core/hooks/useTasks'
import { useCoreState }      from '../core/hooks/useCoreData'
import { RepeatDayPicker }   from './RepeatDayPicker'
import { ReminderPicker }    from './ReminderPicker'

const MESES = ['enero','febrero','marzo','abril','mayo','junio',
               'julio','agosto','septiembre','octubre','noviembre','diciembre']

function labelFecha(ds) {
  if (!ds) return 'Elegir fecha'
  const [y,m,d] = ds.split('-').map(Number)
  return `${d} de ${MESES[m-1]} de ${y}`
}

function labelRepetir(days) {
  if (!days || days.size === 0) return 'No repetir'
  return `${days.size} día${days.size !== 1 ? 's' : ''} seleccionado${days.size !== 1 ? 's' : ''}`
}

export function TaskFormNew({ task, defaultDate, onClose }) {
  const { createTask, updateTask } = useTasks()
  const state  = useCoreState()
  const isEdit = !!task

  const groups = useMemo(
    () => Array.from(state.groups.list.values()),
    [state.groups.list]
  )

  const [title,      setTitle]      = useState(task?.title   ?? '')
  const [groupId,    setGroupId]    = useState(task?.groupId ?? '')
  const [dateStr,    setDateStr]    = useState(() => {
    if (task?.dueDate) {
      const d = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    }
    return defaultDate ?? ''
  })
  const [repeatDays,   setRepeatDays]   = useState(new Set())
  const [error,        setError]        = useState(null)
  const [showGroup,    setShowGroup]    = useState(false)
  const [showDate,     setShowDate]     = useState(false)
  const [showRepeat,   setShowRepeat]   = useState(false)
  const [reminder,     setReminder]     = useState(task?.reminder ?? null)
  const [showReminder, setShowReminder] = useState(false)

  const grupoSeleccionado = groups.find(g => g.id === groupId)
  const grupoLabel        = grupoSeleccionado ? grupoSeleccionado.name : 'Personal'

  function handleSave() {
    if (!title.trim()) return
    const type = groupId ? 'group' : 'personal'
    const gId  = groupId || null
    const dueDateTs = dateStr
      ? Timestamp.fromDate(new Date(dateStr + 'T23:59:59'))
      : null
    onClose()
    if (isEdit) {
      updateTask(task, { title: title.trim(), groupId: gId, type, dueDate: dueDateTs, reminder: reminder ?? null })
        .catch(err => console.error('[TaskFormNew] updateTask error:', err))
      if (repeatDays.size > 0) {
        Array.from(repeatDays).sort().filter(d => d !== dateStr).forEach(day => {
          createTask({ title: title.trim(), type, groupId: gId, dueDate: Timestamp.fromDate(new Date(day + 'T23:59:59')) }).catch(console.error)
        })
      }
    } else if (repeatDays.size > 0) {
      Array.from(repeatDays).sort().forEach(day => {
        createTask({ title: title.trim(), type, groupId: gId, dueDate: Timestamp.fromDate(new Date(day + 'T23:59:59')) }).catch(console.error)
      })
    } else {
      createTask({ title: title.trim(), type, groupId: gId, dueDate: dueDateTs, reminder: reminder ?? null })
        .catch(err => console.error('[TaskFormNew] createTask error:', err))
    }
  }

  function labelGuardar() {
    if (isEdit) {
      if (repeatDays.size > 0) return `Guardar + ${repeatDays.size} repetición${repeatDays.size !== 1 ? 'es' : ''}`
      return 'Guardar cambios'
    }
    if (repeatDays.size > 0) return `Crear ${repeatDays.size} tarea${repeatDays.size !== 1 ? 's' : ''}`
    return 'Crear tarea'
  }

  const puedeGuardar = !!title.trim()

  useEffect(() => {
    const t = setTimeout(() => {
      document.getElementById('syng-task-input')?.focus()
    }, 120)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const prev = document.body.style.cssText
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.cssText = prev }
  }, [])

  const keyboardOffset = useKeyboardOffset()

  return (
    <>
      <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={sheet}>

          {/* Header */}
          <div style={sheetHeader}>
            <button onClick={onClose} style={btnVolver}>‹</button>
            <span style={{ fontSize:17, fontWeight:600, color:'#0D1240', letterSpacing:'-0.01em' }}>
              {isEdit ? 'Editar tarea' : 'Nueva tarea'}
            </span>
          </div>

          {/* Contenido */}
          <div style={sheetBody}>
            <label style={lbl}>¿Qué quieres hacer?</label>
            <textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              id="syng-task-input"
              placeholder="Escribe tu tarea aquí..."
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
            {repeatDays.size === 0 && (
              <>
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
                    style={{ ...textArea, padding:'10px 14px', resize:'none', marginBottom:8 }}
                  />
                )}
              </>
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
                {labelRepetir(repeatDays)}
              </span>
              <span style={arr}>›</span>
            </div>

            {repeatDays.size > 0 && (
              <div style={{ padding:'10px 14px', background:'rgba(45,58,140,0.07)', borderRadius:12, marginTop:4, border:'1px solid rgba(45,58,140,0.12)' }}>
                <p style={{ margin:0, fontSize:12, color:'#2D3A8C' }}>
                  {isEdit
                    ? `Se crearán ${repeatDays.size} tarea${repeatDays.size !== 1 ? 's' : ''} adicionales.`
                    : `Se crearán ${repeatDays.size} tarea${repeatDays.size !== 1 ? 's' : ''}.`
                  }
                </p>
                <button onClick={() => setRepeatDays(new Set())}
                  style={{ background:'none', border:'none', color:'rgba(13,18,64,0.35)', fontSize:11, cursor:'pointer', padding:'4px 0 0', textDecoration:'underline' }}>
                  Limpiar
                </button>
              </div>
            )}

            {error && (
              <p style={{ color:'#E05252', fontSize:13, margin:'8px 0', padding:'10px 14px', background:'rgba(224,82,82,0.08)', borderRadius:12, border:'1px solid rgba(224,82,82,0.15)' }}>
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div style={{ ...sheetFooter, paddingBottom:`calc(12px + ${keyboardOffset}px + env(safe-area-inset-bottom))`, transition:'padding-bottom 0.2s ease' }}>
            <button
              onClick={handleSave}
              disabled={!puedeGuardar}
              style={{
                width:'100%', padding:'14px', borderRadius:14,
                border:'none', fontSize:15, fontWeight:600,
                background: puedeGuardar
                  ? 'linear-gradient(135deg, #3D4FA8, #2D3A8C)'
                  : 'rgba(13,18,64,0.08)',
                color: puedeGuardar ? '#fff' : 'rgba(13,18,64,0.28)',
                cursor: puedeGuardar ? 'pointer' : 'default',
                boxShadow: puedeGuardar ? '0 4px 16px rgba(45,58,140,0.30)' : 'none',
                transition:'all 0.15s ease',
              }}
            >
              {labelGuardar()}
            </button>
            <button onClick={onClose}
              style={{ background:'none', border:'none', color:'rgba(13,18,64,0.40)', fontSize:15, cursor:'pointer', padding:'8px' }}>
              Cancelar
            </button>
          </div>

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
    </>
  )
}

const overlay    = { position:'fixed', inset:0, background:'rgba(13,18,64,0.28)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }
const sheet      = { background:'rgba(250,251,255,0.97)', backdropFilter:'blur(48px)', WebkitBackdropFilter:'blur(48px)', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:480, maxHeight:'85svh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 -8px 48px rgba(13,18,64,0.12)' }
const sheetHeader= { flexShrink:0, display:'flex', alignItems:'center', gap:10, padding:'20px 20px 14px', borderBottom:'1px solid rgba(13,18,64,0.07)' }
const sheetBody  = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'16px 20px 8px' }
const sheetFooter= { flexShrink:0, padding:'12px 20px', paddingBottom:'calc(12px + env(safe-area-inset-bottom))', borderTop:'1px solid rgba(13,18,64,0.07)', display:'flex', flexDirection:'column', gap:8, background:'transparent' }
const btnVolver  = { background:'none', border:'none', fontSize:22, color:'rgba(13,18,64,0.35)', cursor:'pointer', padding:'0 4px' }
const lbl        = { display:'block', fontSize:12, color:'rgba(13,18,64,0.38)', fontWeight:500, marginBottom:6 }
const textArea   = { width:'100%', boxSizing:'border-box', padding:'11px 14px', borderRadius:12, border:'1.5px solid rgba(13,18,64,0.10)', fontSize:15, color:'#0D1240', fontFamily:'inherit', resize:'vertical', outline:'none', marginBottom:14, background:'rgba(255,255,255,0.80)', boxShadow:'inset 0 1px 3px rgba(13,18,64,0.04)', lineHeight:1.5 }
const row        = { display:'flex', alignItems:'center', gap:10, padding:'13px 0', borderBottom:'1px solid rgba(13,18,64,0.07)', cursor:'pointer' }
const rLbl       = { fontSize:14, color:'#0D1240', flex:1 }
const rVal       = { fontSize:14, color:'rgba(13,18,64,0.40)' }
const arr        = { fontSize:16, color:'rgba(13,18,64,0.20)' }
const picker     = { background:'rgba(255,255,255,0.80)', borderRadius:12, overflow:'hidden', marginBottom:4, border:'1px solid rgba(13,18,64,0.08)' }
const opt        = sel => ({ padding:'11px 16px', fontSize:14, cursor:'pointer', borderBottom:'1px solid rgba(13,18,64,0.06)', color: sel ? '#2D3A8C' : '#0D1240', fontWeight: sel ? 600 : 400, background: sel ? 'rgba(45,58,140,0.08)' : 'transparent' })

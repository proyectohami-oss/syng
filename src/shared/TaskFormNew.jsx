/**
 * TaskFormNew — formulario de tarea.
 * Estructura: header fijo + contenido scrollable + footer fijo
 * El footer con botón "Crear tarea" nunca queda tapado por el teclado.
 */
import { useState, useMemo } from 'react'
import { useKeyboardOffset } from '../pwa/useKeyboardOffset'
import { Timestamp }         from 'firebase/firestore'
import { useTasks }          from '../core/hooks/useTasks'
import { useCoreState }      from '../core/hooks/useCoreData'
import { RepeatDayPicker }   from './RepeatDayPicker'

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
  const [repeatDays, setRepeatDays] = useState(new Set())
  const [error,      setError]      = useState(null)
  const [showGroup,  setShowGroup]  = useState(false)
  const [showDate,   setShowDate]   = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)

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
      updateTask(task, { title: title.trim(), groupId: gId, type, dueDate: dueDateTs })
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
      createTask({ title: title.trim(), type, groupId: gId, dueDate: dueDateTs })
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
  const keyboardOffset = useKeyboardOffset()

  return (
    <>
      <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={sheet}>

          {/* ── Header fijo ── */}
          <div style={sheetHeader}>
            <button onClick={onClose} style={btnVolver}>‹</button>
            <span style={{ fontSize:17, fontWeight:600, color:'#111' }}>
              {isEdit ? 'Editar tarea' : 'Nueva tarea'}
            </span>
          </div>

          {/* ── Contenido scrollable ── */}
          <div style={sheetBody}>
            <label style={lbl}>¿Qué quieres hacer?</label>
            <textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Escribe tu tarea aquí..."
              autoFocus
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
                    style={{ ...textArea, padding:'8px 12px', resize:'none', marginBottom:8 }}
                  />
                )}
              </>
            )}

            {/* Repetir */}
            <div style={row} onClick={() => setShowRepeat(true)}>
              <span>🔁</span>
              <span style={rLbl}>Repetir</span>
              <span style={{ ...rVal, color: repeatDays.size > 0 ? '#5B3DF6' : '#6b7280' }}>
                {labelRepetir(repeatDays)}
              </span>
              <span style={arr}>›</span>
            </div>

            {repeatDays.size > 0 && (
              <div style={{ padding:'8px 12px', background:'#EDE9FE', borderRadius:8, marginTop:4 }}>
                <p style={{ margin:0, fontSize:12, color:'#5B3DF6' }}>
                  {isEdit
                    ? `Se crearán ${repeatDays.size} tarea${repeatDays.size !== 1 ? 's' : ''} adicionales.`
                    : `Se crearán ${repeatDays.size} tarea${repeatDays.size !== 1 ? 's' : ''}.`
                  }
                </p>
                <button onClick={() => setRepeatDays(new Set())}
                  style={{ background:'none', border:'none', color:'#9ca3af', fontSize:11, cursor:'pointer', padding:'4px 0 0', textDecoration:'underline' }}>
                  Limpiar
                </button>
              </div>
            )}

            {error && (
              <p style={{ color:'#dc2626', fontSize:13, margin:'8px 0', padding:'8px 12px', background:'#fef2f2', borderRadius:8 }}>
                {error}
              </p>
            )}
          </div>

          {/* ── Footer fijo — siempre visible aunque aparezca el teclado ── */}
          <div style={{ ...sheetFooter, paddingBottom: `calc(12px + ${keyboardOffset}px + env(safe-area-inset-bottom))`, transition:'padding-bottom 0.2s ease' }}>
            <button
              onClick={handleSave}
              disabled={!puedeGuardar}
              style={{
                width:'100%', padding:'13px', borderRadius:12, border:'none',
                fontSize:15, fontWeight:600,
                background: puedeGuardar ? '#5B3DF6' : '#e5e7eb',
                color:      puedeGuardar ? '#fff'    : '#9ca3af',
                cursor:     puedeGuardar ? 'pointer' : 'default',
              }}
            >
              {labelGuardar()}
            </button>
            <button onClick={onClose}
              style={{ background:'none', border:'none', color:'#6b7280', fontSize:15, cursor:'pointer', padding:'8px' }}>
              Cancelar
            </button>
          </div>

        </div>
      </div>

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

const overlay    = { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }
const sheet      = { background:'#fff', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:480, maxHeight:'85svh', display:'flex', flexDirection:'column', overflow:'hidden' }
const sheetHeader= { flexShrink:0, display:'flex', alignItems:'center', gap:10, padding:'20px 20px 14px', borderBottom:'1px solid #f3f4f6' }
const sheetBody  = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'16px 20px 8px' }
const sheetFooter= { flexShrink:0, padding:'12px 20px', paddingBottom:'calc(12px + env(safe-area-inset-bottom))', borderTop:'1px solid #f3f4f6', display:'flex', flexDirection:'column', gap:8, background:'#fff' }
const btnVolver  = { background:'none', border:'none', fontSize:22, color:'#6b7280', cursor:'pointer', padding:'0 4px' }
const lbl        = { display:'block', fontSize:12, color:'#9ca3af', fontWeight:500, marginBottom:6 }
const textArea   = { width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:15, color:'#111', fontFamily:'inherit', resize:'vertical', outline:'none', marginBottom:14 }
const row        = { display:'flex', alignItems:'center', gap:10, padding:'13px 0', borderBottom:'1px solid #f3f4f6', cursor:'pointer' }
const rLbl       = { fontSize:14, color:'#111', flex:1 }
const rVal       = { fontSize:14, color:'#6b7280' }
const arr        = { fontSize:16, color:'#d1d5db' }
const picker     = { background:'#f9fafb', borderRadius:10, overflow:'hidden', marginBottom:4, border:'1px solid #f3f4f6' }
const opt        = sel => ({ padding:'11px 16px', fontSize:14, cursor:'pointer', borderBottom:'1px solid #f3f4f6', color: sel ? '#5B3DF6' : '#374151', fontWeight: sel ? 600 : 400, background: sel ? '#EDE9FE' : 'transparent' })

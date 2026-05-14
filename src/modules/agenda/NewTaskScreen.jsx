import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate }               from 'react-router-dom'
import { Timestamp }                            from 'firebase/firestore'
import { useTasks }                             from '../../core/hooks/useTasks'
import { useCoreState }                         from '../../core/hooks/useCoreData'

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

  const [title,     setTitle]     = useState('')
  const [groupId,   setGroupId]   = useState('')
  const [dateStr,   setDateStr]   = useState(date ?? '')
  const [showGroup, setShowGroup] = useState(false)
  const [showDate,  setShowDate]  = useState(false)

  const grupoLabel = groups.find(g => g.id === groupId)?.name ?? 'Personal'
  const puedeGuardar = !!title.trim()

  // Focus suave después de que la pantalla esté montada
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
    createTask({ title: title.trim(), type, groupId: gId, dueDate }).catch(console.error)
  }

  return (
    <div style={screen}>

      {/* Header */}
      <div style={header}>
        <button onClick={() => navigate(-1)} style={btnBack}>Cancelar</button>
        <span style={{ fontSize:16, fontWeight:600, color:'#111' }}>Nueva tarea</span>
        <button
          onClick={handleSave}
          disabled={!puedeGuardar}
          style={{ background:'none', border:'none', fontSize:16, fontWeight:600, cursor: puedeGuardar ? 'pointer' : 'default', color: puedeGuardar ? '#5B3DF6' : '#c4b5fd', padding:'0 4px' }}
        >
          Listo
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
            style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:14, marginBottom:8, fontFamily:'inherit' }}
          />
        )}
      </div>

      {/* Footer con botón principal */}
      <div style={footer}>
        <button
          onClick={handleSave}
          disabled={!puedeGuardar}
          style={{
            width:'100%', padding:'14px', borderRadius:14, border:'none',
            fontSize:16, fontWeight:600,
            background: puedeGuardar ? '#5B3DF6' : '#e5e7eb',
            color:      puedeGuardar ? '#fff'    : '#9ca3af',
            cursor:     puedeGuardar ? 'pointer' : 'default',
          }}
        >
          Crear tarea
        </button>
      </div>

    </div>
  )
}

const screen = { display:'flex', flexDirection:'column', flex:1, minHeight:0, background:'#fff' }
const header = { flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #f3f4f6' }
const btnBack = { background:'none', border:'none', fontSize:16, color:'#6b7280', cursor:'pointer', padding:'0 4px' }
const body   = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'16px 20px' }
const footer = { flexShrink:0, padding:'12px 20px', paddingBottom:'calc(12px + env(safe-area-inset-bottom))', borderTop:'1px solid #f3f4f6', background:'#fff' }
const textArea = { width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:15, color:'#111', fontFamily:'inherit', resize:'none', outline:'none', marginBottom:14 }
const row    = { display:'flex', alignItems:'center', gap:10, padding:'13px 0', borderBottom:'1px solid #f3f4f6', cursor:'pointer' }
const rLbl   = { fontSize:14, color:'#111', flex:1 }
const rVal   = { fontSize:14, color:'#6b7280' }
const arr    = { fontSize:16, color:'#d1d5db' }
const picker = { background:'#f9fafb', borderRadius:10, overflow:'hidden', marginBottom:4, border:'1px solid #f3f4f6' }
const opt    = sel => ({ padding:'11px 16px', fontSize:14, cursor:'pointer', borderBottom:'1px solid #f3f4f6', color: sel ? '#5B3DF6' : '#374151', fontWeight: sel ? 600 : 400, background: sel ? '#EDE9FE' : 'transparent' })

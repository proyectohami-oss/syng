import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate }      from 'react-router-dom'
import { usePizarronView }             from './hooks/usePizarronView'
import { usePizarronDayView }          from './hooks/usePizarronDayView'
import { useTasks }                    from '../../core/hooks/useTasks'
import { useGroups }                   from '../../core/hooks/useGroups'
import { usePermissions }              from '../../core/hooks/usePermissions'
import { useCoreState }                from '../../core/hooks/useCoreData'
import { ConfirmDialog }               from '../../shared/ConfirmDialog'
import { TaskFormNew }                 from '../../shared/TaskFormNew'
import { EmptyState }                  from '../../shared/EmptyState'
import { SyncBadge }                   from '../../shared/SyncBadge'

const DIAS       = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const DIAS_CORTO = ['Do','Lu','Ma','Mi','Ju','Vi','Sá']
const MESES      = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MESES_CAP  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_GRID  = ['L','M','M','J','V','S','D']

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // lunes = 0
  const days = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
  return days
}


function buildMonthDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const days = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

function DatePickerModal({ selectedKey, todayKey, daysWithActivity, onSelect, onClose }) {
  const today    = new Date()
  const startYear = today.getFullYear() - 1
  const years    = Array.from({ length: 5 }, (_, i) => startYear + i)
  const MESES_MINI = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  function toKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, backdropFilter:'blur(4px)' }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:1001, background:'#fff', borderRadius:'22px 22px 0 0', maxHeight:'82vh', display:'flex', flexDirection:'column' }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'rgba(13,18,64,0.12)', margin:'10px auto 6px' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px 10px', borderBottom:'0.5px solid rgba(13,18,64,0.07)' }}>
          <p style={{ margin:0, fontSize:16, fontWeight:700, color:'#0D1240' }}>Seleccionar fecha</p>
          <button onClick={onClose} style={{ background:'rgba(13,18,64,0.07)', border:'none', borderRadius:'50%', width:28, height:28, fontSize:14, cursor:'pointer', color:'rgba(13,18,64,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        <div style={{ overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'12px 12px 40px', flex:1 }}>
          {years.map(year => (
            <div key={year} style={{ marginBottom:20 }}>
              <p style={{ margin:'0 0 10px 2px', fontSize:22, fontWeight:700, color:'#0D1240', letterSpacing:'-0.5px' }}>{year}</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {Array.from({ length: 12 }, (_, m) => {
                  const days = buildMonthDays(year, m)
                  return (
                    <div key={m} style={{ background:'#F8F9FC', borderRadius:12, padding:'7px 7px 8px' }}>
                      <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:700, color:'#0D1240', textAlign:'center' }}>{MESES_MINI[m]}</p>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:0 }}>
                        {['L','M','M','J','V','S','D'].map((d,i) => (
                          <div key={i} style={{ textAlign:'center', fontSize:6, color: i===6 ? 'rgba(224,82,82,0.7)' : '#8E8E93', fontWeight:600, paddingBottom:1 }}>{d}</div>
                        ))}
                        {days.map((date, i) => {
                          if (!date) return <div key={`e-${i}`} />
                          const key      = toKey(date)
                          const isToday  = key === todayKey
                          const isSel    = key === selectedKey
                          const hasTask  = !!daysWithActivity[key]
                          const isSun    = date.getDay() === 0
                          return (
                            <button
                              key={key}
                              onClick={() => onSelect(date)}
                              style={{
                                aspectRatio:    '1',
                                display:        'flex',
                                flexDirection:  'column',
                                alignItems:     'center',
                                justifyContent: 'center',
                                borderRadius:   '50%',
                                border:         'none',
                                cursor:         'pointer',
                                position:       'relative',
                                background:     isToday ? 'linear-gradient(135deg,#3D4FA8,#2D3A8C)' : isSel ? 'rgba(45,58,140,0.12)' : 'transparent',
                                WebkitTapHighlightColor: 'transparent',
                                padding:        0,
                              }}
                            >
                              <span style={{ fontSize:7, fontWeight: isToday||isSel ? 700 : 400, color: isToday ? '#fff' : isSel ? '#2D3A8C' : isSun ? 'rgba(224,82,82,0.85)' : '#0D1240', lineHeight:1 }}>
                                {date.getDate()}
                              </span>
                              {hasTask && (
                                <div style={{ width:2, height:2, borderRadius:'50%', background: isToday ? 'rgba(255,255,255,0.8)' : '#2D3A8C', position:'absolute', bottom:1 }} />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function EditVariasModal({ count, groups, onSave, onClose }) {
  const [fecha,        setFecha]        = useState('')
  const [nuevoGroupId, setNuevoGroupId] = useState('__sin_cambio__')
  const [loading,      setLoading]      = useState(false)
  const hayCambio = fecha !== '' || nuevoGroupId !== '__sin_cambio__'

  async function guardar() {
    setLoading(true)
    try { await onSave({ fecha, nuevoGroupId }) } finally { setLoading(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(13,18,64,0.30)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'rgba(250,251,255,0.97)', backdropFilter:'blur(48px)', WebkitBackdropFilter:'blur(48px)', borderRadius:'24px 24px 0 0', padding:'20px', width:'100%', maxWidth:480, paddingBottom:'calc(20px + env(safe-area-inset-bottom))', boxShadow:'0 -8px 48px rgba(13,18,64,0.12)' }}>
        <p style={{ margin:'0 0 4px', fontSize:16, fontWeight:600, color:'#0D1240', letterSpacing:'-0.01em' }}>
          Editar {count} tarea{count !== 1 ? 's' : ''}
        </p>
        <p style={{ margin:'0 0 20px', fontSize:13, color:'rgba(13,18,64,0.40)' }}>Solo se aplican los campos que cambies.</p>

        <label style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 0', borderBottom:'1px solid rgba(13,18,64,0.07)', cursor:'pointer' }}>
          <span>📅</span>
          <span style={{ flex:1, fontSize:14, color:'#0D1240' }}>Nueva fecha</span>
          <span style={{ fontSize:14, color: fecha ? '#2D3A8C' : 'rgba(13,18,64,0.35)' }}>
            {fecha ? (() => { const [y,m,d] = fecha.split('-').map(Number); return `${d} de ${MESES[m-1]}` })() : 'Sin cambio ›'}
          </span>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ position:'absolute', opacity:0, pointerEvents:'none', width:0, height:0 }} />
        </label>

        <p style={{ margin:'12px 0 6px', fontSize:12, color:'rgba(13,18,64,0.40)', fontWeight:600, letterSpacing:'0.04em' }}>👥 CAMBIAR GRUPO</p>
        <div style={{ background:'rgba(255,255,255,0.80)', borderRadius:12, overflow:'hidden', border:'1px solid rgba(13,18,64,0.08)', marginBottom:20 }}>
          {[{ id:'__sin_cambio__', name:'Sin cambio' }, { id:'', name:'Personal' }, ...groups].map(g => (
            <div key={g.id} onClick={() => setNuevoGroupId(g.id)}
              style={{ padding:'11px 16px', fontSize:14, cursor:'pointer', borderBottom:'1px solid rgba(13,18,64,0.06)', background: nuevoGroupId === g.id ? 'rgba(45,58,140,0.08)' : 'transparent', color: nuevoGroupId === g.id ? '#2D3A8C' : '#0D1240', fontWeight: nuevoGroupId === g.id ? 600 : 400 }}>
              {g.name}
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid rgba(13,18,64,0.12)', background:'rgba(255,255,255,0.80)', color:'rgba(13,18,64,0.45)', fontSize:15, cursor:'pointer' }}>Cancelar</button>
          <button onClick={guardar} disabled={!hayCambio || loading}
            style={{ flex:1, padding:'12px', borderRadius:12, border:'none', fontSize:15, fontWeight:600, cursor: hayCambio ? 'pointer' : 'default', background: hayCambio ? 'linear-gradient(135deg, #3D4FA8, #2D3A8C)' : 'rgba(13,18,64,0.08)', color: hayCambio ? '#fff' : 'rgba(13,18,64,0.28)', boxShadow: hayCambio ? '0 2px 8px rgba(45,58,140,0.28)' : 'none' }}>
            {loading ? 'Aplicando...' : 'Aplicar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PizarronModule() {
  const { id: groupId } = useParams()
  const navigate        = useNavigate()
  const state           = useCoreState()
  const { tasks, group, members, role, loading, uid } = usePizarronView(groupId)
  const { toggleStatus, deleteTask, updateTask } = useTasks()
  const { leaveGroup, deleteGroup }              = useGroups()
  const perms = usePermissions(groupId)

  const { days, selectedKey, setSelectedKey, selectedDate, pending, completed, daysWithActivity, todayKey } = usePizarronDayView(tasks)

  const [modal,       setModal]       = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [calOpen,     setCalOpen]     = useState(false)
  const [taskExpanded, setTaskExpanded] = useState(false)
  const [calViewMonth, setCalViewMonth] = useState(() => new Date())
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showDateModal,  setShowDateModal]  = useState(false)

  const haySeleccion = selectedIds.size > 0

  function handleDayChange(key) {
    setSelectedKey(key)
    setTaskExpanded(false)
  }

  function toggleSeleccion(taskId) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }
  function limpiarSeleccion() { setSelectedIds(new Set()) }

  const daySelectorRef = useRef(null)

  // Scroll al día seleccionado cuando cambia o se cierra el calendario
  useEffect(() => {
    if (calOpen || !daySelectorRef.current) return
    const target = daySelectorRef.current.querySelector(`[data-key="${selectedKey}"]`)
    if (target) target.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' })
    else {
      const hoy = daySelectorRef.current.querySelector('[data-today="true"]')
      if (hoy) hoy.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' })
    }
  }, [selectedKey, calOpen])

  // Sincroniza el mes del calendario con la fecha seleccionada
  useEffect(() => {
    setCalViewMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  }, [selectedDate])

  function handleCalDayPress(date) {
    const key = toDateKey(date)
    handleDayChange(key)
    setCalOpen(false)
  }

  function prevMonth() {
    setCalViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCalViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }

  const todayDate   = new Date()
  const todayKeyStr = toDateKey(todayDate)
  const calDays     = buildCalendarDays(calViewMonth.getFullYear(), calViewMonth.getMonth())

  const groupsLoaded = state.groups.list.size > 0

  if (!group && (!groupsLoaded || loading)) {
    return <div style={centered}><div style={spinner} /></div>
  }

  if (!group) {
    return (
      <EmptyState
        emoji="📋"
        title="Grupo no encontrado"
        description="Este grupo no existe o ya no tienes acceso."
        action={<button onClick={() => navigate('/pizarrones')} style={backBtn}>Ver pizarrones</button>}
      />
    )
  }

  const selectedDateLabel = selectedKey === todayKey
    ? 'Hoy'
    : `${DIAS[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MESES[selectedDate.getMonth()]}`

  return (
    <div style={screen}>

      {/* Header */}
      <div style={header}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', flex:1, minWidth:0 }}
          onClick={() => navigate(`/pizarron/${groupId}/info`)}>
          <div style={groupAvatar}>{group.name[0].toUpperCase()}</div>
          <div style={{ minWidth:0 }}>
            <p style={{ margin:0, fontSize:16, fontWeight:700, color:'#0D1240', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
              {group.name}
            </p>
            <p style={{ margin:0, fontSize:11, color:'rgba(13,18,64,0.38)' }}>
              {members.length} miembro{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:-6 }}>
          {members.slice(0,3).map(m => (
            <div key={m.uid} style={{ ...memberBubble, marginLeft:-6 }}>
              {(m.displayName?.[0] ?? '?').toUpperCase()}
            </div>
          ))}
          {members.length > 3 && (
            <div style={{ ...memberBubble, marginLeft:-6, background:'rgba(13,18,64,0.08)', color:'rgba(13,18,64,0.45)', fontSize:10 }}>
              +{members.length - 3}
            </div>
          )}
        </div>
        <SyncBadge />
      </div>

      {/* Mes — jerarquía visual dominante */}
      <div
        onClick={() => { setCalOpen(o => !o); setShowYearPicker(false); if(!calOpen) setShowDateModal(false) }}
        style={monthBar}
      >
        <span style={{ fontSize:22, fontWeight:600, color:'#0D1240', letterSpacing:'-0.5px', lineHeight:1 }}>
          {MESES_CAP[calViewMonth.getMonth()]} {calViewMonth.getFullYear()}
        </span>
        <span style={{ fontSize:11, color:'#2D3A8C', lineHeight:1, marginLeft:4, opacity:0.7 }}>
          {calOpen ? '⌃' : '⌄'}
        </span>
      </div>

      {/* Persiana — calendario completo */}
      {calOpen && (
        <div style={calDrawer}>
          {/* Navegación de meses */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <button onClick={e => { e.stopPropagation(); prevMonth() }} style={arrowBtn}>‹</button>
            <button
              onClick={e => { e.stopPropagation(); setShowDateModal(true) }}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, fontWeight:700, color:'#0D1240' }}
            >
              {MESES_CAP[calViewMonth.getMonth()]} {calViewMonth.getFullYear()}
            </button>
            <button onClick={e => { e.stopPropagation(); nextMonth() }} style={arrowBtn}>›</button>
          </div>



          {/* Encabezados días */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
            {DIAS_GRID.map((d, i) => (
              <div key={i} style={{ textAlign:'center', fontSize:11, fontWeight:600, color: i === 6 ? 'rgba(224,82,82,0.8)' : 'rgba(13,18,64,0.35)', padding:'2px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
            {calDays.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />
              const key        = toDateKey(date)
              const isToday    = key === todayKeyStr
              const isSelected = key === selectedKey
              const hasTask    = !!daysWithActivity[key]
              const isSunday   = date.getDay() === 0

              return (
                <button
                  key={key}
                  onClick={() => handleCalDayPress(date)}
                  style={{
                    aspectRatio:    '1',
                    display:        'flex',
                    flexDirection:  'column',
                    alignItems:     'center',
                    justifyContent: 'center',
                    borderRadius:   '50%',
                    border:         'none',
                    cursor:         'pointer',
                    position:       'relative',
                    background:     isToday
                      ? 'linear-gradient(135deg, #3D4FA8, #2D3A8C)'
                      : isSelected
                        ? 'rgba(45,58,140,0.10)'
                        : 'transparent',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{
                    fontSize:   13,
                    fontWeight: isToday || isSelected ? 700 : 400,
                    color:      isToday
                      ? '#fff'
                      : isSelected
                        ? '#2D3A8C'
                        : isSunday
                          ? 'rgba(224,82,82,0.85)'
                          : '#0D1240',
                    lineHeight: 1,
                  }}>
                    {date.getDate()}
                  </span>
                  {hasTask && (
                    <div style={{
                      width:        4,
                      height:       4,
                      borderRadius: '50%',
                      background:   isToday ? 'rgba(255,255,255,0.8)' : isSelected ? '#2D3A8C' : '#2D3A8C',
                      position:     'absolute',
                      bottom:       3,
                      opacity:      1,
                    }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selector de días — solo cuando el calendario está cerrado */}
      {!calOpen && (
        <div style={daySelector}>
          <div ref={daySelectorRef} style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, WebkitOverflowScrolling:'touch', scrollbarWidth:'none' }}>
            {days.map(d => {
              const isSelected  = d.key === selectedKey
              const hasActivity = daysWithActivity[d.key]
              const isToday     = d.key === todayKeyStr
              return (
                <button
                  key={d.key}
                  data-key={d.key}
                  data-today={isToday ? 'true' : 'false'}
                  onClick={() => handleDayChange(d.key)}
                  style={{
                    flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center',
                    padding:'8px 12px', borderRadius:14, border:'none', cursor:'pointer',
                    background: isSelected ? 'linear-gradient(145deg, #3D4FA8, #2D3A8C)' : 'transparent',
                    boxShadow:  isSelected ? '0 2px 8px rgba(45,58,140,0.28)' : 'none',
                    WebkitTapHighlightColor:'transparent',
                    transition:'background 0.15s',
                  }}
                >
                  <span style={{ fontSize:10, fontWeight:500, color: isSelected ? 'rgba(255,255,255,0.70)' : 'rgba(13,18,64,0.38)' }}>
                    {d.isToday ? 'Hoy' : DIAS_CORTO[d.date.getDay()]}
                  </span>
                  <span style={{ fontSize:16, fontWeight:700, color: isSelected ? '#fff' : '#0D1240', lineHeight:1.2 }}>
                    {d.dayNum}
                  </span>
                  {hasActivity && (
                    <div style={{ width:4, height:4, borderRadius:'50%', background: isSelected ? 'rgba(255,255,255,0.75)' : '#2D3A8C', marginTop:2, opacity:1 }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Contadores */}
      <div style={counters}>
        <div style={counter}>
          <span style={{ fontSize:20, fontWeight:700, color:'#2D3A8C' }}>{pending.length}</span>
          <span style={{ fontSize:11, color:'rgba(13,18,64,0.38)' }}>Pendientes</span>
        </div>
        <div style={counterDivider} />
        <div style={counter}>
          <span style={{ fontSize:20, fontWeight:700, color:'#22C55E' }}>{completed.length}</span>
          <span style={{ fontSize:11, color:'rgba(13,18,64,0.38)' }}>Completadas</span>
        </div>
      </div>

      {/* Lista de tareas */}
      <div style={taskList}>
        <p style={{ margin:'0 0 4px', fontSize:15, fontWeight:700, color:'#0D1240', letterSpacing:'-0.01em' }}>
          {selectedDateLabel}
        </p>
        {pending.length > 0 && (
          <p style={{ margin:'0 0 12px', fontSize:13, fontWeight:600, color:'#2D3A8C' }}>
            Pendientes ({pending.length})
          </p>
        )}

        {pending.length === 0 && completed.length === 0 && (
          <p style={{ fontSize:13, color:'rgba(13,18,64,0.35)', textAlign:'center', padding:'24px 0' }}>
            Sin tareas para este día
          </p>
        )}

        {(taskExpanded ? pending : pending.slice(0,3)).map(task => {
          const member = members.find(m => m.uid === task.ownerId)
          const hora = task.dueDate ? (() => {
            const d = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
            return d.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })
          })() : null
          return (
            <div key={task.id} style={{ ...taskCard, background: selectedIds.has(task.id) ? 'rgba(45,58,140,0.06)' : 'transparent' }}>
              <button
                onClick={() => toggleSeleccion(task.id)}
                style={{ ...checkBtn, border: selectedIds.has(task.id) ? '2px solid #2D3A8C' : '2px solid rgba(13,18,64,0.28)', background: selectedIds.has(task.id) ? '#2D3A8C' : 'none' }}
              />
              <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={() => !haySeleccion && toggleStatus(task)}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  {task.reminder && <span style={{ fontSize:12, opacity:0.5 }}>🔔</span>}
                  <p style={{ margin:0, fontSize:14, fontWeight:500, color:'#0D1240', lineHeight:1.3 }}>{task.title}</p>
                </div>
                {hora && <p style={{ margin:'2px 0 0', fontSize:11, color:'rgba(13,18,64,0.35)' }}>{hora}</p>}
              </div>
              {member && (
                <div style={memberMini} title={member.displayName}>
                  {(member.displayName?.[0] ?? '?').toUpperCase()}
                </div>
              )}
              <button onClick={() => navigate(`/pizarron/${groupId}/editar/${task.id}`)} style={btnTask}>✏️</button>
              <button onClick={() => setModal({ tipo:'borrar', task })} style={btnTask}>🗑️</button>
            </div>
          )
        })}

        {!taskExpanded && pending.length > 3 && (
          <button
            onClick={() => setTaskExpanded(true)}
            style={{ width:'100%', padding:'10px 0', background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#2D3A8C', fontWeight:600, textAlign:'center', letterSpacing:'-0.01em' }}
          >
            Ver {pending.length - 3} más ⌄
          </button>
        )}

        {completed.length > 0 && (
          <>
            <p style={{ margin:'20px 0 8px', fontSize:11, color:'rgba(13,18,64,0.32)', fontWeight:600, letterSpacing:'0.06em' }}>
              COMPLETADAS ({completed.length})
            </p>
            {completed.map(task => (
              <div key={task.id} style={{ ...taskCard, opacity:0.55 }}>
                <button onClick={() => toggleStatus(task)} style={{ ...checkBtn, border:'2px solid rgba(13,18,64,0.20)', background:'rgba(13,18,64,0.08)', WebkitTapHighlightColor:'transparent' }} />
                <p style={{ flex:1, margin:0, fontSize:14, color:'rgba(13,18,64,0.35)', textDecoration:'line-through', cursor:'pointer' }} onClick={() => toggleStatus(task)}>{task.title}</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Barra de selección */}
      {haySeleccion && (
        <div style={barraSeleccion}>
          <span style={{ fontSize:13, color:'#0D1240', fontWeight:500 }}>
            {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={async () => {
              const todas = [...pending, ...completed]
              const seleccionadas = todas.filter(t => selectedIds.has(t.id))
              await Promise.all(seleccionadas.map(t => toggleStatus(t)))
              limpiarSeleccion()
            }} style={btnBarra}>✅ Completar</button>
            <button onClick={() => setModal({ tipo:'editarVarias' })} style={btnBarra}>✏️ Editar</button>
            <button onClick={() => setModal({ tipo:'borrarVarias' })} style={{ ...btnBarra, background:'rgba(224,82,82,0.10)', color:'#E05252' }}>🗑️ Eliminar</button>
          </div>
        </div>
      )}

      {/* Modal selector de fecha */}
      {showDateModal && (
        <DatePickerModal
          selectedKey={selectedKey}
          todayKey={toDateKey(new Date())}
          daysWithActivity={daysWithActivity}
          onSelect={date => {
            handleCalDayPress(date)
            setShowDateModal(false)
            setCalOpen(false)
          }}
          onClose={() => setShowDateModal(false)}
        />
      )}

      {perms.canCreateGroupTask && !haySeleccion && (
        <button onClick={() => navigate(`/pizarron/${groupId}/nueva/${selectedKey}`)} style={fabBtn}>
          <span style={{ fontSize:15, fontWeight:600 }}>+ Añadir tarea</span>
        </button>
      )}

      {/* Modales */}
      {modal?.tipo === 'borrar' && (
        <ConfirmDialog
          title="Eliminar tarea"
          message={`¿Eliminar "${modal.task.title}"?`}
          confirmLabel="Eliminar"
          danger
          onConfirm={async () => { await deleteTask(modal.task); setModal(null) }}
          onCancel={() => setModal(null)}
        />
      )}

      {modal?.tipo === 'borrarVarias' && (
        <ConfirmDialog
          title="Eliminar tareas"
          message={`¿Eliminar ${selectedIds.size} tarea${selectedIds.size !== 1 ? 's' : ''}?`}
          confirmLabel={`Eliminar ${selectedIds.size}`}
          danger
          onConfirm={async () => {
            const todas = [...pending, ...completed]
            const seleccionadas = todas.filter(t => selectedIds.has(t.id))
            await Promise.all(seleccionadas.map(t => deleteTask(t)))
            limpiarSeleccion()
            setModal(null)
          }}
          onCancel={() => setModal(null)}
        />
      )}

      {modal?.tipo === 'editarVarias' && (
        <EditVariasModal
          count={selectedIds.size}
          groups={Array.from(state.groups.list.values())}
          onClose={() => setModal(null)}
          onSave={async ({ fecha, nuevoGroupId }) => {
            const { Timestamp } = await import('firebase/firestore')
            const todas = [...pending, ...completed]
            const seleccionadas = todas.filter(t => selectedIds.has(t.id))
            const updates = {}
            if (fecha) updates.dueDate = Timestamp.fromDate(new Date(fecha + 'T23:59:59'))
            if (nuevoGroupId !== '__sin_cambio__') {
              updates.groupId = nuevoGroupId || null
              updates.type    = nuevoGroupId ? 'group' : 'personal'
            }
            if (Object.keys(updates).length > 0) {
              await Promise.all(seleccionadas.map(t => updateTask(t, updates)))
            }
            limpiarSeleccion()
            setModal(null)
          }}
        />
      )}
    </div>
  )
}

const screen         = { display:'flex', flexDirection:'column', flex:1, minHeight:0, background:'transparent', overflow:'hidden' }
const centered       = { display:'flex', alignItems:'center', justifyContent:'center', flex:1 }
const spinner        = { width:28, height:28, borderRadius:'50%', border:'3px solid rgba(13,18,64,0.10)', borderTopColor:'#2D3A8C', animation:'spin 0.7s linear infinite' }
const header         = { flexShrink:0, display:'flex', alignItems:'center', gap:10, padding:'8px 16px', background:'transparent', borderBottom:'1px solid rgba(13,18,64,0.07)' }
const groupAvatar    = { width:40, height:40, borderRadius:12, background:'rgba(45,58,140,0.10)', color:'#2D3A8C', fontSize:18, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }
const memberBubble   = { width:28, height:28, borderRadius:'50%', background:'rgba(45,58,140,0.10)', color:'#2D3A8C', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid rgba(255,255,255,0.80)', flexShrink:0 }
const monthBar       = { flexShrink:0, display:'flex', alignItems:'center', padding:'14px 16px 10px', background:'transparent', cursor:'pointer', userSelect:'none' }
const calDrawer      = { flexShrink:0, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', padding:'12px 16px 16px', borderBottom:'1px solid rgba(13,18,64,0.07)' }
const arrowBtn       = { background:'rgba(45,58,140,0.06)', border:'none', fontSize:15, color:'#2D3A8C', cursor:'pointer', width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }
const daySelector    = { flexShrink:0, padding:'6px 16px 4px', background:'rgba(255,255,255,0.70)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderBottom:'1px solid rgba(13,18,64,0.07)' }
const counters       = { flexShrink:0, display:'flex', alignItems:'center', padding:'10px 20px', background:'rgba(255,255,255,0.60)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderBottom:'1px solid rgba(13,18,64,0.07)', gap:0 }
const counter        = { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }
const counterDivider = { width:1, height:32, background:'rgba(13,18,64,0.08)' }
const taskList       = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'16px' }
const taskCard       = { display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid rgba(13,18,64,0.07)' }
const checkBtn       = { width:22, height:22, borderRadius:'50%', border:'2px solid rgba(13,18,64,0.28)', background:'none', cursor:'pointer', flexShrink:0, WebkitTapHighlightColor:'transparent' }
const memberMini     = { width:24, height:24, borderRadius:'50%', background:'rgba(45,58,140,0.10)', color:'#2D3A8C', fontSize:10, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }
const btnTask        = { background:'none', border:'none', cursor:'pointer', fontSize:14, padding:'4px', color:'rgba(13,18,64,0.35)' }
const barraSeleccion = { flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'rgba(255,255,255,0.88)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderTop:'1px solid rgba(13,18,64,0.07)' }
const btnBarra       = { padding:'8px 14px', borderRadius:10, border:'none', background:'rgba(45,58,140,0.09)', color:'#2D3A8C', fontSize:13, fontWeight:600, cursor:'pointer' }
const fabBtn         = { position:'fixed', bottom:'calc(82px + env(safe-area-inset-bottom))', right:16, display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, height:42, padding:'0 18px', borderRadius:21, background:'rgba(45,58,140,0.88)', border:'none', color:'#fff', cursor:'pointer', boxShadow:'0 2px 12px rgba(45,58,140,0.28)', zIndex:50, WebkitTapHighlightColor:'transparent', fontSize:14, fontWeight:600 }
const backBtn        = { padding:'10px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg, #3D4FA8, #2D3A8C)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }

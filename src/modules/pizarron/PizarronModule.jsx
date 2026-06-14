import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate }      from 'react-router-dom'
import { usePizarronView }             from './hooks/usePizarronView'
import { usePizarronDayView }          from './hooks/usePizarronDayView'
import { useTasks }                    from '../../core/hooks/useTasks'
import { useGroups }                   from '../../core/hooks/useGroups'
import { usePermissions }              from '../../core/hooks/usePermissions'
import { useCoreState }                from '../../core/hooks/useCoreData'
import { useFreeTierBlocked }          from '../../core/hooks/useFreeTierGuard'
import { ReminderBell } from '../../shared/ReminderBell'
import { taskHasReminder } from '../../core/tasks/taskReminder'
import { EmptyState }                  from '../../shared/EmptyState'
import { SyncBadge }                   from '../../shared/SyncBadge'
import { CalendarSwipe }               from './components/CalendarSwipe'
import { A, L }                        from '../../shared/agendaEditorial'

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
  const today     = new Date()
  const startYear = today.getFullYear() - 1
  const years     = Array.from({ length: 5 }, (_, i) => startYear + i)
  const MESES_MINI = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const scrollRef  = useRef(null)
  const anchorRef  = useRef(null)

  // Al abrir, posicionar en la fecha seleccionada o en hoy
  useEffect(() => {
    if (!anchorRef.current || !scrollRef.current) return
    const container = scrollRef.current
    const target    = anchorRef.current
    const offset    = target.offsetTop - 60
    container.scrollTo({ top: Math.max(0, offset), behavior: 'instant' })
  }, [])

  function toKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:1000 }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:1001, background:L.inkSoft, borderRadius:'2px 2px 0 0', borderTop:`1px solid ${L.champagneBorder}`, maxHeight:'82vh', display:'flex', flexDirection:'column' }}>
        <div style={{ width:32, height:3, borderRadius:2, background:L.champagneBorder, margin:'10px auto 6px' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px 10px', borderBottom:`1px solid rgba(196,169,98,0.15)` }}>
          <p style={{ margin:0, fontSize:16, fontWeight:500, color:L.ivory, fontFamily:L.serif }}>Seleccionar fecha</p>
          <button onClick={onClose} style={{ background:L.champagneLight, border:`1px solid ${L.champagneBorder}`, borderRadius:2, width:28, height:28, fontSize:14, cursor:'pointer', color:L.ivoryMuted, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        <div ref={scrollRef} style={{ overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'12px 12px 40px', flex:1 }}>
          {years.map(year => {
            const anchor = selectedKey
              ? parseInt(selectedKey.split('-')[0]) === year
              : today.getFullYear() === year
            return (
            <div key={year} ref={anchor ? anchorRef : null} style={{ marginBottom:20 }}>
              <p style={{ margin:'0 0 10px 2px', fontSize:22, fontWeight:400, color:L.ivory, letterSpacing:'-0.02em', fontFamily:L.serif }}>{year}</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {Array.from({ length: 12 }, (_, m) => {
                  const days = buildMonthDays(year, m)
                  return (
                    <div key={m} style={{ background:L.champagneLight, borderRadius:2, padding:'7px 7px 8px', border:`1px solid ${L.champagneBorder}` }}>
                      <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:500, color:L.champagne, textAlign:'center', letterSpacing:'0.08em' }}>{MESES_MINI[m]}</p>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:0 }}>
                        {['L','M','M','J','V','S','D'].map((d,i) => (
                          <div key={i} style={{ textAlign:'center', fontSize:6, color: i===6 ? 'rgba(224,82,82,0.7)' : L.ivoryFaint, fontWeight:600, paddingBottom:1 }}>{d}</div>
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
                                borderRadius:   2,
                                border:         'none',
                                cursor:         'pointer',
                                position:       'relative',
                                background:     isToday ? L.ivory : isSel ? L.champagneLight : 'transparent',
                                WebkitTapHighlightColor: 'transparent',
                                padding:        0,
                              }}
                            >
                              <span style={{ fontSize:7, fontWeight: isToday||isSel ? 700 : 400, color: isToday ? L.ink : isSel ? L.champagne : isSun ? 'rgba(224,82,82,0.85)' : L.ivoryMuted, lineHeight:1 }}>
                                {date.getDate()}
                              </span>
                              {hasTask && (
                                <div style={{ width:2, height:2, borderRadius:'50%', background: isToday ? L.ink : L.champagne, position:'absolute', bottom:1 }} />
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
          )
          })}
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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:L.inkSoft, borderRadius:'2px 2px 0 0', borderTop:`1px solid ${L.champagneBorder}`, padding:'20px', width:'100%', maxWidth:480, paddingBottom:'calc(20px + env(safe-area-inset-bottom))' }}>
        <p style={{ margin:'0 0 4px', fontSize:18, fontWeight:500, color:L.ivory, letterSpacing:'-0.01em', fontFamily:L.serif }}>
          Editar {count} tarea{count !== 1 ? 's' : ''}
        </p>
        <p style={{ margin:'0 0 20px', fontSize:13, color:L.ivoryMuted }}>Solo se aplican los campos que cambies.</p>

        <label style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 0', borderBottom:`1px solid rgba(196,169,98,0.12)`, cursor:'pointer' }}>
          <span>📅</span>
          <span style={{ flex:1, fontSize:14, color:L.ivory }}>Nueva fecha</span>
          <span style={{ fontSize:14, color: fecha ? L.champagne : L.ivoryFaint }}>
            {fecha ? (() => { const [y,m,d] = fecha.split('-').map(Number); return `${d} de ${MESES[m-1]}` })() : 'Sin cambio ›'}
          </span>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ position:'absolute', opacity:0, pointerEvents:'none', width:0, height:0 }} />
        </label>

        <p style={{ margin:'12px 0 6px', fontSize:10, color:L.champagne, fontWeight:500, letterSpacing:'0.12em' }}>CAMBIAR GRUPO</p>
        <div style={{ background:L.champagneLight, borderRadius:2, overflow:'hidden', border:`1px solid ${L.champagneBorder}`, marginBottom:20 }}>
          {[{ id:'__sin_cambio__', name:'Sin cambio' }, { id:'', name:'Personal' }, ...groups].map(g => (
            <div key={g.id} onClick={() => setNuevoGroupId(g.id)}
              style={{ padding:'11px 16px', fontSize:14, cursor:'pointer', borderBottom:`1px solid rgba(196,169,98,0.1)`, background: nuevoGroupId === g.id ? 'rgba(196,169,98,0.12)' : 'transparent', color: nuevoGroupId === g.id ? L.champagne : L.ivory, fontWeight: nuevoGroupId === g.id ? 600 : 400 }}>
              {g.name}
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ ...A.btnSecondary, flex:1 }}>Cancelar</button>
          <button onClick={guardar} disabled={!hayCambio || loading}
            style={{ ...A.btnPrimary, flex:1, opacity: hayCambio ? 1 : 0.45, cursor: hayCambio ? 'pointer' : 'default' }}>
            {loading ? 'Aplicando…' : 'Aplicar cambios'}
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
  const readOnly = useFreeTierBlocked()

  const { days, selectedKey, setSelectedKey, selectedDate, pending, completed, daysWithActivity, todayKey } = usePizarronDayView(tasks)

  const [modal,       setModal]       = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [calOpen,     setCalOpen]     = useState(false)
  const [taskExpanded, setTaskExpanded] = useState(false)
  const [daySelected, setDaySelected] = useState(false)
  const [calViewMonth, setCalViewMonth] = useState(() => new Date())
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showDateModal,  setShowDateModal]  = useState(false)

  const haySeleccion = selectedIds.size > 0

  function handleDayChange(key) {
    setSelectedKey(key)
    setTaskExpanded(false)
    setDaySelected(true)
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
  const swipeRef = useRef({ x: 0, y: 0 })

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

  function handleCalDayPress(date) {
    const key = toDateKey(date)
    handleDayChange(key)
    setCalOpen(false)
  }

  function prevMonth() {
    const current   = parseKey(selectedKey)
    const newDate   = new Date(calViewMonth.getFullYear(), calViewMonth.getMonth() - 1, 1)
    const targetDay = current.getDate()
    const lastDay   = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate()
    const safeDay   = Math.min(targetDay, lastDay)
    const finalDate = new Date(newDate.getFullYear(), newDate.getMonth(), safeDay)
    setCalViewMonth(newDate)
    handleDayChange(toDateKey(finalDate))
    setTaskExpanded(false)
  }
  function nextMonth() {
    const current   = parseKey(selectedKey)
    const newDate   = new Date(calViewMonth.getFullYear(), calViewMonth.getMonth() + 1, 1)
    const targetDay = current.getDate()
    const lastDay   = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate()
    const safeDay   = Math.min(targetDay, lastDay)
    const finalDate = new Date(newDate.getFullYear(), newDate.getMonth(), safeDay)
    setCalViewMonth(newDate)
    handleDayChange(toDateKey(finalDate))
    setTaskExpanded(false)
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
            <p style={{ margin:0, fontSize:16, fontWeight:500, color:L.ivory, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {group.name}
            </p>
            <p style={{ margin:0, fontSize:11, color:L.ivoryMuted }}>
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
            <div style={{ ...memberBubble, marginLeft:-6, background:L.champagneLight, color:L.ivoryMuted, fontSize:10 }}>
              +{members.length - 3}
            </div>
          )}
        </div>
        <SyncBadge dark />
      </div>

      {/* Mes — jerarquía visual dominante */}
      <div
        onClick={() => { setCalOpen(o => !o); setShowYearPicker(false); if(!calOpen) setShowDateModal(false) }}
        style={monthBar}
      >
        <span style={{ fontFamily:L.serif, fontSize:22, fontWeight:400, color:L.ivory, letterSpacing:'-0.02em', lineHeight:1 }}>
          {MESES_CAP[calViewMonth.getMonth()]} {calViewMonth.getFullYear()}
        </span>
        <span style={{ fontSize:11, color:L.champagne, lineHeight:1, marginLeft:4, opacity:0.8 }}>
          {calOpen ? '⌃' : '⌄'}
        </span>
      </div>

      {/* Persiana — calendario completo */}
      {calOpen && (
        <div style={calDrawer}>
          <CalendarSwipe
            selectedDate={selectedDate}
            daysWithActivity={daysWithActivity}
            onSelectDate={date => handleCalDayPress(date)}
            onMonthChange={date => setCalViewMonth(new Date(date.getFullYear(), date.getMonth(), 1))}
            onMonthTap={() => setShowDateModal(true)}
          />
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
                    background: isSelected ? L.ivory : 'transparent',
                    boxShadow:  isSelected ? '0 4px 16px rgba(0,0,0,0.35)' : 'none',
                    WebkitTapHighlightColor:'transparent',
                    transition:'background 0.15s',
                  }}
                >
                  <span style={{ fontSize:10, fontWeight:500, color: isSelected ? L.ink : L.ivoryMuted }}>
                    {d.isToday ? 'Hoy' : DIAS_CORTO[d.date.getDay()]}
                  </span>
                  <span style={{ fontSize:16, fontWeight:600, color: isSelected ? L.ink : L.ivory, lineHeight:1.2 }}>
                    {d.dayNum}
                  </span>
                  {hasActivity && (
                    <div style={{ width:4, height:4, borderRadius:2, background: isSelected ? L.champagne : L.champagne, marginTop:2, opacity:1 }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Contadores */}
      {daySelected && <div style={counters}>
        <div style={counter}>
          <span style={{ fontSize:20, fontWeight:500, fontFamily:L.serif, color:L.champagne }}>{pending.length}</span>
          <span style={{ fontSize:11, color:L.ivoryMuted }}>Pendientes</span>
        </div>
        <div style={counterDivider} />
        <div style={counter}>
          <span style={{ fontSize:20, fontWeight:500, fontFamily:L.serif, color:'#6ee7a0' }}>{completed.length}</span>
          <span style={{ fontSize:11, color:L.ivoryMuted }}>Completadas</span>
        </div>
      </div>}

      {/* Lista de tareas */}
      <div style={taskList}>
        <p style={{ margin:'0 0 4px', fontFamily:L.serif, fontSize:18, color:L.ivory }}>
          {selectedDateLabel}
        </p>
        {pending.length > 0 && (
          <p style={{ margin:'0 0 12px', fontSize:10, fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:L.champagne }}>
            Pendientes ({pending.length})
          </p>
        )}

        {pending.length === 0 && completed.length === 0 && (
          <p style={{ fontSize:13, color:L.ivoryFaint, textAlign:'center', padding:'24px 0' }}>
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
            <div key={task.id} style={{ ...taskCard, background: selectedIds.has(task.id) ? L.champagneLight : 'transparent' }}>
              <button
                onClick={() => toggleSeleccion(task.id)}
                style={{ ...checkBtn, border: selectedIds.has(task.id) ? `2px solid ${L.champagne}` : `2px solid ${L.champagneBorder}`, background: selectedIds.has(task.id) ? L.champagne : 'none' }}
              />
              <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={() => !haySeleccion && toggleStatus(task)}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  {taskHasReminder(task) && <ReminderBell size={13} />}
                  <p style={{ margin:0, fontSize:14, fontWeight:500, color:L.ivory, lineHeight:1.3 }}>{task.title}</p>
                </div>
                {hora && <p style={{ margin:'2px 0 0', fontSize:11, color:L.ivoryFaint }}>{hora}</p>}
              </div>
              {member && (
                <div style={memberMini} title={member.displayName}>
                  {(member.displayName?.[0] ?? '?').toUpperCase()}
                </div>
              )}
              <button onClick={() => navigate(`/pizarron/${groupId}/editar/${task.id}`)} style={btnTask}>Editar</button>
              <button onClick={() => setModal({ tipo:'borrar', task })} style={btnTask}>Eliminar</button>
            </div>
          )
        })}

        {!taskExpanded && pending.length > 3 && (
          <button
            onClick={() => setTaskExpanded(true)}
            style={{ width:'100%', padding:'10px 0', background:'none', border:'none', cursor:'pointer', fontSize:13, color:L.champagne, fontWeight:500, textAlign:'center' }}
          >
            Ver {pending.length - 3} más ⌄
          </button>
        )}

        {completed.length > 0 && (
          <>
            <p style={{ margin:'20px 0 8px', fontSize:10, color:L.champagne, fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase' }}>
              Completadas ({completed.length})
            </p>
            {completed.map(task => (
              <div key={task.id} style={{ ...taskCard, opacity:0.45 }}>
                <button onClick={() => toggleStatus(task)} style={{ ...checkBtn, border:`2px solid ${L.champagneBorder}`, background:L.champagneLight, WebkitTapHighlightColor:'transparent' }} />
                <p style={{ flex:1, margin:0, fontSize:14, color:L.ivoryMuted, textDecoration:'line-through', cursor:'pointer' }} onClick={() => toggleStatus(task)}>{task.title}</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Barra de selección */}
      {haySeleccion && !readOnly && (
        <div style={barraSeleccion}>
          <span style={{ fontSize:13, color:L.ivory, fontWeight:500 }}>
            {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={async () => {
              const todas = [...pending, ...completed]
              const seleccionadas = todas.filter(t => selectedIds.has(t.id))
              await Promise.all(seleccionadas.map(t => toggleStatus(t)))
              limpiarSeleccion()
            }} style={btnBarra}>Completar</button>
            <button onClick={() => setModal({ tipo:'editarVarias' })} style={btnBarra}>Editar</button>
            <button onClick={() => setModal({ tipo:'borrarVarias' })} style={{ ...btnBarra, background:'rgba(224,82,82,0.12)', color:'#E05252', border:'1px solid rgba(224,82,82,0.25)' }}>Eliminar</button>
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

      {perms.canCreateGroupTask && !haySeleccion && !readOnly && (
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

const screen         = { ...A.screen }
const centered       = { display:'flex', alignItems:'center', justifyContent:'center', flex:1 }
const spinner        = { width:28, height:28, borderRadius:2, border:`3px solid ${L.champagneBorder}`, borderTopColor:L.champagne, animation:'spin 0.7s linear infinite' }
const header         = { ...A.header, gap:10, padding:'8px 16px', paddingTop:'max(8px, env(safe-area-inset-top))' }
const groupAvatar    = { width:40, height:40, borderRadius:2, background:L.champagneLight, border:`1px solid ${L.champagneBorder}`, color:L.champagne, fontFamily:L.serif, fontSize:18, fontWeight:400, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }
const memberBubble   = { width:28, height:28, borderRadius:2, background:L.champagneLight, border:`1px solid ${L.champagneBorder}`, color:L.champagne, fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }
const monthBar       = { flexShrink:0, display:'flex', alignItems:'center', padding:'14px 16px 10px', background:L.ink, cursor:'pointer', userSelect:'none' }
const calDrawer      = { flexShrink:0, background:L.inkSoft, padding:'12px 16px 16px', borderBottom:`1px solid rgba(196,169,98,0.2)`, WebkitOverflowScrolling:'touch' }
const arrowBtn       = { background:'none', border:'none', fontSize:22, color:L.champagne, cursor:'pointer', padding:'4px 12px', minWidth:44, minHeight:44, display:'flex', alignItems:'center', justifyContent:'center', WebkitTapHighlightColor:'transparent' }
const daySelector    = { flexShrink:0, padding:'6px 16px 4px', background:L.ink, borderBottom:`1px solid rgba(196,169,98,0.15)` }
const counters       = { flexShrink:0, display:'flex', alignItems:'center', padding:'10px 20px', background:L.inkSoft, borderBottom:`1px solid rgba(196,169,98,0.15)`, gap:0 }
const counter        = { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }
const counterDivider = { width:1, height:32, background:L.champagneBorder }
const taskList       = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'16px' }
const taskCard       = { display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:`1px solid rgba(196,169,98,0.12)` }
const checkBtn       = { width:22, height:22, borderRadius:2, border:`2px solid ${L.champagneBorder}`, background:'none', cursor:'pointer', flexShrink:0, WebkitTapHighlightColor:'transparent' }
const memberMini     = { width:24, height:24, borderRadius:2, background:L.champagneLight, border:`1px solid ${L.champagneBorder}`, color:L.champagne, fontSize:10, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }
const btnTask        = { background:'none', border:'none', cursor:'pointer', fontSize:13, padding:'4px 8px', color:L.ivoryMuted, letterSpacing:'0.06em' }
const barraSeleccion = { flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:L.inkSoft, borderTop:`1px solid rgba(196,169,98,0.2)` }
const btnBarra       = { padding:'8px 14px', borderRadius:2, border:`1px solid ${L.champagneBorder}`, background:L.champagneLight, color:L.ivory, fontSize:12, fontWeight:600, letterSpacing:'0.06em', cursor:'pointer' }
const fabBtn         = { position:'fixed', bottom:'calc(82px + env(safe-area-inset-bottom))', right:16, display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, height:42, padding:'0 18px', borderRadius:2, background:L.ivory, border:`1px solid ${L.ivory}`, color:L.ink, cursor:'pointer', boxShadow:'0 8px 32px rgba(0,0,0,0.45)', zIndex:50, WebkitTapHighlightColor:'transparent', fontSize:13, fontWeight:600, letterSpacing:'0.08em' }
const backBtn        = { padding:'10px 20px', borderRadius:2, border:`1px solid ${L.ivory}`, background:L.ivory, color:L.ink, fontSize:13, fontWeight:600, letterSpacing:'0.08em', cursor:'pointer' }

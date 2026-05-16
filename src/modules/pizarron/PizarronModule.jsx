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

const DIAS = ['Do','Lu','Ma','Mi','Ju','Vi','Sá']
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function EditVariasModal({ count, groups, onSave, onClose }) {
  const [fecha,       setFecha]       = useState('')
  const [nuevoGroupId, setNuevoGroupId] = useState('__sin_cambio__')
  const [loading,     setLoading]     = useState(false)
  const hayCambio = fecha !== '' || nuevoGroupId !== '__sin_cambio__'

  async function guardar() {
    setLoading(true)
    try { await onSave({ fecha, nuevoGroupId }) } finally { setLoading(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'20px', width:'100%', maxWidth:480, paddingBottom:'calc(20px + env(safe-area-inset-bottom))' }}>
        <p style={{ margin:'0 0 4px', fontSize:16, fontWeight:600, color:'#111' }}>
          Editar {count} tarea{count !== 1 ? 's' : ''}
        </p>
        <p style={{ margin:'0 0 20px', fontSize:13, color:'#9ca3af' }}>Solo se aplican los campos que cambies.</p>

        <p style={{ margin:'0 0 6px', fontSize:12, color:'#6b7280', fontWeight:500 }}>📅 Nueva fecha</p>
        <input
          type="date" value={fecha}
          onChange={e => setFecha(e.target.value)}
          style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:16, fontFamily:'inherit', marginBottom:16 }}
        />

        <p style={{ margin:'0 0 6px', fontSize:12, color:'#6b7280', fontWeight:500 }}>👥 Cambiar grupo</p>
        <div style={{ background:'#f9fafb', borderRadius:10, overflow:'hidden', border:'1px solid #f3f4f6', marginBottom:20 }}>
          {[{ id:'__sin_cambio__', name:'Sin cambio' }, { id:'', name:'Personal' }, ...groups].map(g => (
            <div key={g.id} onClick={() => setNuevoGroupId(g.id)}
              style={{ padding:'11px 16px', fontSize:14, cursor:'pointer', borderBottom:'1px solid #f3f4f6',
                background: nuevoGroupId === g.id ? '#EDE9FE' : 'transparent',
                color: nuevoGroupId === g.id ? '#5B3DF6' : '#374151',
                fontWeight: nuevoGroupId === g.id ? 600 : 400 }}>
              {g.name}
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid #e5e7eb', background:'#fff', color:'#6b7280', fontSize:15, cursor:'pointer' }}>
            Cancelar
          </button>
          <button onClick={guardar} disabled={!hayCambio || loading}
            style={{ flex:1, padding:'12px', borderRadius:12, border:'none', fontSize:15, fontWeight:600, cursor: hayCambio ? 'pointer' : 'default',
              background: hayCambio ? '#5B3DF6' : '#e5e7eb', color: hayCambio ? '#fff' : '#9ca3af' }}>
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
  const { toggleStatus, deleteTask, updateTask }  = useTasks()
  const { leaveGroup, deleteGroup }   = useGroups()
  const perms = usePermissions(groupId)

  const {
    days, selectedKey, setSelectedKey,
    selectedDate, pending, completed,
    daysWithActivity, todayKey,
  } = usePizarronDayView(tasks)

  const [modal,       setModal]       = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())

  const haySeleccion = selectedIds.size > 0

  function toggleSeleccion(taskId) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }
  function limpiarSeleccion() { setSelectedIds(new Set()) }
  const daySelectorRef = useRef(null)

  // Centrar en "Hoy" solo al montar
  useEffect(() => {
    if (!daySelectorRef.current) return
    const hoy = daySelectorRef.current.querySelector('[data-today="true"]')
    if (hoy) hoy.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' })
  }, [])

  const groupsLoaded = state.groups.list.size > 0

  if (!group && (!groupsLoaded || loading)) {
    return (
      <div style={centered}>
        <div style={spinner} />
      </div>
    )
  }

  if (!group) {
    return (
      <EmptyState
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

      {/* ── Header ── */}
      <div style={header}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', flex:1, minWidth:0 }}
          onClick={() => navigate(`/pizarron/${groupId}/info`)}>
          <div style={groupAvatar}>{group.name[0].toUpperCase()}</div>
          <div style={{ minWidth:0 }}>
            <p style={{ margin:0, fontSize:16, fontWeight:700, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {group.name}
            </p>
            <p style={{ margin:0, fontSize:11, color:'#9ca3af' }}>
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
            <div style={{ ...memberBubble, marginLeft:-6, background:'#e5e7eb', color:'#6b7280', fontSize:10 }}>
              +{members.length - 3}
            </div>
          )}
        </div>
        <SyncBadge />
      </div>

      {/* ── Selector de días ── */}
      <div style={daySelector}>
        <div ref={daySelectorRef} style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, WebkitOverflowScrolling:'touch', scrollbarWidth:'none' }}>
          {days.map(d => {
            const isSelected = d.key === selectedKey
            const hasActivity = daysWithActivity[d.key]
            return (
              <button
                key={d.key}
                data-today={d.isToday ? 'true' : 'false'}
                onClick={() => setSelectedKey(d.key)}
                style={{
                  flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center',
                  padding:'8px 12px', borderRadius:12, border:'none', cursor:'pointer',
                  background: isSelected ? '#5B3DF6' : 'transparent',
                  WebkitTapHighlightColor:'transparent',
                  position:'relative',
                }}
              >
                <span style={{ fontSize:10, fontWeight:500, color: isSelected ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>
                  {d.isToday ? 'Hoy' : d.dayName}
                </span>
                <span style={{ fontSize:16, fontWeight:700, color: isSelected ? '#fff' : '#111', lineHeight:1.2 }}>
                  {d.dayNum}
                </span>
                {hasActivity && !isSelected && (
                  <div style={{ width:4, height:4, borderRadius:'50%', background:'#5B3DF6', marginTop:2 }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Contadores ── */}
      <div style={counters}>
        <div style={counter}>
          <span style={{ fontSize:20, fontWeight:700, color:'#5B3DF6' }}>{pending.length}</span>
          <span style={{ fontSize:11, color:'#9ca3af' }}>Pendientes</span>
        </div>
        <div style={counterDivider} />
        <div style={counter}>
          <span style={{ fontSize:20, fontWeight:700, color:'#22C55E' }}>{completed.length}</span>
          <span style={{ fontSize:11, color:'#9ca3af' }}>Completadas</span>
        </div>
      </div>

      {/* ── Lista de tareas ── */}
      <div style={taskList}>
        <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:600, color:'#374151' }}>
          {selectedDateLabel}
        </p>

        {pending.length === 0 && completed.length === 0 && (
          <p style={{ fontSize:13, color:'#9ca3af', textAlign:'center', padding:'24px 0' }}>
            Sin tareas para este día
          </p>
        )}

        {pending.map(task => {
          const member = members.find(m => m.uid === task.ownerId)
          const hora = task.dueDate ? (() => {
            const d = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
            return d.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })
          })() : null
          return (
            <div key={task.id} style={{ ...taskCard, background: selectedIds.has(task.id) ? '#f5f3ff' : 'transparent' }}>
              <button
                onClick={() => toggleSeleccion(task.id)}
                style={{ ...checkBtn,
                  border: selectedIds.has(task.id) ? '2px solid #5B3DF6' : '2px solid #d1d5db',
                  background: selectedIds.has(task.id) ? '#5B3DF6' : 'none'
                }}
              />
              <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={() => !haySeleccion && toggleStatus(task)}>
                <p style={{ margin:0, fontSize:14, fontWeight:500, color:'#111', lineHeight:1.3 }}>{task.title}</p>
                {hora && <p style={{ margin:'2px 0 0', fontSize:11, color:'#9ca3af' }}>{hora}</p>}
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

        {completed.length > 0 && (
          <>
            <p style={{ margin:'20px 0 8px', fontSize:12, color:'#9ca3af', fontWeight:600, letterSpacing:'0.04em' }}>
              COMPLETADAS ({completed.length})
            </p>
            {completed.map(task => (
              <div key={task.id} style={{ ...taskCard, opacity:0.55 }}>
                <button
                  onClick={() => toggleStatus(task)}
                  style={{ ...checkBtn, border:'2px solid #22C55E', background:'#22C55E', WebkitTapHighlightColor:'transparent' }}
                />
                <p style={{ flex:1, margin:0, fontSize:14, color:'#6b7280', textDecoration:'line-through', cursor:'pointer' }} onClick={() => toggleStatus(task)}>{task.title}</p>
              </div>
            ))}
          </>
        )}

      </div>

      {/* ── Barra contextual de selección ── */}
      {haySeleccion && (
        <div style={barraSeleccion}>
          <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>
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
            <button onClick={() => setModal({ tipo:'borrarVarias' })} style={{ ...btnBarra, background:'#fee2e2', color:'#ef4444' }}>🗑️ Eliminar</button>
          </div>
        </div>
      )}

      {/* ── Añadir tarea fijo ── */}
      {perms.canCreateGroupTask && (
        <div style={addTaskZone}>
          <button
            onClick={() => navigate(`/pizarron/${groupId}/nueva/${selectedKey}`)}
            style={addTaskBtn}
          >
            <span style={{ fontSize:20, lineHeight:1 }}>+</span>
            <span>Añadir tarea</span>
          </button>
        </div>
      )}

      {/* ── Modals ── */}
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
              updates.type = nuevoGroupId ? 'group' : 'personal'
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

const screen        = { display:'flex', flexDirection:'column', flex:1, minHeight:0, background:'#f9fafb', overflow:'hidden' }
const centered      = { display:'flex', alignItems:'center', justifyContent:'center', flex:1 }
const spinner       = { width:28, height:28, borderRadius:'50%', border:'3px solid #e5e7eb', borderTopColor:'#5B3DF6', animation:'spin 0.7s linear infinite' }
const header        = { flexShrink:0, display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'#fff', borderBottom:'1px solid #f3f4f6' }
const groupAvatar   = { width:40, height:40, borderRadius:12, background:'#EDE9FE', color:'#5B3DF6', fontSize:18, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }
const memberBubble  = { width:28, height:28, borderRadius:'50%', background:'#EDE9FE', color:'#5B3DF6', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff', flexShrink:0 }
const daySelector   = { flexShrink:0, padding:'10px 16px 6px', background:'#fff', borderBottom:'1px solid #f3f4f6' }
const counters      = { flexShrink:0, display:'flex', alignItems:'center', padding:'12px 20px', background:'#fff', borderBottom:'1px solid #f3f4f6', gap:0 }
const counter       = { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }
const counterDivider = { width:1, height:32, background:'#f3f4f6' }
const taskList      = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'16px' }
const taskCard      = { display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid #f3f4f6' }
const checkBtn      = { width:22, height:22, borderRadius:'50%', border:'2px solid #d1d5db', background:'none', cursor:'pointer', flexShrink:0, WebkitTapHighlightColor:'transparent' }
const memberMini    = { width:24, height:24, borderRadius:'50%', background:'#EDE9FE', color:'#5B3DF6', fontSize:10, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }
const btnTask       = { background:'none', border:'none', cursor:'pointer', fontSize:14, padding:'4px', color:'#9ca3af' }
const barraSeleccion = { flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'#fff', borderTop:'1px solid #f3f4f6' }
const btnBarra      = { padding:'8px 14px', borderRadius:8, border:'none', background:'#EDE9FE', color:'#5B3DF6', fontSize:13, fontWeight:600, cursor:'pointer' }
const addTaskZone   = { flexShrink:0, borderTop:'1px solid #f3f4f6', padding:'4px 16px', background:'#fff' }
const addTaskBtn    = { display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 0', background:'none', border:'none', cursor:'pointer', color:'#5B3DF6', fontSize:15, fontWeight:600, WebkitTapHighlightColor:'transparent' }
const backBtn       = { padding:'10px 20px', borderRadius:10, border:'none', background:'#5B3DF6', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }

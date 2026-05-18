import { useState, useMemo }          from 'react'
import { useParams, useNavigate }     from 'react-router-dom'
import { useDayView }                 from './hooks/useDayView'
import { DayTaskItem }                from './components/DayTaskItem'
import { useTasks }                   from '../../core/hooks/useTasks'
import { useCoreState }               from '../../core/hooks/useCoreData'
import { ConfirmDialog }              from '../../shared/ConfirmDialog'
import { TaskFormNew }                from '../../shared/TaskFormNew'
import { Timestamp }                  from 'firebase/firestore'

const DIAS  = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function labelDia(dateKey) {
  const [y,m,d] = dateKey.split('-').map(Number)
  const dt  = new Date(y, m-1, d)
  const dow = DIAS[dt.getDay()]
  return `${dow[0].toUpperCase()}${dow.slice(1)}, ${d} de ${MESES[m-1]}`
}

function EditMultiModal({ count, groups, onSave, onClose }) {
  const [fecha,   setFecha]   = useState('')
  const [groupId, setGroupId] = useState('__sin_cambio__')
  const [loading, setLoading] = useState(false)
  const hayCambio = fecha !== '' || groupId !== '__sin_cambio__'

  async function guardar() {
    setLoading(true)
    try { await onSave({ fecha, groupId }); onClose() }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#FAFAF7', borderRadius:'20px 20px 0 0', padding:'24px 20px', paddingBottom:'calc(24px + env(safe-area-inset-bottom))', width:'100%', maxWidth:480 }}>
        <p style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:'#21201E' }}>Editar {count} tarea{count!==1?'s':''}</p>
        <p style={{ margin:'0 0 20px', fontSize:13, color:'#7E7C77' }}>Solo se aplican los campos que cambies.</p>
        <p style={{ fontSize:12, color:'#7E7C77', fontWeight:600, margin:'0 0 6px' }}>Nueva fecha</p>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:12, border:'1.5px solid #E8E6E1', fontSize:15, fontFamily:'inherit', outline:'none', marginBottom:16, background:'#FFFFFF' }} />
        <p style={{ fontSize:12, color:'#7E7C77', fontWeight:600, margin:'0 0 6px' }}>Mover a grupo</p>
        <div style={{ background:'#F3F2EE', borderRadius:12, overflow:'hidden', border:'1px solid #E8E6E1', marginBottom:20 }}>
          {[{ id:'__sin_cambio__', label:'Sin cambio' },{ id:'', label:'Personal' },...groups.map(g=>({id:g.id,label:g.name}))].map(op => (
            <div key={op.id} onClick={() => setGroupId(op.id)} style={{ padding:'12px 16px', fontSize:14, cursor:'pointer', borderBottom:'1px solid #E8E6E1', background: groupId===op.id?'#EDE9FE':'transparent', color: groupId===op.id?'#5B3DF6':'#21201E', fontWeight: groupId===op.id?600:400 }}>
              {op.label}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'13px', borderRadius:12, border:'1.5px solid #E8E6E1', background:'#FFFFFF', color:'#7E7C77', fontSize:15, cursor:'pointer' }}>Cancelar</button>
          <button onClick={guardar} disabled={!hayCambio||loading} style={{ flex:1, padding:'13px', borderRadius:12, border:'none', fontSize:15, fontWeight:600, cursor:hayCambio?'pointer':'default', background:hayCambio?'#5B3DF6':'#E8E6E1', color:hayCambio?'#fff':'#A3A19C' }}>
            {loading?'Aplicando...':'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function DayModule() {
  const { date }  = useParams()
  const navigate  = useNavigate()
  const state     = useCoreState()
  const { pending, completed, getGroupName } = useDayView(date)
  const { toggleStatus, deleteTask, updateTask } = useTasks()
  const groups = useMemo(() => Array.from(state.groups.list.values()), [state.groups.list])

  const [selectedIds,  setSelectedIds]  = useState(new Set())
  const [hiddenIds,    setHiddenIds]    = useState(new Set())
  const [modal,        setModal]        = useState(null)

  const orderedPending   = pending.filter(t => !hiddenIds.has(t.id))
  const completedVisible = completed.filter(t => !hiddenIds.has(t.id))
  const haySeleccion     = selectedIds.size > 0

  function toggleSeleccion(taskId) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }
  function limpiarSeleccion() { setSelectedIds(new Set()) }
  function hideLocally(id) { setHiddenIds(prev => new Set([...prev, id])) }

  async function eliminarSeleccionadas() {
    setHiddenIds(prev => new Set([...prev, ...selectedIds]))
    limpiarSeleccion(); setModal(null)
    const todas = [...pending, ...completed]
    for (const id of selectedIds) {
      const t = todas.find(t => t.id === id)
      if (t) await deleteTask(t)
    }
  }

  async function editarSeleccionadas({ fecha, groupId }) {
    const todas = [...pending, ...completed]
    for (const id of selectedIds) {
      const t = todas.find(t => t.id === id)
      if (!t) continue
      const updates = {}
      if (fecha !== '') updates.dueDate = Timestamp.fromDate(new Date(fecha + 'T23:59:59'))
      if (groupId !== '__sin_cambio__') { updates.groupId = groupId||null; updates.type = groupId?'group':'personal' }
      if (Object.keys(updates).length > 0) await updateTask(t, updates)
    }
    limpiarSeleccion()
  }

  const dia = labelDia(date)

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, background:'#F3F2EE', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink:0, background:'#F3F2EE', padding:'16px 20px 8px' }}>
        <div style={{ display:'flex', alignItems:'flex-start' }}>
          <button onClick={() => navigate('/agenda')} style={{ background:'none', border:'none', fontSize:28, color:'#A3A19C', cursor:'pointer', padding:'0 10px 0 0', lineHeight:1.3, marginTop:4 }}>‹</button>
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 2px', fontSize:13, color:'#7E7C77', fontWeight:400 }}>{dia}</p>
            <p style={{ margin:0, fontSize:34, fontWeight:800, color:'#21201E', letterSpacing:'-0.03em', lineHeight:1.1 }}>Syng</p>
            <p style={{ margin:'4px 0 0', fontSize:22, fontWeight:800, color:'#21201E', letterSpacing:'-0.02em' }}>Pendientes</p>
            <p style={{ margin:'2px 0 0', fontSize:13, color:'#7E7C77', fontWeight:400 }}>{orderedPending.length} tarea{orderedPending.length!==1?'s':''} pendiente{orderedPending.length!==1?'s':''}</p>
          </div>
          {haySeleccion && (
            <button onClick={limpiarSeleccion} style={{ background:'none', border:'none', color:'#2B76FA', fontSize:15, fontWeight:600, cursor:'pointer', paddingTop:6 }}>
              Cancelar
            </button>
          )}
        </div>
        {!haySeleccion && (
          <button onClick={() => navigate(`/agenda/${date}/nueva`)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 0 0', background:'none', border:'none', cursor:'pointer', color:'#5B3DF6', fontSize:15, fontWeight:600, WebkitTapHighlightColor:'transparent', marginTop:8, borderTop:'1px solid rgba(33,32,30,0.08)' }}>
            <span style={{ fontSize:18, lineHeight:1 }}>+</span>
            <span>Nueva tarea</span>
          </button>
        )}
      </div>

      {/* Lista */}
      <div style={{ flex:1, overflowY:'auto', padding:'4px 16px 160px', WebkitOverflowScrolling:'touch' }}>

        {/* Pendientes */}
        {orderedPending.length === 0 && (
          <div style={{ padding:'20px 18px', background:'#FAFAF7', borderRadius:20, textAlign:'center', marginBottom:14, boxShadow:'0 12px 36px -4px rgba(35,30,20,0.04)' }}>
            <p style={{ fontSize:13, color:'#A3A19C', margin:0 }}>Sin tareas pendientes</p>
          </div>
        )}
        {orderedPending.map(task => (
          <DayTaskItem key={task.id} task={task}
            groupName={getGroupName(task.groupId)}
            onToggle={toggleStatus}
            onEdit={t => setModal({ tipo:'editar', task:t })}
            onDelete={t => { hideLocally(t.id); setModal({ tipo:'borrar', task:t }) }}
            selected={selectedIds.has(task.id)}
            onCircleTap={toggleSeleccion}
            hasSelection={haySeleccion}
          />
        ))}

        {/* Completadas */}
        {completedVisible.length > 0 && (
          <>
            <p style={{ margin:'24px 2px 2px', fontSize:22, fontWeight:800, color:'#21201E', letterSpacing:'-0.02em' }}>
              Completadas
            </p>
            <p style={{ margin:'2px 2px 14px', fontSize:13, color:'#7E7C77', fontWeight:400 }}>
              {completedVisible.length} tarea{completedVisible.length !== 1 ? 's' : ''} terminada{completedVisible.length !== 1 ? 's' : ''}
            </p>
            {completedVisible.map(task => (
              <DayTaskItem key={task.id} task={task}
                groupName={getGroupName(task.groupId)}
                onToggle={toggleStatus}
                onEdit={t => setModal({ tipo:'editar', task:t })}
                onDelete={t => { hideLocally(t.id); setModal({ tipo:'borrar', task:t }) }}
                selected={selectedIds.has(task.id)}
                onCircleTap={toggleSeleccion}
                hasSelection={haySeleccion}
              />
            ))}
          </>
        )}
      </div>

      {/* Barra flotante glassmorphism */}
      {haySeleccion && (
        <div style={{
          position:'fixed',
          bottom:'calc(28px + env(safe-area-inset-bottom))',
          left:18, right:18,
          zIndex:200,
        }}>
          {/* Pestaña superior campana */}
          <div style={{
            display:'flex', justifyContent:'center', marginBottom:-1,
          }}>
            <div style={{
              background:'rgba(253,252,248,0.6)',
              backdropFilter:'blur(24px) saturate(190%)',
              WebkitBackdropFilter:'blur(24px) saturate(190%)',
              borderRadius:'14px 14px 0 0',
              padding:'5px 20px',
              border:'1px solid rgba(255,255,255,0.6)',
              borderBottom:'none',
            }}>
              <span style={{ fontSize:11, fontWeight:600, color:'#7E7C77', letterSpacing:'0.02em' }}>Edit Toolbar</span>
            </div>
          </div>
          {/* Cuerpo principal */}
          <div style={{
            height:80,
            background:'rgba(253,252,248,0.4)',
            backdropFilter:'blur(24px) saturate(190%)',
            WebkitBackdropFilter:'blur(24px) saturate(190%)',
            borderRadius:24,
            border:'1px solid rgba(255,255,255,0.6)',
            boxShadow:'0 8px 40px rgba(35,30,20,0.12)',
            display:'flex', alignItems:'center', justifyContent:'space-around',
            padding:'0 20px',
          }}>
            <span style={{ fontSize:14, fontWeight:600, color:'#7E7C77' }}>
              {selectedIds.size} sel.
            </span>

            {/* Editar */}
            <button onClick={() => {
              const todas = [...pending, ...completed]
              const t = todas.find(t => selectedIds.has(t.id))
              if (t) { limpiarSeleccion(); setModal({ tipo:'editar', task:t }) }
            }} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', padding:'8px 16px' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <defs>
                  <linearGradient id="pencilGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#5B9EFF"/>
                    <stop offset="100%" stopColor="#2B76FA"/>
                  </linearGradient>
                </defs>
                <rect x="6" y="18" width="16" height="3" rx="1.5" fill="#2B76FA" opacity="0.3"/>
                <rect x="9" y="7" width="10" height="13" rx="2" fill="url(#pencilGrad)" transform="rotate(-45 14 14)" />
                <path d="M18 6l4 4-2 2-4-4z" fill="#5B9EFF"/>
                <path d="M7 19l1.5-1.5 2 2L9 21z" fill="#2B76FA" opacity="0.7"/>
                <line x1="12" y1="10" x2="18" y2="16" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize:12, fontWeight:600, color:'#2B76FA' }}>Editar</span>
            </button>

            {/* Eliminar */}
            <button onClick={() => setModal({ tipo:'borrarVarias' })}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', padding:'8px 16px' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <defs>
                  <linearGradient id="trashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF8A8A"/>
                    <stop offset="100%" stopColor="#EF4444"/>
                  </linearGradient>
                </defs>
                <rect x="8" y="11" width="12" height="13" rx="2" fill="url(#trashGrad)" opacity="0.85"/>
                <rect x="6" y="8" width="16" height="3" rx="1.5" fill="#EF4444"/>
                <rect x="11" y="5" width="6" height="4" rx="1" fill="#EF4444" opacity="0.7"/>
                <line x1="11" y1="14" x2="11" y2="21" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="14" y1="14" x2="14" y2="21" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="17" y1="14" x2="17" y2="21" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize:12, fontWeight:600, color:'#EF4444' }}>Eliminar</span>
            </button>
          </div>
        </div>
      )}

      {modal?.tipo === 'editar'       && <TaskFormNew task={modal.task} defaultDate={date} onClose={() => setModal(null)} />}
      {modal?.tipo === 'borrar'       && (
        <ConfirmDialog title="Eliminar tarea" message={`¿Eliminar "${modal.task.title}"?`} confirmLabel="Eliminar" danger
          onConfirm={async () => { await deleteTask(modal.task); setModal(null) }}
          onCancel={() => { setHiddenIds(prev => { const n=new Set(prev); n.delete(modal.task.id); return n }); setModal(null) }} />
      )}
      {modal?.tipo === 'borrarVarias' && (
        <ConfirmDialog title="Eliminar tareas" message={`¿Eliminar ${selectedIds.size} tarea${selectedIds.size!==1?'s':''}?`} confirmLabel={`Eliminar ${selectedIds.size}`} danger
          onConfirm={eliminarSeleccionadas} onCancel={() => setModal(null)} />
      )}
      {modal?.tipo === 'editarVarias' && (
        <EditMultiModal count={selectedIds.size} groups={groups} onSave={editarSeleccionadas} onClose={() => { setModal(null); limpiarSeleccion() }} />
      )}
    </div>
  )
}

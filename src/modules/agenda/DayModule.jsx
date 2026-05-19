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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'rgba(248,248,247,0.95)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', borderRadius:'28px 28px 0 0', padding:'24px 20px', paddingBottom:'calc(24px + env(safe-area-inset-bottom))', width:'100%', maxWidth:480, border:'1px solid rgba(255,255,255,0.5)' }}>
        <p style={{ margin:'0 0 4px', fontSize:17, fontWeight:600, color:'#1A1A1A' }}>Editar {count} tarea{count!==1?'s':''}</p>
        <p style={{ margin:'0 0 20px', fontSize:13, color:'#9B9B9B', fontWeight:400 }}>Solo se aplican los campos que cambies.</p>
        <p style={{ fontSize:12, color:'#6B6B6B', fontWeight:500, margin:'0 0 6px' }}>Nueva fecha</p>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:14, border:'1px solid rgba(0,0,0,0.08)', fontSize:15, fontFamily:'inherit', outline:'none', marginBottom:16, background:'rgba(255,255,255,0.8)' }} />
        <p style={{ fontSize:12, color:'#6B6B6B', fontWeight:500, margin:'0 0 6px' }}>Mover a grupo</p>
        <div style={{ background:'rgba(255,255,255,0.6)', borderRadius:14, overflow:'hidden', border:'1px solid rgba(0,0,0,0.06)', marginBottom:20 }}>
          {[{ id:'__sin_cambio__', label:'Sin cambio' },{ id:'', label:'Personal' },...groups.map(g=>({id:g.id,label:g.name}))].map(op => (
            <div key={op.id} onClick={() => setGroupId(op.id)} style={{ padding:'12px 16px', fontSize:14, cursor:'pointer', borderBottom:'1px solid rgba(0,0,0,0.04)', background: groupId===op.id?'rgba(74,144,226,0.1)':'transparent', color: groupId===op.id?'#2B6CB0':'#1A1A1A', fontWeight: groupId===op.id?600:400 }}>
              {op.label}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'13px', borderRadius:14, border:'1px solid rgba(0,0,0,0.08)', background:'rgba(255,255,255,0.8)', color:'#6B6B6B', fontSize:15, cursor:'pointer' }}>Cancelar</button>
          <button onClick={guardar} disabled={!hayCambio||loading} style={{ flex:1, padding:'13px', borderRadius:14, border:'none', fontSize:15, fontWeight:600, cursor:hayCambio?'pointer':'default', background:hayCambio?'#4A90E2':'rgba(0,0,0,0.08)', color:hayCambio?'#fff':'#9B9B9B' }}>
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
    <div style={{
      display:'flex', flexDirection:'column', flex:1, minHeight:'100vh', overflow:'hidden',
      background:'transparent',
    }}>

      {/* Header */}
      <div style={{ flexShrink:0, padding:'20px 22px 12px', background:'transparent' }}>
        <div style={{ display:'flex', alignItems:'flex-start' }}>
          <button onClick={() => navigate('/agenda')} style={{ background:'none', border:'none', fontSize:26, color:'#AAAAAA', cursor:'pointer', padding:'0 10px 0 0', lineHeight:1.3, marginTop:6 }}>‹</button>
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 2px', fontSize:14, color:'#6B6B6B', fontWeight:400 }}>{dia}</p>
            <p style={{ margin:'0 0 4px', fontSize:32, fontWeight:700, color:'#1A1A1A', letterSpacing:'-0.02em', lineHeight:1.1 }}>Syng</p>
            <p style={{ margin:'0 0 2px', fontSize:20, fontWeight:600, color:'#1A1A1A', letterSpacing:'-0.01em' }}>Pendientes</p>
            <p style={{ margin:0, fontSize:14, color:'#9B9B9B', fontWeight:400 }}>{orderedPending.length} task{orderedPending.length!==1?'s':''} remaining</p>
          </div>
        </div>
        {!haySeleccion && (
          <button onClick={() => navigate(`/agenda/${date}/nueva`)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 0 0', background:'none', border:'none', cursor:'pointer', color:'#4A90E2', fontSize:15, fontWeight:500, WebkitTapHighlightColor:'transparent', marginTop:12, borderTop:'1px solid rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize:18, lineHeight:1 }}>+</span>
            <span>Nueva tarea</span>
          </button>
        )}
      </div>

      {/* Lista */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px 16px 160px', WebkitOverflowScrolling:'touch' }}>
        {orderedPending.length === 0 && (
          <div style={{ padding:'20px 18px', background:'rgba(255,255,255,0.5)', backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)', borderRadius:28, textAlign:'center', marginBottom:12, border:'1px solid rgba(255,255,255,0.45)' }}>
            <p style={{ fontSize:14, color:'#9B9B9B', margin:0, fontWeight:400 }}>Sin tareas pendientes</p>
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

        {completedVisible.length > 0 && (
          <>
            <p style={{ margin:'24px 4px 4px', fontSize:20, fontWeight:600, color:'#1A1A1A', letterSpacing:'-0.01em' }}>Completadas</p>
            <p style={{ margin:'0 4px 14px', fontSize:14, color:'#9B9B9B', fontWeight:400 }}>{completedVisible.length} task{completedVisible.length!==1?'s':''} finished</p>
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

      {/* Toolbar glassmorphism */}
      {haySeleccion && (
        <div style={{
          position:'fixed',
          bottom:'calc(28px + env(safe-area-inset-bottom))',
          left:18, right:18, zIndex:200,
        }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:-1 }}>
            <div style={{
              background:'rgba(255,255,255,0.58)',
              backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
              borderRadius:'14px 14px 0 0',
              padding:'5px 24px',
              border:'1px solid rgba(255,255,255,0.35)',
              borderBottom:'none',
            }}>
              <span style={{ fontSize:11, fontWeight:600, color:'#9B9B9B', letterSpacing:'0.02em' }}>Edit Toolbar</span>
            </div>
          </div>
          <div style={{
            height:80,
            background:'rgba(255,255,255,0.58)',
            backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
            borderRadius:32,
            border:'1px solid rgba(255,255,255,0.35)',
            boxShadow:'0 20px 60px rgba(15,23,42,0.12)',
            display:'flex', alignItems:'center', justifyContent:'space-around',
            padding:'0 24px',
          }}>
            <span style={{ fontSize:14, fontWeight:500, color:'#9B9B9B' }}>
              {selectedIds.size} sel.
            </span>
            <button onClick={() => {
              const todas = [...pending, ...completed]
              const t = todas.find(t => selectedIds.has(t.id))
              if (t) { limpiarSeleccion(); setModal({ tipo:'editar', task:t }) }
            }} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', padding:'8px 20px' }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <defs>
                  <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#5B9FED"/>
                    <stop offset="100%" stopColor="#4A90E2"/>
                  </linearGradient>
                </defs>
                <rect x="5" y="17" width="14" height="2.5" rx="1.25" fill="#4A90E2" opacity="0.25"/>
                <path d="M15 4L20 9L10 19L5 20L6 15L15 4Z" fill="url(#pg)"/>
                <path d="M15 4L20 9" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize:12, fontWeight:600, color:'#4A90E2' }}>Editar</span>
            </button>
            <button onClick={() => setModal({ tipo:'borrarVarias' })}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', padding:'8px 20px' }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <defs>
                  <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E85C5C"/>
                    <stop offset="100%" stopColor="#D64545"/>
                  </linearGradient>
                </defs>
                <rect x="7" y="10" width="12" height="12" rx="2" fill="url(#tg)" opacity="0.9"/>
                <rect x="5" y="7" width="16" height="3" rx="1.5" fill="#E85C5C"/>
                <rect x="10" y="4" width="6" height="4" rx="1" fill="#E85C5C" opacity="0.6"/>
                <line x1="10" y1="13" x2="10" y2="19" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="13" y1="13" x2="13" y2="19" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="16" y1="13" x2="16" y2="19" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize:12, fontWeight:600, color:'#D64545' }}>Eliminar</span>
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

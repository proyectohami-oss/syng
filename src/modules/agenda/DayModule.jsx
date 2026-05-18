import { useState, useMemo }          from 'react'
import { useParams, useNavigate }     from 'react-router-dom'
import { useDayView }                 from './hooks/useDayView'
import { DayTaskItem }                from './components/DayTaskItem'
import { useTasks }                   from '../../core/hooks/useTasks'
import { useCoreState }               from '../../core/hooks/useCoreData'
import { ConfirmDialog }              from '../../shared/ConfirmDialog'
import { TaskFormNew }                from '../../shared/TaskFormNew'
import { Timestamp }                  from 'firebase/firestore'
import { T }                          from '../../theme'

const DIAS  = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function labelDia(dateKey) {
  const [y,m,d] = dateKey.split('-').map(Number)
  const dt  = new Date(y, m-1, d)
  const dow = DIAS[dt.getDay()]
  return { dia: `${dow[0].toUpperCase()}${dow.slice(1)}`, fecha: `${d} de ${MESES[m-1]}` }
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
      <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px', paddingBottom:'calc(24px + env(safe-area-inset-bottom))', width:'100%', maxWidth:480 }}>
        <p style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:T.textPrimary }}>Editar {count} tarea{count!==1?'s':''}</p>
        <p style={{ margin:'0 0 20px', fontSize:13, color:T.textTertiary }}>Solo se aplican los campos que cambies.</p>
        <p style={{ fontSize:12, color:T.textSecondary, fontWeight:600, margin:'0 0 6px' }}>Nueva fecha</p>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:10, border:'1.5px solid #F0F0F0', fontSize:15, fontFamily:'inherit', outline:'none', marginBottom:16 }} />
        <p style={{ fontSize:12, color:T.textSecondary, fontWeight:600, margin:'0 0 6px' }}>Mover a grupo</p>
        <div style={{ background:'#F9F9F9', borderRadius:12, overflow:'hidden', border:'1px solid #F0F0F0', marginBottom:20 }}>
          {[{ id:'__sin_cambio__', label:'Sin cambio' },{ id:'', label:'Personal' },...groups.map(g=>({id:g.id,label:g.name}))].map(op => (
            <div key={op.id} onClick={() => setGroupId(op.id)} style={{ padding:'12px 16px', fontSize:14, cursor:'pointer', borderBottom:'1px solid #F0F0F0', background: groupId===op.id?T.primaryLight:'transparent', color: groupId===op.id?T.primary:T.textPrimary, fontWeight: groupId===op.id?600:400 }}>
              {op.label}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'13px', borderRadius:12, border:'1.5px solid #F0F0F0', background:'#fff', color:T.textSecondary, fontSize:15, cursor:'pointer' }}>Cancelar</button>
          <button onClick={guardar} disabled={!hayCambio||loading} style={{ flex:1, padding:'13px', borderRadius:12, border:'none', fontSize:15, fontWeight:600, cursor:hayCambio?'pointer':'default', background:hayCambio?T.primary:'#E5E7EB', color:hayCambio?'#fff':T.textTertiary }}>
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

  const { dia, fecha } = labelDia(date)

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, background:'#F5F5F7', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink:0, background:'#FFFFFF', borderBottom:'1px solid #F0F0F0', padding:'16px 20px 12px' }}>
        <div style={{ display:'flex', alignItems:'flex-start' }}>
          <button onClick={() => navigate('/agenda')} style={{ background:'none', border:'none', fontSize:28, color:'#C0C0C0', cursor:'pointer', padding:'0 12px 0 0', lineHeight:1.2, marginTop:2 }}>‹</button>
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 0', fontSize:13, color:'#9CA3AF', fontWeight:400 }}>{dia}</p>
            <p style={{ margin:'0 0 2px', fontSize:32, fontWeight:800, color:'#0F0F0F', letterSpacing:'-0.03em', lineHeight:1.1 }}>Syng</p>
            <p style={{ margin:0, fontSize:17, fontWeight:500, color:'#6B7280' }}>{fecha}</p>
          </div>
          {haySeleccion && (
            <button onClick={limpiarSeleccion} style={{ background:'none', border:'none', color:T.primary, fontSize:15, fontWeight:600, cursor:'pointer', paddingTop:4 }}>
              Cancelar
            </button>
          )}
        </div>
        {!haySeleccion && (
          <button onClick={() => navigate(`/agenda/${date}/nueva`)}
            style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 0 0', background:'none', border:'none', borderTop:'none', cursor:'pointer', color:T.primary, fontSize:15, fontWeight:600, WebkitTapHighlightColor:'transparent', marginTop:10, borderTop:'1px solid #F5F5F7' }}>
            <span style={{ fontSize:20, lineHeight:1 }}>+</span>
            <span>Nueva tarea</span>
          </button>
        )}
      </div>

      {/* Lista */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 140px', WebkitOverflowScrolling:'touch' }}>

        {/* Pendientes */}
        <p style={{ margin:'0 4px 10px', fontSize:18, fontWeight:800, color:'#0F0F0F', letterSpacing:'-0.02em' }}>
          Pendientes ({orderedPending.length})
        </p>
        {orderedPending.length === 0 && (
          <div style={{ padding:'20px 16px', background:'#FFFFFF', borderRadius:16, textAlign:'center', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize:13, color:'#9CA3AF', margin:0 }}>Sin tareas pendientes</p>
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
            <p style={{ margin:'24px 4px 10px', fontSize:18, fontWeight:800, color:'#0F0F0F', letterSpacing:'-0.02em' }}>
              Completadas ({completedVisible.length})
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
          bottom:'calc(90px + env(safe-area-inset-bottom))',
          left:16, right:16,
          background:'rgba(255,255,255,0.92)',
          backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
          borderRadius:20, padding:'14px 20px',
          boxShadow:'0 8px 40px rgba(0,0,0,0.18)',
          display:'flex', alignItems:'center', gap:12, zIndex:200,
          border:'1px solid rgba(255,255,255,0.6)',
        }}>
          <span style={{ flex:1, fontSize:14, fontWeight:600, color:'#374151' }}>
            {selectedIds.size} seleccionada{selectedIds.size!==1?'s':''}
          </span>
          <button onClick={() => {
            const todas = [...pending, ...completed]
            const t = todas.find(t => selectedIds.has(t.id))
            if (t) { limpiarSeleccion(); setModal({ tipo:'editar', task:t }) }
          }} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:12, border:'none', background:'rgba(91,61,246,0.1)', color:T.primary, fontSize:14, fontWeight:600, cursor:'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar
          </button>
          <button onClick={() => setModal({ tipo:'borrarVarias' })}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:12, border:'none', background:'rgba(239,68,68,0.1)', color:'#EF4444', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
            Eliminar
          </button>
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

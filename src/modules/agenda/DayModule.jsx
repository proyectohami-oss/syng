import { useState, useMemo }          from 'react'
import { useParams, useNavigate }     from 'react-router-dom'
import { useDayView }                 from './hooks/useDayView'
import { DayTaskItem }                from './components/DayTaskItem'
import { useTasks }                   from '../../core/hooks/useTasks'
import { useCoreState }               from '../../core/hooks/useCoreData'
import { ConfirmDialog }              from '../../shared/ConfirmDialog'
import { TaskFormNew }                from '../../shared/TaskFormNew'
import { Timestamp }                  from 'firebase/firestore'

const DIAS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
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
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={sheet}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <button onClick={onClose} style={btnVolver}>‹</button>
          <span style={{ fontSize:17, fontWeight:600, color:'#111' }}>Editar {count} tarea{count!==1?'s':''}</span>
        </div>
        <p style={{ fontSize:13, color:'#9ca3af', margin:'0 0 16px' }}>Solo se aplican los campos que cambies.</p>
        <p style={{ fontSize:12, color:'#6b7280', fontWeight:500, margin:'0 0 6px' }}>Nueva fecha</p>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />
        <p style={{ fontSize:12, color:'#6b7280', fontWeight:500, margin:'16px 0 6px' }}>Mover a grupo</p>
        <div style={{ background:'#f9fafb', borderRadius:10, overflow:'hidden', border:'1px solid #f3f4f6' }}>
          {[{ id:'__sin_cambio__', label:'Sin cambio' },{ id:'', label:'Personal' },...groups.map(g=>({id:g.id,label:g.name}))].map(op => (
            <div key={op.id} onClick={() => setGroupId(op.id)} style={{ padding:'11px 16px', fontSize:14, cursor:'pointer', borderBottom:'1px solid #f3f4f6', background: groupId===op.id?'#EDE9FE':'transparent', color: groupId===op.id?'#5B3DF6':'#374151', fontWeight: groupId===op.id?600:400 }}>
              {op.label}
            </div>
          ))}
        </div>
        <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={guardar} disabled={!hayCambio||loading} style={{ width:'100%', padding:'13px', borderRadius:12, border:'none', fontSize:15, fontWeight:600, cursor:hayCambio?'pointer':'default', background:hayCambio?'#5B3DF6':'#e5e7eb', color:hayCambio?'#fff':'#9ca3af' }}>
            {loading?'Aplicando...':'Aplicar cambios'}
          </button>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', fontSize:15, cursor:'pointer', padding:'8px' }}>Cancelar</button>
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
  const [pendingOrder, setPendingOrder] = useState(null)

  const orderedPending  = (pendingOrder ?? pending).filter(t => !hiddenIds.has(t.id))
  const completedVisible = completed.filter(t => !hiddenIds.has(t.id))
  const haySeleccion    = selectedIds.size > 0

  function toggleSeleccion(taskId) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }

  function limpiarSeleccion() { setSelectedIds(new Set()) }

  // Move up/down for mobile reorder
  function moveTask(taskId, dir) {
    const arr = [...orderedPending]
    const idx = arr.findIndex(t => t.id === taskId)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= arr.length) return
    const tmp = arr[idx]; arr[idx] = arr[newIdx]; arr[newIdx] = tmp
    setPendingOrder(arr)
  }

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

  return (
    <div style={screen}>
      <div style={header}>
        <button onClick={() => navigate('/agenda')} style={btnVolver} aria-label="Volver">‹</button>
        <span style={{ fontSize:15, fontWeight:600, color:'#111', flex:1 }}>{labelDia(date)}</span>
        {haySeleccion && (
          <button onClick={limpiarSeleccion} style={{ background:'none', border:'none', color:'#5B3DF6', fontSize:14, fontWeight:500, cursor:'pointer', padding:'8px' }}>
            Cancelar
          </button>
        )}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 20px', WebkitOverflowScrolling:'touch' }}>
        <p style={{ fontSize:13, fontWeight:600, color:'#5B3DF6', margin:'16px 0 6px' }}>
          Pendientes ({orderedPending.length})
        </p>
        {orderedPending.length === 0 && <p style={{ fontSize:13, color:'#9ca3af', marginBottom:16 }}>Sin tareas pendientes.</p>}
        {orderedPending.map((task, idx) => (
          <DayTaskItem
            key={task.id} task={task}
            groupName={getGroupName(task.groupId)}
            onToggle={toggleStatus}
            onEdit={t => setModal({ tipo:'editar', task:t })}
            onDelete={t => { hideLocally(t.id); setModal({ tipo:'borrar', task:t }) }}
            selected={selectedIds.has(task.id)}
            onCircleTap={toggleSeleccion}
            hasSelection={haySeleccion}
            draggable={!haySeleccion}
            onMoveUp={idx > 0 ? () => moveTask(task.id, -1) : null}
            onMoveDown={idx < orderedPending.length-1 ? () => moveTask(task.id, 1) : null}
          />
        ))}

        <p style={{ fontSize:13, fontWeight:600, color:'#22C55E', margin:'20px 0 6px' }}>
          Completadas ({completedVisible.length})
        </p>
        {completedVisible.length === 0 && <p style={{ fontSize:13, color:'#9ca3af', marginBottom:16 }}>Ninguna completada aún.</p>}
        {completedVisible.map(task => (
          <DayTaskItem
            key={task.id} task={task}
            groupName={getGroupName(task.groupId)}
            onToggle={toggleStatus}
            onEdit={t => setModal({ tipo:'editar', task:t })}
            onDelete={t => { hideLocally(t.id); setModal({ tipo:'borrar', task:t }) }}
            selected={selectedIds.has(task.id)}
            onCircleTap={toggleSeleccion}
            hasSelection={haySeleccion}
            draggable={false}
          />
        ))}
        <div style={{ height:140 }} />
      </div>

      {/* Selection bar — fixed at bottom, appears automatically */}
      {haySeleccion && (
        <div style={barraSeleccion}>
          <span style={{ fontSize:13, fontWeight:500, color:'#374151' }}>
            {selectedIds.size} seleccionada{selectedIds.size!==1?'s':''}
          </span>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setModal({ tipo:'editarVarias' })} style={{ padding:'9px 16px', background:'#EDE9FE', color:'#5B3DF6', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              ✏️ Editar
            </button>
            <button onClick={() => setModal({ tipo:'borrarVarias' })} style={{ padding:'9px 16px', background:'#ef4444', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              🗑️ Eliminar
            </button>
          </div>
        </div>
      )}

      {!haySeleccion && (
        <button onClick={() => setModal({ tipo:'nueva' })} style={fab} aria-label="Nueva tarea">
          <span style={{ fontSize:28, color:'#fff', lineHeight:1 }}>+</span>
        </button>
      )}

      {modal?.tipo === 'nueva'       && <TaskFormNew defaultDate={date} onClose={() => setModal(null)} />}
      {modal?.tipo === 'editar'      && <TaskFormNew task={modal.task} defaultDate={date} onClose={() => setModal(null)} />}
      {modal?.tipo === 'borrar'      && (
        <ConfirmDialog title="Eliminar tarea" message={`¿Eliminar "${modal.task.title}"?`} confirmLabel="Eliminar" danger
          onConfirm={async () => { await deleteTask(modal.task); setModal(null) }}
          onCancel={() => { setHiddenIds(prev => { const n=new Set(prev); n.delete(modal.task.id); return n }); setModal(null) }}
        />
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

const screen       = { display:'flex', flexDirection:'column', height:'100%', background:'#fff', overflow:'hidden', position:'relative' }
const header       = { display:'flex', alignItems:'center', gap:8, padding:'14px 20px', borderBottom:'1px solid #f3f4f6', flexShrink:0, paddingTop:'max(14px, env(safe-area-inset-top))' }
const btnVolver    = { background:'none', border:'none', fontSize:22, color:'#6b7280', cursor:'pointer', padding:'0 4px', minWidth:44, minHeight:44, display:'flex', alignItems:'center', justifyContent:'center' }
const barraSeleccion = { position:'fixed', bottom:0, left:0, right:0, zIndex:150, padding:'12px 20px', paddingBottom:'calc(16px + env(safe-area-inset-bottom))', background:'#fff', borderTop:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between' }
const fab          = { position:'fixed', bottom:'calc(80px + env(safe-area-inset-bottom))', right:20, width:56, height:56, borderRadius:'50%', background:'#5B3DF6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(91,61,246,0.4)', zIndex:100, WebkitTapHighlightColor:'transparent' }
const overlay      = { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }
const sheet        = { background:'#fff', borderRadius:'20px 20px 0 0', padding:'20px 20px', paddingBottom:'calc(20px + env(safe-area-inset-bottom))', width:'100%', maxWidth:480 }
const inputStyle   = { width:'100%', boxSizing:'border-box', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:14, color:'#111', fontFamily:'inherit', outline:'none', marginBottom:4 }

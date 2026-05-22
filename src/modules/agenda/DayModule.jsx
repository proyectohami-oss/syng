import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDayView } from './hooks/useDayView'
import { DayTaskItem } from './components/DayTaskItem'
import { useTasks } from '../../core/hooks/useTasks'
import { useCoreState } from '../../core/hooks/useCoreData'
import { ConfirmDialog } from '../../shared/ConfirmDialog'
import { TaskFormNew } from '../../shared/TaskFormNew'
import { Timestamp } from 'firebase/firestore'

const DIAS  = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function labelDia(dateKey) {
  const [y,m,d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m-1, d)
  return `${DIAS[dt.getDay()][0].toUpperCase()}${DIAS[dt.getDay()].slice(1)}, ${d} de ${MESES[m-1]}`
}

function EditMultiModal({ count, groups, onSave, onClose }) {
  const [fecha, setFecha] = useState('')
  const [groupId, setGroupId] = useState('__sin_cambio__')
  const [loading, setLoading] = useState(false)
  const hayCambio = fecha !== '' || groupId !== '__sin_cambio__'
  async function guardar() {
    setLoading(true)
    try { await onSave({ fecha, groupId }); onClose() } finally { setLoading(false) }
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.3)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'rgba(250,249,246,0.92)', backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)', borderRadius:'32px 32px 0 0', padding:'28px 24px', paddingBottom:'calc(28px + env(safe-area-inset-bottom))', width:'100%', maxWidth:480, border:'1px solid rgba(255,255,255,0.4)' }}>
        <p style={{ margin:'0 0 6px', fontSize:18, fontWeight:700, color:'#0F172A' }}>Editar {count} tarea{count!==1?'s':''}</p>
        <p style={{ margin:'0 0 24px', fontSize:13, color:'rgba(15,23,42,0.4)' }}>Solo se aplican los campos que cambies.</p>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ width:'100%', boxSizing:'border-box', padding:'12px 16px', borderRadius:16, border:'1px solid rgba(15,23,42,0.1)', fontSize:15, fontFamily:'inherit', outline:'none', marginBottom:16, background:'rgba(255,255,255,0.7)' }} />
        <div style={{ background:'rgba(255,255,255,0.5)', borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.4)', marginBottom:24 }}>
          {[{ id:'__sin_cambio__', label:'Sin cambio' },{ id:'', label:'Personal' },...groups.map(g=>({id:g.id,label:g.name}))].map(op => (
            <div key={op.id} onClick={() => setGroupId(op.id)} style={{ padding:'13px 18px', fontSize:14, cursor:'pointer', borderBottom:'1px solid rgba(15,23,42,0.05)', background: groupId===op.id?'rgba(59,130,246,0.10)':'transparent', color: groupId===op.id?'#1d4ed8':'#0F172A', fontWeight: groupId===op.id?600:400 }}>{op.label}</div>
          ))}
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={onClose} style={{ flex:1, padding:'14px', borderRadius:16, border:'1px solid rgba(15,23,42,0.1)', background:'rgba(255,255,255,0.6)', color:'rgba(15,23,42,0.45)', fontSize:15, cursor:'pointer' }}>Cancelar</button>
          <button onClick={guardar} disabled={!hayCambio||loading} style={{ flex:1, padding:'14px', borderRadius:16, border:'none', fontSize:15, fontWeight:600, cursor:hayCambio?'pointer':'default', background:hayCambio?'#3B82F6':'rgba(15,23,42,0.08)', color:hayCambio?'#fff':'rgba(15,23,42,0.28)' }}>{loading?'Aplicando...':'Aplicar'}</button>
        </div>
      </div>
    </div>
  )
}

export function DayModule() {
  const { date } = useParams()
  const navigate = useNavigate()
  const state = useCoreState()
  const { pending, completed, getGroupName } = useDayView(date)
  const { toggleStatus, deleteTask, updateTask } = useTasks()
  const groups = useMemo(() => Array.from(state.groups.list.values()), [state.groups.list])

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [hiddenIds, setHiddenIds] = useState(new Set())
  const [modal, setModal] = useState(null)

  const orderedPending = pending.filter(t => !hiddenIds.has(t.id))
  const completedVisible = completed.filter(t => !hiddenIds.has(t.id))
  const haySeleccion = selectedIds.size > 0

  function toggleSeleccion(id) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function limpiarSeleccion() { setSelectedIds(new Set()) }
  function hideLocally(id) { setHiddenIds(prev => new Set([...prev, id])) }

  async function eliminarSeleccionadas() {
    setHiddenIds(prev => new Set([...prev, ...selectedIds]))
    limpiarSeleccion(); setModal(null)
    for (const id of selectedIds) {
      const t = [...pending,...completed].find(t => t.id === id)
      if (t) await deleteTask(t)
    }
  }

  async function editarSeleccionadas({ fecha, groupId }) {
    for (const id of selectedIds) {
      const t = [...pending,...completed].find(t => t.id === id)
      if (!t) continue
      const u = {}
      if (fecha) u.dueDate = Timestamp.fromDate(new Date(fecha+'T23:59:59'))
      if (groupId !== '__sin_cambio__') { u.groupId = groupId||null; u.type = groupId?'group':'personal' }
      if (Object.keys(u).length) await updateTask(t, u)
    }
    limpiarSeleccion()
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
      background: 'transparent',
    }}>

      {/* Header */}
      <div style={{ flexShrink:0, padding:'24px 24px 18px', background:'transparent' }}>
        <div style={{ display:'flex', alignItems:'flex-start' }}>
          <button onClick={() => navigate('/agenda')} style={{ background:'none', border:'none', fontSize:28, color:'rgba(15,23,42,0.22)', cursor:'pointer', padding:'0 12px 0 0', lineHeight:1.3, marginTop:8 }}>‹</button>
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 6px', fontSize:12, color:'rgba(15,23,42,0.36)', fontWeight:500, letterSpacing:'0.07em', textTransform:'uppercase' }}>{labelDia(date)}</p>
            <p style={{ margin:'0 0 10px', fontSize:38, fontWeight:800, color:'#0F172A', letterSpacing:'-0.04em', lineHeight:1 }}>Syng</p>
            <p style={{ margin:'0 0 3px', fontSize:22, fontWeight:700, color:'#0F172A', letterSpacing:'-0.02em' }}>Pendientes</p>
            <p style={{ margin:0, fontSize:13, color:'rgba(15,23,42,0.30)', fontWeight:400 }}>{orderedPending.length} tarea{orderedPending.length!==1?'s':''} pendiente{orderedPending.length!==1?'s':''}</p>
          </div>
        </div>
      </div>

      {/* Scroll */}
      <div style={{ flex:1, overflowY:'auto', padding:'4px 16px 140px', WebkitOverflowScrolling:'touch' }}>

        {/* Tareas pendientes */}
        {orderedPending.length === 0 && (
          <p style={{ fontSize:14, color:'rgba(15,23,42,0.28)', margin:'16px 0', textAlign:'center' }}>Sin tareas pendientes ✨</p>
        )}
        {orderedPending.map(task => (
          <DayTaskItem
            key={task.id}
            task={task}
            groupName={getGroupName(task.groupId)}
            onToggle={toggleStatus}
            onEdit={t => setModal({ tipo:'editar', task:t })}
            onDelete={t => { hideLocally(t.id); setModal({ tipo:'borrar', task:t }) }}
            selected={selectedIds.has(task.id)}
            onCircleTap={toggleSeleccion}
            hasSelection={haySeleccion}
            variant="pending"
          />
        ))}

        {/* Toolbar sticky con emojis 3D */}
        {haySeleccion && (
          <div style={{ position:'sticky', bottom:12, zIndex:500, margin:'12px 0' }}>
            <div style={{
              height: 84,
              background: 'rgba(246,250,255,0.88)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderRadius: 28,
              border: '1px solid rgba(120,215,255,0.28)',
              boxShadow: '0 16px 48px rgba(15,23,42,0.12), 0 3px 12px rgba(15,23,42,0.06), 0 -2px 18px rgba(56,189,248,0.10), inset 0 1px 0 rgba(255,255,255,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '0 16px',
            }}>
              <span style={{ fontSize:12, fontWeight:600, color:'rgba(15,23,42,0.28)', letterSpacing:'0.03em' }}>{selectedIds.size} sel.</span>
              <button onClick={() => {
                const t = [...pending,...completed].find(t => selectedIds.has(t.id))
                if (t) { limpiarSeleccion(); setModal({ tipo:'editar', task:t }) }
              }} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', padding:'4px 24px', WebkitTapHighlightColor:'transparent' }}>
                <span style={{ fontSize:36, lineHeight:1, filter:'drop-shadow(0 2px 6px rgba(59,130,246,0.30))' }}>✏️</span>
                <span style={{ fontSize:11, fontWeight:700, color:'#2563EB', letterSpacing:'0.02em' }}>Editar</span>
              </button>
              <button onClick={() => setModal({ tipo:'borrarVarias' })} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', padding:'4px 24px', WebkitTapHighlightColor:'transparent' }}>
                <span style={{ fontSize:36, lineHeight:1, filter:'drop-shadow(0 2px 6px rgba(239,68,68,0.30))' }}>🗑️</span>
                <span style={{ fontSize:11, fontWeight:700, color:'#DC2626', letterSpacing:'0.02em' }}>Eliminar</span>
              </button>
            </div>
          </div>
        )}

        {/* Completadas */}
        {completedVisible.length > 0 && (
          <>
            <div style={{ padding:'8px 4px 10px' }}>
              <p style={{ margin:0, fontSize:22, fontWeight:700, color:'#0F172A', letterSpacing:'-0.02em' }}>Completadas</p>
              <p style={{ margin:'2px 0 0', fontSize:13, color:'rgba(15,23,42,0.30)', fontWeight:400 }}>{completedVisible.length} tarea{completedVisible.length!==1?'s':''} completada{completedVisible.length!==1?'s':''}</p>
            </div>
            {completedVisible.map(task => (
              <DayTaskItem
                key={task.id}
                task={task}
                groupName={getGroupName(task.groupId)}
                onToggle={toggleStatus}
                onEdit={t => setModal({ tipo:'editar', task:t })}
                onDelete={t => { hideLocally(t.id); setModal({ tipo:'borrar', task:t }) }}
                selected={selectedIds.has(task.id)}
                onCircleTap={toggleSeleccion}
                hasSelection={haySeleccion}
                variant="completed"
              />
            ))}
          </>
        )}
      </div>

      {/* ── FAB: Nueva tarea — esquina inferior derecha ── */}
      {!haySeleccion && (
        <button
          onClick={() => navigate(`/agenda/${date}/nueva`)}
          style={{
            position: 'fixed',
            bottom: 'calc(76px + env(safe-area-inset-bottom))',
            right: 20,
            zIndex: 400,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #5B9BF6 0%, #3B82F6 50%, #2563EB 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(59,130,246,0.50), 0 2px 8px rgba(59,130,246,0.30), inset 0 1px 1px rgba(255,255,255,0.25)',
            WebkitTapHighlightColor: 'transparent',
            transition: 'transform 0.15s ease',
          }}
        >
          <span style={{ fontSize: 28, color: '#fff', lineHeight: 1, marginTop: -2, fontWeight: 300 }}>+</span>
        </button>
      )}

      {modal?.tipo==='editar' && <TaskFormNew task={modal.task} defaultDate={date} onClose={() => setModal(null)} />}
      {modal?.tipo==='borrar' && <ConfirmDialog title="Eliminar tarea" message={`¿Eliminar "${modal.task.title}"?`} confirmLabel="Eliminar" danger onConfirm={async () => { await deleteTask(modal.task); setModal(null) }} onCancel={() => { setHiddenIds(prev => { const n=new Set(prev); n.delete(modal.task.id); return n }); setModal(null) }} />}
      {modal?.tipo==='borrarVarias' && <ConfirmDialog title="Eliminar tareas" message={`¿Eliminar ${selectedIds.size} tarea${selectedIds.size!==1?'s':''}?`} confirmLabel={`Eliminar ${selectedIds.size}`} danger onConfirm={eliminarSeleccionadas} onCancel={() => setModal(null)} />}
      {modal?.tipo==='editarVarias' && <EditMultiModal count={selectedIds.size} groups={groups} onSave={editarSeleccionadas} onClose={() => { setModal(null); limpiarSeleccion() }} />}
    </div>
  )
}

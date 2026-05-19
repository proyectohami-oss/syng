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
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden', background:'transparent' }}>

      {/* Header */}
      <div style={{ flexShrink:0, padding:'20px 22px 16px', background:'transparent' }}>
        <div style={{ display:'flex', alignItems:'flex-start' }}>
          <button onClick={() => navigate('/agenda')} style={{ background:'none', border:'none', fontSize:26, color:'rgba(15,23,42,0.25)', cursor:'pointer', padding:'0 10px 0 0', lineHeight:1.3, marginTop:6 }}>‹</button>
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 4px', fontSize:13, color:'rgba(15,23,42,0.45)', fontWeight:400, letterSpacing:'0.01em' }}>{labelDia(date)}</p>
            <p style={{ margin:'0 0 4px', fontSize:36, fontWeight:800, color:'#0F172A', letterSpacing:'-0.03em', lineHeight:1.05 }}>Syng</p>
            <p style={{ margin:'0 0 2px', fontSize:22, fontWeight:700, color:'#0F172A', letterSpacing:'-0.01em' }}>Pendientes</p>
            <p style={{ margin:0, fontSize:13, color:'rgba(15,23,42,0.38)', fontWeight:400 }}>{orderedPending.length} tarea{orderedPending.length!==1?'s':''} pendiente{orderedPending.length!==1?'s':''}</p>
          </div>
        </div>
        {!haySeleccion && (
          <button onClick={() => navigate(`/agenda/${date}/nueva`)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 0 0', background:'none', border:'none', cursor:'pointer', color:'#3B82F6', fontSize:15, fontWeight:500, WebkitTapHighlightColor:'transparent', marginTop:12, borderTop:'1px solid rgba(15,23,42,0.06)', width:'100%' }}>
            <span style={{ fontSize:18 }}>+</span>
            <span>Nueva tarea</span>
          </button>
        )}
      </div>

      {/* Lista */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px 16px 200px', WebkitOverflowScrolling:'touch' }}>

        {/* Contenedor pendientes */}
        <div style={{
          background: 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.40)',
          borderRadius: 32,
          padding: '16px',
          marginBottom: 20,
          boxShadow: '0 30px 60px -15px rgba(0,0,0,0.04)',
        }}>
          {orderedPending.length === 0 && (
            <p style={{ fontSize:14, color:'rgba(15,23,42,0.3)', margin:'8px 0', textAlign:'center' }}>Sin tareas pendientes ✨</p>
          )}
          {orderedPending.map(task => (
            <DayTaskItem key={task.id} task={task} groupName={getGroupName(task.groupId)}
              onToggle={toggleStatus} onEdit={t => setModal({ tipo:'editar', task:t })}
              onDelete={t => { hideLocally(t.id); setModal({ tipo:'borrar', task:t }) }}
              selected={selectedIds.has(task.id)} onCircleTap={toggleSeleccion} hasSelection={haySeleccion} />
          ))}
        </div>

        {/* Contenedor completadas */}
        {completedVisible.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.45)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.40)',
            borderRadius: 32,
            padding: '16px',
            marginBottom: 20,
            boxShadow: '0 30px 60px -15px rgba(0,0,0,0.04)',
          }}>
            <p style={{ margin:'4px 4px 12px', fontSize:20, fontWeight:700, color:'#0F172A', letterSpacing:'-0.01em' }}>Completadas</p>
            <p style={{ margin:'-8px 4px 14px', fontSize:13, color:'rgba(15,23,42,0.38)', fontWeight:400 }}>{completedVisible.length} tarea{completedVisible.length!==1?'s':''} completada{completedVisible.length!==1?'s':''}</p>
            {completedVisible.map(task => (
              <DayTaskItem key={task.id} task={task} groupName={getGroupName(task.groupId)}
                onToggle={toggleStatus} onEdit={t => setModal({ tipo:'editar', task:t })}
                onDelete={t => { hideLocally(t.id); setModal({ tipo:'borrar', task:t }) }}
                selected={selectedIds.has(task.id)} onCircleTap={toggleSeleccion} hasSelection={haySeleccion} />
            ))}
          </div>
        )}
      </div>

      {/* Toolbar flotante glass */}
      {haySeleccion && (
        <div style={{ position:'fixed', bottom:'calc(90px + env(safe-area-inset-bottom))', left:18, right:18, zIndex:500 }}>

          <div style={{
            height:86,
            background:'rgba(250,247,240,0.75)',
            backdropFilter:'blur(32px) saturate(180%)', WebkitBackdropFilter:'blur(32px) saturate(180%)',
            borderRadius:28,
            border:'1px solid rgba(255,255,255,0.6)',
            boxShadow:'0 20px 60px rgba(15,23,42,0.18), 0 4px 16px rgba(15,23,42,0.08), inset 0 1px 1px rgba(255,255,255,0.9)',
            display:'flex', alignItems:'center', justifyContent:'space-around', padding:'0 24px',
          }}>
            <span style={{ fontSize:13, fontWeight:500, color:'rgba(15,23,42,0.4)' }}>{selectedIds.size} sel.</span>

            <button onClick={() => {
              const t = [...pending,...completed].find(t => selectedIds.has(t.id))
              if (t) { limpiarSeleccion(); setModal({ tipo:'editar', task:t }) }
            }} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', padding:'8px 20px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span style={{ fontSize:12, fontWeight:600, color:'#3B82F6' }}>Editar</span>
            </button>

            <button onClick={() => setModal({ tipo:'borrarVarias' })} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', padding:'8px 20px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              <span style={{ fontSize:12, fontWeight:600, color:'#EF4444' }}>Eliminar</span>
            </button>
          </div>
        </div>
      )}

      {modal?.tipo==='editar' && <TaskFormNew task={modal.task} defaultDate={date} onClose={() => setModal(null)} />}
      {modal?.tipo==='borrar' && <ConfirmDialog title="Eliminar tarea" message={`¿Eliminar "${modal.task.title}"?`} confirmLabel="Eliminar" danger onConfirm={async () => { await deleteTask(modal.task); setModal(null) }} onCancel={() => { setHiddenIds(prev => { const n=new Set(prev); n.delete(modal.task.id); return n }); setModal(null) }} />}
      {modal?.tipo==='borrarVarias' && <ConfirmDialog title="Eliminar tareas" message={`¿Eliminar ${selectedIds.size} tarea${selectedIds.size!==1?'s':''}?`} confirmLabel={`Eliminar ${selectedIds.size}`} danger onConfirm={eliminarSeleccionadas} onCancel={() => setModal(null)} />}
      {modal?.tipo==='editarVarias' && <EditMultiModal count={selectedIds.size} groups={groups} onSave={editarSeleccionadas} onClose={() => { setModal(null); limpiarSeleccion() }} />}
    </div>
  )
}

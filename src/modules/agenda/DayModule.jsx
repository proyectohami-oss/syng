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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'rgba(248,248,250,0.92)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)', borderRadius:'28px 28px 0 0', padding:'28px 24px', paddingBottom:'calc(28px + env(safe-area-inset-bottom))', width:'100%', maxWidth:480, border:'1px solid rgba(255,255,255,0.6)' }}>
        <p style={{ margin:'0 0 6px', fontSize:18, fontWeight:600, color:'#111827' }}>Editar {count} tarea{count!==1?'s':''}</p>
        <p style={{ margin:'0 0 24px', fontSize:13, color:'rgba(0,0,0,0.4)', fontWeight:400 }}>Solo se aplican los campos que cambies.</p>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ width:'100%', boxSizing:'border-box', padding:'12px 16px', borderRadius:16, border:'1px solid rgba(0,0,0,0.08)', fontSize:15, fontFamily:'inherit', outline:'none', marginBottom:16, background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }} />
        <div style={{ background:'rgba(255,255,255,0.5)', borderRadius:16, overflow:'hidden', border:'1px solid rgba(0,0,0,0.06)', marginBottom:24 }}>
          {[{ id:'__sin_cambio__', label:'Sin cambio' },{ id:'', label:'Personal' },...groups.map(g=>({id:g.id,label:g.name}))].map(op => (
            <div key={op.id} onClick={() => setGroupId(op.id)} style={{ padding:'13px 18px', fontSize:14, cursor:'pointer', borderBottom:'1px solid rgba(0,0,0,0.04)', background: groupId===op.id?'rgba(74,144,226,0.12)':'transparent', color: groupId===op.id?'#2563eb':'#111827', fontWeight: groupId===op.id?600:400 }}>{op.label}</div>
          ))}
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={onClose} style={{ flex:1, padding:'14px', borderRadius:16, border:'1px solid rgba(0,0,0,0.08)', background:'rgba(255,255,255,0.6)', color:'rgba(0,0,0,0.5)', fontSize:15, cursor:'pointer' }}>Cancelar</button>
          <button onClick={guardar} disabled={!hayCambio||loading} style={{ flex:1, padding:'14px', borderRadius:16, border:'none', fontSize:15, fontWeight:600, cursor:hayCambio?'pointer':'default', background:hayCambio?'#4A90E2':'rgba(0,0,0,0.08)', color:hayCambio?'#fff':'rgba(0,0,0,0.3)' }}>{loading?'Aplicando...':'Aplicar'}</button>
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
      <div style={{ flexShrink:0, padding:'24px 24px 16px', background:'transparent' }}>
        <div style={{ display:'flex', alignItems:'flex-start' }}>
          <button onClick={() => navigate('/agenda')} style={{ background:'none', border:'none', fontSize:28, color:'rgba(0,0,0,0.25)', cursor:'pointer', padding:'0 12px 0 0', lineHeight:1.3, marginTop:4 }}>‹</button>
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 2px', fontSize:13, color:'rgba(0,0,0,0.4)', fontWeight:400 }}>{labelDia(date)}</p>
            <p style={{ margin:'0 0 6px', fontSize:34, fontWeight:700, color:'#111827', letterSpacing:'-0.03em', lineHeight:1.1 }}>Syng</p>
            <p style={{ margin:'0 0 2px', fontSize:22, fontWeight:600, color:'#111827', letterSpacing:'-0.01em' }}>Pendientes</p>
            <p style={{ margin:0, fontSize:13, color:'rgba(0,0,0,0.38)', fontWeight:400 }}>{orderedPending.length} task{orderedPending.length!==1?'s':''} remaining</p>
          </div>
        </div>
        {!haySeleccion && (
          <button onClick={() => navigate(`/agenda/${date}/nueva`)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 0 0', background:'none', border:'none', cursor:'pointer', color:'#4A90E2', fontSize:15, fontWeight:500, WebkitTapHighlightColor:'transparent', marginTop:14, borderTop:'1px solid rgba(0,0,0,0.06)', width:'100%' }}>
            <span style={{ fontSize:18 }}>+</span>
            <span>Nueva tarea</span>
          </button>
        )}
      </div>

      {/* Lista */}
      <div style={{ flex:1, overflowY:'auto', padding:'4px 18px 180px', WebkitOverflowScrolling:'touch' }}>
        {orderedPending.length === 0 && (
          <div style={{ padding:'24px', background:'rgba(255,255,255,0.35)', backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)', borderRadius:28, textAlign:'center', marginBottom:16, border:'1px solid rgba(255,255,255,0.5)' }}>
            <p style={{ fontSize:14, color:'rgba(0,0,0,0.35)', margin:0 }}>Sin tareas pendientes ✨</p>
          </div>
        )}
        {orderedPending.map(task => (
          <DayTaskItem key={task.id} task={task} groupName={getGroupName(task.groupId)}
            onToggle={toggleStatus} onEdit={t => setModal({ tipo:'editar', task:t })}
            onDelete={t => { hideLocally(t.id); setModal({ tipo:'borrar', task:t }) }}
            selected={selectedIds.has(task.id)} onCircleTap={toggleSeleccion} hasSelection={haySeleccion} />
        ))}
        {completedVisible.length > 0 && (
          <>
            <p style={{ margin:'28px 4px 6px', fontSize:22, fontWeight:600, color:'#111827', letterSpacing:'-0.01em' }}>Completadas</p>
            <p style={{ margin:'0 4px 16px', fontSize:13, color:'rgba(0,0,0,0.38)', fontWeight:400 }}>{completedVisible.length} task{completedVisible.length!==1?'s':''} finished</p>
            {completedVisible.map(task => (
              <DayTaskItem key={task.id} task={task} groupName={getGroupName(task.groupId)}
                onToggle={toggleStatus} onEdit={t => setModal({ tipo:'editar', task:t })}
                onDelete={t => { hideLocally(t.id); setModal({ tipo:'borrar', task:t }) }}
                selected={selectedIds.has(task.id)} onCircleTap={toggleSeleccion} hasSelection={haySeleccion} />
            ))}
          </>
        )}
      </div>

      {/* Toolbar flotante glass */}
      {haySeleccion && (
        <div style={{ position:'fixed', bottom:'calc(32px + env(safe-area-inset-bottom))', left:20, right:20, zIndex:200 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:-2 }}>
            <div style={{ background:'rgba(255,255,255,0.52)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)', borderRadius:'16px 16px 0 0', padding:'6px 28px', border:'1px solid rgba(255,255,255,0.55)', borderBottom:'none' }}>
              <span style={{ fontSize:11, fontWeight:600, color:'rgba(0,0,0,0.35)', letterSpacing:'0.06em' }}>EDIT TOOLBAR</span>
            </div>
          </div>
          <div style={{ height:84, background:'rgba(255,255,255,0.52)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)', borderRadius:32, border:'1px solid rgba(255,255,255,0.55)', boxShadow:'0 25px 80px rgba(15,23,42,0.14)', display:'flex', alignItems:'center', justifyContent:'space-around', padding:'0 28px' }}>
            <span style={{ fontSize:13, fontWeight:500, color:'rgba(0,0,0,0.4)' }}>{selectedIds.size} sel.</span>
            <button onClick={() => {
              const t = [...pending,...completed].find(t => selectedIds.has(t.id))
              if (t) { limpiarSeleccion(); setModal({ tipo:'editar', task:t }) }
            }} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', padding:'8px 20px' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#5B9FED"/><stop offset="100%" stopColor="#4A90E2"/></linearGradient></defs>
                <path d="M16 5L21 10L11 20L6 21L7 16L16 5Z" fill="url(#pg)"/>
                <path d="M16 5L21 10" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize:12, fontWeight:600, color:'#4A90E2' }}>Editar</span>
            </button>
            <button onClick={() => setModal({ tipo:'borrarVarias' })} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', padding:'8px 20px' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E85C5C"/><stop offset="100%" stopColor="#D64545"/></linearGradient></defs>
                <rect x="7" y="10" width="14" height="13" rx="2.5" fill="url(#tg)"/>
                <rect x="5" y="7" width="18" height="3.5" rx="1.75" fill="#E05555"/>
                <rect x="10.5" y="4" width="7" height="4" rx="1.5" fill="#E05555" opacity="0.7"/>
                <line x1="11" y1="13.5" x2="11" y2="20" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="14" y1="13.5" x2="14" y2="20" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="17" y1="13.5" x2="17" y2="20" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize:12, fontWeight:600, color:'#D64545' }}>Eliminar</span>
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

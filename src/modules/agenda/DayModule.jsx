import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDayView } from './hooks/useDayView'
import { DayTaskItem } from './components/DayTaskItem'
import { useTasks } from '../../core/hooks/useTasks'
import { useCoreState } from '../../core/hooks/useCoreData'
import { useFreeTierBlocked } from '../../core/hooks/useFreeTierGuard'
import { ConfirmDialog } from '../../shared/ConfirmDialog'
import { TaskFormNew } from '../../shared/TaskFormNew'
import { Timestamp } from 'firebase/firestore'
import { A, L } from '../../shared/agendaEditorial'

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
  const readOnly = useFreeTierBlocked()
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
    <div style={A.screen}>

      <div style={{ flexShrink:0, padding:'20px 20px 16px', borderBottom:`1px solid rgba(196,169,98,0.2)` }}>
        <div style={{ display:'flex', alignItems:'flex-start' }}>
          <button type="button" onClick={() => navigate('/agenda')} style={{ background:'none', border:'none', fontSize:28, color:L.champagne, cursor:'pointer', padding:'0 12px 0 0', lineHeight:1.3, marginTop:4 }}>‹</button>
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 8px', ...A.badge }}>{labelDia(date)}</p>
            <p style={{ ...A.sectionTitle, fontSize:28, marginBottom:6 }}>Pendientes</p>
            <p style={{ margin:0, fontSize:13, color:L.ivoryMuted }}>{orderedPending.length} tarea{orderedPending.length!==1?'s':''}</p>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:`8px 16px ${haySeleccion ? 24 : 140}px`, WebkitOverflowScrolling:'touch', minHeight:0 }}>

        {orderedPending.length === 0 && (
          <p style={{ fontSize:14, color:L.ivoryFaint, margin:'24px 0', textAlign:'center', fontFamily:L.serif }}>
            Sin tareas pendientes
          </p>
        )}
        {orderedPending.map(task => (
          <DayTaskItem
            key={task.id}
            task={task}
            groupName={getGroupName(task.groupId)}
            onToggle={toggleStatus}
            onDelete={t => { hideLocally(t.id); setModal({ tipo:'borrar', task:t }) }}
            selected={selectedIds.has(task.id)}
            onCircleTap={toggleSeleccion}
            hasSelection={!readOnly && haySeleccion}
            readOnly={readOnly}
            variant="pending"
          />
        ))}

        {/* Completadas */}
        {completedVisible.length > 0 && (
          <>
            <div style={{ padding:'12px 4px 10px' }}>
              <p style={A.sectionTitle}>Completadas</p>
              <p style={{ margin:'4px 0 0', fontSize:13, color:L.ivoryMuted }}>{completedVisible.length} tarea{completedVisible.length!==1?'s':''}</p>
            </div>
            {completedVisible.map(task => (
              <DayTaskItem
                key={task.id}
                task={task}
                groupName={getGroupName(task.groupId)}
                onToggle={toggleStatus}
                onDelete={t => { hideLocally(t.id); setModal({ tipo:'borrar', task:t }) }}
                selected={selectedIds.has(task.id)}
                onCircleTap={toggleSeleccion}
                hasSelection={!readOnly && haySeleccion}
                readOnly={readOnly}
                variant="completed"
              />
            ))}
          </>
        )}
      </div>

      {/* Barra de selección — encima de la nav (como Pizarrones) */}
      {haySeleccion && !readOnly && (
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: 72,
          padding: '0 16px',
          background: L.inkSoft,
          borderTop: `1px solid ${L.champagneBorder}`,
        }}>
          <span style={{ fontSize:12, fontWeight:500, color:L.ivoryMuted }}>{selectedIds.size} sel.</span>
          <button type="button" onClick={() => {
            const t = [...pending,...completed].find(t => selectedIds.has(t.id))
            if (t) { limpiarSeleccion(); setModal({ tipo:'editar', task:t }) }
          }} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 16px', color:L.champagne, fontSize:12, fontWeight:600, letterSpacing:'0.08em' }}>
            EDITAR
          </button>
          <button type="button" onClick={() => setModal({ tipo:'borrarVarias' })} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 16px', color:'#fca5a5', fontSize:12, fontWeight:600, letterSpacing:'0.08em' }}>
            ELIMINAR
          </button>
        </div>
      )}

      {/* ── FAB: Nueva tarea — esquina inferior derecha ── */}
      {!haySeleccion && !readOnly && (
        <button
          type="button"
          onClick={() => navigate(`/agenda/${date}/nueva`)}
          style={A.fab}
        >
          <span style={{ fontSize: 28, lineHeight: 1, marginTop: -2, fontWeight: 300 }}>+</span>
        </button>
      )}

      {modal?.tipo==='editar' && <TaskFormNew task={modal.task} defaultDate={date} onClose={() => setModal(null)} />}
      {modal?.tipo==='borrar' && <ConfirmDialog title="Eliminar tarea" message={`¿Eliminar "${modal.task.title}"?`} confirmLabel="Eliminar" danger onConfirm={async () => { await deleteTask(modal.task); setModal(null) }} onCancel={() => { setHiddenIds(prev => { const n=new Set(prev); n.delete(modal.task.id); return n }); setModal(null) }} />}
      {modal?.tipo==='borrarVarias' && <ConfirmDialog title="Eliminar tareas" message={`¿Eliminar ${selectedIds.size} tarea${selectedIds.size!==1?'s':''}?`} confirmLabel={`Eliminar ${selectedIds.size}`} danger onConfirm={eliminarSeleccionadas} onCancel={() => setModal(null)} />}
      {modal?.tipo==='editarVarias' && <EditMultiModal count={selectedIds.size} groups={groups} onSave={editarSeleccionadas} onClose={() => { setModal(null); limpiarSeleccion() }} />}
    </div>
  )
}

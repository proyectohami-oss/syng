/**
 * AgendaFilterBar — top bar with task counts and "New task" button.
 */
export function AgendaFilterBar({ filter, activeGroup, pendingCount, completedCount, onCreateTask }) {
  const title = filter === 'all'
    ? 'Mi agenda'
    : filter === 'personal'
    ? 'Personal'
    : (activeGroup?.name ?? 'Grupo')

  return (
    <header style={bar}>
      <div>
        <h1 style={{ margin:0, fontSize:18, fontWeight:600, color:'#0D1240', letterSpacing:'-0.01em' }}>{title}</h1>
        <p style={{ margin:0, fontSize:12, color:'rgba(13,18,64,0.38)', marginTop:2, fontWeight:400 }}>
          {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
          {completedCount > 0 && ` · ${completedCount} completada${completedCount !== 1 ? 's' : ''}`}
        </p>
      </div>
      <button onClick={onCreateTask} style={newBtn}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nueva tarea
      </button>
    </header>
  )
}

const bar = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid rgba(13,18,64,0.07)',
  flexShrink: 0,
}
const newBtn = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 10,
  border: 'none',
  background: 'linear-gradient(135deg, #3D4FA8, #2D3A8C)',
  color: '#fff', cursor: 'pointer',
  fontSize: 13, fontWeight: 500,
  boxShadow: '0 2px 8px rgba(45,58,140,0.28)',
  letterSpacing: '-0.01em',
}

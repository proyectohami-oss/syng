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
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>{title}</h1>
        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
          {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
          {completedCount > 0 && ` · ${completedCount} completada${completedCount !== 1 ? 's' : ''}`}
        </p>
      </div>
      <button onClick={onCreateTask} style={newBtn}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nueva tarea
      </button>
    </header>
  )
}

const bar    = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }
const newBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }

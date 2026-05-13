/**
 * AgendaGroupSidebar — left panel showing all groups the user belongs to.
 * Selecting a group sets the filter to that groupId.
 */
export function AgendaGroupSidebar({ groups, activeFilter, onFilterChange, onCreateGroup }) {
  return (
    <aside style={sidebar} aria-label="Grupos">
      {/* Personal section */}
      <button
        onClick={() => onFilterChange('all')}
        style={navItem(activeFilter === 'all')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>
        Mi agenda
      </button>

      <button
        onClick={() => onFilterChange('personal')}
        style={navItem(activeFilter === 'personal')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Personal
      </button>

      {/* Groups */}
      {groups.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: '#9ca3af', padding: '0 12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Grupos
          </p>
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => onFilterChange(group.id)}
              style={navItem(activeFilter === group.id)}
            >
              <span style={groupDot} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {group.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Create group */}
      <button onClick={onCreateGroup} style={createBtn}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nuevo grupo
      </button>
    </aside>
  )
}

const sidebar  = { width: 200, flexShrink: 0, borderRight: '1px solid #f3f4f6', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }
const navItem  = (active) => ({
  display: 'flex', alignItems: 'center', gap: 9,
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14,
  background: active ? '#eff6ff' : 'transparent',
  color:      active ? '#1d4ed8' : '#374151',
  fontWeight: active ? 500 : 400,
})
const groupDot = { width: 8, height: 8, borderRadius: '50%', background: '#c7d2fe', flexShrink: 0 }
const createBtn = {
  display: 'flex', alignItems: 'center', gap: 8,
  width: '100%', padding: '8px 10px', marginTop: 8,
  borderRadius: 8, border: '1.5px dashed #e5e7eb',
  background: 'transparent', cursor: 'pointer',
  fontSize: 13, color: '#9ca3af',
}

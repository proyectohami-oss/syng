/**
 * PizarronHeader — top bar for the group board view.
 * Shows group name, member count, admin actions.
 */
import { useState } from 'react'

export function PizarronHeader({
  group, role, memberCount,
  onInvite, onEditGroup, onDeleteGroup, onLeaveGroup,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = role === 'admin'

  return (
    <header style={header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Group icon */}
        <div style={groupIcon}>
          {group.name[0].toUpperCase()}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#111827' }}>
            {group.name}
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
            {memberCount} miembro{memberCount !== 1 ? 's' : ''}
            {isAdmin ? ' · Admin' : ''}
          </p>
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isAdmin && (
          <button onClick={onInvite} style={inviteBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Invitar
          </button>
        )}

        {/* Options menu */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(v => !v)} style={menuBtn} aria-label="Opciones del grupo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>

          {menuOpen && (
            <>
              <div style={menuOverlay} onClick={() => setMenuOpen(false)} />
              <div style={dropdown}>
                {isAdmin && (
                  <button onClick={() => { setMenuOpen(false); onEditGroup() }} style={menuItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Renombrar grupo
                  </button>
                )}
                <button onClick={() => { setMenuOpen(false); onLeaveGroup() }} style={{ ...menuItem, color: '#f59e0b' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Salir del grupo
                </button>
                {isAdmin && (
                  <button onClick={() => { setMenuOpen(false); onDeleteGroup() }} style={{ ...menuItem, color: '#ef4444' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    Eliminar grupo
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

const header      = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }
const groupIcon   = { width: 36, height: 36, borderRadius: 10, background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }
const inviteBtn   = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: 'none', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 500 }
const menuBtn     = { padding: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', borderRadius: 6, display: 'flex' }
const menuOverlay = { position: 'fixed', inset: 0, zIndex: 10 }
const dropdown    = { position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #f3f4f6', zIndex: 11, minWidth: 180, padding: '4px 0', overflow: 'hidden' }
const menuItem    = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#374151', textAlign: 'left' }

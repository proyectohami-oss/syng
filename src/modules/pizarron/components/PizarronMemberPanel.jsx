/**
 * PizarronMemberPanel — right panel showing group members.
 * Visible on wide screens, collapsible on mobile.
 */
import { useState }    from 'react'
import { MemberList }  from '../../../shared/MemberList'
import { InviteFlow }  from '../../../shared/InviteFlow'

export function PizarronMemberPanel({ groupId, group, members, role, currentUid }) {
  const [showInvite, setShowInvite] = useState(false)
  const isAdmin = role === 'admin'

  return (
    <aside style={panel}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>
          Miembros ({members.length})
        </p>
        {isAdmin && (
          <button onClick={() => setShowInvite(true)} style={addBtn} aria-label="Invitar persona">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        )}
      </div>

      <div style={{ padding: '0 16px', overflowY: 'auto', flex: 1 }}>
        <MemberList
          groupId={groupId}
          members={members}
          adminId={group.adminId}
          currentUid={currentUid}
        />
      </div>

      {showInvite && (
        <InviteFlow
          groupId={groupId}
          onClose={() => setShowInvite(false)}
        />
      )}
    </aside>
  )
}

const panel  = { width: 220, flexShrink: 0, borderLeft: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
const addBtn = { padding: 5, border: 'none', background: '#f3f4f6', borderRadius: 6, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }

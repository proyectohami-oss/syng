/**
 * MemberList — renders the member list for a group.
 * Shows role badge, allows admin to remove members or transfer admin.
 */
import { useState } from 'react'
import { useGroups }      from '../core/hooks/useGroups'
import { usePermissions } from '../core/hooks/usePermissions'
import { ConfirmDialog }  from './ConfirmDialog'

export function MemberList({ groupId, members, adminId, currentUid }) {
  const { removeMember, transferAdmin } = useGroups()
  const perms = usePermissions(groupId)

  const [confirm, setConfirm] = useState(null)
  // confirm: null | { type: 'remove', member } | { type: 'transfer', member }

  return (
    <div>
      {members.map((member) => {
        const isCurrentUser = member.uid === currentUid
        const isAdmin       = member.uid === adminId

        return (
          <div key={member.uid} style={memberRow}>
            {/* Avatar */}
            <div style={avatar}>
              {(member.displayName?.[0] ?? member.email?.[0] ?? '?').toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {member.displayName ?? member.email}
                {isCurrentUser && <span style={{ color: '#9ca3af', fontWeight: 400 }}> (tú)</span>}
              </p>
              {member.displayName && (
                <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {member.email}
                </p>
              )}
            </div>

            {/* Role badge */}
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 99,
              background: isAdmin ? '#fef3c7' : '#f3f4f6',
              color:      isAdmin ? '#92400e' : '#6b7280',
              flexShrink: 0,
            }}>
              {isAdmin ? 'Admin' : 'Miembro'}
            </span>

            {/* Actions (only for admin, not on self) */}
            {perms.canEditGroup && !isCurrentUser && (
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {!isAdmin && (
                  <button
                    onClick={() => setConfirm({ type: 'transfer', member })}
                    title="Hacer admin"
                    style={iconBtn}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </button>
                )}
                <button
                  onClick={() => setConfirm({ type: 'remove', member })}
                  title="Eliminar miembro"
                  style={{ ...iconBtn, color: '#ef4444' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Confirm dialogs */}
      {confirm?.type === 'remove' && (
        <ConfirmDialog
          title="Eliminar miembro"
          message={`¿Eliminar a ${confirm.member.displayName ?? confirm.member.email} del grupo?`}
          confirmLabel="Eliminar"
          danger
          onConfirm={async () => {
            await removeMember({ groupId, targetUid: confirm.member.uid })
            setConfirm(null)
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'transfer' && (
        <ConfirmDialog
          title="Transferir admin"
          message={`¿Hacer a ${confirm.member.displayName ?? confirm.member.email} el nuevo administrador del grupo?`}
          confirmLabel="Transferir"
          onConfirm={async () => {
            await transferAdmin({ groupId, newAdminUid: confirm.member.uid })
            setConfirm(null)
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

const memberRow = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 0', borderBottom: '1px solid #f3f4f6',
}
const avatar = {
  width: 34, height: 34, borderRadius: '50%',
  background: '#e0e7ff', color: '#4338ca',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 13, fontWeight: 600, flexShrink: 0,
}
const iconBtn = {
  padding: 5, border: 'none', background: 'transparent',
  cursor: 'pointer', color: '#9ca3af',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 6,
}

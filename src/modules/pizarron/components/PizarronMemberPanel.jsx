import { useState } from 'react'
import { InviteFlow } from '../../../shared/InviteFlow'

export function PizarronMemberPanel({ groupId, group, members, role, currentUid }) {
  const [showInvite, setShowInvite] = useState(false)
  const isAdmin = role === 'admin'
  const visible = members.slice(0, 4)
  const extra   = members.length - visible.length

  return (
    <>
      <div style={panel}>
        <div style={avatarRow}>
          {visible.map(m => (
            <div key={m.uid} style={avatar} title={m.displayName}>
              {(m.displayName?.[0] ?? '?').toUpperCase()}
            </div>
          ))}
          {extra > 0 && (
            <div style={{ ...avatar, background:'#e5e7eb', color:'#6b7280', fontSize:11 }}>
              +{extra}
            </div>
          )}
          <span style={{ fontSize:12, color:'#9ca3af', marginLeft:4 }}>
            {members.length} miembro{members.length !== 1 ? 's' : ''}
          </span>
        </div>
        {isAdmin && (
          <button onClick={() => setShowInvite(true)} style={inviteBtn}>
            + Invitar personas
          </button>
        )}
      </div>

      {showInvite && (
        <InviteFlow groupId={groupId} groupName={group?.name} inviterName={members.find(m => m.uid === currentUid)?.displayName} onClose={() => setShowInvite(false)} />
      )}
    </>
  )
}

const panel     = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px', borderTop:'1px solid #f3f4f6', borderBottom:'1px solid #f3f4f6', flexShrink:0, background:'#fafafa' }
const avatarRow = { display:'flex', alignItems:'center', gap:4 }
const avatar    = { width:28, height:28, borderRadius:'50%', background:'#EDE9FE', color:'#5B3DF6', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }
const inviteBtn = { background:'none', border:'1px solid #e5e7eb', borderRadius:8, padding:'5px 10px', fontSize:12, color:'#5B3DF6', fontWeight:500, cursor:'pointer' }

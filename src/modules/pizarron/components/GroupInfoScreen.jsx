import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePizarronView } from '../hooks/usePizarronView'
import { useGroups } from '../../../core/hooks/useGroups'
import { InviteFlow } from '../../../shared/InviteFlow'
import { ActivityFeed } from '../../../shared/ActivityFeed'
import { getPendingInvitations } from '../../../core/services/invitations.service'

export function GroupInfoScreen() {
  const { id: groupId } = useParams()
  const navigate = useNavigate()
  const { group, members, role, uid } = usePizarronView(groupId)
  const { leaveGroup, deleteGroup, promoteToAdmin, removeMember, updateGroupName, cancelInvitation } = useGroups()
  const isAdmin = role === 'admin'

  const [showInvite,      setShowInvite]      = useState(false)
  const [pendingInvites,  setPendingInvites]  = useState([])
  const [editingName,     setEditingName]     = useState(false)
  const [newName,         setNewName]         = useState('')
  const [confirmLeave,    setConfirmLeave]    = useState(false)
  const [confirmDelete,   setConfirmDelete]   = useState(false)
  const [confirmCancelId, setConfirmCancelId] = useState(null)

  function loadPending() {
    getPendingInvitations(groupId).then(setPendingInvites).catch(() => {})
  }

  useEffect(() => { loadPending() }, [groupId, showInvite])

  if (!group) return null

  async function handleLeave() {
    await leaveGroup(groupId)
    navigate('/pizarrones')
  }

  async function handleDelete() {
    await deleteGroup(groupId)
    navigate('/pizarrones')
  }

  async function handleCancelInvitation(invId) {
    try {
      await cancelInvitation(invId)
      setPendingInvites(prev => prev.filter(x => x.id !== invId))
    } catch (err) {
      alert('No se pudo cancelar: ' + err.message)
    }
    setConfirmCancelId(null)
  }

  return (
    <div style={screen}>
      <div style={header}>
        <button onClick={() => navigate(-1)} style={btnBack}>‹</button>
        <span style={{ fontSize:16, fontWeight:600, color:'#111' }}>Info del grupo</span>
        <div style={{ width:44 }} />
      </div>

      <div style={body}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 20px 20px', borderBottom:'1px solid #f3f4f6' }}>
          <div style={{ width:72, height:72, borderRadius:20, background:'#EDE9FE', color:'#5B3DF6', fontSize:30, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
            {group.name[0].toUpperCase()}
          </div>
          {isAdmin ? (
            <p onClick={() => { setNewName(group.name); setEditingName(true) }}
              style={{ margin:0, fontSize:20, fontWeight:700, color:'#111', cursor:'pointer', borderBottom:'1.5px dashed #e5e7eb', paddingBottom:2 }}>
              {group.name}
            </p>
          ) : (
            <p style={{ margin:0, fontSize:20, fontWeight:700, color:'#111' }}>{group.name}</p>
          )}
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#9ca3af' }}>
            {members.length} miembro{members.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={section}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 8px' }}>
            <p style={sectionLabel}>MIEMBROS</p>
            {isAdmin && (
              <button onClick={() => setShowInvite(true)} style={btnInvite}>+ Invitar</button>
            )}
          </div>
          {members.map(m => {
            const isMe     = m.uid === uid
            const isMAdmin = group.adminIds?.includes(m.uid)
            return (
              <div key={m.uid} style={memberRow}>
                <div style={memberAvatar}>{(m.displayName?.[0] ?? '?').toUpperCase()}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:14, fontWeight:500, color:'#111' }}>
                    {m.displayName || m.email}{isMe ? ' (tú)' : ''}
                  </p>
                  <p style={{ margin:0, fontSize:12, color:'#9ca3af' }}>
                    {isMAdmin ? 'Admin' : 'Miembro'}
                  </p>
                </div>
                {isAdmin && !isMe && (
                  <div style={{ display:'flex', gap:6 }}>
                    {!isMAdmin && (
                      <button onClick={() => promoteToAdmin(groupId, m.uid)} style={btnAction}>
                        Hacer admin
                      </button>
                    )}
                    <button onClick={() => removeMember({ groupId, targetUid: m.uid })}
                      style={{ ...btnAction, color:'#ef4444', borderColor:'#fecaca' }}>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {pendingInvites.length > 0 && (
          <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:8 }}>
            <p style={{ margin:'10px 20px 4px', fontSize:11, fontWeight:600, color:'#9ca3af', letterSpacing:'0.06em' }}>
              INVITADOS PENDIENTES
            </p>
            {pendingInvites.map(inv => (
              <div key={inv.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 20px' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#fef9c3', color:'#ca8a04', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  ⏳
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:14, color:'#6b7280' }}>{inv.phoneNumber}</p>
                  <p style={{ margin:0, fontSize:11, color:'#9ca3af' }}>Invitación pendiente</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setConfirmCancelId(inv.id)}
                    style={{ background:'none', border:'none', color:'#d1d5db', fontSize:18, cursor:'pointer', padding:'4px 8px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ padding:'20px' }}>
          <button onClick={() => setConfirmLeave(true)} style={{ ...btnDanger, marginBottom:10 }}>
            Salir del grupo
          </button>
          {isAdmin && (
            <button onClick={() => setConfirmDelete(true)} style={btnDanger}>
              Eliminar grupo
            </button>
          )}
        </div>
      </div>

      {editingName && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:'24px 20px', width:'100%', maxWidth:320 }}>
            <p style={{ margin:'0 0 16px', fontWeight:600, fontSize:16 }}>Editar nombre</p>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:16, fontFamily:'inherit', outline:'none', marginBottom:16 }}
              autoFocus
            />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setEditingName(false)}
                style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid #e5e7eb', background:'#fff', fontSize:14, cursor:'pointer', color:'#374151' }}>
                Cancelar
              </button>
              <button onClick={async () => {
                if (!newName.trim()) return
                await updateGroupName(groupId, newName.trim())
                setEditingName(false)
              }} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:'#5B3DF6', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmCancelId && (
        <div style={overlayModal}>
          <div style={dialog}>
            <p style={{ margin:'0 0 8px', fontWeight:600, fontSize:16 }}>¿Cancelar invitación?</p>
            <p style={{ margin:'0 0 20px', fontSize:14, color:'#6b7280' }}>La persona ya no podrá unirse con esta invitación.</p>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setConfirmCancelId(null)} style={btnCancel}>No, mantener</button>
              <button onClick={() => handleCancelInvitation(confirmCancelId)} style={{ ...btnConfirm, background:'#dc2626' }}>Sí, cancelar</button>
            </div>
          </div>
        </div>
      )}

      {confirmLeave && (
        <div style={overlayModal}>
          <div style={dialog}>
            <p style={{ margin:'0 0 8px', fontWeight:600, fontSize:16 }}>¿Salir del grupo?</p>
            <p style={{ margin:'0 0 20px', fontSize:14, color:'#6b7280' }}>Perderás acceso a las tareas del grupo.</p>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setConfirmLeave(false)} style={btnCancel}>Cancelar</button>
              <button onClick={handleLeave} style={btnConfirm}>Salir</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={overlayModal}>
          <div style={dialog}>
            <p style={{ margin:'0 0 8px', fontWeight:600, fontSize:16 }}>¿Eliminar grupo?</p>
            <p style={{ margin:'0 0 20px', fontSize:14, color:'#6b7280' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setConfirmDelete(false)} style={btnCancel}>Cancelar</button>
              <button onClick={handleDelete} style={{ ...btnConfirm, background:'#dc2626' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <InviteFlow
          groupId={groupId}
          groupName={group.name}
          inviterName={members.find(m => m.uid === uid)?.displayName ?? 'Alguien'}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  )
}

const screen       = { display:'flex', flexDirection:'column', flex:1, minHeight:0, background:'#f9fafb' }
const header       = { flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #f3f4f6', background:'#fff' }
const btnBack      = { background:'none', border:'none', fontSize:22, color:'#6b7280', cursor:'pointer', padding:'0 4px', minWidth:44, display:'flex', alignItems:'center' }
const body         = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }
const section      = { background:'#fff', margin:'12px 0 0', borderTop:'1px solid #f3f4f6', borderBottom:'1px solid #f3f4f6' }
const sectionLabel = { margin:0, fontSize:11, fontWeight:600, color:'#9ca3af', letterSpacing:'0.06em' }
const memberRow    = { display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderTop:'1px solid #f9fafb' }
const memberAvatar = { width:36, height:36, borderRadius:'50%', background:'#EDE9FE', color:'#5B3DF6', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }
const btnInvite    = { background:'none', border:'none', color:'#5B3DF6', fontSize:13, fontWeight:600, cursor:'pointer' }
const btnAction    = { padding:'5px 10px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', fontSize:12, color:'#374151', cursor:'pointer' }
const btnDanger    = { width:'100%', padding:'13px', borderRadius:12, border:'1.5px solid #fee2e2', background:'#fff', color:'#dc2626', fontSize:15, fontWeight:600, cursor:'pointer' }
const overlayModal = { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }
const dialog       = { background:'#fff', borderRadius:16, padding:'24px 20px', width:'100%', maxWidth:320 }
const btnCancel    = { flex:1, padding:'11px', borderRadius:10, border:'1px solid #e5e7eb', background:'#fff', fontSize:14, cursor:'pointer', color:'#374151' }
const btnConfirm   = { flex:1, padding:'11px', borderRadius:10, border:'none', background:'#5B3DF6', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }
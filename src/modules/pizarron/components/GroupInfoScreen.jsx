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

      {/* Header */}
      <div style={header}>
        <button onClick={() => navigate(-1)} style={btnBack}>‹</button>
        <span style={{ fontSize:16, fontWeight:600, color:'#0D1240', letterSpacing:'-0.01em' }}>Info del grupo</span>
        <div style={{ width:44 }} />
      </div>

      <div style={body}>

        {/* Avatar del grupo */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 20px 20px', borderBottom:'1px solid rgba(13,18,64,0.07)' }}>
          <div style={{
            width:72, height:72, borderRadius:20,
            background:'rgba(45,58,140,0.10)',
            color:'#2D3A8C',
            fontSize:30, fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center',
            marginBottom:12,
            boxShadow:'0 4px 16px rgba(45,58,140,0.12)',
          }}>
            {group.name[0].toUpperCase()}
          </div>
          {isAdmin ? (
            <p onClick={() => { setNewName(group.name); setEditingName(true) }}
              style={{ margin:0, fontSize:20, fontWeight:700, color:'#0D1240', cursor:'pointer', letterSpacing:'-0.02em' }}>
              {group.name}
            </p>
          ) : (
            <p style={{ margin:0, fontSize:20, fontWeight:700, color:'#0D1240', letterSpacing:'-0.02em' }}>{group.name}</p>
          )}
          <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(13,18,64,0.38)' }}>
            {members.length} miembro{members.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Miembros */}
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
                  <p style={{ margin:0, fontSize:14, fontWeight:500, color:'#0D1240' }}>
                    {m.displayName || m.email}{isMe ? ' (tú)' : ''}
                  </p>
                  <p style={{ margin:0, fontSize:12, color:'rgba(13,18,64,0.38)' }}>
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
                      style={{ ...btnAction, color:'#E05252', borderColor:'rgba(224,82,82,0.25)' }}>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Invitados pendientes */}
        {pendingInvites.length > 0 && (
          <div style={{ borderTop:'1px solid rgba(13,18,64,0.07)', paddingTop:8 }}>
            <p style={{ margin:'10px 20px 4px', fontSize:11, fontWeight:600, color:'rgba(13,18,64,0.32)', letterSpacing:'0.08em' }}>
              INVITADOS PENDIENTES
            </p>
            {pendingInvites.map(inv => (
              <div key={inv.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 20px' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(245,158,11,0.10)', color:'#B45309', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  ⏳
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:14, color:'rgba(13,18,64,0.55)' }}>{inv.phoneNumber}</p>
                  <p style={{ margin:0, fontSize:11, color:'rgba(13,18,64,0.35)' }}>Invitación pendiente</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setConfirmCancelId(inv.id)}
                    style={{ background:'none', border:'none', color:'rgba(13,18,64,0.22)', fontSize:18, cursor:'pointer', padding:'4px 8px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <ActivityFeed groupId={groupId} />

        {/* Acciones peligrosas */}
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

      {/* Modal editar nombre */}
      {editingName && (
        <div style={overlayModal}>
          <div style={dialog}>
            <p style={{ margin:'0 0 16px', fontWeight:600, fontSize:16, color:'#0D1240', letterSpacing:'-0.01em' }}>Editar nombre</p>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', borderRadius:12, border:'1.5px solid rgba(13,18,64,0.10)', fontSize:16, fontFamily:'inherit', outline:'none', marginBottom:16, background:'rgba(255,255,255,0.80)' }}
              autoFocus
            />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setEditingName(false)} style={btnCancel}>Cancelar</button>
              <button onClick={async () => {
                if (!newName.trim()) return
                await updateGroupName(groupId, newName.trim())
                setEditingName(false)
              }} style={{ ...btnConfirm, background:'linear-gradient(135deg, #3D4FA8, #2D3A8C)' }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar cancelar invitación */}
      {confirmCancelId && (
        <div style={overlayModal}>
          <div style={dialog}>
            <p style={{ margin:'0 0 8px', fontWeight:600, fontSize:16, color:'#0D1240' }}>¿Cancelar invitación?</p>
            <p style={{ margin:'0 0 20px', fontSize:14, color:'rgba(13,18,64,0.45)', lineHeight:1.5 }}>La persona ya no podrá unirse con esta invitación.</p>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setConfirmCancelId(null)} style={btnCancel}>No, mantener</button>
              <button onClick={() => handleCancelInvitation(confirmCancelId)} style={{ ...btnConfirm, background:'linear-gradient(135deg, #E86060, #E05252)' }}>Sí, cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar salir */}
      {confirmLeave && (
        <div style={overlayModal}>
          <div style={dialog}>
            <p style={{ margin:'0 0 8px', fontWeight:600, fontSize:16, color:'#0D1240' }}>¿Salir del grupo?</p>
            <p style={{ margin:'0 0 20px', fontSize:14, color:'rgba(13,18,64,0.45)', lineHeight:1.5 }}>Perderás acceso a las tareas del grupo.</p>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setConfirmLeave(false)} style={btnCancel}>Cancelar</button>
              <button onClick={handleLeave} style={{ ...btnConfirm, background:'linear-gradient(135deg, #E86060, #E05252)' }}>Salir</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar eliminar */}
      {confirmDelete && (
        <div style={overlayModal}>
          <div style={dialog}>
            <p style={{ margin:'0 0 8px', fontWeight:600, fontSize:16, color:'#0D1240' }}>¿Eliminar grupo?</p>
            <p style={{ margin:'0 0 20px', fontSize:14, color:'rgba(13,18,64,0.45)', lineHeight:1.5 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setConfirmDelete(false)} style={btnCancel}>Cancelar</button>
              <button onClick={handleDelete} style={{ ...btnConfirm, background:'linear-gradient(135deg, #E86060, #E05252)' }}>Eliminar</button>
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

const screen       = { display:'flex', flexDirection:'column', flex:1, minHeight:0, background:'transparent' }
const header       = { flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid rgba(13,18,64,0.07)', background:'transparent' }
const btnBack      = { background:'none', border:'none', fontSize:22, color:'rgba(13,18,64,0.35)', cursor:'pointer', padding:'0 4px', minWidth:44, display:'flex', alignItems:'center' }
const body         = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }
const section      = { background:'rgba(255,255,255,0.70)', margin:'12px 0 0', borderTop:'1px solid rgba(13,18,64,0.07)', borderBottom:'1px solid rgba(13,18,64,0.07)' }
const sectionLabel = { margin:0, fontSize:11, fontWeight:600, color:'rgba(13,18,64,0.32)', letterSpacing:'0.08em' }
const memberRow    = { display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderTop:'1px solid rgba(13,18,64,0.05)' }
const memberAvatar = { width:36, height:36, borderRadius:'50%', background:'rgba(45,58,140,0.10)', color:'#2D3A8C', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }
const btnInvite    = { background:'none', border:'none', color:'#2D3A8C', fontSize:13, fontWeight:600, cursor:'pointer' }
const btnAction    = { padding:'5px 10px', borderRadius:8, border:'1px solid rgba(13,18,64,0.12)', background:'rgba(255,255,255,0.80)', fontSize:12, color:'rgba(13,18,64,0.55)', cursor:'pointer' }
const btnDanger    = { width:'100%', padding:'14px', borderRadius:14, border:'1.5px solid rgba(224,82,82,0.22)', background:'rgba(224,82,82,0.05)', color:'#E05252', fontSize:15, fontWeight:600, cursor:'pointer' }
/* Sin backdropFilter en el overlay — evita que iOS bloquee los clicks en botones */
const overlayModal = { position:'fixed', inset:0, background:'rgba(13,18,64,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }
const dialog       = { background:'#FAFBFF', borderRadius:20, padding:'24px 20px', width:'100%', maxWidth:320, boxShadow:'0 20px 60px rgba(13,18,64,0.20)', border:'1px solid rgba(255,255,255,0.70)' }
const btnCancel    = { flex:1, padding:'11px', borderRadius:12, border:'1px solid rgba(13,18,64,0.12)', background:'rgba(255,255,255,0.80)', fontSize:14, cursor:'pointer', color:'rgba(13,18,64,0.45)' }
const btnConfirm   = { flex:1, padding:'11px', borderRadius:12, border:'none', background:'linear-gradient(135deg, #3D4FA8, #2D3A8C)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', boxShadow:'0 2px 8px rgba(45,58,140,0.28)' }

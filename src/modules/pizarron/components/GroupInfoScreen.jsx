import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePizarronView } from '../hooks/usePizarronView'
import { useGroups } from '../../../core/hooks/useGroups'
import { InviteFlow } from '../../../shared/InviteFlow'
import { ActivityFeed } from '../../../shared/ActivityFeed'
import { getPendingInvitations } from '../../../core/services/invitations.service'
import { L } from '../../../shared/agendaEditorial'

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
        <span style={headerTitle}>Info del grupo</span>
        <div style={{ width: 44 }} />
      </div>

      <div style={body}>

        <div style={heroBlock}>
          <div style={groupAvatar}>
            {group.name[0].toUpperCase()}
          </div>
          {isAdmin ? (
            <p onClick={() => { setNewName(group.name); setEditingName(true) }}
              style={{ ...groupName, cursor: 'pointer' }}>
              {group.name}
            </p>
          ) : (
            <p style={groupName}>{group.name}</p>
          )}
          <p style={memberCount}>
            {members.length} miembro{members.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 8px' }}>
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={memberName}>
                    {m.displayName || m.email}{isMe ? ' (tú)' : ''}
                  </p>
                  <p style={memberRole}>
                    {isMAdmin ? 'Admin' : 'Miembro'}
                  </p>
                </div>
                {isAdmin && !isMe && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {!isMAdmin && (
                      <button onClick={() => promoteToAdmin(groupId, m.uid)} style={btnAction}>
                        Hacer admin
                      </button>
                    )}
                    <button onClick={() => removeMember({ groupId, targetUid: m.uid })}
                      style={{ ...btnAction, color: '#E05252', borderColor: 'rgba(224,82,82,0.35)' }}>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {pendingInvites.length > 0 && (
          <div style={{ borderTop: `1px solid rgba(196,169,98,0.15)`, paddingTop: 8 }}>
            <p style={pendingLabel}>INVITADOS PENDIENTES</p>
            {pendingInvites.map(inv => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px' }}>
                <div style={pendingIcon}>⏳</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, color: L.ivoryMuted }}>{inv.phoneNumber}</p>
                  <p style={{ margin: 0, fontSize: 11, color: L.ivoryFaint }}>Invitación pendiente</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setConfirmCancelId(inv.id)}
                    style={{ background: 'none', border: 'none', color: L.ivoryFaint, fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <ActivityFeed groupId={groupId} editorial />

        <div style={{ padding: '20px' }}>
          <button onClick={() => setConfirmLeave(true)} style={{ ...btnDanger, marginBottom: 10 }}>
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
        <div style={overlayModal}>
          <div style={dialog}>
            <p style={dialogTitle}>Editar nombre</p>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={dialogInput}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditingName(false)} style={btnCancel}>Cancelar</button>
              <button onClick={async () => {
                if (!newName.trim()) return
                await updateGroupName(groupId, newName.trim())
                setEditingName(false)
              }} style={btnConfirm}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmCancelId && (
        <div style={overlayModal}>
          <div style={dialog}>
            <p style={dialogTitle}>¿Cancelar invitación?</p>
            <p style={dialogBody}>La persona ya no podrá unirse con esta invitación.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmCancelId(null)} style={btnCancel}>No, mantener</button>
              <button onClick={() => handleCancelInvitation(confirmCancelId)} style={{ ...btnConfirm, background: 'rgba(224,82,82,0.18)', color: '#E05252', border: '1px solid rgba(224,82,82,0.35)' }}>
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmLeave && (
        <div style={overlayModal}>
          <div style={dialog}>
            <p style={dialogTitle}>¿Salir del grupo?</p>
            <p style={dialogBody}>Perderás acceso a las tareas del grupo.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmLeave(false)} style={btnCancel}>Cancelar</button>
              <button onClick={handleLeave} style={{ ...btnConfirm, background: 'rgba(224,82,82,0.18)', color: '#E05252', border: '1px solid rgba(224,82,82,0.35)' }}>
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={overlayModal}>
          <div style={dialog}>
            <p style={dialogTitle}>¿Eliminar grupo?</p>
            <p style={dialogBody}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)} style={btnCancel}>Cancelar</button>
              <button onClick={handleDelete} style={{ ...btnConfirm, background: 'rgba(224,82,82,0.18)', color: '#E05252', border: '1px solid rgba(224,82,82,0.35)' }}>
                Eliminar
              </button>
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

const screen = { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: L.ink, color: L.ivory }
const header = { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid rgba(196,169,98,0.2)`, background: L.ink }
const headerTitle = { fontSize: 16, fontWeight: 500, color: L.ivory, letterSpacing: '-0.01em', fontFamily: L.serif }
const btnBack = { background: 'none', border: 'none', fontSize: 22, color: L.champagne, cursor: 'pointer', padding: '0 4px', minWidth: 44, display: 'flex', alignItems: 'center' }
const body = { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }
const heroBlock = { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px 20px', borderBottom: `1px solid rgba(196,169,98,0.15)` }
const groupAvatar = { width: 72, height: 72, borderRadius: 2, background: L.champagneLight, border: `1px solid ${L.champagneBorder}`, color: L.champagne, fontFamily: L.serif, fontSize: 30, fontWeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }
const groupName = { margin: 0, fontSize: 22, fontWeight: 400, color: L.ivory, letterSpacing: '-0.02em', fontFamily: L.serif }
const memberCount = { margin: '4px 0 0', fontSize: 13, color: L.ivoryMuted }
const section = { background: L.inkSoft, margin: '12px 0 0', borderTop: `1px solid rgba(196,169,98,0.15)`, borderBottom: `1px solid rgba(196,169,98,0.15)` }
const sectionLabel = { margin: 0, fontSize: 10, fontWeight: 500, color: L.champagne, letterSpacing: '0.12em' }
const memberRow = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderTop: `1px solid rgba(196,169,98,0.1)` }
const memberAvatar = { width: 36, height: 36, borderRadius: 2, background: L.champagneLight, border: `1px solid ${L.champagneBorder}`, color: L.champagne, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const memberName = { margin: 0, fontSize: 14, fontWeight: 500, color: L.ivory }
const memberRole = { margin: 0, fontSize: 12, color: L.ivoryMuted }
const btnInvite = { background: 'none', border: 'none', color: L.champagne, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const btnAction = { padding: '5px 10px', borderRadius: 2, border: `1px solid ${L.champagneBorder}`, background: L.champagneLight, fontSize: 12, color: L.ivoryMuted, cursor: 'pointer' }
const btnDanger = { width: '100%', padding: '14px', borderRadius: 2, border: '1.5px solid rgba(224,82,82,0.35)', background: 'rgba(224,82,82,0.08)', color: '#E05252', fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em' }
const pendingLabel = { margin: '10px 20px 4px', fontSize: 10, fontWeight: 500, color: L.champagne, letterSpacing: '0.12em' }
const pendingIcon = { width: 36, height: 36, borderRadius: 2, background: L.champagneLight, border: `1px solid ${L.champagneBorder}`, color: L.champagne, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const overlayModal = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }
const dialog = { background: L.inkSoft, borderRadius: 2, padding: '24px 20px', width: '100%', maxWidth: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.55)', border: `1px solid ${L.champagneBorder}` }
const dialogTitle = { margin: '0 0 16px', fontWeight: 500, fontSize: 18, color: L.ivory, letterSpacing: '-0.01em', fontFamily: L.serif }
const dialogBody = { margin: '0 0 20px', fontSize: 14, color: L.ivoryMuted, lineHeight: 1.5 }
const dialogInput = { width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 2, border: `1px solid ${L.champagneBorder}`, fontSize: 16, fontFamily: 'inherit', outline: 'none', marginBottom: 16, background: L.champagneLight, color: L.ivory }
const btnCancel = { flex: 1, padding: '11px', borderRadius: 2, border: `1px solid ${L.champagneBorder}`, background: 'transparent', fontSize: 14, cursor: 'pointer', color: L.ivoryMuted }
const btnConfirm = { flex: 1, padding: '11px', borderRadius: 2, border: `1px solid ${L.ivory}`, background: L.ivory, color: L.ink, fontSize: 14, fontWeight: 600, cursor: 'pointer' }

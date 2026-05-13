/**
 * InvitationChecker — discovers and presents pending group invitations.
 *
 * WHEN IT RUNS
 * ─────────────
 * Mounts once inside AuthGuard (user is guaranteed to exist).
 * Runs a one-shot Firestore query on mount — NOT a real-time listener.
 * Reasons:
 *   1. Invitations are a login-time event, not a continuous stream.
 *   2. Adding a listener would require a composite index on
 *      (invitedEmail, status) and consume a persistent connection.
 *   3. A getDocs() query at login is cheaper and sufficient.
 *
 * After the user accepts or dismisses, the checker is done.
 * New invitations sent WHILE the user is logged in will appear on
 * next login — this is acceptable for v1.
 *
 * FUTURE: If you want real-time invitation delivery while the app is open,
 * add a listener in CoreDataProvider following the same L4 pattern.
 *
 * ARCHITECTURE NOTE
 * ─────────────────
 * InvitationChecker wraps children so it can intercept the first render
 * and show the invitation UI before the user reaches their agenda.
 * It uses its own local state — no CoreDataProvider changes needed.
 */
import { useState, useEffect }  from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db }                   from '../firebase'
import { useCoreState }         from '../core/hooks/useCoreData'
import { useGroups }            from '../core/hooks/useGroups'

export function InvitationChecker({ children }) {
  const state = useCoreState()
  const { acceptInvitation } = useGroups()

  const uid   = state.auth.user?.uid
  const email = state.auth.user?.email?.toLowerCase()

  const [invitations, setInvitations] = useState(null)  // null = loading, [] = done
  const [current,     setCurrent]     = useState(0)     // index of shown invitation
  const [accepting,   setAccepting]   = useState(false)
  const [error,       setError]       = useState(null)

  // One-shot query on mount
  useEffect(() => {
    if (!email) return

    getDocs(
      query(
        collection(db, 'invitations'),
        where('invitedEmail', '==', email),
        where('status',       '==', 'pending')
      )
    )
      .then((snap) => {
        const pending = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        // Filter out expired invitations client-side
        const now   = Date.now()
        const valid = pending.filter(inv => {
          if (!inv.expiresAt) return true
          const expiresMs = inv.expiresAt?.toMillis?.() ?? inv.expiresAt
          return expiresMs > now
        })
        setInvitations(valid)
      })
      .catch((err) => {
        console.error('[InvitationChecker] query error:', err)
        setInvitations([]) // fail open — don't block the app
      })
  }, [email])

  // Still loading invitations — show children so the app doesn't freeze
  if (invitations === null) return children

  // No pending invitations, or all dismissed
  if (invitations.length === 0 || current >= invitations.length) return children

  const inv = invitations[current]

  async function handleAccept() {
    setAccepting(true)
    setError(null)
    try {
      await acceptInvitation({
        invitationId: inv.id,
        groupId:      inv.groupId,
        invitedBy:    inv.invitedBy,
      })
      // Move to next invitation (or finish)
      setCurrent(c => c + 1)
    } catch (err) {
      console.error('[InvitationChecker] accept error:', err)
      setError('No se pudo unir al grupo. Intenta de nuevo.')
    } finally {
      setAccepting(false)
    }
  }

  function handleDecline() {
    // Just skip — we don't mark as declined in v1
    // (prevents the same invitation from reappearing until next login)
    setCurrent(c => c + 1)
  }

  const remaining = invitations.length - current

  return (
    <>
      {children}
      {/* Invitation modal overlays the app */}
      <div style={overlay}>
        <div style={card} role="dialog" aria-modal="true" aria-labelledby="inv-title">
          {/* Counter if multiple invitations */}
          {invitations.length > 1 && (
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#9ca3af' }}>
              Invitación {current + 1} de {invitations.length}
            </p>
          )}

          {/* Group icon */}
          <div style={groupIcon}>
            {inv.groupName?.[0]?.toUpperCase() ?? '?'}
          </div>

          <h2 id="inv-title" style={{ margin: '16px 0 6px', fontSize: 18, fontWeight: 600, color: '#111827' }}>
            Te invitaron a un grupo
          </h2>
          <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#111827' }}>
            {inv.groupName}
          </p>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280' }}>
            Invitación de <strong>{inv.invitedByName ?? 'alguien'}</strong>
          </p>

          {error && (
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#dc2626', padding: '9px 12px', background: '#fef2f2', borderRadius: 8 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleDecline} disabled={accepting} style={declineBtn}>
              Ahora no
            </button>
            <button onClick={handleAccept} disabled={accepting} style={acceptBtn}>
              {accepting ? 'Uniéndome...' : 'Unirme al grupo'}
            </button>
          </div>

          {remaining > 1 && (
            <p style={{ margin: '16px 0 0', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
              {remaining - 1} invitación{remaining - 1 !== 1 ? 'es' : ''} más después de esta
            </p>
          )}
        </div>
      </div>
    </>
  )
}

const overlay    = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }
const card       = { background: '#fff', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }
const groupIcon  = { width: 64, height: 64, borderRadius: 18, background: '#e0e7ff', color: '#4338ca', fontSize: 28, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
const declineBtn = { flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151', fontWeight: 500 }
const acceptBtn  = { flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }

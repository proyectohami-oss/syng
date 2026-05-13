/**
 * InviteFlow — invite a user to a group by email.
 *
 * Creates an /invitations document. The invited user discovers
 * the invitation on their next login via a query on their email.
 * No Cloud Functions required.
 */
import { useState } from 'react'
import { useGroups } from '../core/hooks/useGroups'

export function InviteFlow({ groupId, onClose }) {
  const { inviteUser } = useGroups()

  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [sent,    setSent]    = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      await inviteUser({ groupId, email: email.trim() })
      setSent(true)
    } catch (err) {
      setError(err.message ?? 'No se pudo enviar la invitación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={sheet} role="dialog" aria-modal="true">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Invitar persona</h2>
          <button onClick={onClose} style={closeBtn} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#111827' }}>Invitación enviada</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
              Cuando <strong>{email}</strong> inicie sesión, verá la invitación pendiente.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => { setEmail(''); setSent(false) }} style={btnSecondary}>
                Invitar otra persona
              </button>
              <button onClick={onClose} style={btnPrimary}>Listo</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
              La persona recibirá la invitación la próxima vez que inicie sesión con este correo.
            </p>
            <div>
              <label style={labelStyle} htmlFor="invite-email">Correo electrónico *</label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                autoFocus
                style={inputStyle}
              />
            </div>

            {error && (
              <p style={{ margin: 0, fontSize: 13, color: '#ef4444', padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
              <button type="button" onClick={onClose} disabled={loading} style={btnSecondary}>
                Cancelar
              </button>
              <button type="submit" disabled={loading || !email.trim()} style={btnPrimary}>
                {loading ? 'Enviando...' : 'Enviar invitación'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

const overlay    = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }
const sheet      = { background: '#fff', borderRadius: '16px 16px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: 480 }
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827', outline: 'none', fontFamily: 'inherit' }
const closeBtn   = { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex' }
const btnSecondary = { padding: '9px 18px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' }
const btnPrimary   = { padding: '9px 18px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }

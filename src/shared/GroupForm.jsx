/**
 * GroupForm — crear o renombrar grupo (modal editorial).
 */
import { useState } from 'react'
import { useGroups } from '../core/hooks/useGroups'
import { L } from './agendaEditorial'

export function GroupForm({ group, onClose }) {
  const { createGroup, updateGroupName } = useGroups()
  const isEdit = !!group

  const [name, setName] = useState(group?.name ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      if (isEdit) {
        await updateGroupName(group.id, name.trim())
      } else {
        await createGroup({ name: name.trim() })
      }
      onClose()
    } catch (err) {
      setError(err.message ?? 'No se pudo guardar el grupo')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = !!name.trim() && !loading

  return (
    <div style={overlayModal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={dialog} role="dialog" aria-modal="true">

        <div style={headerRow}>
          <p style={dialogTitle}>{isEdit ? 'Renombrar grupo' : 'Nuevo grupo'}</p>
          <button type="button" onClick={onClose} style={closeBtn} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle} htmlFor="group-name">Nombre del grupo *</label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Familia, Trabajo, Proyecto X"
              required
              autoFocus
              maxLength={60}
              style={dialogInput}
            />
          </div>

          {error && (
            <p style={errorBox}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="button" onClick={onClose} disabled={loading} style={btnCancel}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{ ...btnConfirm, opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'default' }}
            >
              {loading ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear grupo'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

const overlayModal = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.72)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '18vh',
  paddingLeft: 20,
  paddingRight: 20,
  zIndex: 1000,
}

const dialog = {
  background: L.inkSoft,
  borderRadius: 2,
  padding: '24px 20px',
  width: '100%',
  maxWidth: 440,
  boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
  border: `1px solid ${L.champagneBorder}`,
}

const headerRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
}

const dialogTitle = {
  margin: 0,
  fontWeight: 500,
  fontSize: 18,
  color: L.ivory,
  letterSpacing: '-0.01em',
  fontFamily: L.serif,
}

const labelStyle = {
  display: 'block',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: L.champagne,
  marginBottom: 8,
}

const dialogInput = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 2,
  border: `1px solid ${L.champagneBorder}`,
  fontSize: 16,
  fontFamily: 'inherit',
  outline: 'none',
  background: L.champagneLight,
  color: L.ivory,
}

const closeBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: L.ivoryFaint,
  padding: 4,
  display: 'flex',
}

const errorBox = {
  margin: 0,
  fontSize: 13,
  color: '#E05252',
  padding: '10px 14px',
  background: 'rgba(224,82,82,0.08)',
  borderRadius: 2,
  border: '1px solid rgba(224,82,82,0.2)',
}

const btnCancel = {
  flex: 1,
  padding: '12px',
  borderRadius: 2,
  border: `1px solid ${L.champagneBorder}`,
  background: 'transparent',
  fontSize: 14,
  cursor: 'pointer',
  color: L.ivoryMuted,
}

const btnConfirm = {
  flex: 1,
  padding: '12px',
  borderRadius: 2,
  border: `1px solid ${L.ivory}`,
  background: L.ivory,
  color: L.ink,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

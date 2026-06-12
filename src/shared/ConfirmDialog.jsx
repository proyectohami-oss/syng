/**
 * Modal de confirmación — estilo editorial Syng.
 */
import { useState } from 'react'
import { L } from './agendaEditorial'

export function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message ?? 'Ocurrió un error')
      setLoading(false)
    }
  }

  const confirmStyle = danger
    ? { ...btnConfirm, background: 'rgba(224,82,82,0.18)', color: '#E05252', border: '1px solid rgba(224,82,82,0.35)' }
    : btnConfirm

  return (
    <div style={overlayModal}>
      <div style={dialog} role="alertdialog" aria-modal="true" aria-labelledby="dlg-title">
        <p id="dlg-title" style={dialogTitle}>{title}</p>
        <p style={dialogBody}>{message}</p>
        {error && (
          <p style={errorBox}>{error}</p>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onCancel} disabled={loading} style={btnCancel}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            style={{ ...confirmStyle, opacity: loading ? 0.45 : 1 }}
          >
            {loading ? 'Cargando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const overlayModal = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.72)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
}

const dialog = {
  background: L.inkSoft,
  borderRadius: 2,
  padding: '24px 20px',
  width: '100%',
  maxWidth: 360,
  boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
  border: `1px solid ${L.champagneBorder}`,
}

const dialogTitle = {
  margin: '0 0 8px',
  fontWeight: 500,
  fontSize: 18,
  color: L.ivory,
  letterSpacing: '-0.01em',
  fontFamily: L.serif,
}

const dialogBody = {
  margin: '0 0 20px',
  fontSize: 14,
  color: L.ivoryMuted,
  lineHeight: 1.5,
}

const errorBox = {
  margin: '0 0 12px',
  fontSize: 13,
  color: '#E05252',
  padding: '8px 12px',
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
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

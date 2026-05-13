/**
 * Modal confirmation dialog for destructive actions.
 *
 * Usage:
 *   <ConfirmDialog
 *     title="Eliminar tarea"
 *     message='¿Eliminar "Comprar leche"? Esta acción no se puede deshacer.'
 *     confirmLabel="Eliminar"
 *     danger
 *     onConfirm={handleDelete}
 *     onCancel={() => setModal(null)}
 *   />
 */
import { useState } from 'react'

export function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

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

  return (
    <div style={overlay}>
      <div style={dialog} role="alertdialog" aria-modal="true" aria-labelledby="dlg-title">
        <p id="dlg-title" style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 16, color: '#111827' }}>
          {title}
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
          {message}
        </p>
        {error && (
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#ef4444' }}>{error}</p>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={loading} style={btnSecondary}>
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{ ...btnPrimary, background: danger ? '#ef4444' : '#3b82f6' }}
          >
            {loading ? 'Cargando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
}
const dialog = {
  background: '#fff', borderRadius: 12,
  padding: '24px', width: '100%', maxWidth: 380,
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
}
const btnSecondary = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb',
  background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151',
}
const btnPrimary = {
  padding: '8px 16px', borderRadius: 8, border: 'none',
  color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500,
}

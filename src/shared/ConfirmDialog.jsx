/**
 * Modal confirmation dialog for destructive actions.
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
        <p id="dlg-title" style={{ margin:'0 0 8px', fontWeight:600, fontSize:16, color:'#0D1240', letterSpacing:'-0.01em' }}>
          {title}
        </p>
        <p style={{ margin:'0 0 20px', fontSize:14, color:'rgba(13,18,64,0.45)', lineHeight:1.5 }}>
          {message}
        </p>
        {error && (
          <p style={{ margin:'0 0 12px', fontSize:13, color:'#E05252', padding:'8px 12px', background:'rgba(224,82,82,0.08)', borderRadius:10 }}>{error}</p>
        )}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onCancel} disabled={loading} style={btnSecondary}>
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              ...btnPrimary,
              background: danger
                ? 'linear-gradient(135deg, #E86060, #E05252)'
                : 'linear-gradient(135deg, #3D4FA8, #2D3A8C)',
              boxShadow: danger
                ? '0 2px 8px rgba(224,82,82,0.28)'
                : '0 2px 8px rgba(45,58,140,0.28)',
            }}
          >
            {loading ? 'Cargando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position:'fixed', inset:0,
  background:'rgba(13,18,64,0.30)',
  display:'flex', alignItems:'center', justifyContent:'center',
  zIndex:1000,
  backdropFilter:'blur(4px)',
  WebkitBackdropFilter:'blur(4px)',
}
const dialog = {
  background:'rgba(255,255,255,0.96)',
  backdropFilter:'blur(48px)',
  WebkitBackdropFilter:'blur(48px)',
  borderRadius:20,
  padding:'24px',
  width:'100%', maxWidth:360,
  margin:'0 20px',
  boxShadow:'0 20px 60px rgba(13,18,64,0.16), inset 0 1px 0 rgba(255,255,255,0.95)',
  border:'1px solid rgba(255,255,255,0.70)',
}
const btnSecondary = {
  padding:'10px 18px', borderRadius:12,
  border:'1px solid rgba(13,18,64,0.12)',
  background:'rgba(255,255,255,0.80)',
  cursor:'pointer', fontSize:14,
  color:'rgba(13,18,64,0.50)',
}
const btnPrimary = {
  padding:'10px 18px', borderRadius:12,
  border:'none', color:'#fff',
  cursor:'pointer', fontSize:14, fontWeight:600,
}

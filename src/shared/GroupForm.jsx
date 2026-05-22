/**
 * GroupForm — create or rename a group (modal).
 * Centrado en pantalla para evitar que el teclado tape los botones en iOS.
 */
import { useState } from 'react'
import { useGroups } from '../core/hooks/useGroups'

export function GroupForm({ group, onClose }) {
  const { createGroup, updateGroupName } = useGroups()
  const isEdit = !!group

  const [name,    setName]    = useState(group?.name ?? '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

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

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={dialog} role="dialog" aria-modal="true">

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:600, color:'#0D1240', letterSpacing:'-0.01em' }}>
            {isEdit ? 'Renombrar grupo' : 'Nuevo grupo'}
          </h2>
          <button onClick={onClose} style={closeBtn} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
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
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ margin:0, fontSize:13, color:'#E05252', padding:'10px 14px', background:'rgba(224,82,82,0.08)', borderRadius:12, border:'1px solid rgba(224,82,82,0.15)' }}>
              {error}
            </p>
          )}

          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:4 }}>
            <button type="button" onClick={onClose} disabled={loading} style={btnCancel}>
              Cancelar
            </button>
            <button type="submit" disabled={loading || !name.trim()} style={btnSubmit}>
              {loading ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear grupo'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

/* Modal centrado — el teclado empuja hacia arriba pero no tapa los botones */
const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(13,18,64,0.30)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '18vh',
  paddingLeft: 20,
  paddingRight: 20,
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
}
const dialog = {
  background: 'rgba(250,251,255,0.97)',
  backdropFilter: 'blur(48px)',
  WebkitBackdropFilter: 'blur(48px)',
  borderRadius: 24,
  padding: '24px 20px 28px',
  width: '100%',
  maxWidth: 440,
  boxShadow: '0 20px 60px rgba(13,18,64,0.16), inset 0 1px 0 rgba(255,255,255,0.90)',
  border: '1px solid rgba(255,255,255,0.70)',
}
const labelStyle = { display:'block', fontSize:13, fontWeight:500, color:'rgba(13,18,64,0.50)', marginBottom:6 }
const inputStyle = {
  width:'100%', boxSizing:'border-box',
  padding:'12px 14px', borderRadius:12,
  border:'1.5px solid rgba(13,18,64,0.10)',
  fontSize:15, color:'#0D1240',
  outline:'none', fontFamily:'inherit',
  background:'rgba(255,255,255,0.80)',
  boxShadow:'inset 0 1px 3px rgba(13,18,64,0.04)',
}
const closeBtn  = { background:'none', border:'none', cursor:'pointer', color:'rgba(13,18,64,0.30)', padding:4, display:'flex' }
const btnCancel = { padding:'10px 18px', borderRadius:12, border:'1px solid rgba(13,18,64,0.12)', background:'rgba(255,255,255,0.80)', cursor:'pointer', fontSize:14, color:'rgba(13,18,64,0.45)' }
const btnSubmit = { padding:'10px 18px', borderRadius:12, border:'none', background:'linear-gradient(135deg, #3D4FA8, #2D3A8C)', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:600, boxShadow:'0 2px 8px rgba(45,58,140,0.28)' }

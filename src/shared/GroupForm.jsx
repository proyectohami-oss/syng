/**
 * GroupForm — create or rename a group (modal).
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
      <div style={sheet} role="dialog" aria-modal="true">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            {isEdit ? 'Renombrar grupo' : 'Nuevo grupo'}
          </h2>
          <button onClick={onClose} style={closeBtn} aria-label="Cerrar">
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
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: '#ef4444', padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
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

const overlay   = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }
const sheet     = { background: '#fff', borderRadius: '16px 16px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: 480 }
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827', outline: 'none', fontFamily: 'inherit' }
const closeBtn   = { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex' }
const btnCancel  = { padding: '9px 18px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' }
const btnSubmit  = { padding: '9px 18px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }

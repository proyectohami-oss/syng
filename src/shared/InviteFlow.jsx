import { useState } from 'react'
import { useGroups } from '../core/hooks/useGroups'
import { A, L } from './agendaEditorial'

export function InviteFlow({ groupId, groupName, inviterName, onClose }) {
  const { createInvitationLink } = useGroups()
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [compartido, setCompartido] = useState(false)
  const [maxUses,    setMaxUses]    = useState(5)
  const [horas,      setHoras]      = useState(18)
  const [sheetUsos,  setSheetUsos]  = useState(false)
  const [sheetHoras, setSheetHoras] = useState(false)

  async function handleInvitar() {
    setLoading(true)
    setError(null)
    try {
      const token = await createInvitationLink({ groupId, groupName, inviterName, maxUses, hoursValid: horas })
      const url   = `https://syng-psi.vercel.app/unirse?inv=${token}`
      const msg   = `${inviterName || 'Alguien'} te invito al grupo "${groupName}" en Syng.`
      if (navigator.share) {
        await navigator.share({ title: 'Invitacion a Syng', text: msg, url })
      } else {
        await navigator.clipboard.writeText(msg)
        setError('Enlace copiado. Pegalo en WhatsApp o Mensajes.')
      }
      setCompartido(true)
    } catch (err) {
      if (err.name !== 'AbortError') setError('No se pudo compartir: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={sheet}>
        <div style={sheetHeader}>
          <h2 style={sheetTitle}>Invitar al grupo</h2>
          <button type="button" onClick={onClose} style={closeBtn} aria-label="Cerrar">×</button>
        </div>

        {compartido ? (
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div style={successIcon}>✓</div>
            <p style={heading}>Invitación compartida</p>
            <p style={subtext}>
              Cuando la persona abra el link y acepte, entrará automáticamente al grupo.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button type="button" onClick={() => setCompartido(false)} style={A.btnSecondary}>
                Invitar a otro
              </button>
              <button type="button" onClick={onClose} style={A.btnPrimary}>
                Listo
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4px 0 0' }}>
            <div style={groupIcon}>
              {(groupName || 'G')[0].toUpperCase()}
            </div>
            <p style={heading}>{groupName}</p>
            <p style={subtext}>
              Syng genera un link único. Tú eliges cómo compartirlo.
            </p>

            <div style={optionsBox}>
              <button type="button" onClick={() => setSheetUsos(true)} style={rowBtn}>
                <span style={rowLabel}>Participantes máximos</span>
                <span style={rowValue}>{maxUses} ›</span>
              </button>
              <div style={rowDivider} />
              <button type="button" onClick={() => setSheetHoras(true)} style={rowBtn}>
                <span style={rowLabel}>Expira en</span>
                <span style={rowValue}>{horas} horas ›</span>
              </button>
            </div>

            {error && (
              <p style={{
                fontSize: 13,
                color: error.includes('copiado') ? L.champagne : '#E05252',
                padding: '10px 12px',
                background: error.includes('copiado') ? 'rgba(196,169,98,0.08)' : 'rgba(224,82,82,0.08)',
                border: `1px solid ${error.includes('copiado') ? L.champagneBorder : 'rgba(224,82,82,0.25)'}`,
                borderRadius: 2,
                margin: '0 0 16px',
                lineHeight: 1.45,
              }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleInvitar}
              disabled={loading}
              style={{ ...A.btnPrimary, width: '100%', marginBottom: 10, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Generando link…' : 'Generar link e invitar'}
            </button>
            <button type="button" onClick={onClose} style={{ ...A.btnSecondary, width: '100%' }}>
              Cancelar
            </button>
          </div>
        )}
      </div>

      {sheetUsos && (
        <div style={pickerOverlay} onClick={() => setSheetUsos(false)}>
          <div style={pickerSheet} onClick={e => e.stopPropagation()}>
            <p style={pickerTitle}>Participantes máximos</p>
            <div style={chipRow}>
              {[3, 5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setMaxUses(n); setSheetUsos(false) }}
                  style={chip(maxUses === n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {sheetHoras && (
        <div style={pickerOverlay} onClick={() => setSheetHoras(false)}>
          <div style={pickerSheet} onClick={e => e.stopPropagation()}>
            <p style={pickerTitle}>Duración de invitación</p>
            <div style={chipRow}>
              {[6, 12, 18, 24, 48].map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => { setHoras(h); setSheetHoras(false) }}
                  style={chip(horas === h)}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.72)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  zIndex: 1000,
}

const sheet = {
  background: L.inkSoft,
  borderRadius: '2px 2px 0 0',
  borderTop: `1px solid ${L.champagneBorder}`,
  padding: '20px 20px calc(28px + env(safe-area-inset-bottom))',
  width: '100%',
  maxWidth: 480,
  boxShadow: '0 -12px 48px rgba(0,0,0,0.45)',
}

const sheetHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 18,
  paddingBottom: 14,
  borderBottom: `1px solid rgba(196,169,98,0.15)`,
}

const sheetTitle = {
  margin: 0,
  fontFamily: L.serif,
  fontSize: 20,
  fontWeight: 400,
  color: L.ivory,
  letterSpacing: '-0.02em',
}

const closeBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: L.champagne,
  fontSize: 26,
  lineHeight: 1,
  padding: '4px 8px',
  minWidth: 44,
  minHeight: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const groupIcon = {
  width: 56,
  height: 56,
  borderRadius: 2,
  background: L.champagneLight,
  border: `1px solid ${L.champagneBorder}`,
  color: L.champagne,
  fontFamily: L.serif,
  fontSize: 24,
  fontWeight: 400,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 14px',
}

const successIcon = {
  width: 56,
  height: 56,
  borderRadius: 2,
  background: 'rgba(52,199,89,0.1)',
  border: '1px solid rgba(52,199,89,0.35)',
  color: '#6ee7a0',
  fontSize: 28,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 14px',
}

const heading = {
  margin: '0 0 8px',
  fontFamily: L.serif,
  fontSize: 20,
  fontWeight: 400,
  color: L.ivory,
  letterSpacing: '-0.02em',
}

const subtext = {
  margin: '0 0 18px',
  fontSize: 13,
  color: L.ivoryMuted,
  lineHeight: 1.55,
}

const optionsBox = {
  background: L.champagneLight,
  border: `1px solid ${L.champagneBorder}`,
  borderRadius: 2,
  marginBottom: 18,
  textAlign: 'left',
  overflow: 'hidden',
}

const rowBtn = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '13px 16px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
}

const rowLabel = {
  fontSize: 13,
  color: L.ivoryMuted,
}

const rowValue = {
  fontSize: 13,
  fontWeight: 600,
  color: L.champagne,
  letterSpacing: '0.02em',
}

const rowDivider = {
  height: 1,
  background: 'rgba(196,169,98,0.12)',
  margin: '0 16px',
}

const pickerOverlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.55)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  zIndex: 2000,
}

const pickerSheet = {
  background: L.inkSoft,
  borderRadius: '2px 2px 0 0',
  borderTop: `1px solid ${L.champagneBorder}`,
  padding: '22px 20px calc(28px + env(safe-area-inset-bottom))',
  width: '100%',
  maxWidth: 480,
}

const pickerTitle = {
  margin: '0 0 16px',
  fontFamily: L.serif,
  fontSize: 18,
  fontWeight: 400,
  color: L.ivory,
  textAlign: 'center',
  letterSpacing: '-0.02em',
}

const chipRow = {
  display: 'flex',
  gap: 8,
  justifyContent: 'center',
  flexWrap: 'wrap',
}

function chip(active) {
  return {
    padding: '10px 18px',
    borderRadius: 2,
    border: `1px solid ${active ? L.ivory : L.champagneBorder}`,
    background: active ? L.ivory : L.champagneLight,
    color: active ? L.ink : L.ivoryMuted,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    minWidth: 52,
  }
}

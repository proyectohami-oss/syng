import { useState } from 'react'
import { dejarAliadoSyng, gananciaTotalAliado } from '../../core/services/promotores.service'
import { fmtMXN } from '../../core/utils/aliadosRetiro'
import { A, L } from '../../shared/agendaEditorial'
import { showToast } from '../../shared/Toast'

export function AliadosDejarSection({ aliado }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!aliado || aliado.activo === false) return null

  const disponible = aliado.comisiones_disponibles ?? 0
  const pendiente = aliado.comisiones_pendientes ?? 0

  async function handleDejar() {
    setSubmitting(true)
    setError(null)
    try {
      const result = await dejarAliadoSyng()
      showToast(result.mensaje || 'Dejaste Aliados Syng', '✓')
      setConfirmOpen(false)
    } catch (e) {
      setError(e.message || 'No se pudo completar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ ...A.section, marginTop: 12, marginBottom: 24 }}>
      <p style={A.sectionLabel}>Dejar el programa</p>
      <div style={{ padding: '12px 16px 16px' }}>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: L.ivoryMuted, lineHeight: 1.55 }}>
          Tu código dejará de funcionar para nuevos referidos. Si tienes saldo disponible o pendiente,
          conservas el derecho a retirarlo según las reglas del programa.
        </p>
        <button
          type="button"
          onClick={() => { setConfirmOpen(true); setError(null) }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 2,
            border: '1px solid rgba(224,82,82,0.35)',
            background: 'rgba(224,82,82,0.08)',
            color: '#E05252',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Dejar Aliados Syng
        </button>
      </div>

      {confirmOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.72)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => !submitting && setConfirmOpen(false)}>
          <div style={{
            width: '100%', maxWidth: 480,
            background: L.inkSoft,
            borderTop: `1px solid ${L.champagneBorder}`,
            padding: '20px 16px calc(20px + env(safe-area-inset-bottom))',
          }} onClick={e => e.stopPropagation()}>
            <p style={{ margin: '0 0 8px', fontFamily: L.serif, fontSize: 20, color: L.ivory }}>
              ¿Dejar Aliados Syng?
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: L.ivoryMuted, lineHeight: 1.55 }}>
              Tu código <strong style={{ color: L.champagne }}>{aliado.codigo}</strong> dejará de generar
              comisiones nuevas. Tu saldo actual (pendiente ${fmtMXN(pendiente)} · disponible ${fmtMXN(disponible)})
              sigue siendo tuyo — total acumulado ${fmtMXN(gananciaTotalAliado(aliado))}.
            </p>
            {error && (
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#E05252' }}>{error}</p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setConfirmOpen(false)} disabled={submitting} style={{ ...A.btnSecondary, flex: 1 }}>
                Cancelar
              </button>
              <button type="button" onClick={handleDejar} disabled={submitting} style={{
                flex: 1,
                padding: '12px',
                borderRadius: 2,
                border: '1px solid rgba(224,82,82,0.45)',
                background: 'rgba(224,82,82,0.15)',
                color: '#E05252',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}>
                {submitting ? 'Procesando…' : 'Sí, dejar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

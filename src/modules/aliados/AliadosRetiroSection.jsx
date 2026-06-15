import { useState, useEffect } from 'react'
import {
  solicitarRetiroAliado, datosFiscalesCompletos,
} from '../../core/services/promotores.service'
import {
  RETIRO_MULTIPLO, montosPagoPermitidos, fmtMXN, faltanteParaRetiro,
} from '../../core/utils/aliadosRetiro'
import { A, L } from '../../shared/agendaEditorial'
import { showToast } from '../../shared/Toast'

export function AliadosRetiroSection({ aliado, retiroSolicitado, userName }) {
  const disponible = aliado?.comisiones_disponibles ?? 0
  const montos = montosPagoPermitidos(disponible)
  const faltante = faltanteParaRetiro(disponible)
  const cuentas = aliado?.cuentas_bancarias || []
  const fiscalOk = datosFiscalesCompletos(aliado?.datos_fiscales)
  const puedeRetirar = montos.length > 0 && cuentas.length > 0 && fiscalOk && !retiroSolicitado && aliado?.activo !== false

  const [monto, setMonto] = useState(montos[montos.length - 1] ?? RETIRO_MULTIPLO)
  const [cuentaId, setCuentaId] = useState(
    () => cuentas.find(c => c.predeterminada)?.id || cuentas[0]?.id || '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (montos.length) setMonto(montos[montos.length - 1])
  }, [disponible])

  async function handleSolicitar() {
    setSubmitting(true)
    setError(null)
    try {
      await solicitarRetiroAliado({ monto, cuentaId: cuentaId || undefined })
      showToast('Retiro solicitado — te avisaremos al depositar', '✓')
      setConfirmOpen(false)
    } catch (e) {
      setError(e.message || 'No se pudo solicitar el retiro')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={A.section}>
      <p style={A.sectionLabel}>Retirar ganancias</p>
      <div style={{ padding: '12px 16px 16px' }}>
        {retiroSolicitado ? (
          <div style={{
            padding: '14px 16px',
            background: 'rgba(217,119,6,0.08)',
            border: '1px solid rgba(217,119,6,0.35)',
            borderRadius: 2,
          }}>
            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: L.ivory }}>
              Retiro en proceso
            </p>
            <p style={{ margin: 0, fontSize: 12, color: L.ivoryMuted, lineHeight: 1.5 }}>
              Solicitaste ${fmtMXN(retiroSolicitado.monto)} el{' '}
              {retiroSolicitado.createdAt?.toDate
                ? retiroSolicitado.createdAt.toDate().toLocaleDateString('es-MX')
                : 'recientemente'}
              . Te depositaremos por SPEI en unos días hábiles.
            </p>
          </div>
        ) : (
          <>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: L.ivoryMuted, lineHeight: 1.5 }}>
              Retiros en múltiplos de ${RETIRO_MULTIPLO} MXN. Saldo disponible:{' '}
              <strong style={{ color: L.ivory }}>${fmtMXN(disponible)}</strong>
            </p>

            {!fiscalOk && (
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#E8A838', lineHeight: 1.5 }}>
                Antes del primer retiro necesitas RFC y razón social en la sección de arriba.
              </p>
            )}
            {!cuentas.length && (
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#E8A838', lineHeight: 1.5 }}>
                Agrega al menos una cuenta bancaria para retirar.
              </p>
            )}
            {faltante > 0 && (
              <p style={{ margin: '0 0 12px', fontSize: 12, color: L.ivoryMuted }}>
                Faltan ${fmtMXN(faltante)} para alcanzar el mínimo de ${RETIRO_MULTIPLO}.
              </p>
            )}

            {montos.length > 0 && (
              <>
                <label style={{ display: 'block', fontSize: 11, color: L.ivoryMuted, marginBottom: 6 }}>
                  Monto a retirar
                </label>
                <select
                  value={monto}
                  onChange={e => setMonto(Number(e.target.value))}
                  style={{ ...A.input, marginBottom: 12 }}
                >
                  {montos.map(m => (
                    <option key={m} value={m}>${fmtMXN(m)} MXN</option>
                  ))}
                </select>

                {cuentas.length > 1 && (
                  <>
                    <label style={{ display: 'block', fontSize: 11, color: L.ivoryMuted, marginBottom: 6 }}>
                      Cuenta de depósito
                    </label>
                    <select
                      value={cuentaId}
                      onChange={e => setCuentaId(e.target.value)}
                      style={{ ...A.input, marginBottom: 12 }}
                    >
                      {cuentas.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.banco} · {String(c.clabe).slice(-4)}
                          {c.predeterminada ? ' (predeterminada)' : ''}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </>
            )}

            <button
              type="button"
              disabled={!puedeRetirar}
              onClick={() => setConfirmOpen(true)}
              style={{
                ...A.btnPrimary,
                width: '100%',
                opacity: puedeRetirar ? 1 : 0.45,
              }}
            >
              Solicitar retiro
            </button>
          </>
        )}

        {error && (
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#E05252' }}>{error}</p>
        )}
      </div>

      {confirmOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => !submitting && setConfirmOpen(false)}>
          <div style={{
            width: '100%', maxWidth: 480,
            background: L.navyDeep,
            borderTop: `1px solid ${L.champagneBorder}`,
            padding: '20px 16px calc(20px + env(safe-area-inset-bottom))',
          }} onClick={e => e.stopPropagation()}>
            <p style={{ margin: '0 0 8px', fontFamily: L.serif, fontSize: 20, color: L.ivory }}>
              Confirmar retiro
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: L.ivoryMuted, lineHeight: 1.55 }}>
              Solicitarás <strong style={{ color: L.ivory }}>${fmtMXN(monto)}</strong> a la cuenta registrada a nombre de{' '}
              {cuentas.find(c => c.id === cuentaId)?.titular || userName || 'ti'}.
              El depósito puede tardar unos días hábiles.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setConfirmOpen(false)} disabled={submitting} style={{ ...A.btnSecondary, flex: 1 }}>
                Cancelar
              </button>
              <button type="button" onClick={handleSolicitar} disabled={submitting} style={{ ...A.btnPrimary, flex: 1 }}>
                {submitting ? 'Enviando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

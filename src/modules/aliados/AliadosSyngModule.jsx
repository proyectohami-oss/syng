import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCoreAuth } from '../../core/hooks/useCoreData'
import {
  subscribePromotorByUserId,
  registerAliadoSyng,
  subscribeRetiroSolicitado,
  isAliadosProgramActive,
  ALIADOS_PAUSADO_MSG,
  EN_REVISION_MSG,
  gananciaTotalAliado,
} from '../../core/services/promotores.service'
import {
  RETIRO_MULTIPLO, faltanteParaRetiro, fmtMXN, aliadoShareUrl, aliadoShareText,
} from '../../core/utils/aliadosRetiro'
import { AliadosCuentasSection } from './AliadosCuentasSection'
import { AliadosRetiroSection } from './AliadosRetiroSection'
import { A, L } from '../../shared/agendaEditorial'
import { showToast } from '../../shared/Toast'

const ONBOARDING = [
  {
    title: 'Comparte tu código',
    body: 'Quien se suscriba a Syng con tu código recibe descuento en su primer pago.',
  },
  {
    title: 'Ganas en cada referido',
    body: 'Recibes comisión sobre lo que paguen — solo en su primera suscripción de pago.',
  },
  {
    title: 'Retiros desde $500',
    body: 'Cuando acumules saldo disponible, podrás retirar en bloques de $500 MXN. Para retiros, la ley puede exigir datos fiscales (RFC).',
  },
]

function MetricCard({ label, value, sub, accent }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      padding: '14px 12px',
      background: 'rgba(196,169,98,0.06)',
      border: `1px solid ${L.champagneBorder}`,
      borderRadius: 2,
    }}>
      <p style={{ margin: '0 0 6px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: L.ivoryMuted }}>
        {label}
      </p>
      <p style={{ margin: 0, fontFamily: L.serif, fontSize: 22, color: accent || L.ivory }}>
        {value}
      </p>
      {sub && (
        <p style={{ margin: '6px 0 0', fontSize: 11, color: L.ivoryMuted, lineHeight: 1.4 }}>{sub}</p>
      )}
    </div>
  )
}

export function AliadosSyngModule() {
  const navigate = useNavigate()
  const auth = useCoreAuth()
  const user = auth.user
  const systemConfig = auth.systemConfig
  const aliadosActivo = isAliadosProgramActive(systemConfig)
  const descuentoPct = systemConfig?.descuento_usuario ?? 10

  const [aliado, setAliado]       = useState(null)
  const [retiroSolicitado, setRetiroSolicitado] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError]         = useState(null)
  const [onboardStep, setOnboardStep] = useState(0)

  useEffect(() => {
    if (!user?.uid) return undefined
    setLoading(true)
    const unsub = subscribePromotorByUserId(user.uid, (data) => {
      setAliado(data)
      setLoading(false)
    })
    const unsubRetiro = subscribeRetiroSolicitado(user.uid, setRetiroSolicitado)
    return () => { unsub(); unsubRetiro() }
  }, [user?.uid])

  async function handleRegister() {
    setRegistering(true)
    setError(null)
    try {
      const result = await registerAliadoSyng()
      setAliado(result.aliado)
      if (result.mensaje) showToast(result.mensaje, '✓')
      else if (result.linked) showToast('Tu cuenta aliado quedó vinculada', '✓')
      else showToast('¡Ya eres aliado Syng!', '✓')
    } catch (e) {
      setError(e.message || 'No se pudo completar el registro')
    } finally {
      setRegistering(false)
    }
  }

  async function handleShare() {
    if (!aliado?.codigo) return
    const url = aliadoShareUrl(aliado.codigo)
    const text = aliadoShareText(aliado.codigo, descuentoPct)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Syng — Aliados', text, url })
        return
      } catch { /* cancelado */ }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      showToast('Enlace copiado', '✓')
    } catch {
      showToast('No se pudo copiar', '!')
    }
  }

  async function handleCopyCode() {
    if (!aliado?.codigo) return
    try {
      await navigator.clipboard.writeText(aliado.codigo)
      showToast('Código copiado', '✓')
    } catch {
      showToast('No se pudo copiar', '!')
    }
  }

  const comisionPct = aliado?.porcentaje_comision ?? systemConfig?.comision_promotores ?? 25
  const disponible = aliado?.comisiones_disponibles ?? 0
  const pendiente = aliado?.comisiones_pendientes ?? 0
  const pagado = aliado?.comisiones_pagadas ?? 0
  const faltante = faltanteParaRetiro(disponible)

  return (
    <div style={A.screen}>
      <div style={A.header}>
        <button type="button" onClick={() => navigate('/perfil')} style={A.navBtn} aria-label="Volver">
          ←
        </button>
        <span style={A.headerTitle}>Aliados Syng</span>
        <span style={{ width: 32 }} />
      </div>

      <div style={{ ...A.body, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {loading ? (
          <p style={{ padding: 32, textAlign: 'center', color: L.ivoryMuted, fontSize: 14 }}>Cargando…</p>
        ) : !aliadosActivo ? (
          <div style={{ padding: '24px 16px' }}>
            <p style={{ margin: 0, fontSize: 14, color: L.ivoryMuted, lineHeight: 1.6 }}>{ALIADOS_PAUSADO_MSG}</p>
          </div>
        ) : aliado?.en_revision ? (
          <div style={{ padding: '24px 16px' }}>
            <div style={{
              padding: '16px 18px',
              border: '1px solid rgba(217,119,6,0.35)',
              background: 'rgba(217,119,6,0.08)',
              borderRadius: 2,
            }}>
              <p style={{ margin: 0, fontSize: 14, color: L.ivory, lineHeight: 1.55 }}>{EN_REVISION_MSG}</p>
            </div>
          </div>
        ) : aliado ? (
          <>
            <div style={{ padding: '20px 16px 8px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: L.champagne }}>
                Eres aliado Syng
              </p>
              <p style={{ margin: '0 0 12px', fontFamily: L.serif, fontSize: 28, color: L.ivory, letterSpacing: '0.12em' }}>
                {aliado.codigo}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: L.ivoryMuted }}>
                Comisión {comisionPct}% · Descuento referido {descuentoPct}%
              </p>
              {!aliado.activo && (
                <p style={{ margin: '10px 0 0', fontSize: 12, color: '#E05252' }}>
                  Tu código está inactivo — no genera nuevas comisiones.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, padding: '0 16px 20px' }}>
              <button type="button" onClick={handleShare} style={{ ...A.btnPrimary, flex: 1 }}>
                Compartir
              </button>
              <button type="button" onClick={handleCopyCode} style={{ ...A.btnSecondary, flex: 'none', padding: '10px 14px' }}>
                Copiar
              </button>
            </div>

            <div style={A.section}>
              <p style={A.sectionLabel}>Mis ganancias</p>
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <MetricCard
                    label="Pendiente"
                    value={`$${fmtMXN(pendiente)}`}
                    sub="Esperando liquidación Syng"
                    accent="#E8A838"
                  />
                  <MetricCard
                    label="Disponible"
                    value={`$${fmtMXN(disponible)}`}
                    sub={faltante > 0 ? `Faltan $${fmtMXN(faltante)} para retirar $${RETIRO_MULTIPLO}` : 'Listo para retiro'}
                    accent="#6ee7a0"
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <MetricCard
                    label="Pagado"
                    value={`$${fmtMXN(pagado)}`}
                    sub="Transferencias completadas"
                  />
                  <MetricCard
                    label="Total"
                    value={`$${fmtMXN(gananciaTotalAliado(aliado))}`}
                    sub="Pendiente + disponible + pagado"
                  />
                </div>
              </div>
            </div>

            <div style={A.section}>
              <p style={A.sectionLabel}>Referidos</p>
              <div style={{ padding: '12px 16px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${L.champagneBorder}` }}>
                  <span style={{ fontSize: 14, color: L.ivoryMuted }}>Pagos convertidos</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: L.ivory }}>{aliado.usuarios_pago ?? 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                  <span style={{ fontSize: 14, color: L.ivoryMuted }}>Registros con tu código</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: L.ivory }}>{aliado.usuarios_registrados ?? 0}</span>
                </div>
              </div>
            </div>

            <AliadosCuentasSection
              aliado={aliado}
              userName={user?.displayName || user?.email?.split('@')[0]}
            />

            <AliadosRetiroSection
              aliado={aliado}
              retiroSolicitado={retiroSolicitado}
              userName={user?.displayName || user?.email?.split('@')[0]}
            />

            <div style={{ ...A.section, marginTop: 12 }}>
              <p style={A.sectionLabel}>Tu enlace</p>
              <div style={{ padding: '12px 16px 14px' }}>
                <p style={{
                  margin: 0, fontSize: 12, color: L.champagne, fontFamily: 'monospace',
                  wordBreak: 'break-all', lineHeight: 1.5,
                }}>
                  {aliadoShareUrl(aliado.codigo)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '8px 16px 32px' }}>
            <p style={{ margin: '0 0 20px', fontFamily: L.serif, fontSize: 22, color: L.ivory, lineHeight: 1.35 }}>
              Gana comisión cuando alguien paga Syng con tu código.
            </p>

            <div style={{
              padding: '18px 16px',
              marginBottom: 20,
              background: 'rgba(196,169,98,0.06)',
              border: `1px solid ${L.champagneBorder}`,
              borderRadius: 2,
            }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, color: L.champagne, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Paso {onboardStep + 1} de {ONBOARDING.length}
              </p>
              <p style={{ margin: '0 0 8px', fontFamily: L.serif, fontSize: 18, color: L.ivory }}>
                {ONBOARDING[onboardStep].title}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: L.ivoryMuted, lineHeight: 1.55 }}>
                {ONBOARDING[onboardStep].body}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {onboardStep > 0 && (
                  <button type="button" onClick={() => setOnboardStep(s => s - 1)} style={A.btnSecondary}>
                    Atrás
                  </button>
                )}
                {onboardStep < ONBOARDING.length - 1 ? (
                  <button type="button" onClick={() => setOnboardStep(s => s + 1)} style={{ ...A.btnPrimary, flex: 1 }}>
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={registering}
                    style={{ ...A.btnPrimary, flex: 1 }}
                  >
                    {registering ? 'Activando…' : 'Hazte aliado Syng'}
                  </button>
                )}
              </div>
            </div>

            {onboardStep === ONBOARDING.length - 1 && (
              <p style={{ margin: 0, fontSize: 11, color: L.ivoryMuted, lineHeight: 1.5 }}>
                Al continuar aceptas las reglas del programa: comisión solo en primer pago, retiros en múltiplos de $500,
                y datos fiscales antes del primer retiro cuando la ley lo exija.
              </p>
            )}
          </div>
        )}

        {error && (
          <p style={{
            fontSize: 13, color: '#E05252', padding: '10px 16px',
            background: 'rgba(224,82,82,0.08)', borderRadius: 2,
            margin: '12px 16px', border: '1px solid rgba(224,82,82,0.25)',
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

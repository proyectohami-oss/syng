import { useEffect, useState } from 'react'
import { useCoreAuth } from '../../core/hooks/useCoreData'
import {
  findPromotorByCodigo,
  savePromotorCodigo,
  clearPromotorCodigo,
  canEditAliadoCode,
  qualifiesForAliadoDiscount,
  normalizePromotorCodigo,
  isSelfReferral,
  SELF_REFERRAL_MSG,
} from '../../core/services/promotores.service'
import { A, L } from '../../shared/agendaEditorial'

export function PromotorCodeSection({ systemConfig, onApplied, onError }) {
  const auth = useCoreAuth()
  const user = auth.user
  const userData = auth.userData
  const subscription = auth.subscription

  const descuentoPct = systemConfig?.descuento_usuario ?? 0
  const canEdit = canEditAliadoCode(userData)
  const discountEligible = qualifiesForAliadoDiscount({ subscription, userData })

  const [input, setInput]       = useState(userData?.promotorCodigo ?? '')
  const [promotor, setPromotor] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [applied, setApplied]   = useState(!!userData?.promotorCodigo)

  useEffect(() => {
    if (!userData?.promotorCodigo) return
    let cancelled = false
    findPromotorByCodigo(userData.promotorCodigo).then(p => {
      if (!cancelled && p) {
        setPromotor(p)
        setApplied(true)
        onApplied?.(p)
      }
    })
    return () => { cancelled = true }
  }, [userData?.promotorCodigo])

  async function handleApply() {
    const codigo = normalizePromotorCodigo(input)
    if (!codigo) {
      onError?.('Ingresa un código de aliado')
      return
    }
    setLoading(true)
    onError?.(null)
    try {
      const p = await findPromotorByCodigo(codigo)
      if (!p) {
        onError?.('Código no válido o aliado inactivo')
        setPromotor(null)
        setApplied(false)
        return
      }
      if (isSelfReferral({ user, promotor: p })) {
        onError?.(SELF_REFERRAL_MSG)
        setPromotor(null)
        setApplied(false)
        return
      }
      await savePromotorCodigo(user.uid, p)
      setPromotor(p)
      setApplied(true)
      onApplied?.(p)
    } catch (e) {
      onError?.(e.message || 'No se pudo aplicar el código')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    setLoading(true)
    onError?.(null)
    try {
      await clearPromotorCodigo(user.uid)
      setPromotor(null)
      setApplied(false)
      setInput('')
      onApplied?.(null)
    } catch (e) {
      onError?.(e.message || 'No se pudo quitar el código')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      marginTop: 14,
      padding: '12px 14px',
      border: `1px solid ${applied ? 'rgba(52,199,89,0.35)' : L.champagneBorder}`,
      borderRadius: 2,
      background: applied ? 'rgba(52,199,89,0.06)' : 'rgba(196,169,98,0.04)',
    }}>
      <p style={{ margin: '0 0 8px', fontSize: 12, color: L.ivoryMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Código Aliados Syng
      </p>

      {!canEdit && userData?.promotorCodigoUsado ? (
        <p style={{ margin: 0, fontSize: 13, color: L.ivoryMuted, lineHeight: 1.5 }}>
          Ya usaste un código de aliado en tu suscripción
          {userData.promotorCodigo ? ` (${userData.promotorCodigo})` : ''}.
        </p>
      ) : applied && promotor ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, color: L.ivory, fontWeight: 500 }}>
              {promotor.codigo}
              {discountEligible && descuentoPct > 0
                ? ` · −${descuentoPct}% al pagar`
                : ' · código guardado'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: L.ivoryMuted }}>
              Referido por {promotor.nombre}
              {!discountEligible && descuentoPct > 0
                ? ' · El descuento aplica en tu primera suscripción de pago'
                : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            style={{ ...A.btnSecondary, flex: 'none', padding: '6px 10px', fontSize: 11 }}
          >
            Quitar
          </button>
        </div>
      ) : (
        <>
          {descuentoPct > 0 ? (
            <p style={{ margin: '0 0 10px', fontSize: 11, color: L.ivoryMuted, lineHeight: 1.45 }}>
              ¿Te invitó un aliado? Ingresa su código aquí.
              {discountEligible
                ? ` Descuento de ${descuentoPct}% en tu primera suscripción de pago.`
                : ' El descuento aplica en tu primera suscripción de pago.'}
            </p>
          ) : (
            <p style={{ margin: '0 0 10px', fontSize: 11, color: L.ivoryMuted }}>
              Programa Aliados Syng no disponible por ahora.
            </p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              placeholder="Ej. GFS2K6FJ"
              disabled={!canEdit || descuentoPct <= 0}
              style={{ ...A.input, flex: 1, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}
            />
            <button
              type="button"
              onClick={handleApply}
              disabled={loading || !canEdit || descuentoPct <= 0}
              style={{ ...A.btnPrimary, flex: 'none', padding: '8px 14px', fontSize: 12 }}
            >
              {loading ? '…' : 'Aplicar'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCoreAuth } from '../../core/hooks/useCoreData'
import { startMercadoPagoCheckout } from '../../core/services/payments.service'
import { planDisplayName, planPriceLabel, planLimitLabel } from '../../core/services/subscriptions.service'
import { qualifiesForAliadoDiscount } from '../../core/services/promotores.service'
import { showToast } from '../../shared/Toast'
import { A, L } from '../../shared/agendaEditorial'

const PAID_PLAN_ORDER = ['plus_individual', 'plus_ilimitado', 'familiar']

function sortPlans(plans) {
  return [...plans].sort((a, b) => {
    const ia = PAID_PLAN_ORDER.indexOf(a.id)
    const ib = PAID_PLAN_ORDER.indexOf(b.id)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}

function isPlanAvailable(plan, systemConfig) {
  if (plan.id === 'gratis' || plan.active === false) return false
  const toggles = systemConfig?.planes_activos
  if (toggles && toggles[plan.id] === false) return false
  return PAID_PLAN_ORDER.includes(plan.id)
}

export function PlanUpgradeSection({ currentPlanId, systemConfig, appliedAliado, onError, onCheckoutStart }) {
  const auth = useCoreAuth()
  const [plans, setPlans]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [checkoutId, setCheckoutId] = useState(null)

  const discountEligible = qualifiesForAliadoDiscount({
    subscription: auth.subscription,
    userData:     auth.userData,
  })
  const descuentoPct = (appliedAliado && discountEligible)
    ? (systemConfig?.descuento_usuario ?? 0)
    : 0

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const snap = await getDocs(collection(db, 'subscription_plans'))
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => isPlanAvailable(p, systemConfig) && p.id !== currentPlanId)
        if (!cancelled) setPlans(sortPlans(list))
      } catch (e) {
        if (!cancelled) onError?.(e.message || 'No se pudieron cargar los planes')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [currentPlanId, systemConfig, onError])

  async function handlePay(planId) {
    setCheckoutId(planId)
    onError?.(null)
    onCheckoutStart?.()
    try {
      const payload = { planId }
      if (appliedAliado?.codigo && descuentoPct > 0) {
        payload.promotorCodigo = appliedAliado.codigo
      }
      const { checkoutUrl } = await startMercadoPagoCheckout(payload)
      window.location.href = checkoutUrl
    } catch (e) {
      const msg = e.message || 'No se pudo iniciar el pago'
      onError?.(msg)
      showToast(msg, '⚠️')
      setCheckoutId(null)
    }
  }

  if (loading) {
    return (
      <p style={{ margin: '14px 0 0', fontSize: 12, color: L.ivoryMuted }}>
        Cargando planes…
      </p>
    )
  }

  if (!plans.length) return null

  return (
    <div id="syng-mejorar-plan" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: 0, fontSize: 12, color: L.ivoryMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Mejorar plan
      </p>
      {plans.map(plan => (
        <div
          key={plan.id}
          style={{
            padding: '12px 14px',
            border: `1px solid ${L.champagneBorder}`,
            borderRadius: 2,
            background: 'rgba(196,169,98,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 4px', fontFamily: L.serif, fontSize: 16, color: L.ivory }}>
                {planDisplayName(plan, plan.id)}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: L.champagne }}>
                {planPriceLabel(plan, descuentoPct)} · {planLimitLabel(plan, plan.id)}
              </p>
              {descuentoPct > 0 && (
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6ee7a0' }}>
                  Descuento Aliados Syng aplicado en checkout
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => handlePay(plan.id)}
              disabled={checkoutId != null}
              style={{
                ...A.btnPrimary,
                flex: 'none',
                padding: '8px 12px',
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              {checkoutId === plan.id ? 'Abriendo…' : 'Pagar'}
            </button>
          </div>
        </div>
      ))}
      <p style={{ margin: 0, fontSize: 11, color: L.ivoryMuted, lineHeight: 1.45 }}>
        Pago seguro con Mercado Pago. Tu plan se activa al confirmarse el pago.
      </p>
    </div>
  )
}

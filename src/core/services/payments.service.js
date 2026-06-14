import { auth } from '../../firebase'

export async function startMercadoPagoCheckout({ planId, promotorCodigo } = {}) {
  const user = auth.currentUser
  if (!user) throw new Error('Inicia sesión para continuar')

  const token = await user.getIdToken()
  const body  = { planId }
  if (promotorCodigo) body.promotorCodigo = promotorCodigo

  const res = await fetch('/api/checkout', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Error de pago (${res.status})`)
  }
  if (!data.checkoutUrl) {
    throw new Error('Mercado Pago no devolvió la URL de pago')
  }
  return data
}

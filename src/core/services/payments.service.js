import { auth } from '../../firebase'

export async function startMercadoPagoCheckout(planId) {
  const user = auth.currentUser
  if (!user) throw new Error('Inicia sesión para continuar')

  const token = await user.getIdToken()
  const res   = await fetch('/api/checkout', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify({ planId }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'No se pudo iniciar el pago')
  }
  if (!data.checkoutUrl) {
    throw new Error('Mercado Pago no devolvió la URL de pago')
  }
  return data
}

/**
 * Mercado Pago — checkout y webhook para activar suscripciones.
 *
 * Secret requerido:
 *   firebase functions:secrets:set MERCADOPAGO_ACCESS_TOKEN
 *
 * Webhook URL (configurar en MP Developers):
 *   https://us-central1-syng-app.cloudfunctions.net/mercadopagoWebhook
 */
const fetch = require('node-fetch')
const { onRequest } = require('firebase-functions/v2/https')
const { defineString } = require('firebase-functions/params')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

const mpToken = defineString('MERCADOPAGO_ACCESS_TOKEN', { default: '' })
const db      = getFirestore()

const WEB_APP_URL = process.env.WEB_APP_URL || 'https://syng-psi.vercel.app'
const PAID_PLANS  = new Set(['plus_individual', 'plus_ilimitado', 'familiar'])

function setCors(req, res) {
  const origin = req.get('Origin') || ''
  if (origin === WEB_APP_URL || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
    res.set('Access-Control-Allow-Origin', origin)
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

async function verifyAuth(req) {
  const header = req.headers.authorization || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    const err = new Error('Inicia sesión para continuar')
    err.status = 401
    throw err
  }
  return getAuth().verifyIdToken(token)
}

function mpAccessToken() {
  const token = mpToken.value()
  if (!token) {
    const err = new Error('Mercado Pago aún no está configurado en el servidor')
    err.status = 503
    throw err
  }
  return token
}

async function mpRequest(path, options = {}) {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      Authorization:  `Bearer ${mpAccessToken()}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('[MP]', path, res.status, data)
    const err = new Error(data.message || 'Error al contactar Mercado Pago')
    err.status = 502
    throw err
  }
  return data
}

function planUnitPrice(plan) {
  const price = Number(plan.price ?? plan.priceMonthly ?? plan.monthlyPrice ?? 0)
  if (!price || price <= 0) {
    const err = new Error('Este plan no tiene precio configurado')
    err.status = 400
    throw err
  }
  return price
}

function parseExternalReference(ref) {
  if (!ref || typeof ref !== 'string') return {}
  const [userId, planId] = ref.split('|')
  return { userId, planId }
}

function paymentUserAndPlan(payment) {
  const meta = payment.metadata || {}
  const fromMeta = {
    userId: meta.user_id || meta.userId || null,
    planId: meta.plan_id || meta.planId || null,
  }
  if (fromMeta.userId && fromMeta.planId) return fromMeta
  return parseExternalReference(payment.external_reference)
}

async function loadPlan(planId) {
  const snap = await db.doc(`subscription_plans/${planId}`).get()
  if (!snap.exists()) {
    const err = new Error('Plan no encontrado')
    err.status = 404
    throw err
  }
  const plan = snap.data()
  if (plan.active === false) {
    const err = new Error('Este plan no está disponible')
    err.status = 400
    throw err
  }
  return { id: snap.id, ...plan }
}

async function activateSubscriptionFromPayment(payment) {
  const paymentId = String(payment.id)
  const payRef    = db.doc(`payments/${paymentId}`)
  const existing  = await payRef.get()
  if (existing.exists && existing.data().status === 'approved') {
    console.log('[MP webhook] pago ya procesado', paymentId)
    return { duplicate: true }
  }

  const { userId, planId } = paymentUserAndPlan(payment)
  if (!userId || !planId || !PAID_PLANS.has(planId)) {
    console.warn('[MP webhook] pago sin userId/planId válido', paymentId, { userId, planId })
    return { skipped: true }
  }

  const batch = db.batch()
  batch.set(payRef, {
    userId,
    planId,
    monto:       payment.transaction_amount ?? 0,
    currency:    payment.currency_id || 'MXN',
    status:      'approved',
    mpPaymentId: paymentId,
    mpStatus:    payment.status,
    createdAt:   FieldValue.serverTimestamp(),
  }, { merge: true })

  batch.set(db.doc(`subscriptions/${userId}`), {
    userId,
    planId,
    status:    'active',
    source:    'payment',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })

  await batch.commit()
  console.log('[MP webhook] plan activado', userId, planId, paymentId)
  return { activated: true, userId, planId }
}

const createMercadoPagoCheckout = onRequest({
  timeoutSeconds: 30,
  invoker:        'public',
}, async (req, res) => {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  try {
    const decoded = await verifyAuth(req)
    const { planId } = req.body || {}
    if (!planId || !PAID_PLANS.has(planId)) {
      return res.status(400).json({ error: 'Plan no válido' })
    }

    const plan  = await loadPlan(planId)
    const price = planUnitPrice(plan)
    const uid   = decoded.uid
    const email = decoded.email || ''

    const preference = await mpRequest('/checkout/preferences', {
      method: 'POST',
      body:   JSON.stringify({
        items: [{
          id:          planId,
          title:       plan.name || planId,
          description: plan.description || `Suscripción Syng — ${plan.name || planId}`,
          quantity:    1,
          unit_price:  price,
          currency_id: plan.currency || 'MXN',
        }],
        payer: { email },
        external_reference: `${uid}|${planId}|${Date.now()}`,
        metadata:           { user_id: uid, plan_id: planId },
        back_urls: {
          success: `${WEB_APP_URL}/perfil?pago=ok`,
          failure: `${WEB_APP_URL}/perfil?pago=fail`,
          pending: `${WEB_APP_URL}/perfil?pago=pending`,
        },
        auto_return:      'approved',
        notification_url: `https://us-central1-${process.env.GCLOUD_PROJECT || 'syng-app'}.cloudfunctions.net/mercadopagoWebhook`,
      }),
    })

    const checkoutUrl = preference.init_point || preference.sandbox_init_point
    if (!checkoutUrl) {
      return res.status(502).json({ error: 'Mercado Pago no devolvió URL de pago' })
    }

    res.json({
      checkoutUrl,
      preferenceId: preference.id,
      planId,
      amount:       price,
    })
  } catch (err) {
    console.error('[createMercadoPagoCheckout]', err)
    res.status(err.status || 500).json({ error: err.message || 'Error interno' })
  }
})

const mercadopagoWebhook = onRequest({
  timeoutSeconds: 60,
  invoker:        'public',
}, async (req, res) => {
  try {
    let paymentId = req.query.id || req.query['data.id']
    const topic   = req.query.topic || req.query.type || req.body?.type

    if (!paymentId && req.body?.data?.id) {
      paymentId = req.body.data.id
    }

    if (topic && topic !== 'payment') {
      return res.status(200).send('OK')
    }
    if (!paymentId) {
      return res.status(400).send('missing payment id')
    }

    const payment = await mpRequest(`/v1/payments/${paymentId}`)
    if (payment.status === 'approved') {
      await activateSubscriptionFromPayment(payment)
    } else {
      console.log('[MP webhook] pago no aprobado', paymentId, payment.status)
    }

    res.status(200).send('OK')
  } catch (err) {
    console.error('[mercadopagoWebhook]', err)
    res.status(500).send('error')
  }
})

module.exports = { createMercadoPagoCheckout, mercadopagoWebhook }

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

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100
}

async function loadSystemConfig() {
  const [mainSnap, adminSnap] = await Promise.all([
    db.doc('system_config/main').get(),
    db.doc('system_config/admin').get(),
  ])
  return {
    ...(mainSnap.exists ? mainSnap.data() : {}),
    ...(adminSnap.exists ? adminSnap.data() : {}),
  }
}

async function findPromotorByCodigo(codigo) {
  const normalized = String(codigo || '').trim().toUpperCase()
  if (!normalized) return null
  const snap = await db.collection('promotores')
    .where('codigo', '==', normalized)
    .limit(1)
    .get()
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  const data = docSnap.data()
  if (data.activo === false) return null
  return { id: docSnap.id, ...data }
}

async function assertNotSelfReferral(uid, promotor) {
  const userSnap = await db.doc(`users/${uid}`).get()
  const userEmail = (userSnap.data()?.email || '').trim().toLowerCase()
  const aliadoEmail = (promotor.email || '').trim().toLowerCase()
  if (promotor.userId && promotor.userId === uid) {
    const err = new Error('Este código es tuyo — compártelo con alguien más para que reciba el descuento')
    err.status = 400
    throw err
  }
  if (userEmail && aliadoEmail && userEmail === aliadoEmail) {
    const err = new Error('Este código es tuyo — compártelo con alguien más para que reciba el descuento')
    err.status = 400
    throw err
  }
}

async function userEligibleForPromotorDiscount(uid) {
  const [subSnap, userSnap, paysSnap] = await Promise.all([
    db.doc(`subscriptions/${uid}`).get(),
    db.doc(`users/${uid}`).get(),
    db.collection('payments')
      .where('userId', '==', uid)
      .where('status', '==', 'approved')
      .limit(1)
      .get(),
  ])

  if (userSnap.exists && userSnap.data().promotorCodigoUsado) return false
  if (!paysSnap.empty) return false

  const sub = subSnap.exists ? subSnap.data() : null
  if (sub?.source === 'payment' && PAID_PLANS.has(sub.planId)) return false
  return true
}

async function resolveCheckoutPricing({ uid, plan, promotorCodigo }) {
  const config = await loadSystemConfig()
  const listPrice = planUnitPrice(plan)
  let promotor = null
  let descuentoPct = 0

  if (promotorCodigo) {
    const eligible = await userEligibleForPromotorDiscount(uid)
    if (!eligible) {
      const err = new Error('El descuento de promotor solo aplica en tu primera suscripción pagada')
      err.status = 400
      throw err
    }
    promotor = await findPromotorByCodigo(promotorCodigo)
    if (!promotor) {
      const err = new Error('Código de promotor no válido')
      err.status = 400
      throw err
    }
    await assertNotSelfReferral(uid, promotor)
    descuentoPct = Number(config.descuento_usuario ?? 0)
    if (descuentoPct <= 0) {
      const err = new Error('No hay descuento de promotor activo')
      err.status = 400
      throw err
    }
  }

  const finalPrice = descuentoPct > 0
    ? roundMoney(listPrice * (1 - descuentoPct / 100))
    : listPrice

  if (finalPrice <= 0) {
    const err = new Error('Precio final inválido')
    err.status = 400
    throw err
  }

  return { config, listPrice, finalPrice, descuentoPct, promotor }
}

async function recordPromotorCommission(payment, meta) {
  const promotorId = meta.promotor_id
  if (!promotorId) return

  const promotorRef = db.doc(`promotores/${promotorId}`)
  const promotorSnap = await promotorRef.get()
  if (!promotorSnap.exists) {
    console.warn('[MP webhook] promotor no encontrado', promotorId)
    return
  }

  const config = await loadSystemConfig()
  const promotor = promotorSnap.data()
  const pct = Number(promotor.porcentaje_comision ?? config.comision_promotores ?? 20)
  const monto = Number(payment.transaction_amount ?? 0)
  const comision = roundMoney(monto * pct / 100)
  const userId = meta.user_id || meta.userId

  const batch = db.batch()

  const comisionRef = db.collection('comisiones').doc()
  batch.set(comisionRef, {
    promotorId,
    promotorNombre: promotor.nombre || '',
    userId,
    paymentId: String(payment.id),
    monto,
    comision,
    porcentaje: pct,
    estatus: 'Pendiente',
    createdAt: FieldValue.serverTimestamp(),
  })

  batch.update(promotorRef, {
    usuarios_pago: FieldValue.increment(1),
    comisiones_pendientes: FieldValue.increment(comision),
    total_generado: FieldValue.increment(monto),
    updatedAt: FieldValue.serverTimestamp(),
  })

  if (userId) {
    batch.set(db.doc(`users/${userId}`), {
      promotorCodigoUsado: true,
      promotorId,
      promotorCodigo: meta.promotor_codigo || promotor.codigo || null,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
  }

  await batch.commit()
  console.log('[MP webhook] comisión registrada', promotorId, comision)
}

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
  if (!snap.exists) {
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

  const meta = payment.metadata || {}

  const batch = db.batch()
  batch.set(payRef, {
    userId,
    planId,
    monto:            payment.transaction_amount ?? 0,
    precioLista:      Number(meta.precio_lista ?? 0) || null,
    descuentoPct:     Number(meta.descuento_pct ?? 0) || null,
    descuentoMonto:   Number(meta.descuento_monto ?? 0) || null,
    promotorId:       meta.promotor_id || null,
    promotorCodigo:   meta.promotor_codigo || null,
    currency:         payment.currency_id || 'MXN',
    status:           'approved',
    mpPaymentId:      paymentId,
    mpStatus:         payment.status,
    createdAt:        FieldValue.serverTimestamp(),
  }, { merge: true })

  batch.set(db.doc(`subscriptions/${userId}`), {
    userId,
    planId,
    status:    'active',
    source:    'payment',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })

  await batch.commit()
  await recordPromotorCommission(payment, meta)
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
    const { planId, promotorCodigo } = req.body || {}
    if (!planId || !PAID_PLANS.has(planId)) {
      return res.status(400).json({ error: 'Plan no válido' })
    }

    const plan  = await loadPlan(planId)
    const uid   = decoded.uid
    const { listPrice, finalPrice, descuentoPct, promotor } = await resolveCheckoutPricing({
      uid,
      plan,
      promotorCodigo,
    })
    const production = process.env.MERCADOPAGO_PRODUCTION === 'true'
    const payerEmail = production ? (decoded.email || '') : 'test@testuser.com'

    const itemTitle = promotor && descuentoPct > 0
      ? `${plan.name || planId} (−${descuentoPct}% promotor)`
      : (plan.name || planId)

    const metadata = {
      user_id:        uid,
      plan_id:        planId,
      precio_lista:   String(listPrice),
      descuento_pct:  String(descuentoPct),
      descuento_monto: String(roundMoney(listPrice - finalPrice)),
    }
    if (promotor) {
      metadata.promotor_id = promotor.id
      metadata.promotor_codigo = promotor.codigo
    }

    const preference = await mpRequest('/checkout/preferences', {
      method: 'POST',
      body:   JSON.stringify({
        items: [{
          id:          planId,
          title:       itemTitle,
          description: plan.description || `Suscripción Syng — ${plan.name || planId}`,
          quantity:    1,
          unit_price:  finalPrice,
          currency_id: plan.currency || 'MXN',
        }],
        payer: { email: payerEmail },
        external_reference: `${uid}|${planId}|${Date.now()}`,
        metadata,
        back_urls: {
          success: `${WEB_APP_URL}/perfil?pago=ok`,
          failure: `${WEB_APP_URL}/perfil?pago=fail`,
          pending: `${WEB_APP_URL}/perfil?pago=pending`,
        },
        auto_return:      'approved',
        notification_url: `https://us-central1-${process.env.GCLOUD_PROJECT || 'syng-app'}.cloudfunctions.net/mercadopagoWebhook`,
      }),
    })

    // Sandbox: sandbox_init_point. Producción: init_point (no mezclar).
    const checkoutUrl = production
      ? (preference.init_point || preference.sandbox_init_point)
      : (preference.sandbox_init_point || preference.init_point)
    if (!checkoutUrl) {
      return res.status(502).json({ error: 'Mercado Pago no devolvió URL de pago' })
    }

    res.json({
      checkoutUrl,
      preferenceId: preference.id,
      planId,
      amount:       finalPrice,
      listPrice,
      descuentoPct,
      promotorCodigo: promotor?.codigo || null,
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

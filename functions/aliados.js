/**
 * Aliados Syng — registro, cuentas bancarias y retiros.
 */
const { onRequest } = require('firebase-functions/v2/https')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const crypto = require('crypto')

const db = getFirestore()
const RETIRO_MULTIPLO = 500
const MAX_CUENTAS = 3

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100
}

function esMultiploRetiro(monto) {
  const m = Number(monto)
  return Number.isFinite(m) && m >= RETIRO_MULTIPLO && m % RETIRO_MULTIPLO === 0
}

function validClabe(clabe) {
  return /^\d{18}$/.test(String(clabe || '').replace(/\s/g, ''))
}

function validRfc(rfc) {
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(String(rfc || '').trim().toUpperCase())
}

function normalizeCuentas(raw) {
  if (!Array.isArray(raw)) return []
  const cuentas = raw.slice(0, MAX_CUENTAS).map(c => ({
    id: c.id || crypto.randomUUID(),
    titular: String(c.titular || '').trim(),
    banco: String(c.banco || '').trim(),
    clabe: String(c.clabe || '').replace(/\s/g, ''),
    predeterminada: !!c.predeterminada,
  })).filter(c => c.titular && c.banco && validClabe(c.clabe))

  if (!cuentas.length) return []
  const defaultIdx = cuentas.findIndex(c => c.predeterminada)
  cuentas.forEach((c, i) => { c.predeterminada = i === (defaultIdx >= 0 ? defaultIdx : 0) })
  return cuentas
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

function setCors(req, res) {
  const origin = req.get('Origin') || ''
  const allowed = origin.endsWith('.vercel.app') || origin.includes('localhost') || origin.includes('syng')
  if (allowed) res.set('Access-Control-Allow-Origin', origin)
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
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

async function findAliadoByUserId(uid) {
  const snap = await db.collection('promotores').where('userId', '==', uid).limit(1).get()
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return { id: docSnap.id, ref: docSnap.ref, ...docSnap.data() }
}

async function findUnlinkedAliadoByEmail(email) {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  const snap = await db.collection('promotores').where('email', '==', email.trim()).limit(1).get()
  if (!snap.empty && !snap.docs[0].data().userId) {
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  }
  const all = await db.collection('promotores').get()
  for (const d of all.docs) {
    const data = d.data()
    if (data.userId) continue
    const stored = (data.email || '').trim().toLowerCase()
    if (stored && stored === normalized) {
      return { id: d.id, ...data }
    }
  }
  return null
}

function requireAliadoActivo(aliado) {
  if (!aliado) {
    const err = new Error('No eres aliado Syng')
    err.status = 404
    throw err
  }
  if (aliado.en_revision) {
    const err = new Error('Tu cuenta está en revisión. Te avisaremos pronto.')
    err.status = 403
    throw err
  }
  if (aliado.activo === false) {
    const err = new Error('Tu código de aliado está inactivo')
    err.status = 403
    throw err
  }
}

/** Cuentas y retiros — permitido aunque haya dejado el programa (activo false). */
function requireAliadoSelfService(aliado) {
  if (!aliado) {
    const err = new Error('No eres aliado Syng')
    err.status = 404
    throw err
  }
  if (aliado.en_revision) {
    const err = new Error('Tu cuenta está en revisión. Te avisaremos pronto.')
    err.status = 403
    throw err
  }
}

function datosFiscalesCompletos(datos) {
  if (!datos) return false
  const rfc = String(datos.rfc || '').trim().toUpperCase()
  const razon = String(datos.razon_social || '').trim()
  return validRfc(rfc) && razon.length >= 3
}

const registerAliadoSyng = onRequest({
  timeoutSeconds: 30,
  invoker: 'public',
}, async (req, res) => {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  try {
    const decoded = await verifyAuth(req)
    const uid = decoded.uid
    const config = await loadSystemConfig()

    if (config.aliados_activo === false) {
      return res.status(400).json({ error: 'Aliados Syng está pausado temporalmente' })
    }

    const existing = await findAliadoByUserId(uid)
    if (existing) {
      return res.json({ aliado: existing, linked: false, existing: true })
    }

    const userSnap = await db.doc(`users/${uid}`).get()
    const user = userSnap.data() || {}
    const email = (decoded.email || user.email || '').trim()
    const nombre = (user.displayName || decoded.name || email.split('@')[0] || 'Aliado').trim()

    const unlinked = await findUnlinkedAliadoByEmail(email)
    if (unlinked) {
      await db.doc(`promotores/${unlinked.id}`).update({
        userId: uid,
        updatedAt: FieldValue.serverTimestamp(),
      })
      const linked = { ...unlinked, userId: uid }
      return res.json({ aliado: linked, linked: true, existing: true })
    }

    const defaultPct = Number(config.comision_promotores ?? 25)
    const id = db.collection('promotores').doc().id
    const codigo = generateCode()

    const aliado = {
      id,
      userId: uid,
      nombre,
      email,
      codigo,
      porcentaje_comision: defaultPct,
      activo: true,
      en_revision: false,
      cuentas_bancarias: [],
      datos_fiscales: null,
      usuarios_registrados: 0,
      usuarios_pago: 0,
      comisiones_pendientes: 0,
      comisiones_disponibles: 0,
      comisiones_pagadas: 0,
      total_generado: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    await db.doc(`promotores/${id}`).set(aliado)

    return res.json({
      aliado: { ...aliado, createdAt: new Date().toISOString() },
      linked: false,
      existing: false,
      mensaje: config.mensaje_promotores || null,
    })
  } catch (err) {
    console.error('[registerAliadoSyng]', err)
    res.status(err.status || 500).json({ error: err.message || 'Error interno' })
  }
})

const updateAliadoCuentas = onRequest({
  timeoutSeconds: 30,
  invoker: 'public',
}, async (req, res) => {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  try {
    const decoded = await verifyAuth(req)
    const aliado = await findAliadoByUserId(decoded.uid)
    requireAliadoSelfService(aliado)

    const cuentas = normalizeCuentas(req.body?.cuentas_bancarias)
    const rfc = String(req.body?.datos_fiscales?.rfc || '').trim().toUpperCase()
    const razon_social = String(req.body?.datos_fiscales?.razon_social || '').trim()

    const datos_fiscales = rfc || razon_social
      ? {
        rfc: rfc || aliado.datos_fiscales?.rfc || '',
        razon_social: razon_social || aliado.datos_fiscales?.razon_social || '',
        completo: false,
      }
      : (aliado.datos_fiscales || null)

    if (datos_fiscales) {
      datos_fiscales.completo = datosFiscalesCompletos(datos_fiscales)
      if (datos_fiscales.rfc && !validRfc(datos_fiscales.rfc)) {
        return res.status(400).json({ error: 'RFC no válido' })
      }
    }

    await aliado.ref.update({
      cuentas_bancarias: cuentas,
      datos_fiscales,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return res.json({
      ok: true,
      cuentas_bancarias: cuentas,
      datos_fiscales,
    })
  } catch (err) {
    console.error('[updateAliadoCuentas]', err)
    res.status(err.status || 500).json({ error: err.message || 'Error interno' })
  }
})

const solicitarRetiroAliado = onRequest({
  timeoutSeconds: 60,
  invoker: 'public',
}, async (req, res) => {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  try {
    const decoded = await verifyAuth(req)
    const uid = decoded.uid
    const { monto, cuentaId } = req.body || {}

    if (!esMultiploRetiro(monto)) {
      return res.status(400).json({ error: `Solo retiros en múltiplos de $${RETIRO_MULTIPLO} MXN` })
    }

    const result = await db.runTransaction(async (tx) => {
      const aliadoSnap = await tx.get(db.collection('promotores').where('userId', '==', uid).limit(1))
      if (aliadoSnap.empty) throw Object.assign(new Error('No eres aliado Syng'), { status: 404 })
      const docSnap = aliadoSnap.docs[0]
      const aliado = { id: docSnap.id, ...docSnap.data() }
      requireAliadoSelfService(aliado)

      if (!datosFiscalesCompletos(aliado.datos_fiscales)) {
        throw Object.assign(new Error('Completa tus datos fiscales (RFC y razón social) antes de retirar'), { status: 400 })
      }

      const cuentas = aliado.cuentas_bancarias || []
      if (!cuentas.length) {
        throw Object.assign(new Error('Agrega una cuenta bancaria antes de retirar'), { status: 400 })
      }

      const cuenta = cuentaId
        ? cuentas.find(c => c.id === cuentaId)
        : cuentas.find(c => c.predeterminada) || cuentas[0]
      if (!cuenta) {
        throw Object.assign(new Error('Cuenta bancaria no encontrada'), { status: 400 })
      }

      const pendientesSnap = await tx.get(
        db.collection('retiros')
          .where('promotorId', '==', aliado.id)
          .where('estatus', '==', 'Solicitado'),
      )
      if (!pendientesSnap.empty) {
        throw Object.assign(new Error('Ya tienes un retiro en proceso'), { status: 400 })
      }

      const disponible = roundMoney(aliado.comisiones_disponibles ?? 0)
      const montoNum = roundMoney(monto)
      if (montoNum > disponible) {
        throw Object.assign(new Error(`Saldo disponible: $${disponible.toFixed(2)}`), { status: 400 })
      }

      const retiroRef = db.collection('retiros').doc()
      tx.set(retiroRef, {
        promotorId: aliado.id,
        promotorNombre: aliado.nombre || '',
        userId: uid,
        monto: montoNum,
        estatus: 'Solicitado',
        cuenta: {
          id: cuenta.id,
          titular: cuenta.titular,
          banco: cuenta.banco,
          clabe: cuenta.clabe,
        },
        datos_fiscales: aliado.datos_fiscales,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      tx.update(docSnap.ref, {
        comisiones_disponibles: roundMoney(disponible - montoNum),
        updatedAt: FieldValue.serverTimestamp(),
      })

      return { retiroId: retiroRef.id, monto: montoNum }
    })

    return res.json({ ok: true, ...result })
  } catch (err) {
    console.error('[solicitarRetiroAliado]', err)
    res.status(err.status || 500).json({ error: err.message || 'Error interno' })
  }
})

const dejarAliadoSyng = onRequest({
  timeoutSeconds: 30,
  invoker: 'public',
}, async (req, res) => {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  try {
    const decoded = await verifyAuth(req)
    const aliado = await findAliadoByUserId(decoded.uid)
    if (!aliado) {
      return res.status(404).json({ error: 'No eres aliado Syng' })
    }
    if (aliado.activo === false) {
      return res.json({ ok: true, alreadyLeft: true })
    }

    await aliado.ref.update({
      activo: false,
      dejadoAt: FieldValue.serverTimestamp(),
      dejadoPor: 'aliado',
      updatedAt: FieldValue.serverTimestamp(),
    })

    return res.json({ ok: true, mensaje: 'Dejaste Aliados Syng. Tu saldo disponible sigue siendo retirable.' })
  } catch (err) {
    console.error('[dejarAliadoSyng]', err)
    res.status(err.status || 500).json({ error: err.message || 'Error interno' })
  }
})

module.exports = {
  registerAliadoSyng,
  updateAliadoCuentas,
  solicitarRetiroAliado,
  dejarAliadoSyng,
  RETIRO_MULTIPLO,
}

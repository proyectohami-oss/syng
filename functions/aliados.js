/**
 * Aliados Syng — auto-registro desde la App.
 */
const { onRequest } = require('firebase-functions/v2/https')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

const db = getFirestore()

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
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
  return { id: docSnap.id, ...docSnap.data() }
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

module.exports = { registerAliadoSyng }

/**
 * Consolida comisiones duplicadas por paymentId y recalcula stats del promotor.
 * Uso: node scripts/reconcile-comisiones-duplicadas.mjs
 */
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const projectId = process.env.GCLOUD_PROJECT || 'syng-app'
const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || resolve(process.cwd(), 'serviceAccountKey.json')

if (existsSync(saPath)) {
  initializeApp({ credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))), projectId })
} else {
  initializeApp({ credential: applicationDefault(), projectId })
}

const db = getFirestore()

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100
}

async function loadConfig() {
  const [main, admin] = await Promise.all([
    db.doc('system_config/main').get(),
    db.doc('system_config/admin').get(),
  ])
  return { ...(main.data() || {}), ...(admin.data() || {}) }
}

const config = await loadConfig()
const comSnap = await db.collection('comisiones').get()
const byPayment = new Map()

for (const doc of comSnap.docs) {
  const d = doc.data()
  const pid = d.paymentId || doc.id
  if (!byPayment.has(pid)) byPayment.set(pid, [])
  byPayment.get(pid).push({ id: doc.id, ...d })
}

let merged = 0
let deleted = 0

for (const [paymentId, rows] of byPayment) {
  if (rows.length <= 1 && rows[0]?.id === paymentId) continue

  const monto = rows[0].monto
  const promotorId = rows[0].promotorId
  const promotorSnap = await db.doc(`promotores/${promotorId}`).get()
  const promotor = promotorSnap.data() || {}
  const pct = Number(promotor.porcentaje_comision ?? config.comision_promotores ?? 25)
  const comision = roundMoney(Number(monto) * pct / 100)
  const estatus = rows.every(r => r.estatus === rows[0].estatus) ? rows[0].estatus : 'Pendiente'
  const keep = rows[0]

  const batch = db.batch()
  for (const row of rows) {
    if (row.id !== paymentId) {
      batch.delete(db.doc(`comisiones/${row.id}`))
      deleted++
    }
  }

  batch.set(db.doc(`comisiones/${paymentId}`), {
    promotorId,
    promotorNombre: keep.promotorNombre || promotor.nombre || '',
    userId: keep.userId,
    paymentId,
    monto: Number(monto),
    comision,
    porcentaje: pct,
    estatus,
    liquidadoAt: keep.liquidadoAt || null,
    pagadoAt: keep.pagadoAt || null,
    speiReferencia: keep.speiReferencia || null,
    createdAt: keep.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    reconciledAt: FieldValue.serverTimestamp(),
  }, { merge: true })
  merged++

  await batch.commit()
  console.log(`payment ${paymentId}: ${rows.length} filas → 1 comisión $${comision} (${pct}%)`)
}

const promotoresSnap = await db.collection('promotores').get()
for (const pDoc of promotoresSnap.docs) {
  const promotorId = pDoc.id
  const all = await db.collection('comisiones').where('promotorId', '==', promotorId).get()
  let pendientes = 0
  let disponibles = 0
  let pagadas = 0
  let usuariosPago = new Set()

  for (const c of all.docs) {
    const d = c.data()
    if (d.paymentId) usuariosPago.add(d.paymentId)
    const v = Number(d.comision) || 0
    if (d.estatus === 'Pendiente') pendientes += v
    else if (d.estatus === 'Disponible') disponibles += v
    else if (d.estatus === 'Pagada') pagadas += v
  }

  await pDoc.ref.update({
    usuarios_pago: usuariosPago.size,
    comisiones_pendientes: roundMoney(pendientes),
    comisiones_disponibles: roundMoney(disponibles),
    comisiones_pagadas: roundMoney(pagadas),
    updatedAt: FieldValue.serverTimestamp(),
  })
  console.log(`promotor ${pDoc.data().nombre}: pend $${pendientes} · disp $${disponibles} · pag $${pagadas}`)
}

console.log(`Listo: ${merged} pagos consolidados, ${deleted} docs huérfanos borrados.`)

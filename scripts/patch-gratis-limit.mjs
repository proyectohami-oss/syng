/**
 * Actualiza system_config/main → limites.gratis = 270
 * Uso: node scripts/patch-gratis-limit.mjs
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

const snap = await db.doc('system_config/main').get()
const before = snap.exists ? snap.data()?.limites?.gratis : null

await db.doc('system_config/main').set({
  limites: { gratis: 270 },
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true })

const after = (await db.doc('system_config/main').get()).data()?.limites?.gratis
console.log(`system_config/main limites.gratis: ${before ?? '(sin doc)'} → ${after}`)

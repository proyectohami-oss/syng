/**
 * NOTIFICACIONES SYNG — CONTRATO (no romper)
 *
 * Syng gana siendo simple Y con recordatorios que llegan. Este pipeline está congelado.
 * Antes de tocar auth, users.service, sw-v2.js o functions/index.js → leer esto.
 *
 * ARCHIVOS SAGRADOS
 * ─────────────────
 * Cliente:  src/core/notifications/fcm.service.js
 * SW push:  public/firebase-messaging-sw.js  (scope /firebase-cloud-messaging-push-scope)
 * SW caché: src/sw-v2.js                     (scope / — NO mezclar push aquí)
 * Servidor: functions/index.js → sendFcm()   (payload SOLO { token, data })
 *
 * REGLAS
 * ──────
 * 1. sendFcm: NUNCA fcmOptions, link, apns, android, notification top-level, webpush.notification
 * 2. upsertUser: NUNCA escribir fcmTokens:{} (borra tokens)
 * 3. getToken: SIEMPRE serviceWorkerRegistration = firebase-messaging-sw.js
 * 4. Tras cambiar functions → firebase deploy --only functions
 * 5. Tras cambiar cliente → push Vercel → Perfil → Enviar prueba
 *
 * PRUEBA OBLIGATORIA
 * ──────────────────
 * Perfil → Enviar prueba → debe llegar al iPhone (app instalada, cerrada).
 * Respuesta API: successCount >= 1. Si ok=0 fail=N → revisar logs Firebase.
 *
 * VERSIÓN PIPELINE: v4-data-only
 */

export const PUSH_PIPELINE_VERSION = 'v4-data-only'

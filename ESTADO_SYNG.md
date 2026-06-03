# SYNG — Estado actual al 3 de junio 2026

Stack: React, Firebase Firestore, Firebase Auth, FCM, Firebase modular v9+, Vite, Vercel, Cloud Tasks.
URL: https://syng-psi.vercel.app

## Fixes y features de hoy

### Fix — sw-v2.js navegación por tipo (commit 3eff78e)
- notificationclick ahora lee event.notification.data.url
- Navega a la pantalla correcta según el tipo de notificación

### Fix — Push notifications iOS (commit a92f4b9)
- serviceWorkerRegistration en getToken resuelve tokenCount 0 en iOS Safari

### Fix — member.left notifica en Avisos (commit 55aaffb)
- actorName se pasa correctamente al logActivityEvent

## Navegación por tipo de notificación
- Recordatorio de tarea → /recordatorio/:taskId
- Actividad de grupo → /avisos
- Resumen diario → /resumen-diario
- Reenganche → /bienvenido-de-vuelta

## Pantallas construidas
- /recordatorio/:taskId — muestra tarea, permite completarla, frase motivacional
- /resumen-diario — tareas del día, botón Organizar mi día, botón Cerrar
- /bienvenido-de-vuelta — 4 variantes aleatorias, tono humano y cercano

## Notificaciones — 4 tipos
1. Actividad de grupo — todos los miembros — FUNCIONANDO
2. Recordatorio de tarea — solo quien lo programó — FUNCIONANDO
3. Resumen diario — construido, sin probar end-to-end
4. Reenganche — pantalla construida, lógica por construir en Cloud Functions

## Pendientes
- Lógica de reenganche en Cloud Functions — detectar 3-5 días sin tareas y mandar push
- Probar resumen diario end-to-end
- Probar member.left con cuenta de prueba

## Arquitectura Cloud Tasks
- Cola: syng-reminders en us-central1
- scheduleReminder — crea tarea en cola cuando usuario guarda recordatorio
- sendReminderTask — ejecuta push a hora exacta
- scheduleDailySummary — crea tarea en cola para resumen diario
- sendDailySummaryTask — ejecuta push y se reprograma para el día siguiente

## Lo que funciona
- Push iOS y Android
- Token FCM en Firestore
- Activity Log 6 eventos
- Centro de Avisos con badge
- Offline y sync
- Invitaciones por link
- Campana y hora en tareas con recordatorio
- Rollover 00:05

## UID principal
ALpdjUWgTJgLakvsqB8qeAg0PYE3 — proyectohami@gmail.com

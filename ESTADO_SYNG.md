# SYNG — Estado actual al 2 de junio 2026

Stack: React, Firebase Firestore, Firebase Auth, FCM, Firebase modular v9+, Vite, Vercel, Cloud Tasks.
URL: https://syng-psi.vercel.app

## Fixes aplicados hoy

### Fix 1 — Push notifications iOS (commit a92f4b9)
- Problema: tokenCount 0, token FCM no se guardaba en iOS Safari
- Causa: getToken() necesita serviceWorkerRegistration explícito en iOS
- Solución: agregar swReg en los 3 llamados a getToken() en usePushNotifications.js
- Archivo: src/core/notifications/usePushNotifications.js

### Fix 2 — member.left notifica en Avisos (commit 55aaffb)
- Problema: cuando alguien sale del grupo no aparecía en Avisos
- Causa: metadata llegaba vacío sin actor_name
- Solución: pasar actorName desde useGroups.js a members.service.js
- Pendiente: probar con cuenta de prueba

## Próxima sesión — en este orden
1. Fix sw-v2.js — navegación por tipo de notificación
2. Pantalla /recordatorio/:taskId — ya existe, conectar desde notificationclick
3. Pantalla /resumen-diario — tareas del día, botón Cerrar y botón Organizar mi día
4. Pantalla /bienvenido-de-vuelta — reenganche, tono humano y cercano

## Navegación por tipo de notificación (diseño aprobado)
- Recordatorio de tarea → /recordatorio/:taskId
- Actividad de grupo → /avisos
- Resumen diario → /resumen-diario
- Reenganche → /bienvenido-de-vuelta

## Tono aprobado para pantallas
- Resumen diario: simple y honesto, muestra tareas del día
- Reenganche: humano, cercano, sin sermón. Mercado: familias, emprendedores, comerciantes, 30-60 años, hombres y mujeres que quieren salir adelante

## Notificaciones — 4 tipos
1. Actividad de grupo — todos los miembros — FUNCIONANDO
2. Recordatorio de tarea — solo quien lo programó — FUNCIONANDO
3. Resumen diario — personal + grupos — CONSTRUIDO, sin probar
4. Reenganche — personal, una vez por racha — POR CONSTRUIR

## Reglas de negocio
- Cada tarea tiene un solo recordatorio por usuario
- El reenganche se manda una sola vez por racha seca de 3-5 días sin tareas
- El reenganche se manda a la misma hora que el resumen diario
- El resumen diario solo llega si hay tareas ese día

## Arquitectura Cloud Tasks
- Cola: syng-reminders en us-central1
- scheduleReminder — crea tarea en cola cuando usuario guarda recordatorio
- sendReminderTask — ejecuta push a hora exacta, marca reminder.notification_sent true
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

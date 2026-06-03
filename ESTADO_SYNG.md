# SYNG — Estado actual al 2 de junio 2026

Stack: React, Firebase Firestore, Firebase Auth, FCM, Firebase modular v9+, Vite, Vercel, Cloud Tasks.
URL: https://syng-psi.vercel.app

## Push notifications iOS — FIX APLICADO HOY
- Problema: tokenCount 0, token FCM no se guardaba en iOS Safari
- Causa: getToken() necesita serviceWorkerRegistration explícito en iOS
- Solución: agregar swReg en los 3 llamados a getToken() en usePushNotifications.js
- Commit: a92f4b9

## Notificaciones — 4 tipos
1. Actividad de grupo — todos los miembros — FUNCIONANDO
2. Recordatorio de tarea — solo quien lo programó — FUNCIONANDO
3. Resumen diario — personal + grupos — CONSTRUIDO, sin probar
4. Reenganche — personal, una vez por racha — POR CONSTRUIR

## Pendientes
- notificationclick abre / en lugar de la tarea — fix en sw-v2.js
- Resumen diario sin probar end-to-end
- Reenganche por construir
- Icono iOS con fondo blanco — necesita #2D3A8C
- member.left no notifica en Avisos

## Lo que funciona
- Push iOS y Android
- Token FCM en Firestore
- Activity Log 6 eventos
- Centro de Avisos con badge
- Offline y sync
- Invitaciones por link
- Rollover 00:05

## UID principal
ALpdjUWgTJgLakvsqB8qeAg0PYE3 — proyectohami@gmail.com

# Proyecto Syng — Contexto para Claude

## Datos del proyecto
- **Ruta local:** /Users/efrain/syng/src/
- **Repo:** github.com/proyectohami-oss/syng
- **URL:** syng-psi.vercel.app
- **Token GitHub:** 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 (no subir al repo)
- **Firebase proyecto:** syng-app

## Stack
- React + Vite
- Firebase (Firestore + Auth anónimo + Google + Email)
- Vercel (deploy automático desde main)
- Fuente: Space Grotesk (Google Fonts)

## Archivos principales
- App.jsx — login, navegación, Sinyi (voz)
- Pizarron.jsx — calendario interactivo con grupos
- ListaTareas.jsx — lista personal
- ListaSuper.jsx — lista del super (sin Firebase aún)
- PantallaInvitacion.jsx — pantalla de invitación para nuevos usuarios
- firebase.js — configuración Firebase

## ✅ Funcionando
- Login Google + email
- ListaTareas: Firebase, selector fecha, botón Hoy, marcar done, selección múltiple, drag & drop
- Pizarrón: Firebase, drag & drop calendario (botón ⠿) y modal, repetir tarea, editar/eliminar
- Pizarrón: Grupos — crear grupo, selector de grupos, ver miembros
- Pizarrón: Invitaciones — Share Sheet nativo, pantalla de bienvenida premium
- Invitado anónimo entra al grupo con Firebase Anonymous Auth
- Fuente Syng: Space Grotesk, se ve bien en iOS y Android

## 🔴 Pendiente urgente
- Botón micrófono flotante (Sinyi) sigue apareciendo — ocultar
- ListaSuper: conectar Firebase
- Login iPhone: campos de texto se ven negros (modo oscuro iOS)
- Botón Google en Samsung se corta en login

## 🟡 Pendiente importante
- Pantalla invitación: agregar botones Google y Apple para login directo
- Link de invitación de un solo uso
- Idioma que cambie textos al tocar banderita
- Iconos en módulos pantalla principal
- Marca Syng visible en todos los módulos

## 🟠 Pendiente menor
- Pizarrón grupos Fase 2: notificaciones en tiempo real
- Comando de voz Sinyi mejorado
- Idioma recordado entre sesiones
- Lista de Tareas: formato de captura mejorado (como Pizarrón)

## Notas importantes
- Sinyi es la asistente de voz de Syng
- El botón flotante del micrófono debe ocultarse — Sinyi se activa de otra forma
- Firebase Anonymous Auth habilitado en consola
- Reglas Firestore: invitaciones tienen allow read: if true
- Backup del Pizarrón en: /Users/efrain/syng/src/Pizarron.backup.jsx

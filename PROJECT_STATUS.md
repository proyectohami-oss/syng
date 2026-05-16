# SYNG — PROJECT STATUS
Última actualización: Mayo 2026 — checkpoint-pizarron-v1

## ESTADO GENERAL
App estable en producción. Layout móvil iOS sólido. Pizarrón rediseñado mobile-first.

## STACK
- React + Vite
- Firebase Auth + Firestore
- PWA (Vite Plugin PWA + Workbox)
- Deploy: Vercel — syng-psi.vercel.app
- Repo: github.com/proyectohami-oss/syng

## ARQUITECTURA LAYOUT ✅
- #root: position:fixed + height:100svh
- AppShell: 3 zonas — header / contenido / nav inferior
- Módulos: flex:1 + minHeight:0
- Solo contenedor central hace scroll
- vercel.json: SPA rewrite + cache headers correctos

## MÓDULOS ACTIVOS

### Mi Agenda ✅
- Calendario visual con puntos de actividad
- Vista del día con pendientes/completadas
- Nueva tarea como pantalla completa
- Repetición visual de fechas
- Selección múltiple con barra contextual
- Edición individual y múltiple

### Pizarrones ✅ (checkpoint-pizarron-v1)
- Lista de grupos desde móvil
- Header limpio con avatar + miembros
- Selector horizontal de días
- Día seleccionado controla toda la pantalla
- Contadores: Pendientes / Completadas
- Lista de tareas filtrada por día seleccionado
- Crear tarea respeta día seleccionado
- Edición individual con datos precargados
- Repetición básica en crear y editar
- Completar/descompletar con tap en texto
- Selección múltiple con círculos
- Barra contextual: Completar / Editar / Eliminar
- Edición masiva: fecha, grupo
- Confirmación antes de eliminar
- Info del grupo: miembros, admins, salir, eliminar
- Invitar por número de teléfono

### Perfil ✅
- Ver y editar nombre y teléfono
- Cerrar sesión

### Social ✅
- phoneNumber obligatorio en onboarding
- normalización E.164
- Invitaciones pendientes (checkPendingInvitations)
- InviteFlow por teléfono

## AUTENTICACIÓN
- Google Sign-In con signInWithPopup (iOS 26 compatible)
- Onboarding obligatorio de teléfono
- upsertUser no sobreescribe phoneNumber

## REGLAS FIRESTORE
- users: read si autenticado, write si owner
- tasks: read si owner o groupId en groupIds del usuario
- groups: read si autenticado, create/update si miembro/admin
- invitations: read/write si autenticado

## CHECKPOINT ACTIVO
Tag: checkpoint-pizarron-v1
Fecha: Mayo 2026
Estado: Estable y probado en iPhone con iOS 26

# SYNG — PROJECT STATUS
Última actualización: Mayo 2026 — post checkpoint-pizarron-v1

## ESTADO GENERAL
App estable en producción. Layout móvil iOS sólido. Pizarrón rediseñado mobile-first completo.
URL: https://syng-psi.vercel.app
Repo: github.com/proyectohami-oss/syng

## STACK
- React + Vite
- Firebase Auth + Firestore
- PWA (Vite Plugin PWA + Workbox)
- Deploy: Vercel
- vercel.json con SPA rewrite y cache headers

## MÓDULOS ACTIVOS

### Mi Agenda ✅
- Calendario visual con puntos de actividad
- Vista del día con pendientes/completadas
- Nueva tarea como pantalla completa (/agenda/:date/nueva)
- Repetición visual de fechas
- Selección múltiple con barra contextual
- Edición individual y múltiple

### Pizarrones ✅
- Lista de grupos desde móvil (PizarronesModule)
- Header con avatar, nombre del grupo, miembros compactos
- Selector horizontal de días (nombres completos)
- Día seleccionado controla toda la pantalla
- Contadores: Pendientes / Completadas
- Lista de tareas filtrada por día
- Tareas ordenadas por createdAt
- Crear tarea respeta día seleccionado (/pizarron/:id/nueva/:date)
- Edición individual con datos precargados (/pizarron/:id/editar/:taskId)
- Modo edición reutiliza NewGroupTaskScreen
- Repetición básica en crear y editar
- Completar/descompletar con tap en texto
- Selección múltiple con círculos
- Barra contextual: Completar / Editar / Eliminar
- Edición masiva: fecha, grupo
- Confirmación antes de eliminar
- Botón flotante rectangular "+ Añadir tarea" fijo abajo derecha
- Info del grupo (/pizarron/:id/info): miembros, admins, invitados pendientes, salir, eliminar
- Editar nombre del grupo (tap sobre nombre en Info)
- Invitar por número de teléfono
- Share nativo (navigator.share) para invitaciones

### Perfil ✅
- Ver y editar nombre y teléfono
- Cerrar sesión

### Social ✅
- phoneNumber obligatorio en onboarding (PhoneSetupScreen)
- normalización E.164
- findUserByPhone, updatePhoneNumber, normalizePhone
- Invitaciones pendientes en Firestore (/invitations)
- checkPendingInvitations al registrar teléfono
- InviteFlow: manual + share nativo
- Invitados pendientes visibles en Info del grupo

## AUTENTICACIÓN
- Google Sign-In con signInWithPopup (iOS 26 compatible)
- Onboarding obligatorio de teléfono
- upsertUser no sobreescribe phoneNumber

## RUTAS ACTIVAS
- /agenda
- /agenda/:date
- /agenda/:date/nueva
- /pizarrones
- /pizarron/:id
- /pizarron/:id/info
- /pizarron/:id/nueva/:date
- /pizarron/:id/editar/:taskId
- /super (placeholder)
- /compartir (placeholder)
- /perfil

## CHECKPOINT ACTIVO
Tag: checkpoint-pizarron-v1

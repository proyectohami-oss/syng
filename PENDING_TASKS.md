# SYNG — PENDING TASKS
Última actualización: Mayo 2026

## COMPLETADO HOY ✅

### Arquitectura móvil
- Layout 3 zonas estable (100svh, flex:1, minHeight:0)
- useViewportFix eliminado
- Service worker con recarga automática

### Autenticación
- signInWithPopup en lugar de signInWithRedirect (iOS 26)
- Onboarding obligatorio de teléfono (PhoneSetupScreen)
- upsertUser no sobreescribe phoneNumber

### Perfil
- PerfilModule — ver y editar nombre y teléfono

### Grupos / Pizarrones
- PizarronesModule — lista de grupos desde móvil
- Crear grupo funcionando (groupIds se actualiza correctamente)
- PizarronModule carga correctamente (fix useParams :id)
- usePizarronView lee desde useCoreGroups
- Layout vertical móvil sin columnas
- PizarronMemberPanel compacto con avatares horizontales
- GroupInfoScreen — info del grupo, miembros, admins
- Salir del grupo funcionando
- Eliminar grupo funcionando
- Invitar miembros por teléfono

### Social
- phoneNumber en modelo de usuario (E.164)
- normalizePhone, updatePhoneNumber, findUserByPhone
- Colección /invitations con checkPendingInvitations
- InviteFlow por teléfono (agrega directo o invitación pendiente)
- Reglas Firestore actualizadas para múltiples admins

## PRIORIDAD INMEDIATA

### Grupos — funciones pendientes
- Promover miembro a admin (UI existe, validar que funciona)
- Eliminar miembro del grupo (UI existe, validar que funciona)
- Renombrar grupo desde Info del grupo (actualmente solo en ⋮)

### Pizarrón — UX
- Botón "Invitar" en header compite visualmente con "Nueva tarea" — hacerlo más discreto
- Barra de miembros compacta (avatares) se corta en pantalla — revisar posición
- Mover acciones de ⋮ (editar/eliminar) a Info del grupo para consistencia

### Nueva tarea en grupo
- Validar flujo completo: crear tarea en grupo → aparece en Pizarrón
- Validar que tarea grupal aparece en Mi Agenda del miembro

## PRIORIDAD MEDIA

### Contactos reales
- Acceso a contactos del teléfono (navigator.contacts o fallback manual)
- Mostrar contactos que ya usan Syng vs los que no
- Invitar contactos que no usan Syng via WhatsApp/SMS nativo
- Onboarding con propósito: "X te invitó a Y"

### Lista de Súper
- Arquitectura y UX pendiente de definición

### PWA
- Validar experiencia instalada desde home screen iPhone

## PRIORIDAD FUTURA

- Notificaciones FCM
- Compartir / links de invitación
- Planes: Gratis / Básico / Pro
- Viralización
- Auth por SMS/teléfono (migración futura)

# SYNG — VISIÓN SOCIAL
Última actualización: Mayo 2026

## MODELO MENTAL
Syng es más tipo WhatsApp/Telegram que red social pública.
La identidad es el teléfono. Los grupos son el núcleo social.
La colaboración es el producto.

## FLUJO DE INVITACIÓN A GRUPOS

### Crear grupo
1. Admin crea grupo
2. Syng pide permiso de contactos (una sola vez, opcional pero recomendado)
3. Se muestra lista de contactos del teléfono
4. Contactos que YA usan Syng → disponibles para agregar directamente
5. Contactos que NO usan Syng → aparecen con opción "Invitar"

### Estados de un miembro
- ACTIVO: tiene cuenta Syng, número coincide, está en el grupo
- PENDIENTE: fue invitado, aún no instala Syng

### Invitaciones pendientes
- NO se crean usuarios fantasmas
- Se guarda en /invitations: { groupId, inviterUid, phoneNumber, status: 'pending' }
- Cuando el contacto instala Syng y registra su número → Syng conecta automáticamente
- El nuevo usuario entra al grupo sin hacer nada extra

## ONBOARDING CON PROPÓSITO
Si alguien instala Syng porque fue invitado a un grupo:
- La app detecta la invitación pendiente por teléfono
- Muestra: "Efraín te invitó a Familia"
- El usuario entra directamente al grupo
- Onboarding tiene propósito real y emocional

## PRIVACIDAD Y SPAM
- Syng NUNCA manda mensajes automáticos masivos
- Los contactos sin Syng NO reciben nada sin acción explícita del usuario
- El usuario elige a quién invitar y cómo
- Mensaje de invitación: manual, via WhatsApp/SMS nativo del teléfono
- Pregunta opcional: "¿Quieres avisar a tus contactos que ya usas Syng?"

## ARQUITECTURA TÉCNICA NECESARIA

### Colección /invitations
### Flujo de conexión automática
1. Usuario instala Syng
2. Registra su teléfono en onboarding
3. updatePhoneNumber() ejecuta → busca invitaciones pendientes por phoneNumber
4. Si encuentra → agrega usuario al grupo → marca invitación como accepted
5. App muestra: "X te invitó a Y" → entra al grupo

### Acceso a contactos
- API: navigator.contacts (PWA) o fallback manual
- Solo se lee localmente — los números de contactos NUNCA se suben a Firestore
- Solo se compara localmente contra usuarios existentes en Syng

## ORDEN DE CONSTRUCCIÓN
1. ✅ phoneNumber en modelo de usuario
2. ✅ normalización E.164
3. ✅ onboarding obligatorio
4. Pantalla de perfil (ver/editar teléfono y nombre)
5. Colección /invitations en Firestore
6. Flujo: crear grupo → buscar miembros por teléfono
7. Invitaciones pendientes → conexión automática al registrar teléfono
8. Acceso a contactos del teléfono (opcional, con permiso)
9. Onboarding con propósito: "X te invitó a Y"

## DECISIONES QUE NO SE TOCAN AÚN
- Auth por SMS/teléfono (migración futura)
- Notificaciones push de invitación
- Viralización automática

## DECISIONES FINALES DE GRUPOS (Mayo 2026)

### Creación
- Cualquier usuario puede crear grupos
- Plan Gratis: máximo 1 grupo, hasta 5 miembros

### Admins
- Múltiples admins por grupo permitido (como WhatsApp)
- El creador es admin por defecto
- Cualquier admin puede promover a otro miembro a admin

### Permisos
- Miembro: crear/editar/completar tareas + salirse del grupo
- Admin: todo lo anterior + agregar/quitar miembros + promover admins + eliminar grupo

### Invitaciones
- Contacto con Syng → entra directo al grupo
- Contacto sin Syng → invitación pendiente hasta que instale y registre número
- Al registrar teléfono → Syng conecta automáticamente invitaciones pendientes

### Búsqueda de miembros
- Manual por número de teléfono
- Desde contactos del teléfono (con permiso)

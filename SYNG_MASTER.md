# SYNG — RESUMEN GENERAL DEL PROYECTO
> Documento maestro. Actualizar en cada sesión de trabajo.
> Última actualización: Mayo 2026

---

## 1. VISIÓN GENERAL

Syng es una app/PWA enfocada en:
- Organización personal
- Colaboración grupal
- Productividad visual
- Experiencia móvil simple y humana

**Módulos principales:**
1. Mi Agenda
2. Pizarrones
3. Lista de Súper

---

## 2. ESTRUCTURA ACTUAL

### Mi Agenda
- Calendario principal y centro visual del tiempo
- Vista consolidada de tareas personales y grupales
- Flujo: tocar un día → entra directamente a la Vista del Día

### Vista del Día
Pantalla operacional enfocada en:
- Pendientes y completadas
- Completar, editar, eliminar
- Selección múltiple (tocar círculo activa modo automáticamente)
- Drag & drop para reordenar
- Repetición visual de fechas
- Mover tareas entre grupos/personal

### Pizarrones
- Se mantienen como módulo independiente
- NO deben sentirse como otra agenda
- Identidad: espacio colaborativo vivo con miembros, actividad y contexto compartido
- Diferencia clave: Mi Agenda = relación personal con el tiempo / Pizarrón = espacio del grupo

### Lista de Súper
- Aún pendiente de definición completa
- Dirección: rápida, colaborativa, visual, tipo carrito/lista compartida

---

## 3. DECISIONES DE UX TOMADAS

| Elemento | Decisión |
|---|---|
| Calendario | Un solo punto por día con actividad. Números alineados. Limpio. |
| Navegación | Barra inferior con emojis. Sin "Inicio" por ahora. |
| Captura | Sin campo "título" separado. Captura rápida y natural. |
| Repetición | Selección visual de días estilo "asientos de cine". Sin patrones corporativos. |
| Organización | Solo dos bloques: Pendientes / Completadas. |
| Etiquetas | Cada tarea muestra "Personal" o nombre corto del grupo en línea con el texto. |
| Toggle completar | Tocar el TEXTO de la tarea. |
| Selección múltiple | Tocar el CÍRCULO. Barra contextual aparece automáticamente. |
| Barra múltiple | Aparece sola al seleccionar ≥1 tarea. Desaparece sola al quedar 0. |
| Botón + | Desaparece cuando hay selección activa. |

---

## 4. IMPLEMENTADO Y FUNCIONANDO ✅

- Calendario visual principal con puntos de actividad
- Entrada directa al día tocando la fecha
- Creación de tareas (individual y con repetición visual)
- Edición individual: texto, fecha, grupo, repetición
- Edición múltiple: cambiar fecha y/o grupo a varias tareas a la vez
- Cambio entre Personal y grupos (sin duplicados)
- Eliminación individual con confirmación
- Eliminación múltiple con confirmación
- Drag & drop para reordenar pendientes dentro del día
- Selección múltiple automática al tocar círculos
- Reubicación automática al cambiar tipo/grupo
- Navegación simplificada sin "Inicio"
- Grupos sin duplicar en sidebar
- Optimistic UI: toggle y eliminación instantáneos (sin esperar Firestore)
- Orden cronológico: pendientes por createdAt asc, completadas por completedAt asc
- Modal de edición múltiple se cierra automáticamente al guardar
- Auth con Google y email/password
- Sincronización realtime con Firebase
- Offline-first con IndexedDB

---

## 5. PENDIENTES INMEDIATOS

### Experiencia móvil real
- Validar responsive completo en teléfono físico
- Ergonomía con una mano
- PWA instalada en celular real
- Comportamiento de la barra inferior en iOS/Android

### Pizarrones — identidad visual
- Header con color del grupo
- Contadores (pendientes / completadas / miembros)
- Avatares de miembros visibles
- Cada tarea muestra quién la creó
- Sin filtro de fecha (muestra todo el grupo, no solo hoy)

### Drag & drop — mejora visual
- Línea/sombra/indicador de destino más visible
- Feedback más claro de dónde caerá la tarea

---

## 6. PENDIENTES FUTUROS

### Lista de Súper
- Definir arquitectura y UX completa
- Experiencia tipo carrito colaborativo

### Notificaciones FCM
- Estructura ya preparada en el código (desacoplada)
- Pendiente: cuándo pedir permisos, estrategia de recordatorios

### Compartir / Growth
- Links de invitación visuales
- Pantalla de demo pública
- CTA de planes

### Planes (propuesta inicial)
| Plan | Incluye |
|---|---|
| Gratis | Personal + 1 grupo |
| Básico | 5 grupos + Súper personal |
| Pro | Grupos ilimitados + Súper ilimitado |

### Viralización
- Instalar app → compartir a 5 amigos → desbloquear acceso gratuito
- Sin implementación definida aún

### Número telefónico
- Pendiente decidir si obligatorio u opcional
- Para invitaciones y contactos

---

## 7. ARQUITECTURA TÉCNICA

**Stack:** React + Vite, Firebase Auth, Firestore, PWA

**Capas:**
1. `CoreDataProvider` — única fuente de verdad, listeners Firestore, reducer global
2. Módulos de vista (`agenda/`, `pizarron/`) — solo consumen contexto, cero Firestore directo
3. Componentes compartidos (`shared/`) — TaskItem, TaskForm, etc.
4. Notificaciones (`core/notifications/`) — capa desacoplada, no afecta el núcleo

**Regla de oro:** solo `CoreDataProvider` habla con Firestore. Los módulos solo leen del contexto.

**Listeners activos (≤4):**
- L1: `/users/{uid}` — auth + datos del usuario
- L2: `tasks WHERE ownerId==uid AND type==personal`
- L3: `tasks WHERE groupId IN [...]` — tareas grupales
- L4: `groups WHERE memberIds array-contains uid` — grupos del usuario

---

## 8. ESTADO ACTUAL DEL PROYECTO

**Etapa:** Ya no es arquitectura. Es producto.

**Prioridad actual:**
1. UX y rendimiento percibido
2. Experiencia móvil real
3. Identidad visual de Pizarrones
4. Estabilidad y refinamiento

**Lo que YA funciona end-to-end:**
- Login → Mi Agenda → Vista del Día → Crear/Editar/Eliminar tareas → Sincronización

**Lo que falta para sentirse producto real:**
- Validación en móvil físico
- Pizarrones con identidad propia
- Lista de Súper

---

## 9. DECISIONES QUE NO SE TOCAN AÚN

- Monetización
- Planes y precios
- Compartir / referrals
- Growth loops
- Número telefónico

**Primero:** consolidar experiencia, claridad, flujo humano y sensación de producto.

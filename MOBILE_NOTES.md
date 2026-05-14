# SYNG — MOBILE NOTES iOS
Última actualización: Mayo 2026

## COMPORTAMIENTO NATIVO ACEPTADO
La barra flotante de iOS (▲ ▼ ✓) sobre el teclado es comportamiento nativo del sistema.
Aparece en cualquier app con inputs — WhatsApp, Notas, Recordatorios.
NO se puede eliminar. NO intentar más hacks para ocultarla.

## PROBLEMAS RESUELTOS

### Layout inestable con Safari address bar
**Causa:** `useViewportFix` escuchaba cambios de viewport y actualizaba `--app-height`
**Solución:** Eliminado. `#root` usa `position:fixed + height:100svh`

### Contenido empujando el layout padre
**Causa:** módulos usaban `height:100%` en flex — no funciona cuando contenido crece
**Solución:** `flex:1 + minHeight:0` en todos los contenedores raíz de módulos

### Modal "Nueva tarea" rompía el layout al abrir teclado
**Causa:** overlay con `position:fixed` conflictúa con `#root` fijo en iOS
**Intentos fallidos:** viewport lock, body lock, visualViewport, autofocus delay, maxHeight
**Solución definitiva:** migrar a pantalla completa con navegación real (`/agenda/:date/nueva`)

### iPhone servía archivos viejos (404 en JS)
**Causa:** service worker con `onNeedRefresh` en modo silencioso
**Solución:** `window.location.reload()` automático al detectar nueva versión

### Zoom automático de iOS al tocar inputs
**Causa:** `fontSize` menor a 16px en inputs/textarea
**Solución:** todos los inputs usan `fontSize:16px` mínimo

## REGLAS MÓVILES — NO ROMPER

1. `#root` siempre `position:fixed + height:100svh` — nunca tocar
2. Módulos siempre `flex:1 + minHeight:0` — nunca `height:100%`
3. Solo UN contenedor hace scroll por pantalla
4. Inputs siempre `fontSize:16px` mínimo
5. No usar `position:fixed` dentro de modales — usar navegación real
6. No intentar ocultar o modificar la barra nativa del teclado de iOS
7. Service worker con recarga automática — mantener así

## FLUJO NUEVA TAREA (ESTABLE)
- Ruta: `/agenda/:date/nueva`
- Componente: `NewTaskScreen.jsx`
- Header: Cancelar | Nueva tarea | Crear tarea
- Sin footer — botón "Crear tarea" en el header
- `fontSize:16px` en textarea — sin zoom iOS
- Focus con delay de 80ms — sin salto de layout
- Soporta: grupo, fecha, repetición (RepeatDayPicker)

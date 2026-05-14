# SYNG — PROJECT STATUS
Última actualización: Mayo 2026

## ESTADO GENERAL
La app está estable en móvil iOS. El layout ya no reacciona al viewport dinámico de Safari.

## STACK
- React + Vite
- Firebase Auth + Firestore
- PWA (Vite Plugin PWA + Workbox)
- Deploy: Vercel — syng-psi.vercel.app
- Repo: github.com/proyectohami-oss/syng

## ARQUITECTURA LAYOUT (ESTABLE ✅)
- `#root` usa `position:fixed` + `height:100svh` — nunca reacciona a Safari address bar
- `useViewportFix` eliminado — era el causante del layout inestable
- `AppShell` usa flex column con 3 zonas: header / contenido / nav inferior
- Todos los módulos usan `flex:1 + minHeight:0` en su contenedor raíz — nunca `height:100%`
- Solo el contenedor central hace scroll (`overflowY:auto`)
- Header y nav inferior siempre fijos, nunca se mueven

## MÓDULOS ACTIVOS
- Mi Agenda — calendario principal, estable
- Vista del Día (DayModule) — lista de tareas por día, estable
- Nueva Tarea (NewTaskScreen) — pantalla completa, estable
- Pizarrones — módulo independiente, pendiente identidad visual
- Súper, Compartir, Perfil — placeholders

## SERVICE WORKER
- `onNeedRefresh` ahora recarga automáticamente — resuelve problema de caché en iPhone
- Sin esto el iPhone servía archivos viejos con 404

## DECISIONES TÉCNICAS TOMADAS
- `100svh` en lugar de `100vh` o `var(--app-height)` — solución definitiva iOS
- `flex:1 + minHeight:0` en módulos — evita que contenido empuje el layout padre
- Nueva tarea como pantalla completa — sin overlays, sin conflictos teclado/viewport
- `fontSize:16px` en todos los inputs — evita zoom automático de iOS
- Service worker con recarga automática al detectar nueva versión

# Contexto de Efrain — Proyecto Syng

## Quién es Efrain
- Conocimientos de IA: 0
- Conocimientos de programación: 0
- Conocimientos de inglés: 0
- Necesita explicaciones simples, en español, sin tecnicismos innecesarios

## Cómo ayudarle
- Siempre entregar el código listo para copiar y pegar, sin que tenga que entender qué hace
- Decirle exactamente en qué archivo va cada fragmento y en qué línea aproximada
- Evitar explicaciones largas en inglés o términos técnicos sin aclarar
- Si algo puede salir mal, advertirlo de forma simple antes de que lo intente
- Siempre decirle si es terminal izquierda o derecha

## Proyecto: Syng
- Repositorio: https://github.com/proyectohami-oss/syng
- Es una app de lista del súper con catálogo, grupos y productos personalizados
- Stack: React + Firebase (Firestore)
- Archivos principales: ListaSuper.jsx, Pizarron.jsx, App.jsx

## Historial de versiones
- v2.61 - sistema de traducciones centralizado en idiomas.js
- v2.62 - traducciones home, navbar, stats completas
- v2.63 - traducciones corregidas Cuenta, modal instalar
- v2.64 - Pizarron.jsx traducciones completas
- v2.65 - traducciones Pizarron y ListaSuper
- v2.66 - traducciones home, navbar, stats, agenda completas
- v2.67 - ListaSuper traducciones completas
- v2.68 - ListaSuper modales con traducciones
- v2.69 - ListaSuper reescrito completo con traducciones
- v2.70 - catálogo traducido en 8 idiomas adaptado por país (catalogos.js)
- v2.71 - Mi Agenda formulario como modal al tocar + agregar
- v2.72 - Mi Agenda modal sube con teclado (visualViewport)
- v2.73 - Mi Agenda modal padding teclado corregido
- v2.74 - ListaSuper grupos conectados a Firebase (crear, invitar, salir, eliminar miembro, eliminar grupo, grupo Personal de fábrica)

## Estado actual v2.74
- Traducciones: 95% completas en toda la app
- Catálogo Lista del Súper: traducido y adaptado por país en 8 idiomas
- Mi Agenda: modal para agregar tarea funcionando correctamente
- ListaSuper: grupos en Firebase, grupo Personal siempre disponible
- ListaSuper: admin puede invitar, quitar miembros y eliminar grupo
- ListaSuper: miembro puede salirse del grupo (sigue en Syng)

## Pendientes
- BUG: la lista se repite en todos los grupos (no cambia al cambiar de grupo)
- Invitaciones con link compartible en ListaSuper (igual que Pizarrón)
- Buscadores digan "Buscar en Syng"
- Decidir si catálogo de grupo va a Firebase
- Pulir Mi Agenda (visual y funcional)
- Logo Syng nuevas propuestas

## Notas importantes
- Salir de un grupo NO es salir de Syng
- Eliminar a un miembro del grupo NO lo elimina de Syng
- El grupo Personal siempre existe, no se puede eliminar, guarda en users/{userId}/lista
- Los grupos compartidos guardan en grupos/{grupoId}/lista
- Las invitaciones se guardan en colección "invitaciones" en Firestore
- App.jsx pasa userId, userName, userEmail a ListaSuper

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
- No dar parches — si algo no funciona, reescribir el archivo completo

## Proyecto: Syng
- Repositorio: https://github.com/proyectohami-oss/syng
- App de organización familiar: pizarrón, lista del súper, agenda
- Stack: React + Firebase (Firestore)
- Desplegado en Vercel: https://syng-psi.vercel.app
- Archivos principales: ListaSuper.jsx, Pizarron.jsx, App.jsx, PantallaInvitacion.jsx

## Historial de versiones
- v2.61 a v2.70 — traducciones completas y catálogo en 8 idiomas
- v2.71 a v2.73 — Mi Agenda modal funcionando correctamente
- v2.74 — ListaSuper grupos conectados a Firebase, grupo Personal de fábrica
- v2.75 — ListaSuper invitaciones con link compartible
- v2.76 — Invitaciones completas: ListaSuper y Pizarrón, logueado y visitante

## Estado actual v2.76
- Traducciones: 95% completas en toda la app
- Catálogo Lista del Súper: traducido y adaptado por país en 8 idiomas
- Mi Agenda: modal para agregar tarea funcionando correctamente
- ListaSuper: grupos en Firebase, Personal siempre disponible
- ListaSuper: invitaciones con link, miembros, salir, eliminar grupo
- Pizarrón: invitaciones con link funcionando correctamente
- Visitante sin login: puede ver el grupo, si intenta interactuar se le invita a loguearse

## Pendientes
- Buscadores que digan "Buscar en Syng"
- Catálogo de grupo — decidir si va a Firebase
- Pulir Mi Agenda (visual y funcional)
- Logo Syng nuevas propuestas
- Pantalla de demo + "Por qué de Syng" al compartir la app (historia del pizarrón físico de la casa)

## Notas importantes
- Salir de un grupo NO es salir de Syng
- Eliminar a un miembro del grupo NO lo elimina de Syng
- El grupo Personal siempre existe, guarda en users/{userId}/lista
- Los grupos compartidos guardan en grupos/{grupoId}/lista
- Las invitaciones se guardan en colección "invitaciones" en Firestore y son de un solo uso
- App.jsx pasa userId, userName, userEmail y grupoInicial a ListaSuper
- Al compartir invitación de Pizarrón sin login: se guarda grupoId en localStorage antes de cargar

## Historia de Syng (para pantalla de demo)
- Origen: pizarrón físico en casa para tareas familiares
- Problema 1: había que estar frente al pizarrón para verlo o actualizarlo
- Problema 2: muchos pendientes del día se perdían sin poder consultarlo
- Problema 3: lista del súper de memoria = productos olvidados + gastos de más
- Solución: Syng — el pizarrón de casa en el bolsillo, compartido, en tiempo real

## Mercado objetivo
- Familias: coordinación del hogar, lista del súper compartida
- Empresas públicas y privadas: jefes y subjefes coordinados en tiempo real
- Equipos de trabajo: tareas con fecha, sin correos largos, palabras clave y precisas

## Pantalla de demo (pendiente construir)
- Mostrar historia real de Efraín de forma emotiva
- Destacar los 3 módulos: Pizarrón, Mi Agenda, Lista del Súper
- Usar lenguaje de marketing atractivo
- Incluir ángulo empresarial además del familiar

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

## Proyecto: Syng
- Repositorio: https://github.com/proyectohami-oss/syng
- Es una app de lista del súper con catálogo, grupos y productos personalizados
- Stack: React + Firebase (Firestore)
- Archivo principal trabajado: `ListaSuper.jsx`

## Estado actual (al día de hoy)
- La UI de la lista del súper está funcional: catálogo, selección de productos, cantidades, marcar como jalado, borrar lista, grupos
- Firebase ya está importado (`db`, `doc`, `onSnapshot`, `setDoc`) pero **no estaba conectado**
- Se identificó que el estado vivía solo en React y no persistía
- Solución acordada: agregar dos `useEffect` para cargar y guardar en Firestore usando la colección `listas/{grupoId}`
- Pendiente verificar: reglas de Firestore (lectura/escritura)

## Sesión 20-21 abril 2026
- v2.61 - sistema de traducciones centralizado en idiomas.js
- v2.62 - traducciones home, navbar, stats completas
- v2.63 - traducciones corregidas Cuenta, modal instalar
- v2.64 - Pizarron.jsx traducciones completas
- v2.65 - traducciones Pizarron y ListaSuper
- v2.66 - traducciones home, navbar, stats, agenda completas
- v2.67 - ListaSuper traducciones completas
- v2.68 - ListaSuper modales con traducciones
- v2.69 - ListaSuper reescrito completo con traducciones
- v2.70 - catálogo traducido en 8 idiomas adaptado por país (archivo catalogos.js)
- v2.71 - Mi Agenda formulario como modal al tocar + agregar
- v2.72 - Mi Agenda modal sube con teclado (visualViewport)
- v2.73 - Mi Agenda modal padding teclado corregido

## Estado actual v2.73
- Traducciones: 95% completas en toda la app
- Catálogo Lista del Súper: traducido y adaptado por país en 8 idiomas
- Mi Agenda: modal para agregar tarea funcionando correctamente
- Pendiente: editar/eliminar grupos en Lista del Súper
- Pendiente: buscadores digan "Buscar en Syng"
- Pendiente: decidir si grupos Lista del Súper van a Firebase
- Pendiente: pulir Mi Agenda (visual y funcional)
- Pendiente: logo Syng nuevas propuestas

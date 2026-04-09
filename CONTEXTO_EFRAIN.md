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

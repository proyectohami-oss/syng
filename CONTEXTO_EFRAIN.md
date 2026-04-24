# Contexto de Efrain — Proyecto Syng

## Quién es Efrain

* Conocimientos de IA: 0
* Conocimientos de programación: 0
* Conocimientos de inglés: 0
* Necesita explicaciones simples, en español, sin tecnicismos innecesarios

## Cómo ayudarle

* Siempre entregar código completo listo para usar, sin parches
* Siempre decirle si es terminal izquierda o derecha
* Si algo no funciona, reescribir el archivo completo, no parchear
* Evitar explicaciones en inglés o términos técnicos sin aclarar
* Respuestas cortas y simples

## Proyecto: Syng

* Repositorio: https://github.com/proyectohami-oss/syng
* App de organización: pizarrón, lista del súper, agenda
* Stack: React + Firebase (Firestore)
* Desplegado en Vercel: https://syng-psi.vercel.app
* Archivos principales: ListaSuper.jsx, Pizarron.jsx, App.jsx, PantallaDemo.jsx

## Versión actual: v2.78

## Historial

* v2.61-v2.70 — traducciones completas y catálogo en 8 idiomas
* v2.71-v2.73 — Mi Agenda modal funcionando
* v2.74 — ListaSuper grupos en Firebase, grupo Personal de fábrica
* v2.75 — ListaSuper invitaciones con link compartible
* v2.76 — Invitaciones completas ListaSuper y Pizarrón
* v2.77 — PantallaDemo completa: fondo claro, botones funcionales, 8 idiomas, detección automática de idioma
* v2.78 — Pizarrón ya guarda correctamente; al cambiar de grupo no regresan tareas eliminadas

## Estado v2.78

* Traducciones: 95% completas
* ListaSuper: grupos Firebase, Personal siempre disponible, invitaciones
* Pizarrón: guarda correctamente, cambio de grupo funciona bien
* PantallaDemo: una pantalla, fondo claro, botones de módulo interactivos, planes clickeables, mensaje motivador
* Botón compartir manda a ?demo=true

## Pendientes

* Mi Agenda duplica tareas en el Pizarrón cuando hay varios grupos (bug v2.79)
* Buscadores que digan "Buscar en Syng"
* Catálogo de grupo — decidir si va a Firebase
* Pulir Mi Agenda (visual y funcional)
* Logo Syng nuevas propuestas

## Notas importantes

* Salir/eliminar de grupo NO es salir de Syng
* Personal guarda en users/{userId}/lista
* Grupos compartidos en grupos/{grupoId}/lista
* Invitaciones en colección "invitaciones", uso único
* App.jsx usa estado verDemo para mostrar PantallaDemo
* PantallaDemo detecta idioma del celular automáticamente
* Pizarron.jsx obtiene el usuario con onAuthStateChanged (no auth.currentUser directo)
* App.jsx usa key={user?.uid} en Pizarron para evitar que se destruya al cambiar de grupo

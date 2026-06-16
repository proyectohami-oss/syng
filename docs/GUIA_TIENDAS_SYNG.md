# Guía para publicar Syng en Google Play y Amazon Appstore

Todo el texto abajo está listo para copiar y pegar. Solo faltan **tus cuentas de desarrollador** (Google Play Console ~$25 USD una vez; Amazon Appstore gratis).

## Antes de subir

1. Genera el APK: `npm run android:apk` (desde `~/syng`)
2. URL de privacidad: **https://syng-psi.vercel.app/que-es-syng#privacidad**
3. URL del sitio: **https://syng-psi.vercel.app**

---

## Google Play — textos sugeridos

**Nombre:** Syng

**Descripción corta (80 caracteres):**
Organiza tareas, grupos familiares y recordatorios. Simple y en español.

**Descripción completa:**
Syng te ayuda a organizar tu día y coordinar con tu familia o equipo.

• Mi Agenda — tus tareas personales con recordatorios
• Pizarrons — grupos compartidos donde todos ven pendientes y completados
• Avisos — entérate cuando alguien agrega o termina una tarea
• Instalable como app desde el navegador o desde esta APK

Empieza gratis. Diseño claro, en español, pensado para México y Latinoamérica.

**Categoría:** Productividad

**Clasificación de contenido:** Para todos

**Correo de contacto:** (pon el tuyo)

---

## Amazon Appstore — textos sugeridos

Usa los mismos textos de Google Play. Amazon pide además:

- Ícono 512×512 (ya tienes `public/icon-512.png`)
- Al menos 3 capturas de pantalla del teléfono
- APK firmado (release)

---

## Capturas recomendadas

1. Pantalla de inicio (landing)
2. Mi Agenda con tareas
3. Pizarrón de un grupo
4. Crear tarea con recordatorio

---

## Google Search Console (5 minutos, solo tú)

1. Entra a https://search.google.com/search-console
2. Agrega propiedad: `https://syng-psi.vercel.app`
3. Elige verificación por metaetiqueta
4. Copia el código y dímelo — lo pegamos en `index.html` (un solo paso)

Analytics ya está conectado: **G-7JPTF06ND3**

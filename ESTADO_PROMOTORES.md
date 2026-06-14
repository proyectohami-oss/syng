# Syng — Estado del programa de promotores

> Última actualización: 12 de junio 2026  

---

## 😴 CUANDO DESPIERTES (3 pasos, ~10 min)

1. **Admin** (`~/syng-admin`) → Configuración → **Guardar** → Aliados Syng → **+ Nuevo aliado** → copia código  
2. **App** (syng-psi.vercel.app) → Perfil → **Código Aliados Syng** → Aplicar → **Pagar**  
3. Si el monto en MP es **~$71.10** (no $79) → ✅ listo. Si no, avísame.

**Spec completa abajo.** Carpetas: App = `~/syng` · Admin = `~/syng-admin` · Ignorar Downloads.

---

## 📋 SPEC ACORDADA — Programa de promotores v2 (sin codear aún)

> Decisiones de producto cerradas con Efrain. **Implementación pendiente** en fases A→D.

### Quién puede ser promotor

- **Cualquier usuario** de Syng App con un botón **“Hazte aliado Syng”**.
- Recibe **código + link** para compartir (YouTuber, redes, etc.).
- **Admin no da de alta** manualmente (salvo casos especiales). Solo **supervisa, liquida y paga retiros**.
- El usuario puede **dejar el programa cuando quiera** (desactivar su código / dejar de participar). El saldo ya ganado y pendiente de retiro **se conserva** según las reglas de liquidación; no pierde lo liquidado disponible.

### Nombre del programa

Ver sección **Decisión final: Aliados Syng** arriba.

**Decisión final:** **Aliados Syng** — mismo nombre en App, Admin, config y textos. Una sola palabra para todo.

**Por qué no Embajador:** suena bien pero puede evocar cadenas / multinivel. **Aliado** = socio de la marca, sin tono piramidal.

### Nombres en todo el producto

| Lugar | Texto |
|-------|--------|
| App — sección | **Aliados Syng** |
| App — persona | **Eres aliado Syng** / **Hazte aliado** |
| App — pantallas | Tu código · Mis ganancias · Mis cuentas · Retirar |
| App — dejar programa | **Dejar Aliados Syng** |
| Admin — menú | **Aliados Syng** |
| Admin — persona en tabla | **Aliado** (nombre, email, código…) |
| Admin — retiros | **Retiros Aliados Syng** |
| Config Admin | *Descuento referido* · *Comisión Aliados Syng* |
| Código referido (seguidor) | Sigue en Perfil: “Código de aliado” o “Código Aliados Syng” |

**Regla:** nunca mezclar promotor / embajador / participante en UI. Solo **Aliado / Aliados Syng**.

**Técnico (invisible):** colección Firestore `promotores` puede quedar un tiempo; al refactor renombrar a `aliados` si conviene.

### Flujo referido (seguidor)

1. Ve video/post con código → entra a Syng App.
2. Perfil → ingresa código → descuento en **primer pago** (% editable en Admin).
3. Paga → promotor gana comisión sobre monto cobrado.

### Saldo del promotor (cuándo puede retirar)

**Mezcla A + C** — dos pasos antes de que el dinero sea retirable:

| Estado | Significado |
|--------|-------------|
| **Pendiente** | Alguien pagó con su código; MP aprobó el pago. |
| **Disponible** | Admin confirmó que el depósito **llegó a la cuenta Syng** (“liquidado”). |
| **En retiro** | Promotor solicitó retiro; Admin debe transferir. |
| **Pagado** | Admin marcó SPEI como hecho. |

→ El promotor **no retira** hasta que Admin liquide el ingreso (protege contra reembolsos / pagos no acreditados).

### Retiros

- **Mínimo $500 MXN**, solo montos **$500, $1000, $1500…** (múltiplos de 500).
- Si tiene **$480**, espera a **$500**.
- Botón **“Retirar dinero”** en App.

### Datos bancarios

- **No se piden al unirse al programa.**
- Se pueden **agregar, editar y eliminar en cualquier momento** (apartado “Mis cuentas” o al retirar).
- **Hasta 3 cuentas:** 1 predeterminada + 2 extras.
- Al retirar elige **a cuál cuenta** enviar (o usa la predeterminada).

### Dejar el programa

- Botón **“Dejar Aliados Syng”**.
- Efecto: código **deja de funcionar** para nuevos referidos; no genera más comisiones.
- **Saldo ya acumulado** (liquidado y disponible) **sigue retirable** con las mismas reglas ($500+).
- Admin puede ver historial aunque ya no esté activo.

### Admin — pagos a promotores (v1)

- Apartado: **quién debe, cuánto, quién solicitó retiro**.
- Datos bancarios **ya vienen del promotor**.
- Admin hace SPEI en su banco → **un click “Marcar como pagado”** + referencia SPEI.
- **Fase 2 (futuro):** payout automático banco / Mercado Pago.

### Fraude / control

- Admin puede **desactivar promotor** y **congelar saldo**.
- **Descuento %** editable desde Admin (calculadora de margen para no perder).

### Fases de implementación (cuando toque codear)

| Fase | App (`~/syng`) | Admin (`~/syng-admin`) |
|------|----------------|------------------------|
| **A** | Botón “Ser promotor” + código + compartir | Lista auto-registrados (lectura + activar/desactivar) |
| **B** | “Mis ganancias” (pendiente / disponible) | Liquidar ingresos (pendiente → disponible) |
| **C** | Retiros + cuentas bancarias (máx 3) | Cola de solicitudes de retiro |
| **D** | — | Pagar con un click + referencia SPEI |

### Lo que YA está hecho (v1 técnica actual)

- Descuento con código en checkout MP ✅
- Webhook crea comisión ✅
- Calculadora margen en Admin ✅
- Alta manual promotor en Admin ⚠️ **temporal** hasta Fase A

---

## 📋 SPEC AMPLIADA — Aliados Syng (decisiones Efrain)

### Legal y fiscal

| Tema | Decisión |
|------|----------|
| Términos del programa | Sí: comisión solo 1er pago, no es empleo, Syng puede pausar cuentas |
| Aviso fiscal desde el inicio | Texto tipo: *Por disposición fiscal, para retirar ganancias debes estar dado de alta ante el SAT (o equivalente en tu país), cuando la ley lo exija* |
| RFC / datos fiscales | **Filtro al retirar:** no puede solicitar retiro si faltan datos fiscales validados. Mencionar al **hacerse aliado**, captura completa **antes del 1er retiro** |
| Factura al retirar | El aliado debe poder **facturar a Syng** (o cumplir esquema que indique contador). RFC sirve para eso y para registro de pagos |
| ISR | A definir con contador; sistema debe permitir registrar retención si aplica |

> **¿Por qué el RFC?** Cuando Syng paga $500+ a alguien por comisiones, en México normalmente necesitas **registrar a quién le pagas** y a veces recibir **factura** para que ese pago sea deducible para Syng. No es cobrarle al aliado — es cumplir tú al pagarle. **Confirmar con contador** antes de lanzar.

### Contabilidad Admin

- Comisiones = **gasto**; suscripciones = **ingreso**
- Cada pago guarda: bruto, descuento, comisión aliado, fee MP
- **Reporte mensual** en Admin (export / resumen contable)

### Anti-abuso y auto-referido

| Caso | Comportamiento |
|------|----------------|
| Aliado usa **su propio código** en su cuenta | **No bloquear** el teléfono/dispositivo; al intentar aplicar código propio → mensaje amable: *“Este código es tuyo — compártelo con otros para ganar comisión”* |
| Misma persona, otro email, mismo código | Reglas anti-abuso (detectar patrones); mensaje claro en el momento, tono Syng |
| Admin sospecha fraude | **Congela saldo** + aliado ve: *“Tu cuenta está en revisión. Te avisaremos pronto.”* (no error técnico ni silencio) |

**“Cuenta en revisión” explicado:** tú (Admin) pausas a un aliado porque algo se ve raro. En lugar de que vea su dinero y no pueda retirar sin explicación, la app le muestra ese mensaje humano hasta que tú resuelves.

### Reembolsos y chargebacks

**¿Por qué pedirían reembolso?** Aunque digas “no hay reembolsos”, puede pasar por: disputa con el banco, cargo no reconocido, error de MP, usuarios insistentes. No es lo común, pero existe.

**Política suscriptor:** dejar claro al pagar, con tono elegante: *“La suscripción se activa al confirmar el pago; no aplican reembolsos salvo lo que exija la ley.”*

**Protección Syng + aliados:**
- Comisión pasa a **disponible** solo tras **7–14 días** + Admin liquida (depósito en cuenta Syng)
- Si hay reembolso **antes** de liquidar → se cancela la comisión, no pasa a disponible
- Si hay reembolso **después** de pagar al aliado → regla a definir con contador (restar de saldo futuro o absorber Syng)

### Aliado que deja el programa

- Link viejo en YouTube → *“Este código ya no está activo”*
- Saldo pendiente / disponible → **sigue el proceso normal** de retiro

### Comunicación al aliado

Push / email (cuando exista):
- “Ganaste $X por un referido”
- “Tu retiro fue aprobado”
- “Te faltan $Y para tu primer retiro ($500)”

### Métricas (App — Aliados Syng)

| Métrica | Fase |
|---------|------|
| Registros con su código | v1 |
| Pagos convertidos | v1 |
| Ganancia total / este mes | v1 |
| Clics en su link | v2 (implementar después, pero planeado) |

### Soporte

- **FAQ** en sección Aliados: código no aplicó, solo 1er pago, cuándo retirar, fiscal, etc.
- Sin chat v1 (formulario opcional fase 2)

### Límites Admin (Config)

| Campo | Default | Notas |
|-------|---------|-------|
| Comisión Aliados Syng | **25%** | Editable; tope sugerido 30% |
| Descuento referido | 10% | Calculadora margen |
| **Aliados Syng activo** | switch global | Pausar todo el programa |

### Privacidad

- Admin ve CLABE solo para pagar retiros
- Aliado ve **solo conteos** (ej. “3 registrados, 1 pagó”), nunca email/teléfono de referidos

### Onboarding aliado

- Pantalla 3 pasos + *“Ganas cuando alguien paga Syng con tu código, no por invitar a invitar”*
- Botón **Compartir** (WhatsApp, copiar link)
- Deep link: `syng.app/?aliado=CODIGO`

### Técnico

- UI: **Aliados Syng** everywhere
- Historial comisiones / retiros **inmutable** (auditoría)
- Ventana liquidación: **7 días** tras pago (ajustable en config) + confirmación Admin

### Checklist urgente — CERRADO

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 1 | Ventana antes de liquidar | **7 días** tras pago + Admin liquida depósito |
| 2 | RFC | **Sí**, aviso desde inicio; datos obligatorios **antes del 1er retiro**; sin RFC validado = no hay solicitud de retiro |
| 3 | Switch global | **Sí** — Aliados Syng activo / pausado |
| 4 | Auto-referido | **Mensaje amable**, no bloqueo duro; no usar propio código |

---

## ⭐ REGLA DE CARPETAS (memorízala)

Hay **dos proyectos**. No mezclar:

| Proyecto | Carpeta que SÍ usamos | Para qué |
|----------|----------------------|----------|
| **Syng App** (usuarios) | `~/syng` | La app que instalan tus clientes. Pagos, tareas, perfil. |
| **Syng Admin** (tu panel) | `~/syng-admin` | Tu panel privado. Promotores, finanzas, calculadora. |

**NO usar para trabajar:**
- `~/Downloads/syng-admin` → solo respaldo/copia vieja de Claude. Ignorar.

**Firebase es uno solo** (`syng-app`): App y Admin leen y escriben el mismo Firebase, pero desde carpetas distintas.

**En Cursor:** abre `~/syng` para la app, o `~/syng-admin` para el panel. Nunca edites los dos a la vez en la misma sesión si puedes evitarlo.

---

## Resumen del flujo

```
Admin define descuento % ──► Firebase system_config
Usuario ingresa código ──► App valida promotor activo
Checkout MP ──► Cloud Function aplica descuento + metadata
Pago aprobado ──► Webhook activa plan + crea comisión + stats promotor
Admin Finanzas ──► ve ingresos, comisiones, utilidad (calculadora de margen)
```

---

## 1. Firebase — Colecciones y documentos

| Recurso | Ruta | Quién escribe | Quién lee |
|---------|------|---------------|-----------|
| Config App | `system_config/main` | Admin (sync al guardar) | Syng App |
| Config Admin | `system_config/admin` | Syng Admin | Syng Admin |
| Promotores | `promotores/{id}` | Syng Admin | App + Admin |
| Comisiones | `comisiones/{id}` | Cloud Function (webhook MP) | Syng Admin |
| Pagos | `payments/{mpPaymentId}` | Cloud Function (webhook MP) | Syng Admin |
| Usuario | `users/{uid}` campos promotor | App (código) + webhook (usado) | App |

### Campos en `system_config` (main + admin)

| Campo | Default | Uso |
|-------|---------|-----|
| `descuento_usuario` | 10 | % descuento en primer pago con código |
| `comision_promotores` | 20 | % comisión al promotor (1er pago) |
| `comision_mercadopago` | 3.5 | % fee MP |
| `costos_fijos_mensual` | 0 | Calculadora + Finanzas |
| `costo_variable_por_usuario` | 0 | Calculadora + Finanzas |
| `impuesto_pct` | 0 | Calculadora + Finanzas |
| `meta_mensual` | 100 | Dashboard + prorrateo costos fijos |
| `limites`, `planes_activos` | — | App + Admin |

**Importante:** Al guardar en Admin → Configuración, se hace merge automático a `main` para que la App vea los mismos valores.

### Campos en `users/{uid}` (promotores)

| Campo | Cuándo se setea |
|-------|-----------------|
| `promotorCodigo` | Usuario aplica código en Perfil |
| `promotorId` | Usuario aplica código en Perfil |
| `promotorCodigoUsado` | Webhook tras primer pago aprobado con código |

---

## 2. Syng Admin (`~/syng-admin`)

| Módulo | Estado | Qué hace |
|--------|--------|----------|
| **Promotores** | ✅ | CRUD promotores, códigos, tabla stats |
| **Configuración** | ✅ | Comisiones, descuento, costos, impuestos |
| **Calculadora margen** | ✅ | `MargenCalculator` + `calcularMargen.js` |
| **Finanzas** | ✅ | Usa config (no 3.5% hardcoded), incluye costos |
| **Pagar comisiones** | ❌ | Solo lectura de pendientes; sin UI de pago |
| **Corte mensual auto** | ❌ | Pendiente en Dashboard |

### Archivos clave Admin

- `src/utils/calcularMargen.js` — fórmula compartida
- `src/modules/configuracion/components/MargenCalculator.jsx`
- `src/modules/configuracion/services/configuracion.service.js` — sync admin→main
- `src/modules/promotores/PromotoresModule.jsx` — calculadora arriba
- `src/modules/finanzas/services/finanzas.service.js`

---

## 3. Syng App (`~/syng`)

| Pieza | Estado | Archivo |
|-------|--------|---------|
| Lee config | ✅ | `useSystemConfigListener.js` → `main` |
| Campo código promotor | ✅ | `PromotorCodeSection.jsx` en Perfil |
| Precio con descuento | ✅ | `PlanUpgradeSection.jsx` |
| Checkout con código | ✅ | `payments.service.js` → `/api/checkout` |
| Validación cliente | ✅ | `promotores.service.js` |

### Reglas de negocio (App + Function)

- Descuento solo en **primera suscripción pagada**
- Código debe existir en `promotores` y `activo === true`
- `descuento_usuario` debe ser > 0 en config
- Comisión promotor = % sobre **monto cobrado** (después del descuento)

---

## 4. Cloud Functions (`functions/mercadopago.js`)

| Función | Estado | Qué hace |
|---------|--------|----------|
| `createMercadoPagoCheckout` | ✅ | Valida código, aplica descuento, metadata |
| `mercadopagoWebhook` | ✅ | Activa plan, guarda pago, crea comisión |

### Metadata en preference MP

```
user_id, plan_id, precio_lista, descuento_pct, descuento_monto
promotor_id, promotor_codigo  (si aplica)
```

### Webhook tras pago aprobado

1. Escribe `payments/{id}` con monto, descuento, promotor
2. Activa `subscriptions/{uid}`
3. Crea doc en `comisiones` (estatus: Pendiente)
4. Incrementa stats del promotor
5. Marca `users/{uid}.promotorCodigoUsado = true`

**Deploy:** ✅ hecho 12-jun-2026 (`createMercadoPagoCheckout`, `mercadopagoWebhook`, rules, indexes).

```bash
# Solo si hay cambios nuevos en functions:
cd ~/syng && firebase deploy --only functions:createMercadoPagoCheckout,functions:mercadopagoWebhook
```

---

## 5. Mercado Pago

| Item | Estado |
|------|--------|
| Credenciales prueba | ✅ en `functions/.env.syng-app` |
| Checkout sandbox | ✅ abre URL |
| Pago prueba end-to-end | ⚠️ falló antes (cuenta real vs sandbox) |
| Webhook URL | `https://us-central1-syng-app.cloudfunctions.net/mercadopagoWebhook` |
| Producción | ❌ `MERCADOPAGO_PRODUCTION` no activo |

---

## 6. BACKLOG — Todo antes de producción (orden de trabajo)

> **Producción MP = al final.** Primero cerrar pendientes en sandbox + Aliados v2.

### ✅ Validado hoy (13-jun)

| Item | Estado |
|------|--------|
| Código Aliados visible siempre en Perfil | ✅ local |
| Descuento −10% en checkout MP | ✅ $71.10 / $89.10 |
| Proxy `/api/checkout` en local (vite) | ✅ |
| Aliado manual en Admin + sync config | ✅ |
| Auto-referido (mensaje amable) | ✅ código, falta deploy función |
| Pago sandbox MP completo | ⚠️ MP rechaza tarjeta (no Syng) |

---

### 🔴 Bloque 1 — Subir lo que ya funciona (1 sesión)

| # | Tarea | Dónde |
|---|-------|-------|
| 1.1 | Commit + push App → **Vercel** (código aliado, proxy no aplica en prod) | `~/syng` |
| 1.2 | Deploy función MP (auto-referido) | `firebase deploy …` |
| 1.3 | Commit cambios Admin (Aliados Syng labels, form simplificado pendiente) | `~/syng-admin` |
| 1.4 | Guardar **Configuración** en Admin (sync `descuento_usuario` → `main`) | Admin UI |

---

### 🟠 Bloque 2 — Aliados v1 cerrado (Admin + reglas)

| # | Tarea | Dónde |
|---|-------|-------|
| 2.1 | Form **+ Nuevo aliado**: solo nombre + email (sin banco) | Admin |
| 2.2 | Switch **Aliados Syng activo/pausado** en Config | Admin |
| 2.3 | Comisión default **25%** en config existente en Firebase | Admin guardar |
| 2.4 | Admin: **liquidar comisión** (pendiente → disponible, ventana 7 días) | Admin |
| 2.5 | Admin: **marcar comisión/retiro pagado** + referencia SPEI | Admin |
| 2.6 | Reporte mensual Finanzas (export CSV o resumen) | Admin |
| 2.7 | Congelar saldo + mensaje “cuenta en revisión” | Admin + App |

---

### 🟡 Bloque 3 — Aliados v2 App (spec acordada)

| Fase | Tarea | App | Admin |
|------|-------|-----|-------|
| **A** | **Hazte aliado Syng** (1 click, código auto, compartir WhatsApp/link) | ✅ | lista auto-registro |
| **A** | Deep link `?aliado=CODIGO` | ✅ | — |
| **A** | Onboarding 3 pasos + aviso fiscal | ✅ | — |
| **B** | **Mis ganancias** (pendiente / disponible / total) | ✅ | liquidar |
| **B** | Métricas: registrados, pagos convertidos, ganancia mes | ✅ | — |
| **B** | Push: “Ganaste $X”, “Faltan $Y para retirar” | ✅ | — |
| **C** | **Mis cuentas** bancarias (máx 3, editar anytime) | ✅ | — |
| **C** | **Retirar** ($500, múltiplos) + elegir cuenta | ✅ | cola retiros |
| **C** | Datos fiscales / RFC antes del 1er retiro | ✅ | — |
| **C** | **Dejar Aliados Syng** | ✅ | — |
| **D** | Retiros: pagar 1 click + SPEI | — | ✅ |
| **—** | FAQ Aliados en App | ✅ | — |
| **v2+** | Clics en link del aliado | ✅ | — |

---

### 🟢 Bloque 4 — MP sandbox / prueba E2E (sin producción)

| # | Tarea |
|---|-------|
| 4.1 | Pago sandbox exitoso (Fernanda + código Hamilton) — reintentar APRO / otra tarjeta |
| 4.2 | Verificar webhook: plan activo + comisión en Admin |
| 4.3 | Código inactivo: mensaje elegante si aliado dejó programa |
| 4.4 | Términos / “sin reembolsos” en pantalla de pago |

---

### ⚪ Bloque 5 — Syng App general (fuera Aliados, de ESTADO_SYNG)

| # | Tarea |
|---|-------|
| 5.1 | Reenganche Cloud Functions (3–5 días sin tareas) |
| 5.2 | Resumen diario end-to-end |
| 5.3 | member.left prueba |

---

### ⛔ Bloque 6 — Solo al lanzar (NO ahora)

| # | Tarea |
|---|-------|
| 6.1 | Credenciales MP producción |
| 6.2 | `MERCADOPAGO_PRODUCTION=true` |
| 6.3 | Webhook MP panel producción |
| 6.4 | Primera compra real de validación |
| 6.5 | Contador: ISR, facturación aliados |

---

### 📍 Siguiente paso recomendado

**Empezar Bloque 1** (subir App a Vercel + deploy función) → luego **Bloque 2.1** (form aliado sin banco) → **Fase A** Aliados en App.

Dime **“sigue con bloque 1”** y lo hacemos en esta sesión.

---

## 7. UID y pruebas

- **UID principal:** `ALpdjUWgTJgLakvsqB8qeAg0PYE3` — proyectohami@gmail.com
- **Tarjeta test MX:** `5474925432670366`, vence `11/30`, CVV `123`, titular **APRO**
- **Email sandbox MP:** `test@testuser.com` (automático si no es producción)

---

## 8. Fórmula calculadora (Admin)

```
precio cobrado = precio lista × (1 − descuento%)
margen = precio cobrado − MP% − promotor% − costos var − costos fijos prorrateados − impuestos%
```

Semáforo: rojo (pérdida) · amarillo (<15% margen) · verde (≥15%)

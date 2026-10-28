# SPEC-CONF — Confirmación, idempotencia y comprobante

> **Estado:** Aprobada · **PR:** #6 · continúa el flujo de [`SPEC-TX`](SPEC-TX.md): la `Idempotency-Key` nace en el borrador y se aplica al confirmar

## 1. Contexto y alcance
Desde el resumen ([`SPEC-TX`](SPEC-TX.md)), el usuario confirma la transferencia. El servidor:
1. revalida todas las reglas contra el saldo real;
2. garantiza que la misma intención **nunca se cobre dos veces** (`Idempotency-Key`);
3. simula con un motor de caos, **al azar**, los cinco resultados posibles de un procesador de pagos: éxito, error de red, fondos insuficientes, timeout y error desconocido.

El cliente muestra una pantalla por resultado. Todas ofrecen **"Volver al inicio"** y ninguna permite regresar al resumen: una transferencia nueva siempre recorre el flujo completo.

La idempotencia importa sobre todo cuando el cliente no sabe si el cargo se aplicó (error de red o timeout). Reintentar con la misma clave es seguro; generar otra podría duplicar la transferencia.

Con esta feature el recorrido de la wallet queda completo, así que este PR incluye también las **pruebas E2E de inicio a fin** (§5).

## 2. Características
- Botón "Confirmar transferencia" en el resumen, protegido contra doble envío.
- `POST /api/transactions`: revalida monto, saldo, destinatario y concepto; descuenta el saldo y **responde con el saldo resultante**.
- Idempotencia por usuario y clave: los reintentos devuelven el resultado original sin volver a cobrar.
- Motor de caos aleatorio con pesos configurables y escenario forzable en pruebas.
- Tiempo límite de la transferencia configurable en un solo lugar (15 s por defecto).
- Pantalla de procesamiento y una pantalla por resultado, todas con "Volver al inicio".
- Al volver al inicio, el Home muestra el saldo descontado y el movimiento nuevo al principio de la lista.
- E2E de inicio a fin con cuentas aisladas para poder mover dinero en paralelo.

## 3. Reglas derivadas

### Validación en servidor

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-CONF-R01 | `POST /api/transactions` revalida en este orden, **antes** de cualquier efecto: <br>1. sesión → `401 UNAUTHORIZED` <br>2. `Idempotency-Key` → R03 <br>3. esquema del cuerpo: `amountCents` entero ≥ 1 (`SPEC-TX-R01/R03`), `contactId` obligatorio (`SPEC-TX-R08`), `concept` ≤ 40 (`SPEC-TX-R09`) → `400 VALIDATION_ERROR` con `fieldErrors` <br>4. destinatario: debe ser un contacto del usuario → `422 RECIPIENT_NOT_FOUND` <br>5. saldo real: `amountCents ≤ balanceCents` (`SPEC-TX-R02`) → `422 INSUFFICIENT_FUNDS` <br>Usa las mismas funciones de dominio que la UI. El punto 5 cubre el caso real de que el saldo baje después de abrir `/transfer` (otra pestaña u otro cargo), algo que la validación del formulario no puede ver. | API + Dominio |
| SPEC-CONF-R02 | La verificación de saldo, el cargo y el registro del movimiento ocurren en un **bloque atómico**, sin `await` intermedio. Dos transferencias con claves distintas enviadas a la vez no pueden dejar el saldo en negativo. | Servidor |

### Idempotencia

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-CONF-R03 | El header `Idempotency-Key` es **obligatorio** y debe ser un UUID. Si falta o es inválido, la respuesta es `400 IDEMPOTENCY_KEY_INVALID` y no hay efectos. | API |
| SPEC-CONF-R04 | La clave tiene alcance **por usuario** y se asocia a la huella del cuerpo (`contactId`, `amountCents` y `concept` normalizados). Si la misma clave llega con otro contenido, la respuesta es `422 IDEMPOTENCY_KEY_REUSED` y no hay efectos. | Servidor |
| SPEC-CONF-R05 | **Repetición:** si la misma clave y el mismo contenido ya terminaron con éxito, se devuelve la **misma respuesta `201`** con el header `Idempotent-Replayed: true`. No hay cargo nuevo y no se consulta el motor de caos. | Servidor |
| SPEC-CONF-R06 | **Concurrencia:** si llega una solicitud mientras otra con la misma clave sigue en proceso, espera el resultado de la original y responde lo mismo (*single-flight*). Nunca se procesan dos veces. | Servidor |
| SPEC-CONF-R07 | Solo se almacena el resultado **exitoso**, porque es el único con efectos, y se conserva **24 horas** en memoria. Los fallos no cobran, así que un reintento con la misma clave se procesa de nuevo (y vuelve a pasar por el motor de caos). | Servidor |
| SPEC-CONF-R08 | El cliente **reutiliza la misma clave** en los reintentos tras un error de red o un timeout. La clave se descarta con el envío (R20); una transferencia nueva genera otra al llegar a su resumen (`SPEC-TX-R13`). | Aplicación |

### Motor de caos

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-CONF-R09 | El motor de caos se ejecuta **después** de R01–R07: una solicitud inválida o una repetición nunca llegan a él. Elige el escenario **al azar** con pesos definidos en una sola constante; por defecto `SUCCESS 60` · `NETWORK_ERROR 10` · `INSUFFICIENT_FUNDS 10` · `TIMEOUT 10` · `UNKNOWN_ERROR 10`. | Servidor |
| SPEC-CONF-R10 | Con `ENABLE_TEST_SCENARIOS=true`, el header `x-mock-scenario` fuerza uno de los cinco escenarios. Sin la variable, el header se ignora (igual que `SPEC-HOME-R08`). | Servidor |
| SPEC-CONF-R11 | Respuesta por escenario: <br>`SUCCESS` → cargo + movimiento + `201` con el comprobante y el saldo resultante <br>`NETWORK_ERROR` → `503 SERVICE_UNAVAILABLE`, sin efectos <br>`INSUFFICIENT_FUNDS` → `422 INSUFFICIENT_FUNDS`, sin efectos; simula un cargo ajeno aplicado después de consultar el saldo <br>`UNKNOWN_ERROR` → `500 INTERNAL_ERROR`, sin efectos <br>`TIMEOUT` → **procesa con éxito** (cargo, movimiento y resultado almacenado para R05) y **después** retrasa la respuesta más allá del límite del cliente (R13 + 5 s). | Servidor |
| SPEC-CONF-R12 | Solo un éxito (`SUCCESS` o `TIMEOUT`) descuenta saldo y registra un movimiento `DEBIT` al inicio de los movimientos del usuario, con el nombre del contacto como contraparte, el concepto (o `"Transferencia"`) y la fecha de la operación. | Servidor |

### Tiempo límite

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-CONF-R13 | El cliente aborta la confirmación a los `NEXT_PUBLIC_TRANSFER_TIMEOUT_MS` (**15 000 ms** por defecto), definido en un solo módulo de configuración y documentado en `.env.example`. Es independiente del límite general de peticiones (`NEXT_PUBLIC_TIMEOUT_MS`, 4 s), porque un pago tarda legítimamente más que una consulta. El retraso del escenario `TIMEOUT` en el servidor se deriva del mismo valor, así que basta cambiar una variable. | Aplicación + Servidor |

### Cliente: envío y navegación

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-CONF-R14 | **Doble envío bloqueado en tres capas:** <br>1. al primer clic el resumen se sustituye por "Procesando", así que el botón "Confirmar transferencia" deja de existir <br>2. el hook **consume** el resumen al confirmar: un segundo clic en el mismo instante ya no encuentra qué enviar <br>3. idempotencia en el servidor (R05–R06) | UI + Aplicación + API |
| SPEC-CONF-R15 | **Sin regreso al resumen.** Al confirmar, el borrador editable (`SPEC-TX-R10`) se descarta y se navega con `replace` a `/transfer/status`, que **sustituye** al resumen en el historial. "Atrás" del navegador lleva a un formulario vacío, nunca a un resumen con "Confirmar". En memoria solo queda el envío en curso (solicitud + clave) para reintentar. Entrar a `/transfer/status` sin un envío en memoria (recarga o URL directa) redirige a `/`. Un resultado que llega antes de terminar la navegación (por ejemplo, una conexión cortada al instante) no la desvía. Preparar un resumen nuevo descarta el resultado anterior. | Aplicación |
| SPEC-CONF-R16 | Mientras la solicitud está en curso, `/transfer/status` muestra "Procesando tu transferencia" (`role="status"`) **sin botones**. Es la única pantalla sin "Volver al inicio": dura como máximo el tiempo límite (R13) y salir antes dejaría al usuario sin saber el resultado. | UI |
| SPEC-CONF-R17 | Resultado según la respuesta: <br>`201` → `SUCCESS` <br>`503` o fallo de `fetch` (sin conexión, conexión cortada) → `NETWORK_ERROR` <br>aborto por R13 → `TIMEOUT` <br>`422 INSUFFICIENT_FUNDS` → `INSUFFICIENT_FUNDS` <br>`401` → la sesión expiró: navega a `/login` recargando el documento (`SPEC-HOME-R10`) <br>cualquier otra respuesta (`500`, otro `4xx`, cuerpo que no cumple el contrato) → `UNKNOWN_ERROR` | Aplicación |
| SPEC-CONF-R18 | **Toda pantalla de resultado ofrece "Volver al inicio"** y ninguna ofrece "Atrás" ni "Editar". "Volver al inicio" descarta el envío **antes** de navegar (`SPEC-TX-R14`) y lleva a `/` reemplazando la entrada del historial. | UI + Aplicación |
| SPEC-CONF-R19 | Pantalla por resultado: <br>`SUCCESS` → "Transferencia enviada" + comprobante (R21) · Volver al inicio <br>`NETWORK_ERROR` → "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo; no se te cobrará dos veces." · **Reintentar** (misma clave) + Volver al inicio <br>`TIMEOUT` → "Tu transferencia está tardando más de lo normal. Aún no sabemos si se completó; reintentar es seguro: si ya se procesó verás el comprobante y no se te cobrará dos veces." · **Reintentar** (misma clave) + Volver al inicio <br>`INSUFFICIENT_FUNDS` → "Fondos insuficientes. Tu saldo cambió desde que iniciaste la transferencia y ya no alcanza para enviarla. No se realizó ningún cargo." · Volver al inicio <br>`UNKNOWN_ERROR` (pantalla genérica) → "Algo salió mal. No pudimos completar tu transferencia. Revisa tus movimientos en el inicio antes de intentarlo de nuevo." · Volver al inicio | UI |
| SPEC-CONF-R20 | `SUCCESS`, `INSUFFICIENT_FUNDS` y `UNKNOWN_ERROR` son **finales**: el envío y su clave se descartan en cuanto llega la respuesta. `NETWORK_ERROR` y `TIMEOUT` conservan el envío solo para "Reintentar", que vuelve a "Procesando" y reenvía exactamente la misma solicitud con la misma clave. | Aplicación |
| SPEC-CONF-R21 | El **comprobante** muestra: <br>· folio <br>· fecha y hora en `America/Mexico_City` <br>· monto <br>· destinatario, banco y cuenta enmascarada <br>· concepto <br>· saldo disponible después de la transferencia (`balanceAfterCents` de la respuesta) | UI |
| SPEC-CONF-R22 | Al volver al inicio tras un éxito, el Home se consulta de nuevo al servidor (nunca una versión en caché): el saldo coincide con `balanceAfterCents` y el movimiento aparece **primero** en la lista. Si el usuario no tenía movimientos, el estado vacío desaparece. | Aplicación + Servidor |
| SPEC-CONF-R23 | **Accesibilidad:** el procesamiento se anuncia con `role="status"`; al mostrar un resultado, el foco pasa a su título, y los errores se anuncian con `role="alert"`. | UI |

### Soporte de pruebas

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-CONF-R24 | Con `ENABLE_TEST_SCENARIOS=true`, `POST /api/test/accounts` crea una **cuenta aislada** a partir de una plantilla (`ana`: saldo, movimientos y contactos de Ana; `luis`: saldo sin movimientos ni contactos) con un email único, y lo devuelve para iniciar sesión. Sin la variable responde `404`. Las pruebas E2E que mueven dinero usan una cuenta propia, así corren en paralelo (escritorio y móvil) sin compartir saldo. | Servidor |
| SPEC-CONF-R25 | Las pruebas E2E no esperan los 15 s reales: el servidor de pruebas se levanta con un `NEXT_PUBLIC_TRANSFER_TIMEOUT_MS` corto, usando la misma variable de R13. | Pruebas |

## 4. Criterios de aceptación

**SPEC-CONF-AC01 — Éxito**
- **Dado** un resumen válido y el escenario `SUCCESS`
- **Cuando** confirma
- **Entonces** ve "Procesando tu transferencia" y después el comprobante con el saldo resultante; al activar "Volver al inicio", el Home muestra ese saldo y el movimiento al inicio de la lista.

**SPEC-CONF-AC02 — Error de red y reintento con la misma clave**
- **Dado** el escenario `NETWORK_ERROR`
- **Cuando** confirma
- **Entonces** ve el error de red con "Reintentar" y "Volver al inicio"; al reintentar con el escenario `SUCCESS`, ambas solicitudes llevan **la misma** `Idempotency-Key`, ve el comprobante y el saldo se descontó **una sola vez**.

**SPEC-CONF-AC03 — Timeout sin cobro doble**
- **Dado** el escenario `TIMEOUT`
- **Cuando** confirma y pasa el tiempo límite
- **Entonces** ve la pantalla de timeout; al reintentar recibe el comprobante original (`Idempotent-Replayed: true`) y el Home muestra **un solo** movimiento.

**SPEC-CONF-AC04 — Timeout y volver al inicio**
- **Dado** la pantalla de timeout
- **Cuando** activa "Volver al inicio"
- **Entonces** el Home ya refleja el cargo, porque el servidor sí procesó la transferencia.

**SPEC-CONF-AC05 — Fondos insuficientes simulados**
- **Dado** el escenario `INSUFFICIENT_FUNDS`
- **Cuando** confirma
- **Entonces** ve "Fondos insuficientes" solo con "Volver al inicio", y el saldo no cambia.

**SPEC-CONF-AC06 — Fondos insuficientes reales**
- **Dado** un resumen listo y un cargo posterior que deja el saldo por debajo del monto
- **Cuando** confirma, aun con el escenario `SUCCESS`
- **Entonces** el servidor responde `422 INSUFFICIENT_FUNDS` y ve la misma pantalla de fondos insuficientes.

**SPEC-CONF-AC07 — Error desconocido**
- **Dado** el escenario `UNKNOWN_ERROR`
- **Cuando** confirma
- **Entonces** ve la pantalla genérica solo con "Volver al inicio", y el saldo no cambia.

**SPEC-CONF-AC08 — Doble clic**
- **Dado** el resumen
- **Cuando** activa "Confirmar transferencia" dos veces seguidas
- **Entonces** se envía una sola solicitud y se cobra una sola vez.

**SPEC-CONF-AC09 — Sin regreso al resumen**
- **Dado** cualquier pantalla de resultado
- **Cuando** usa "Atrás" del navegador
- **Entonces** llega a un formulario de nueva transacción vacío, nunca al resumen con "Confirmar"; y si recarga `/transfer/status`, es redirigido a `/`.

**SPEC-CONF-AC10 — Repetición directa al API**
- **Dado** una transferencia exitosa con la clave `K`
- **Cuando** se envía otra vez la misma solicitud con `K`
- **Entonces** responde el mismo `201` con `Idempotent-Replayed: true` y el saldo no cambia.

**SPEC-CONF-AC11 — Clave reutilizada con otro contenido**
- **Dado** una transferencia exitosa con la clave `K`
- **Cuando** se envía `K` con otro monto
- **Entonces** responde `422 IDEMPOTENCY_KEY_REUSED` y no hay cargo.

**SPEC-CONF-AC12 — Validación en servidor**
- **Dado** solicitudes que no pasan por la UI
- **Cuando** envían un monto `0`, negativo, decimal o mayor al saldo, un contacto ajeno o inexistente, o ningún `Idempotency-Key`
- **Entonces** reciben `400`/`422` según R01–R03 y el saldo no cambia.

**SPEC-CONF-AC13 — Aleatoriedad**
- **Dado** el motor de caos sin escenario forzado
- **Cuando** se le inyectan valores aleatorios en todo el rango
- **Entonces** produce los cinco escenarios en proporción a sus pesos (prueba unitaria).

## 5. Recorridos de inicio a fin (E2E)

Cada recorrido corre en escritorio y en Pixel 7 con una cuenta aislada (R24) y comprueba el resultado **en el Home**, no solo en la pantalla de resultado. E2E03 y E2E04 se cubren en las mismas pruebas que AC02 y AC03, que ya terminan en el Home.

| ID | Recorrido | Verifica |
|----|-----------|----------|
| SPEC-CONF-E2E01 | Login → Home → Nueva transacción → contacto existente, monto con centavos y concepto → Resumen → Confirmar → Comprobante → Volver al inicio → Cerrar sesión | Saldo descontado exacto, movimiento primero con contraparte y concepto, sesión cerrada |
| SPEC-CONF-E2E02 | Usuario sin contactos ni movimientos → alta de contacto → transferencia → Comprobante → Home | El estado vacío de movimientos desaparece y aparece el primer movimiento |
| SPEC-CONF-E2E03 | Error de red → Reintentar → éxito | Misma `Idempotency-Key` en ambas solicitudes; un solo cargo y un solo movimiento |
| SPEC-CONF-E2E04 | Timeout → Reintentar → comprobante original | Respuesta repetida (`Idempotent-Replayed`), un solo movimiento |
| SPEC-CONF-E2E05 | Fondos insuficientes y error desconocido → Volver al inicio → nueva transacción | Saldo intacto y formulario vacío: el flujo empieza de cero |
| SPEC-CONF-E2E06 | Dos transferencias seguidas, cada una por el flujo completo | Dos cargos, dos movimientos y claves distintas |

## 6. Contrato de API

| Método | Ruta | Request | Respuestas |
|--------|------|---------|------------|
| `POST` | `/api/transactions` | Cookie de sesión · `Idempotency-Key: <uuid>` · `{ contactId, amountCents, concept? }` | `201 { transaction }` (+ `Idempotent-Replayed: true` si es repetición) · `400 VALIDATION_ERROR` · `400 IDEMPOTENCY_KEY_INVALID` · `401 UNAUTHORIZED` · `422 RECIPIENT_NOT_FOUND` · `422 INSUFFICIENT_FUNDS` · `422 IDEMPOTENCY_KEY_REUSED` · `500 INTERNAL_ERROR` · `503 SERVICE_UNAVAILABLE` |
| `POST` | `/api/test/accounts` | `{ template: "ana" \| "luis" }` · solo con `ENABLE_TEST_SCENARIOS=true` | `201 { email }` · `404` sin la variable |

```json
// 201
{
  "transaction": {
    "id": "tx_7Kq2",
    "reference": "MW48213907",
    "amountCents": 125050,
    "concept": "Renta",
    "createdAt": "2026-10-28T18:42:10.000Z",
    "recipient": { "name": "Mariana Soto", "bank": "BBVA", "accountType": "CLABE", "maskedAccount": "•••• 7899" },
    "balanceAfterCents": 1120025
  }
}
```

## 7. Estados de UI

| Estado | Comportamiento | Cómo forzarlo en pruebas |
|--------|----------------|--------------------------|
| Procesando | Al primer clic el resumen se sustituye por "Procesando tu transferencia", sin botones (latencia simulada de 1.2 s) | Cualquier confirmación |
| Éxito | Comprobante + "Volver al inicio" | `x-mock-scenario: SUCCESS` |
| Error de red | Mensaje + "Reintentar" y "Volver al inicio" | `x-mock-scenario: NETWORK_ERROR` o `page.route` abortando la solicitud |
| Timeout | Estado incierto + "Reintentar" y "Volver al inicio" | `x-mock-scenario: TIMEOUT` con límite corto (R25) |
| Fondos insuficientes | Mensaje descriptivo + "Volver al inicio" | `x-mock-scenario: INSUFFICIENT_FUNDS`, o un cargo previo por API (AC06) |
| Error desconocido | Pantalla genérica + "Volver al inicio" | `x-mock-scenario: UNKNOWN_ERROR` |

## 8. Edge cases
- Reintentar después de un timeout mientras el servidor sigue retrasando la respuesta original: el resultado ya está almacenado y se repite al instante (R05, R11).
- "Atrás" del navegador durante el procesamiento: la solicitud continúa en segundo plano; el formulario aparece vacío y el resultado, si fue exitoso, se ve en el Home.
- El saldo baja entre la apertura de `/transfer` y la confirmación: `422 INSUFFICIENT_FUNDS` real (R01, AC06).
- Dos pestañas confirman transferencias distintas a la vez por más que el saldo combinado: solo una pasa (R02).
- La sesión expira entre el resumen y la confirmación: `401` y navegación a `/login` (R17).
- El contacto deja de existir entre el resumen y la confirmación (por ejemplo, tras reiniciar el servidor): `422 RECIPIENT_NOT_FOUND`, que el cliente muestra como error genérico (R17).
- Transferir exactamente el saldo disponible: el saldo queda en `$0.00` y el Home lo muestra.
- Reinicio del servidor: se pierden el saldo modificado, los movimientos, las claves almacenadas y las cuentas de prueba (persistencia en memoria).
- Cuerpo con campos extra o JSON inválido: `400 VALIDATION_ERROR`.

## 9. Fuera de alcance (se implementarían con más tiempo)
- Botón para **compartir o descargar el comprobante**.
- **Animaciones** de éxito y error, y **feedback háptico** en móvil.
- **Sonido** de confirmación.
- **Programar la operación para más tarde** cuando hay un error de red, en lugar de reintentar en el momento.
- Reintentos automáticos con *backoff*: los reintentos son siempre explícitos del usuario.
- Consulta del estado de una transacción por folio y reconciliación.
- Abonar al destinatario cuando también es usuario de Mini Wallet.
- Persistencia durable de claves de idempotencia y de transacciones.
- Botón tipo swipe para evitar confirmaciones por error 

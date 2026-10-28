# SPEC-CONF — Confirmación, idempotencia y comprobante

> **Estado:** Borrador · **PR:** #6 · se redacta junto con [`SPEC-TX`](SPEC-TX.md) porque la `Idempotency-Key` nace en el borrador y se aplica al confirmar

## 1. Contexto y alcance
Desde el resumen ([`SPEC-TX`](SPEC-TX.md)), el usuario confirma la transferencia. El servidor:
1. revalida todas las reglas contra el saldo real;
2. garantiza que la misma intención **nunca se cobre dos veces** (`Idempotency-Key`);
3. simula, con un motor de caos, los cinco resultados posibles de un procesador de pagos.

El cliente reacciona a cada resultado y, en el caso exitoso, muestra un comprobante.

La idempotencia importa sobre todo tras un **timeout**: el cliente no sabe si el cargo se aplicó. Reintentar con la misma clave es seguro. Generar otra clave podría duplicar la transferencia.

## 2. Características
- Botón "Confirmar transferencia" en el resumen, protegido contra doble envío.
- Revalidación en servidor de monto, saldo, destinatario y concepto.
- Idempotencia por usuario y clave: los reintentos devuelven el resultado original sin volver a cobrar.
- Motor de caos con cinco escenarios: éxito, error de red, fondos insuficientes, timeout y error desconocido.
- Una pantalla de resultado por escenario: comprobante, reintentar, editar monto o fallback genérico.
- El Home refleja el nuevo saldo y el movimiento.

## 3. Reglas derivadas

### Validación en servidor

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-CONF-R01 | `POST /api/transactions` revalida en este orden, **antes** de cualquier efecto: <br>1. sesión → `401 UNAUTHORIZED` <br>2. `Idempotency-Key` → R03 <br>3. esquema del cuerpo: `amountCents` entero ≥ 1 (`SPEC-TX-R01/R03`), `contactId` obligatorio (`SPEC-TX-R08`), `concept` ≤ 40 (`SPEC-TX-R09`) → `400 VALIDATION_ERROR` con `fieldErrors` <br>4. destinatario: debe ser un contacto del usuario → `422 RECIPIENT_NOT_FOUND` <br>5. saldo real: `amountCents ≤ balanceCents` (`SPEC-TX-R02`) → `422 INSUFFICIENT_FUNDS` <br>Usa las mismas funciones de dominio que la UI. | API + Dominio |
| SPEC-CONF-R02 | La verificación de saldo, el cargo y el registro del movimiento ocurren en un **bloque atómico**, sin `await` intermedio. Dos transferencias con claves distintas enviadas a la vez no pueden dejar el saldo en negativo. | Servidor |

### Idempotencia

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-CONF-R03 | El header `Idempotency-Key` es **obligatorio** y debe ser un UUID. Si falta o es inválido, la respuesta es `400 IDEMPOTENCY_KEY_INVALID` y no hay efectos. | API |
| SPEC-CONF-R04 | La clave tiene alcance **por usuario** y se asocia a la huella del cuerpo (`contactId`, `amountCents` y `concept` normalizados). Si la misma clave llega con otro contenido, la respuesta es `422 IDEMPOTENCY_KEY_REUSED` y no hay efectos. | Servidor |
| SPEC-CONF-R05 | **Repetición:** si la misma clave y el mismo contenido ya terminaron con éxito, se devuelve la **misma respuesta `201`**, byte a byte, con el header `Idempotent-Replayed: true`. No hay cargo nuevo y no se consulta el motor de caos. | Servidor |
| SPEC-CONF-R06 | **Concurrencia:** si llega una solicitud mientras otra con la misma clave sigue en proceso, espera el resultado de la original y responde lo mismo (*single-flight*). Nunca se procesan dos veces. | Servidor |
| SPEC-CONF-R07 | Solo se almacena el resultado **exitoso**, porque es el único con efectos, y se conserva **24 horas** en memoria. Los fallos no cobran, así que un reintento con la misma clave se procesa de nuevo. | Servidor |
| SPEC-CONF-R08 | El cliente **reutiliza la clave del borrador** en todos los reintentos (red, timeout, error desconocido). Solo editar el borrador genera una nueva (`SPEC-TX-R13`). | Aplicación |

### Motor de caos

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-CONF-R09 | El motor de caos se ejecuta **después** de R01–R07: una solicitud inválida o una repetición nunca llegan a él. Elige un escenario con pesos configurables; por defecto `SUCCESS 60` · `NETWORK_ERROR 10` · `INSUFFICIENT_FUNDS 10` · `TIMEOUT 10` · `UNKNOWN_ERROR 10`. | Servidor |
| SPEC-CONF-R10 | Con `ENABLE_TEST_SCENARIOS=true`, el header `x-mock-scenario` fuerza uno de los cinco escenarios. Sin la variable, el header se ignora (igual que `SPEC-HOME-R08`). | Servidor |
| SPEC-CONF-R11 | Respuestas por escenario: <br>`SUCCESS` → cargo + movimiento + `201` con el comprobante <br>`NETWORK_ERROR` → `503 SERVICE_UNAVAILABLE`, sin efectos <br>`INSUFFICIENT_FUNDS` → `422 INSUFFICIENT_FUNDS`, sin efectos <br>`UNKNOWN_ERROR` → `500 INTERNAL_ERROR`, sin efectos <br>`TIMEOUT` → **procesa con éxito** (cargo, movimiento y resultado almacenado), pero responde después de `TIMEOUT_SCENARIO_DELAY_MS` (mayor que `NEXT_PUBLIC_TIMEOUT_MS`). | Servidor |
| SPEC-CONF-R12 | Solo un éxito (`SUCCESS`, o `TIMEOUT` resuelto) descuenta saldo y registra un movimiento `DEBIT`, con el nombre del contacto como contraparte y el concepto (o `"Transferencia"`). | Servidor |

### Cliente

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-CONF-R13 | **Doble envío bloqueado en tres capas:** <br>1. botón deshabilitado con estado de carga <br>2. guarda `inFlight` en el hook <br>3. idempotencia en el servidor (R05–R06) | UI + Aplicación + API |
| SPEC-CONF-R14 | El cliente aborta a los `NEXT_PUBLIC_TIMEOUT_MS` y trata ese caso como **estado incierto**, nunca como un fallo confirmado: "No pudimos confirmar tu transferencia. Reintentar es seguro: no se te cobrará dos veces." | Aplicación + UI |
| SPEC-CONF-R15 | Pantalla según el resultado: <br>éxito → comprobante <br>red o timeout → mensaje + "Reintentar" (misma clave) <br>fondos insuficientes → mensaje descriptivo + "Editar monto" (vuelve a `/transfer` con el borrador) <br>desconocido → fallback genérico + "Reintentar" y "Volver al inicio" <br>respuesta inesperada → igual que desconocido | UI |
| SPEC-CONF-R16 | Tras un éxito, el borrador y su clave se descartan **antes** de navegar (`SPEC-TX-R14`). Entrar a `/transfer/status` sin un resultado en memoria redirige a `/`. Con "Atrás" del navegador no se puede reenviar la transferencia. | Aplicación |
| SPEC-CONF-R17 | El **comprobante** muestra: <br>· folio <br>· fecha y hora en `America/Mexico_City` <br>· monto <br>· destinatario, banco y cuenta enmascarada <br>· concepto <br>· saldo restante <br>Ofrece "Volver al inicio" y "Nueva transferencia". | UI |

## 4. Criterios de aceptación

**SPEC-CONF-AC01 — Éxito**
- **Dado** un resumen válido y el escenario `SUCCESS`
- **Cuando** confirma
- **Entonces** ve el comprobante, y en el Home el saldo disminuyó por el monto y aparece el movimiento al inicio de la lista.

**SPEC-CONF-AC02 — Error de red y reintento**
- **Dado** el escenario `NETWORK_ERROR`
- **Cuando** confirma
- **Entonces** ve el error con "Reintentar"; al reintentar con el escenario `SUCCESS`, ve el comprobante y el saldo se descontó **una sola vez**.

**SPEC-CONF-AC03 — Timeout sin cobro doble**
- **Dado** el escenario `TIMEOUT`
- **Cuando** confirma, el cliente aborta y el usuario reintenta
- **Entonces** recibe el comprobante original (`Idempotent-Replayed: true`) y el Home muestra **un solo** movimiento.

**SPEC-CONF-AC04 — Fondos insuficientes**
- **Dado** el escenario `INSUFFICIENT_FUNDS`
- **Cuando** confirma
- **Entonces** ve el mensaje descriptivo y "Editar monto"; al editar, el monto se conserva y la nueva confirmación usa otra clave.

**SPEC-CONF-AC05 — Error desconocido**
- **Dado** el escenario `UNKNOWN_ERROR`
- **Cuando** confirma
- **Entonces** ve el fallback genérico con "Reintentar" y "Volver al inicio", y el saldo no cambia.

**SPEC-CONF-AC06 — Doble clic**
- **Dado** el resumen
- **Cuando** activa "Confirmar transferencia" dos veces seguidas
- **Entonces** se envía una sola solicitud y se cobra una sola vez.

**SPEC-CONF-AC07 — Repetición directa al API**
- **Dado** una transferencia exitosa con la clave `K`
- **Cuando** se envía otra vez la misma solicitud con `K`
- **Entonces** responde el mismo `201` con `Idempotent-Replayed: true` y el saldo no cambia.

**SPEC-CONF-AC08 — Clave reutilizada con otro contenido**
- **Dado** una transferencia exitosa con la clave `K`
- **Cuando** se envía `K` con otro monto
- **Entonces** responde `422 IDEMPOTENCY_KEY_REUSED` y no hay cargo.

**SPEC-CONF-AC09 — Validación en servidor**
- **Dado** solicitudes que no pasan por la UI
- **Cuando** envían un monto `0`, negativo, decimal o mayor al saldo, un contacto ajeno o inexistente, o ningún `Idempotency-Key`
- **Entonces** reciben `400`/`422` según R01–R03 y el saldo no cambia.

**SPEC-CONF-AC10 — Sin reenvío tras éxito**
- **Dado** el comprobante
- **Cuando** usa "Atrás" del navegador o recarga `/transfer/status`
- **Entonces** no puede volver a confirmar la misma transferencia: el resumen redirige a `/transfer` y el estado redirige a `/`.

## 5. Contrato de API

| Método | Ruta | Request | Respuestas |
|--------|------|---------|------------|
| `POST` | `/api/transactions` | Cookie de sesión · `Idempotency-Key: <uuid>` · `{ contactId, amountCents, concept? }` | `201 { transaction }` (+ `Idempotent-Replayed: true` si es repetición) · `400 VALIDATION_ERROR` · `400 IDEMPOTENCY_KEY_INVALID` · `401 UNAUTHORIZED` · `422 RECIPIENT_NOT_FOUND` · `422 INSUFFICIENT_FUNDS` · `422 IDEMPOTENCY_KEY_REUSED` · `500 INTERNAL_ERROR` · `503 SERVICE_UNAVAILABLE` |

```json
// 201
{
  "transaction": {
    "id": "tx_7Kq2",
    "reference": "MW48213907",
    "amountCents": 125050,
    "concept": "Renta",
    "createdAt": "2026-10-28T18:42:10.000Z",
    "recipient": { "name": "Mariana Soto", "bank": "BBVA", "maskedAccount": "•••• 4321" },
    "balanceAfterCents": 1120025
  }
}
```

## 6. Estados de UI

| Estado | Comportamiento | Cómo forzarlo en pruebas |
|--------|----------------|--------------------------|
| Procesando | "Confirmar transferencia" deshabilitado con "Procesando…" | Cualquier confirmación |
| Éxito | Comprobante | `x-mock-scenario: SUCCESS` |
| Error de red | Mensaje + "Reintentar" | `x-mock-scenario: NETWORK_ERROR` o `page.route` abortando la solicitud |
| Timeout | Estado incierto + "Reintentar" | `x-mock-scenario: TIMEOUT` |
| Fondos insuficientes | Mensaje descriptivo + "Editar monto" | `x-mock-scenario: INSUFFICIENT_FUNDS` |
| Error desconocido | Fallback genérico + "Reintentar" y "Volver al inicio" | `x-mock-scenario: UNKNOWN_ERROR` |

## 7. Edge cases
- Reintentar después de un timeout **mientras** el servidor sigue procesando la original (R06).
- El saldo baja entre la apertura de `/transfer` y la confirmación, por ejemplo por una transferencia desde otra pestaña: el servidor responde `422 INSUFFICIENT_FUNDS` real (R01).
- Dos pestañas confirman borradores distintos a la vez por más que el saldo combinado: solo uno pasa (R02).
- El contacto deja de existir entre el resumen y la confirmación, por ejemplo tras reiniciar el servidor: `422 RECIPIENT_NOT_FOUND` (R01).
- Reinicio del servidor: se pierden el saldo modificado, los movimientos y las claves almacenadas (persistencia en memoria).
- Cuerpo con campos extra o JSON inválido: `400 VALIDATION_ERROR`.

## 8. Fuera de alcance (se implementarían con más tiempo)
- Persistencia durable de claves de idempotencia y de transacciones.
- Reconciliación o consulta de estado de una transacción por folio.
- Descarga o envío del comprobante.
- Reintentos automáticos con *backoff*: los reintentos son siempre explícitos del usuario.

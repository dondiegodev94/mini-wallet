# SPEC-TX — Nueva Transacción (captura y resumen)

> **Estado:** Aprobada · **PR:** #5 (captura y resumen) · la ejecución en servidor se especifica en [`SPEC-CONF`](SPEC-CONF.md) (PR 6)

## 1. Contexto y alcance
Desde el Home, el usuario inicia una transferencia: captura el **monto**, elige el **destinatario** (contacto favorito o uno nuevo, ver [`SPEC-CT`](SPEC-CT.md)), agrega un **concepto** opcional y revisa un **resumen** antes de confirmar.

Esta spec define las reglas del borrador de transferencia. Esas reglas viven en el **dominio** como funciones puras, para que la UI y el API apliquen exactamente la misma lógica:
- **PR 5:** la UI las usa para dar retroalimentación inmediata.
- **PR 6:** `POST /api/transactions` las vuelve a aplicar contra el saldo real antes de mover dinero.

En el PR 5 no se mueve dinero, así que una validación solo en cliente no deja ninguna operación expuesta. El servidor es la única autoridad cuando existe un cargo.

## 2. Características
- Campo de monto con formato de moneda en vivo (`$` · separadores de miles · centavos) y teclado decimal en móvil.
- Saldo disponible visible junto al campo.
- Selección de destinatario entre los contactos favoritos o alta de uno nuevo.
- Concepto opcional.
- Resumen con monto, destinatario, concepto y saldo resultante; desde ahí se puede editar o confirmar.
- Cancelar en cualquier paso regresa al Home y descarta el borrador.

## 3. Reglas derivadas

### Monto

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-TX-R01 | El monto es **obligatorio** y **mayor a cero**: vacío, `0` o `0.00` son inválidos. Un monto negativo es inválido aunque llegue directo al API. | Dominio (UI + API) |
| SPEC-TX-R02 | El monto debe ser **menor o igual al saldo disponible**; transferir exactamente el saldo está permitido y deja la cuenta en `$0.00`. | Dominio (UI + API) |
| SPEC-TX-R03 | Los montos se manejan como **enteros en centavos**. El texto capturado se convierte a centavos operando sobre la cadena (`"0.29"` → `29`), **nunca** con aritmética de punto flotante (`0.29 * 100 = 28.999…`). El API recibe `amountCents` entero y nunca interpreta texto formateado. | Dominio |
| SPEC-TX-R04 | **Solo dígitos y un punto decimal:** cualquier otro carácter tecleado (letras, `-`, `+`, `e`, un segundo punto) no entra al campo. La coma es el separador de miles en `es-MX`: la pone el formato, no el usuario. Al pegar, se ignoran los símbolos de formato (`$`, comas y espacios); si queda cualquier otro carácter, el pegado se descarta completo. El teclado en móvil es decimal. | UI |
| SPEC-TX-R05 | **Límites de captura:** máximo **2 decimales** y **7 dígitos enteros** (hasta `$9,999,999.99`). Un cambio que exceda cualquiera de los dos límites se descarta completo y el valor anterior se conserva. Esto aplica a teclear y a pegar: pegar `1.234,56` no se convierte en silencio en `$1.23`. | UI |
| SPEC-TX-R06 | **Formato en vivo:** mientras escribe, se insertan separadores de miles (`1234567` → `1,234,567`) y se eliminan los ceros a la izquierda (`007` → `7`); `.5` se muestra como `0.5`. Al salir del campo se completan los centavos (`1,500` → `1,500.00`). El cursor conserva su posición relativa a los dígitos al insertar o quitar comas. | UI |
| SPEC-TX-R07 | Los errores del monto aparecen al salir del campo o al intentar continuar, no con la primera tecla. A partir de ese momento se actualizan en vivo. | UI |

### Destinatario y concepto

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-TX-R08 | El **destinatario es obligatorio** y debe ser un contacto del usuario de la sesión. El borrador guarda el `contactId`; el servidor lo resuelve en su propio repositorio y nunca confía en el nombre o la cuenta que envíe el cliente. | Dominio (UI) + API (PR 6) |
| SPEC-TX-R09 | El **concepto es opcional**: se recortan espacios y admite hasta **40 caracteres**. Si queda vacío, el movimiento se registra como `"Transferencia"`. | Dominio (UI + API) |

### Borrador, resumen e idempotencia

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-TX-R10 | El borrador (monto, destinatario, concepto e `idempotencyKey`) vive en un store en memoria del cliente. No se persiste en `localStorage` ni `sessionStorage`: al recargar, el borrador se pierde a propósito. | Aplicación |
| SPEC-TX-R11 | `/transfer/review` sin borrador completo (por ejemplo, tras recargar o al entrar por URL) redirige a `/transfer`. | Aplicación |
| SPEC-TX-R12 | El resumen muestra: monto, nombre del destinatario, banco, cuenta enmascarada, concepto (o "Sin concepto"), saldo disponible y **saldo después de la transferencia**. | UI |
| SPEC-TX-R13 | **Idempotency-Key:** al pasar a revisión se genera una clave UUID v4 (`crypto.randomUUID()`) que identifica *esta* intención de transferencia. Se conserva entre reintentos del mismo borrador y **se regenera si cambia el monto, el destinatario o el concepto**. Si se reutilizara tras editar, el servidor rechazaría la solicitud por clave reutilizada con otro contenido ([`SPEC-CONF-R04`](SPEC-CONF.md)). | Aplicación |
| SPEC-TX-R14 | El borrador y su clave se **descartan** al cancelar, al terminar con éxito y al cerrar sesión. En los tres casos se descartan **antes** de navegar, porque el Router Cache conserva el estado del cliente. Así, quien inicie sesión después no ve el borrador de otro usuario. | Aplicación |
| SPEC-TX-R15 | El saldo que usa la UI para validar se obtiene del servicio de saldo al abrir `/transfer`; lo resuelve el servidor, como en el Home. Si no se puede cargar, no se puede continuar (sin saldo confirmado no hay validación posible, igual que `SPEC-HOME-R09`). El saldo real lo vuelve a verificar el servidor al confirmar. | UI + API |
| SPEC-TX-R16 | "Continuar" no se deshabilita por errores, para que el usuario siempre pueda descubrir qué falta: al activarlo con datos inválidos se muestran todos los errores y el foco va al primer campo inválido. | UI |

### Mensajes

| Caso | Mensaje |
|------|---------|
| Monto vacío | "Ingresa un monto." |
| Monto en cero | "El monto debe ser mayor a $0.00." |
| Monto mayor al saldo | "El monto supera tu saldo disponible de $12,450.75." (saldo real formateado) |
| Sin destinatario | "Selecciona un destinatario." |
| Concepto largo | No ocurre en la UI (`maxLength` y contador); el API responde "El concepto admite hasta 40 caracteres." |

## 4. Criterios de aceptación

**SPEC-TX-AC01 — Formato de moneda en vivo**
- **Dado** el campo de monto vacío
- **Cuando** el usuario teclea `1234567.8`
- **Entonces** ve `1,234,567.8` mientras escribe y `1,234,567.80` al salir del campo.

**SPEC-TX-AC02 — Entradas descartadas**
- **Dado** el campo de monto con `12.34`
- **Cuando** teclea un tercer decimal, una letra o `-`, o pega `1.234,56`
- **Entonces** el valor sigue siendo `12.34`.

**SPEC-TX-AC03 — Monto vacío o en cero**
- **Dado** un destinatario seleccionado
- **Cuando** activa "Continuar" con el monto vacío o en `0.00`
- **Entonces** ve el error del monto, el foco va al campo y permanece en `/transfer`.

**SPEC-TX-AC04 — Monto mayor al saldo**
- **Dado** un saldo de `$12,450.75`
- **Cuando** captura `12,450.76`
- **Entonces** ve "El monto supera tu saldo disponible de $12,450.75." y no puede continuar.

**SPEC-TX-AC05 — Monto igual al saldo**
- **Dado** un saldo de `$12,450.75`
- **Cuando** captura `12,450.75`, elige un destinatario y continúa
- **Entonces** llega al resumen con saldo después de la transferencia de `$0.00`.

**SPEC-TX-AC06 — Destinatario obligatorio**
- **Dado** un monto válido
- **Cuando** activa "Continuar" sin destinatario
- **Entonces** ve "Selecciona un destinatario." y permanece en `/transfer`.

**SPEC-TX-AC07 — Resumen**
- **Dado** un borrador válido
- **Cuando** continúa
- **Entonces** llega a `/transfer/review` y ve monto, destinatario, banco, cuenta enmascarada, concepto y saldo después de la transferencia.

**SPEC-TX-AC08 — Editar desde el resumen**
- **Dado** el resumen de un borrador
- **Cuando** activa "Editar"
- **Entonces** vuelve a `/transfer` con el monto, el destinatario y el concepto conservados.

**SPEC-TX-AC09 — Recarga en el resumen**
- **Dado** el resumen abierto
- **Cuando** recarga la página o entra a `/transfer/review` por URL
- **Entonces** es redirigido a `/transfer` con el formulario vacío.

**SPEC-TX-AC10 — Cancelar**
- **Dado** un borrador en cualquier paso
- **Cuando** activa "Cancelar"
- **Entonces** vuelve al Home y, al iniciar otra transacción, el formulario está vacío.

**SPEC-TX-AC11 — Cierre de sesión con borrador**
- **Dado** un borrador de Ana
- **Cuando** cierra sesión e inicia sesión como Luis
- **Entonces** `/transfer` está vacío.

**SPEC-TX-AC12 — Saldo no disponible**
- **Dado** que el servicio de saldo falla (`x-mock-scenario: WALLET_UNAVAILABLE`)
- **Cuando** abre `/transfer`
- **Entonces** ve un error con "Reintentar", sin el formulario.

**SPEC-TX-AC13 — Responsivo y accesible**
- **Dado** un viewport móvil (Pixel 7) o de escritorio
- **Cuando** completa el flujo solo con teclado
- **Entonces** no hay scroll horizontal, cada campo tiene etiqueta y los errores se asocian al campo (`aria-invalid` + `aria-describedby`).

## 5. Contrato de API
Esta spec no agrega endpoints:
- El servicio de saldo ([`SPEC-HOME`](SPEC-HOME.md)) y el de contactos ([`SPEC-CT`](SPEC-CT.md)) se consultan desde el servidor al abrir `/transfer`.
- `POST /api/contacts` ([`SPEC-CT`](SPEC-CT.md)) da de alta destinatarios.
- `POST /api/transactions` ([`SPEC-CONF`](SPEC-CONF.md)) recibe el borrador así:

```json
// Header: Idempotency-Key: 6f1c2a8e-3b7d-4c1e-9a2f-0d5e8b7c4a31
{ "contactId": "ct_luis", "amountCents": 125050, "concept": "Renta" }
```

## 6. Estados de UI

| Estado | Comportamiento | Cómo forzarlo en pruebas |
|--------|----------------|--------------------------|
| Carga | Skeleton del formulario mientras llegan saldo y contactos | Latencia simulada de los servicios |
| Error | "No pudimos cargar tu información" + "Reintentar"; sin formulario | `x-mock-scenario: WALLET_UNAVAILABLE` |
| Sin contactos | Lista vacía con el alta de contacto visible ([`SPEC-CT`](SPEC-CT.md)) | `luis@miniwallet.dev` |
| Error de validación | Mensaje bajo el campo, `aria-invalid`, foco al primer campo inválido | Continuar con monto vacío o sin destinatario |
| Resumen | Datos del borrador + "Editar" y "Cancelar"; "Confirmar transferencia" se agrega con [`SPEC-CONF`](SPEC-CONF.md) | Borrador válido |

## 7. Edge cases
- `0.29`, `0.07`, `1.10` y `9,999,999.99`: conversión exacta a centavos (R03).
- Pegar `$1,234.56` → `1,234.56`; pegar `1.234,56` o `1e5` → se descarta (R04, R05).
- Un segundo punto decimal, un octavo dígito entero o un tercer decimal → se descarta (R05).
- Borrar una coma con Retroceso: se borra el dígito anterior y el formato se recalcula sin saltos de cursor (R06).
- Teclear solo `.` muestra `0.`; al salir del campo queda `0.00`, que es inválido (R01, R06). Salir con `5.` normaliza a `5.00`.
- Monto igual al saldo (R02) y saldo en `$0.00`: cualquier monto mayor a cero es inválido.
- Editar el monto desde el resumen genera una nueva `idempotencyKey`; volver sin cambios la conserva (R13).
- Navegar con "Atrás" del navegador desde el resumen: vuelve a `/transfer` con el borrador.
- El saldo cambia entre que se abre `/transfer` y la confirmación: lo detecta el servidor ([`SPEC-CONF-R01`](SPEC-CONF.md)).
- Solicitud manipulada al API (monto en `0`, negativo, decimal, mayor al saldo o contacto ajeno): la rechaza el servidor ([`SPEC-CONF`](SPEC-CONF.md)).

## 8. Fuera de alcance (se implementarían con más tiempo)
- Límites diarios o por operación distintos del saldo.
- Comisiones y transferencias programadas.
- Otras monedas o configuraciones regionales.
- Persistir el borrador entre recargas.

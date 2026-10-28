# SPEC-HOME — Dashboard (Home)

> **Estado:** Aprobada · **PR:** #4

## 1. Contexto y alcance
Pantalla principal tras el login. Muestra el **saldo disponible** y el **nombre del usuario**, la **lista de movimientos recientes** y el **botón para iniciar una nueva transacción**, con estados de carga, vacío y error. Valida composición de componentes, listas, manejo de información asíncrona y diseño responsivo. Incluye el cierre de sesión que `SPEC-AUTH` dejó fuera de su alcance.

## 2. Características
- Saludo con el nombre del usuario y tarjeta de saldo disponible.
- Lista de movimientos recientes (cargos y abonos) con contraparte, concepto, fecha y monto.
- Botón "Nueva transacción" que lleva a `/transfer`.
- Estados de carga (skeleton), vacío (sin movimientos) y error (con reintento).
- Encabezado común de las páginas privadas con el botón "Cerrar sesión".
- `GET /api/wallet` expone el mismo resumen para consumo desde el cliente (lo usará el flujo de transferencia).

## 3. Reglas derivadas

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-HOME-R01 | Los montos viajan y se almacenan como **enteros en centavos** (`balanceCents`, `amountCents`); nunca como decimales. El saldo no puede ser negativo y el monto de un movimiento siempre es positivo (su signo lo da el tipo). | Dominio (contrato) |
| SPEC-HOME-R02 | Los montos se muestran en pesos mexicanos con formato `es-MX`: `1245075` → `$12,450.75`. | UI |
| SPEC-HOME-R03 | Un cargo (`DEBIT`) se muestra con signo `-` y un abono (`CREDIT`) con signo `+`; el tipo también se comunica como texto para lectores de pantalla, no solo con color. | UI |
| SPEC-HOME-R04 | Los movimientos se ordenan del más reciente al más antiguo. | Dominio |
| SPEC-HOME-R05 | Se muestran como máximo los **10** movimientos más recientes. | Dominio |
| SPEC-HOME-R06 | Las fechas se muestran en la zona horaria `America/Mexico_City`, con independencia de la zona del servidor o del navegador. | UI |
| SPEC-HOME-R07 | El resumen siempre corresponde al usuario de la sesión. Sin sesión válida, `GET /api/wallet` responde `401` y la página redirige a `/login` (segunda barrera además del proxy). | Servidor |
| SPEC-HOME-R08 | Con `ENABLE_TEST_SCENARIOS=true`, el header `x-mock-scenario: WALLET_UNAVAILABLE` simula la caída del servicio de saldo. Sin la variable, el header se ignora. | Servidor |
| SPEC-HOME-R09 | Si el resumen no se puede cargar, no se muestra el botón "Nueva transacción": sin saldo confirmado no se puede validar una transferencia. | UI |
| SPEC-HOME-R10 | "Cerrar sesión" elimina la cookie de sesión y navega a `/login` recargando el documento, para que ningún estado del cliente pase al siguiente usuario (ver `SPEC-TX-R14`); si la solicitud falla, el usuario permanece en la página y se le informa. | Aplicación |

## 4. Criterios de aceptación

**SPEC-HOME-AC01 — Saldo y nombre**
- **Dado** un usuario autenticado
- **Cuando** abre el Home
- **Entonces** ve "Hola, <nombre>" y su saldo disponible con formato de moneda.

**SPEC-HOME-AC02 — Movimientos recientes**
- **Dado** un usuario con más de 10 movimientos
- **Cuando** abre el Home
- **Entonces** ve los 10 más recientes, del más nuevo al más antiguo, con signo según su tipo.

**SPEC-HOME-AC03 — Estado vacío**
- **Dado** un usuario sin movimientos
- **Cuando** abre el Home
- **Entonces** ve su saldo y el mensaje "Aún no tienes movimientos".

**SPEC-HOME-AC04 — Estado de carga**
- **Dado** que el resumen tarda en responder
- **Cuando** abre el Home
- **Entonces** ve un skeleton anunciado como "Cargando tu información" en lugar de los datos.

**SPEC-HOME-AC05 — Estado de error y reintento**
- **Dado** que el servicio de saldo no está disponible
- **Cuando** abre el Home
- **Entonces** ve "No pudimos cargar tu información" con un botón "Reintentar", sin el botón "Nueva transacción"; y al reintentar con el servicio disponible, ve sus datos.

**SPEC-HOME-AC06 — Nueva transacción**
- **Dado** un usuario con su resumen cargado
- **Cuando** activa "Nueva transacción"
- **Entonces** navega a `/transfer`.

**SPEC-HOME-AC07 — Cerrar sesión**
- **Dado** un usuario autenticado
- **Cuando** activa "Cerrar sesión"
- **Entonces** llega a `/login` y, si vuelve a `/`, es redirigido otra vez a `/login`.

**SPEC-HOME-AC08 — Responsivo**
- **Dado** un viewport móvil (Pixel 7) o de escritorio
- **Cuando** abre el Home
- **Entonces** todo el contenido es visible sin scroll horizontal.

## 5. Contrato de API

| Método | Ruta | Request | Respuestas |
|--------|------|---------|------------|
| `GET` | `/api/wallet` | Cookie de sesión | `200 WalletSummary` · `401 UNAUTHORIZED` · `503 SERVICE_UNAVAILABLE` |

```json
{
  "user": { "id": "usr_ana", "name": "Ana García" },
  "balanceCents": 1245075,
  "movements": [
    {
      "id": "mov_012",
      "type": "DEBIT",
      "amountCents": 35000,
      "counterparty": "Luis Pérez",
      "concept": "Cena",
      "occurredAt": "2026-10-26T02:15:00.000Z"
    }
  ]
}
```

## 6. Estados de UI

| Estado | Comportamiento | Cómo forzarlo en pruebas |
|--------|----------------|--------------------------|
| Carga | Skeleton con `role="status"` mientras el servidor resuelve el resumen (streaming con Suspense) | Latencia simulada de 700 ms en el servicio |
| Con datos | Saludo, saldo, botón "Nueva transacción" y lista | `ana@miniwallet.dev` (12 movimientos) |
| Vacío | Saldo y "Aún no tienes movimientos" | `luis@miniwallet.dev` (sin movimientos) |
| Error | "No pudimos cargar tu información" + "Reintentar" | Header `x-mock-scenario: WALLET_UNAVAILABLE` |

## 7. Edge cases
- Exactamente 10 o más de 10 movimientos (R05).
- Movimientos recibidos en desorden (R04).
- Saldo en cero: se muestra `$0.00` y el botón "Nueva transacción" sigue visible (la regla de saldo suficiente se valida al transferir).
- Montos grandes con separador de miles y montos menores a un peso (`50` → `$0.50`).
- Fechas cerca de la medianoche UTC que en `America/Mexico_City` caen en el día anterior (R06).
- Cookie expirada mientras se está en el Home: la siguiente navegación redirige a `/login`.
- Doble clic en "Cerrar sesión".

## 8. Fuera de alcance (se implementarían con más tiempo)
- Paginación o historial completo de movimientos.
- Detalle de un movimiento.
- Actualización en tiempo real del saldo (se refresca al navegar).

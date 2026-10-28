# SPEC-CT — Contactos favoritos

> **Estado:** Aprobada · **PR:** #5

## 1. Contexto y alcance
Al crear una transferencia ([`SPEC-TX`](SPEC-TX.md)), el usuario elige un **contacto favorito** o **da de alta uno nuevo**, que queda guardado para la próxima vez. Un contacto se identifica por un **celular**, una **tarjeta** o una **CLABE**.

Los contactos pertenecen al usuario de la sesión y se guardan en memoria en el servidor. El API revalida todo lo que la UI valida y es el único que detecta duplicados, porque solo él conoce los números completos.

## 2. Características
- Lista de contactos favoritos, con nombre, banco, tipo de cuenta y número enmascarado, seleccionable con mouse, toque o teclado.
- Formulario "Nuevo contacto": nombre, tipo de cuenta (Celular, Tarjeta o CLABE), número y banco.
- Captura del número con la máscara de su tipo y solo dígitos.
- El contacto nuevo se guarda en favoritos y queda seleccionado como destinatario.
- Estado vacío para quien aún no tiene contactos.

## 3. Reglas derivadas

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-CT-R01 | **Nombre obligatorio:** se recortan espacios y se colapsan los espacios repetidos. Debe tener entre **3 y 60 caracteres**. | Dominio (UI + API) |
| SPEC-CT-R02 | **Tipo de cuenta obligatorio:** `PHONE` (celular), `CARD` (tarjeta) o `CLABE`. El usuario lo elige antes de capturar el número; cambiarlo vacía el número capturado. | Dominio (UI + API) |
| SPEC-CT-R03 | **Longitud exacta por tipo:** celular **10 dígitos**, tarjeta **16** y CLABE **18**. El número solo contiene dígitos; el API rechaza cualquier otro carácter. | Dominio (UI + API) |
| SPEC-CT-R04 | **Dígito verificador:** una tarjeta debe pasar el algoritmo de **Luhn** y una CLABE su **dígito de control** (pesos `3, 7, 1` sobre los primeros 17 dígitos, módulo 10). Un celular no tiene dígito verificador. | Dominio (UI + API) |
| SPEC-CT-R05 | **Banco obligatorio:** debe ser uno del catálogo del dominio (`BANKS`) y se elige en un selector, no como texto libre. | Dominio (UI + API) |
| SPEC-CT-R06 | **Sin duplicados:** si el usuario ya tiene un contacto con el mismo tipo y número, el alta responde `409 CONTACT_ALREADY_EXISTS` y no se crea otro. | API |
| SPEC-CT-R07 | **El número completo nunca vuelve al cliente:** el API responde el tipo y el número enmascarado (`•••• 4321`). El número completo solo existe en la solicitud de alta y en el repositorio del servidor. | API |
| SPEC-CT-R08 | Los contactos están **aislados por usuario**: cada usuario solo lee y crea los suyos. Sin sesión válida, ambos endpoints responden `401 UNAUTHORIZED`. | Servidor |
| SPEC-CT-R09 | Un contacto creado con éxito se agrega a la lista y queda **seleccionado** como destinatario del borrador. | Aplicación |
| SPEC-CT-R10 | La lista se ordena alfabéticamente por nombre, sin distinguir mayúsculas ni acentos (`localeCompare` con `es-MX`). | Dominio |
| SPEC-CT-R11 | **Solo dígitos:** un carácter que no sea dígito no entra al campo. Al pegar, se ignoran espacios, guiones y paréntesis; si queda cualquier otro carácter, el pegado se descarta completo. El campo no admite más dígitos que la longitud de su tipo. El teclado en móvil es numérico. | UI |
| SPEC-CT-R12 | **Máscara por tipo**, aplicada mientras se escribe, sin que el cursor salte: <br>celular en bloques `2 · 4 · 4` (`55 1234 5678`) <br>tarjeta en bloques `4 · 4 · 4 · 4` (`4915 6002 1234 5675`) <br>CLABE en bloques `3 · 3 · 4 · 4 · 4` (`012 180 0012 3456 7899`) | UI |
| SPEC-CT-R13 | Mientras el alta está en vuelo no se puede enviar otra. Al guardar con éxito, el formulario se limpia y se cierra **antes** de notificar la selección. | Aplicación |
| SPEC-CT-R14 | Los errores del servidor se muestran en el campo correspondiente (`fieldErrors`) o como alerta del formulario. Lo capturado se conserva para corregir. | UI |

### Mensajes

| Caso | Mensaje |
|------|---------|
| Nombre vacío | "Ingresa el nombre del contacto." |
| Nombre corto o largo | "El nombre debe tener entre 3 y 60 caracteres." |
| Número vacío | "Ingresa el número de celular." / "Ingresa el número de tarjeta." / "Ingresa la CLABE." |
| Longitud inválida | "El celular debe tener 10 dígitos." / "La tarjeta debe tener 16 dígitos." / "La CLABE debe tener 18 dígitos." |
| Tarjeta con dígito inválido | "El número de tarjeta no es válido." |
| CLABE con dígito inválido | "La CLABE no es válida." |
| Banco vacío | "Selecciona el banco." |
| Duplicado | "Ya tienes un contacto con esa cuenta." |

## 4. Criterios de aceptación

**SPEC-CT-AC01 — Lista de favoritos**
- **Dado** que Ana tiene contactos guardados
- **Cuando** abre `/transfer`
- **Entonces** ve sus contactos en orden alfabético con nombre, banco, tipo y número enmascarado, y puede seleccionar uno.

**SPEC-CT-AC02 — Sin contactos**
- **Dado** que Luis no tiene contactos
- **Cuando** abre `/transfer`
- **Entonces** ve "Aún no tienes contactos guardados" y el formulario de nuevo contacto.

**SPEC-CT-AC03 — Alta exitosa**
- **Dado** el formulario de nuevo contacto
- **Cuando** captura un nombre, elige un tipo, captura un número válido y un banco, y guarda
- **Entonces** el contacto aparece en la lista, seleccionado como destinatario, y sigue ahí al volver a `/transfer`.

**SPEC-CT-AC04 — Máscara y solo dígitos**
- **Dado** el formulario de nuevo contacto
- **Cuando** teclea `55a1234-5678` como celular, `4915600212345675` como tarjeta o `012180001234567899` como CLABE
- **Entonces** ve `55 1234 5678`, `4915 6002 1234 5675` y `012 180 0012 3456 7899`.

**SPEC-CT-AC05 — Validación de campos**
- **Dado** el formulario de nuevo contacto
- **Cuando** guarda con el nombre vacío, un celular de 9 dígitos o una tarjeta que no pasa Luhn
- **Entonces** ve el mensaje correspondiente en cada campo y no se realiza ninguna solicitud.

**SPEC-CT-AC06 — Duplicado**
- **Dado** que Ana ya tiene un contacto con la cuenta `X`
- **Cuando** da de alta otro contacto con la cuenta `X`
- **Entonces** ve "Ya tienes un contacto con esa cuenta." y la lista no cambia.

**SPEC-CT-AC07 — Aislamiento**
- **Dado** un contacto creado por Ana
- **Cuando** Luis abre `/transfer`
- **Entonces** no lo ve.

**SPEC-CT-AC08 — Validación en servidor**
- **Dado** una solicitud a `POST /api/contacts` que no pasa por la UI
- **Cuando** envía un número con letras o con la longitud de otro tipo, un banco fuera del catálogo o un nombre vacío
- **Entonces** recibe `400 VALIDATION_ERROR` con `fieldErrors` y no se guarda nada.

## 5. Contrato de API

| Método | Ruta | Request | Respuestas |
|--------|------|---------|------------|
| `GET` | `/api/contacts` | Cookie de sesión | `200 { contacts: Contact[] }` · `401 UNAUTHORIZED` |
| `POST` | `/api/contacts` | Cookie de sesión + `{ name, accountType, account, bank }` | `201 { contact: Contact }` · `400 VALIDATION_ERROR` · `401 UNAUTHORIZED` · `409 CONTACT_ALREADY_EXISTS` |

```json
// Contact (respuesta)
{ "id": "ct_8f3k2a", "name": "Mariana Soto", "bank": "BBVA", "accountType": "CLABE", "maskedAccount": "•••• 7899" }
```

```json
// POST /api/contacts (request): account solo con dígitos
{ "name": "Mariana Soto", "accountType": "CLABE", "account": "012180001234567899", "bank": "BBVA" }
```

## 6. Estados de UI

| Estado | Comportamiento | Cómo forzarlo en pruebas |
|--------|----------------|--------------------------|
| Carga | Parte del skeleton de `/transfer` ([`SPEC-TX`](SPEC-TX.md)) | Latencia simulada |
| Vacío | "Aún no tienes contactos guardados" + formulario de alta visible | `luis@miniwallet.dev` |
| Con datos | Grupo de opciones (`radiogroup`) con los favoritos y botón "Nuevo contacto" | `ana@miniwallet.dev` |
| Guardando | Botón "Guardar contacto" con estado de carga y campos de solo lectura | Cualquier alta válida |
| Error de validación | Mensaje bajo el campo con `aria-invalid` | Celular de 9 dígitos |
| Error de servidor | Alerta en el formulario o error en el campo; lo capturado se conserva | Cuenta duplicada |

### Contactos de demostración

| Usuario | Contacto | Banco | Tipo | Número |
|---------|----------|-------|------|--------|
| Ana García | Carlos Núñez | Banorte | Tarjeta | `4915 6002 1234 5675` |
| Ana García | Luis Pérez | Mini Wallet | Celular | `55 8765 4321` |
| Ana García | Mariana Soto | BBVA | CLABE | `012 180 0012 3456 7899` |
| Luis Pérez | — | — | — | — |

Los números son ficticios, pero pasan Luhn o el dígito de control de la CLABE, según su tipo.

## 7. Edge cases
- Pegar `55 1234-5678` o `(55) 1234 5678` como celular: se normaliza; pegar `55-ABCD-5678` se descarta (R11).
- Teclear un dígito más de la longitud del tipo: no entra (R11).
- Cambiar el tipo con un número capturado: el número se vacía y no se valida contra el tipo anterior (R02).
- Borrar un espacio de la máscara con Retroceso: se borra el dígito anterior y la máscara se recalcula (R12).
- Tarjeta de 16 dígitos con Luhn inválido; CLABE de 18 con dígito de control inválido (R04).
- Mismo número dado de alta por dos usuarios distintos: permitido, porque cada uno tiene su lista (R06, R08).
- Nombre con acentos, `ñ` o espacios dobles (R01, R10).
- Doble clic en "Guardar contacto" (R13).
- Banco fuera del catálogo o tipo de cuenta desconocido, enviado directo al API (R02, R05).
- Reinicio del servidor: los contactos creados se pierden y vuelven los de demostración (persistencia en memoria).

## 8. Fuera de alcance (se implementarían con más tiempo)
- Editar, eliminar o marcar o desmarcar favoritos.
- Validar que el banco corresponda al prefijo de la CLABE (los 3 primeros dígitos).
- Búsqueda en la lista de contactos.
- Transferir a un número sin guardarlo como contacto.

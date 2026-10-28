# SPEC-AUTH — Login y Sesión

> **Estado:** Aprobada · **PR:** #3

## 1. Contexto y alcance
Punto de entrada de la PoC. El usuario se identifica con su **teléfono o email** (sin contraseña: no se busca autenticación real) y obtiene una sesión mockeada que le da acceso a las rutas privadas (Home y flujo de transferencia). El objetivo es validar estructura, estado, validación, navegación y separación de responsabilidades.

## 2. Características
- Formulario con un único campo "Teléfono o email".
- Validación de formato y campo requerido, en cliente y servidor con el mismo esquema.
- Estados de carga y de error (incluido un error de servicio simulado).
- Sesión persistida en una cookie firmada; sobrevive a recargas y reinicios del servidor.
- Navegación al Home tras un login exitoso.
- Rutas privadas protegidas; las rutas públicas redirigen al Home si ya hay sesión.
- Cierre de sesión vía API.

## 3. Reglas derivadas

| ID | Regla | Capa donde se valida |
|----|-------|----------------------|
| SPEC-AUTH-R01 | El identificador es obligatorio; una cadena vacía o solo espacios es inválida. | Dominio (UI + API) |
| SPEC-AUTH-R02 | Si el identificador contiene `@`, se trata como email: se recortan espacios, se pasa a minúsculas y debe tener formato de email válido. | Dominio (UI + API) |
| SPEC-AUTH-R03 | Si no contiene `@`, se trata como teléfono: se eliminan espacios, guiones y paréntesis, se descarta el prefijo `+52`/`52` opcional y el resultado debe ser **exactamente 10 dígitos**. | Dominio (UI + API) |
| SPEC-AUTH-R04 | El identificador normalizado (R02/R03) es el que se usa para buscar al usuario; `ANA@MiniWallet.dev ` y `ana@miniwallet.dev` son el mismo usuario, igual que `+52 55 1234 5678` y `5512345678`. | Dominio |
| SPEC-AUTH-R05 | Un identificador con formato válido que no pertenece a ningún usuario se rechaza con un mensaje genérico, sin revelar si existe el email o el teléfono. | API |
| SPEC-AUTH-R06 | Con `ENABLE_TEST_SCENARIOS=true`, el identificador reservado `error@miniwallet.dev` produce un error de servicio simulado (503). | API |
| SPEC-AUTH-R07 | La sesión es un token `payload.firma` (HMAC-SHA256 con `SESSION_SECRET`) con `userId` y expiración; un token alterado, mal formado o expirado se considera **sin sesión**. | Servidor |
| SPEC-AUTH-R08 | La sesión expira a los **30 minutos** de su emisión. | Servidor |
| SPEC-AUTH-R09 | La cookie `mini-wallet-session` es `httpOnly`, `sameSite=lax`, `path=/` y `secure` en producción. | API |
| SPEC-AUTH-R10 | Toda página distinta de `/login` (incluidas `/` y `/transfer/*`) es privada por defecto: sin sesión válida redirige a `/login`. Las API Routes y los assets estáticos no pasan por esta regla. | Proxy |
| SPEC-AUTH-R11 | `/login` con sesión válida redirige a `/`. | Proxy |
| SPEC-AUTH-R12 | Mientras una solicitud de login está en vuelo, no se puede enviar otra (sin doble envío). | Aplicación |
| SPEC-AUTH-R13 | Si el servidor no responde en `NEXT_PUBLIC_TIMEOUT_MS` (4000 ms por defecto), la solicitud se aborta y se informa al usuario. | Aplicación |

## 4. Criterios de aceptación

**SPEC-AUTH-AC01 — Login exitoso**
- **Dado** un usuario registrado
- **Cuando** ingresa su email o teléfono válido y envía el formulario
- **Entonces** ve un estado de carga, se emite la cookie de sesión y es redirigido al Home.

**SPEC-AUTH-AC02 — Campo requerido**
- **Dado** el formulario vacío
- **Cuando** lo envía
- **Entonces** ve "Ingresa tu teléfono o email." junto al campo y no se realiza ninguna solicitud.

**SPEC-AUTH-AC03 — Formato inválido**
- **Dado** un identificador que no es email ni teléfono de 10 dígitos (ej. `ana@`, `55123`)
- **Cuando** envía el formulario
- **Entonces** ve el mensaje de formato correspondiente junto al campo y no se realiza ninguna solicitud.

**SPEC-AUTH-AC04 — Usuario no encontrado**
- **Dado** un identificador válido no registrado
- **Cuando** envía el formulario
- **Entonces** ve "No encontramos una cuenta con esos datos." y permanece en `/login`.

**SPEC-AUTH-AC05 — Error de servicio simulado**
- **Dado** `ENABLE_TEST_SCENARIOS=true`
- **Cuando** inicia sesión con `error@miniwallet.dev`
- **Entonces** ve "El servicio no está disponible. Intenta de nuevo en unos momentos." y puede reintentar.

**SPEC-AUTH-AC06 — Ruta privada sin sesión**
- **Dado** un visitante sin sesión
- **Cuando** navega a `/` o `/transfer`
- **Entonces** es redirigido a `/login`.

**SPEC-AUTH-AC07 — Login con sesión activa**
- **Dado** un usuario con sesión válida
- **Cuando** navega a `/login`
- **Entonces** es redirigido a `/`.

**SPEC-AUTH-AC08 — Persistencia**
- **Dado** un usuario con sesión válida
- **Cuando** recarga la página
- **Entonces** sigue autenticado.

## 5. Contrato de API

| Método | Ruta | Request | Respuestas |
|--------|------|---------|------------|
| `POST` | `/api/auth` | `{ "identifier": string }` | `200 { user: { id, name } }` + `Set-Cookie` · `400 VALIDATION_ERROR` · `401 INVALID_CREDENTIALS` · `503 SERVICE_UNAVAILABLE` |
| `DELETE` | `/api/auth` | — | `204` + cookie eliminada |

Formato de error común:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Ingresa un email válido.", "fieldErrors": { "identifier": ["Ingresa un email válido."] } } }
```

## 6. Estados de UI

| Estado | Comportamiento | Cómo forzarlo en pruebas |
|--------|----------------|--------------------------|
| Inicial | Campo vacío, botón "Ingresar" habilitado | — |
| Error de validación | Mensaje bajo el campo, `aria-invalid="true"` | Enviar vacío o `55123` |
| Carga | Botón deshabilitado con "Ingresando…" y `aria-busy` | Cualquier envío válido (latencia simulada de 600 ms) |
| Error de servidor | Alerta (`role="alert"`) sobre el botón; el usuario puede corregir y reintentar | Identificador no registrado o `error@miniwallet.dev` |
| Éxito | Redirección a `/` | `ana@miniwallet.dev` |

### Usuarios de demostración

| Nombre | Email | Teléfono |
|--------|-------|----------|
| Ana García | `ana@miniwallet.dev` | `5512345678` |
| Luis Pérez | `luis@miniwallet.dev` | `5587654321` |

## 7. Edge cases
- Espacios al inicio o al final y mayúsculas en el email (R02).
- Teléfono con espacios, guiones, paréntesis o prefijo `+52` (R03).
- Teléfono de 9 u 11 dígitos, o con letras (R03).
- Cuerpo de la solicitud vacío, JSON inválido o sin `identifier`: `400`.
- Doble clic en "Ingresar" (R12).
- Servidor lento o sin conexión (R13 y error de red).
- Cookie alterada manualmente, expirada o firmada con otro secreto (R07).
- `SESSION_SECRET` ausente o con menos de 32 caracteres: el servidor falla con un mensaje explícito de configuración.

## 8. Fuera de alcance
- Contraseña, OTP o cualquier factor de autenticación real.
- Registro de usuarios y recuperación de cuenta.
- Regreso a la ruta originalmente solicitada tras el login (siempre se navega a `/`).
- Botón de cierre de sesión en la UI (se agrega con el Home en `SPEC-HOME`).

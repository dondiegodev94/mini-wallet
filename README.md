# 🚀 Mini Wallet Web App

Bienvenido(a) al repositorio de la **Mini Wallet Web App**. Este proyecto es una **prueba de concepto (PoC)** de una wallet digital que simula un flujo transaccional (Login → Home → Nueva Transacción → Confirmación / Comprobante) para un entorno de alto volumen, construido bajo la metodología **Specification-Driven Development (SDD)**, con una arquitectura orientada a un Design System encapsulado y separación estricta de responsabilidades (SOLID).

## 🛠️ Stack Tecnológico y Librerías Usadas

El proyecto prioriza el pragmatismo y el rendimiento, seleccionando herramientas específicas para resolver problemas del dominio:

* **Framework:** Next.js 16 (App Router) + TypeScript estricto.
* **Gestión de Estado Local:** Zustand (suscripciones atómicas para evitar re-renders masivos).
* **Validación y Contratos:** Zod (esquemas de validación unificados para UI y API).
* **Estilos y Design System:** Tailwind CSS v4 + CVA (Class Variance Authority), encapsulados estrictamente en la capa de UI.
* **Testing:**
  * Unitario: Jest + React Testing Library.
  * E2E: Playwright (ideal para interceptar red y simular fallos aleatorios).
  * Mutación (Bonus): Stryker (garantiza la confiabilidad de los tests).
* **Calidad de commits:** Husky + Lint-staged + Commitlint, con commits firmados (GPG) verificados en CI.

## ⚙️ Prerrequisitos

* **Node.js:** v20.9 o superior.
* **Gestor de paquetes:** pnpm (versión fijada en `packageManager` de `package.json`; se recomienda habilitarlo con `corepack enable`).

## 🚀 Instrucciones para Levantar el Proyecto

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/dondiegodev94/mini-wallet.git
   cd mini-wallet
   ```

2. **Configurar variables de entorno** a partir del ejemplo (obligatorio: el servidor no arranca sin `SESSION_SECRET`):
   ```bash
   cp .env.example .env.local
   ```

3. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

4. **Levantar el servidor de desarrollo:**
   ```bash
   pnpm dev
   ```
   La aplicación estará disponible en http://localhost:3000.

5. **(Opcional) Instalar el navegador para pruebas E2E:**
   ```bash
   pnpm exec playwright install chromium
   ```

## 👤 Usuarios de Demostración

El login no usa contraseña: basta con el teléfono o el email (se aceptan espacios, guiones y el prefijo `+52` en el teléfono).

| Usuario | Email | Teléfono | Home |
|---------|-------|----------|------|
| Ana García | `ana@miniwallet.dev` | `5512345678` | Saldo de $12,450.75 y 12 movimientos (se muestran los 10 más recientes) |
| Luis Pérez | `luis@miniwallet.dev` | `5587654321` | Saldo de $3,000.00 sin movimientos (estado vacío) |

### Contactos de demostración

Ana tiene tres contactos favoritos; Luis no tiene ninguno (estado vacío con el alta de contacto abierta). Los números son ficticios, pero pasan las validaciones de su tipo.

| Contacto | Banco | Tipo | Número |
|----------|-------|------|--------|
| Carlos Núñez | Banorte | Tarjeta (Luhn) | `4915 6002 1234 5675` |
| Luis Pérez | Mini Wallet | Celular | `55 8765 4321` |
| Mariana Soto | BBVA | CLABE (dígito de control) | `012 180 0012 3456 7899` |

Para dar de alta un contacto nuevo puedes usar, por ejemplo, la tarjeta `4027 6600 1298 7659` o la CLABE `072 180 0198 7654 3216`.

### Escenarios de error simulados

Disponibles solo con `ENABLE_TEST_SCENARIOS=true`:

| Escenario | Cómo activarlo |
|-----------|----------------|
| Login con servicio no disponible | Iniciar sesión con `error@miniwallet.dev` |
| Home o Nueva transacción sin servicio de saldo | Enviar el header `x-mock-scenario: WALLET_UNAVAILABLE` (por ejemplo, con una extensión del navegador para modificar headers) |
| Resultado fijo al confirmar una transferencia | Enviar el header `x-mock-scenario` con `SUCCESS`, `NETWORK_ERROR`, `INSUFFICIENT_FUNDS`, `TIMEOUT` o `UNKNOWN_ERROR` |

### Confirmación de transferencias

Sin el header, cada confirmación obtiene un resultado **al azar**: éxito (60 %), error de red, fondos insuficientes, timeout o error desconocido (10 % cada uno). Todas las pantallas de resultado ofrecen "Volver al inicio"; el error de red y el timeout permiten además reintentar con la misma `Idempotency-Key`, así que un reintento nunca cobra dos veces. En el timeout, el servidor sí aplica el cargo y responde tarde: al reintentar aparece el comprobante original.

El tiempo límite de la confirmación es de **15 s** y se cambia con `NEXT_PUBLIC_TRANSFER_TIMEOUT_MS` en `.env.local` (requiere reiniciar `pnpm dev`, porque Next.js lo incrusta en el bundle). Las pruebas E2E lo bajan a 3 s.

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Inicia el entorno de desarrollo. |
| `pnpm build` | Construye la aplicación para producción. |
| `pnpm start` | Sirve el build de producción. |
| `pnpm type-check` | Genera los tipos de rutas de Next.js y ejecuta el compilador de TypeScript sin emitir archivos (bloqueante en pre-commit y CI). |
| `pnpm lint` | Ejecuta ESLint: Clean Code, prohibición de `any`, de estilos inline y de funciones inline en JSX. |
| `pnpm test` | Ejecuta la suite de pruebas unitarias con Jest. |
| `pnpm test:e2e` | Ejecuta las pruebas de flujos completos en el navegador con Playwright (levanta la app automáticamente). |

## ⚠️ Limitaciones Conocidas

Para mantener el enfoque en la arquitectura del frontend dentro del alcance de la PoC, el sistema presenta las siguientes limitaciones intencionales:

1. **Persistencia volátil:** los contactos creados, reducción de saldo y movimientos recientes se guardan en memoria en la capa de API Routes (servidor simulado). Al reiniciar el servidor, los datos vuelven a su estado inicial.
2. **Aleatoriedad determinista (testing):** la pantalla de confirmación genera 5 escenarios aleatorios. Para probar el sistema sin inestabilidad (*flakiness*), los tests envían el header `x-mock-scenario`, que solo se respeta si `ENABLE_TEST_SCENARIOS=true`.
3. **Autenticación mockeada:** no hay contraseña ni factor de autenticación real; solo validación de formato y una sesión de 30 minutos en una cookie firmada (HMAC) que sobrevive a reinicios del servidor.
4. **Sin regreso a la ruta solicitada:** tras el login siempre se navega al Home, aunque el usuario hubiera intentado abrir otra página privada.
5. **Historial acotado:** el Home muestra solo los 10 movimientos más recientes; no hay paginación ni detalle de movimiento.
6. **Moneda y zona horaria fijas:** los montos se muestran en MXN (`es-MX`) y las fechas en `America/Mexico_City`.
7. **Borrador de transferencia volátil:** el monto, el destinatario y el concepto viven en memoria del navegador; al recargar la página se pierden a propósito.
8. **Contactos sin edición:** se pueden dar de alta, pero no editar ni eliminar, y no se valida que el banco corresponda al prefijo de la CLABE.
9. **Sin abono al destinatario:** una transferencia descuenta el saldo de quien envía, pero no acredita a un contacto que también sea usuario de Mini Wallet.
10. **Comprobante sin compartir:** el comprobante se muestra en pantalla; no se descarga ni se comparte, y no hay animaciones, sonido ni feedback háptico.

## 📚 Documentación Adjunta

* [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md): plan de entrega por features (vertical slices) y ciclo SDD.
* [`docs/specs/`](docs/specs/): especificaciones de cada feature (reglas derivadas y criterios de aceptación con ID).
* [`DECISIONS.md`](DECISIONS.md): justificación técnica y trade-offs arquitectónicos.
* [`AI_USAGE.md`](AI_USAGE.md): bitácora de transparencia sobre el uso de IA.

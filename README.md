# 🚀 Mini Wallet Web App

Bienvenido(a) al repositorio de la **Mini Wallet Web App**. Este proyecto es una **prueba de concepto (PoC)** de una wallet digital que simula un flujo transaccional (Login → Home → Nueva Transacción → Confirmación / Comprobante) para un entorno de alto volumen, construido bajo la metodología **Specification-Driven Development (SDD)**, con una arquitectura orientada a un Design System encapsulado y separación estricta de responsabilidades (SOLID).

<div align="center">
  <video src="https://github.com/user-attachments/assets/1fc79a36-d33f-4f3a-89f1-6b300d457c11.mp4" width="600" controls></video>
</div>

## ⏱️ Tiempo invertido

Se le dedicaron al rededor de 10Hrs efectivas al proyecto.

## 🛠️ Stack Tecnológico y Librerías Usadas

El proyecto prioriza el pragmatismo y el rendimiento, seleccionando herramientas específicas para resolver problemas del dominio:

* **Framework:** Next.js 16 (App Router, Cache Components y Partial Prerendering) + TypeScript estricto.
* **Gestión de Estado Local:** Zustand (suscripciones atómicas para evitar re-renders masivos).
* **Validación y Contratos:** Zod (esquemas de validación unificados para UI y API).
* **Estilos y Design System:** Tailwind CSS v4 + CVA (Class Variance Authority) + `clsx`/`tailwind-merge`, encapsulados estrictamente en la capa de UI (ver [Design System](#-design-system)).
* **Testing:**
  * Unitario: Jest + React Testing Library.
  * E2E: Playwright (ideal para interceptar red y simular fallos aleatorios).
  * Mutación: Stryker, con la configuración lista en `stryker.conf.js`; la instalación de sus paquetes queda para el PR 7 (opcional).
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

### Variables de entorno

| Variable | Valor por defecto | Uso |
|----------|-------------------|-----|
| `SESSION_SECRET` | — (obligatoria, mínimo 32 caracteres) | Firma la cookie de sesión (HMAC-SHA256). Sin ella el servidor falla con un mensaje explícito. |
| `ENABLE_TEST_SCENARIOS` | `false` (`.env.example` la activa para la demo) | Habilita el header `x-mock-scenario`, el login con `error@miniwallet.dev` y `POST /api/test/accounts`. En producción siempre debe ser `false`. |
| `NEXT_PUBLIC_TIMEOUT_MS` | `4000` | Tiempo límite de las demás peticiones del cliente (login, cierre de sesión y alta de contactos). |
| `NEXT_PUBLIC_TRANSFER_TIMEOUT_MS` | `15000` | Tiempo límite de la confirmación de una transferencia. Next.js lo incrusta en el bundle: requiere reiniciar `pnpm dev` o volver a construir. |

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

## 🧪 Pruebas

* **Unitarias (`pnpm test`):** viven junto al código (`*.test.ts` / `*.test.tsx`) y su título cita el ID de la regla o criterio que protegen, por ejemplo `[SPEC-CONF-R09] motor de caos`. Cubren reglas del dominio, esquemas, Route Handlers, servicios, idempotencia, concurrencia, store, hooks y componentes críticos.
* **E2E (`pnpm test:e2e`):** viven en `tests/e2e` y corren cada prueba en **Desktop Chrome** y **Pixel 7**. Playwright levanta la app en el puerto `3100` (configurable con `E2E_PORT`) con `ENABLE_TEST_SCENARIOS=true` y un tiempo límite de confirmación de 3 s. En local usa `pnpm dev` y reutiliza un servidor que ya esté en ese puerto; en CI sirve el build con `pnpm start`.
* **Un solo archivo o dispositivo:**
  ```bash
  pnpm test:e2e tests/e2e/confirmation.spec.ts --project=desktop
  ```
* **Determinismo:** las pruebas fuerzan el resultado de la confirmación con `x-mock-scenario` y crean una cuenta aislada por prueba (`POST /api/test/accounts`), así corren en paralelo con saldos exactos.

## 🏗️ Arquitectura en Breve

```text
src/app          → rutas, contenedores (_components), Route Handlers (BFF) y proxy
src/ui           → Design System y ensamblajes por feature (solo props)
src/application  → hooks, store Zustand y cliente HTTP (cero JSX)
src/server       → sesión, repositorios en memoria, idempotencia y motor de caos (server-only)
src/domain       → modelos, reglas puras, esquemas y contratos Zod (sin React ni Next.js)
```

Las dependencias apuntan hacia `domain`: las reglas de negocio existen una sola vez, la UI las usa para dar retroalimentación inmediata y el API las vuelve a aplicar antes de mover dinero. La justificación de cada decisión está en [`DECISIONS.md`](DECISIONS.md).

## 🎨 Design System

El Design System define **todo** lo visual en dos lugares; ninguna otra parte del código decide colores, radios ni tamaños.

| Pieza | Ubicación | Responsabilidad |
|-------|-----------|-----------------|
| **Tokens** | `src/app/globals.css` (`@theme`) | Colores semánticos y radios. El resto de las escalas (espaciado, tipografía, sombras) son los tokens por defecto de Tailwind v4, que se sobrescriben en el mismo bloque. |
| **Componentes base** | `src/ui/components` | `Button`, `ButtonLink`, `Input`, `TextField`, `MaskedField`, `SelectField`, `SegmentedControl`, `Card`, `Alert`, `Skeleton`, `EmptyState` y `ErrorState`, con variantes CVA. |
| **Ensamblajes** | `src/ui/features` | Pantallas por feature (auth, home, layout, transfer) compuestas con los componentes base; solo reciben props. |
| **Utilidad** | `src/ui/utils/cn.ts` | `clsx` + `tailwind-merge`: un `className` externo extiende un componente sin pelear con sus variantes. |

### Cómo fluye un token

```text
@theme { --color-primary: #00e096 }                       globals.css
  → .bg-primary { background-color: var(--color-primary) } utilidad generada por Tailwind
  → buttonVariants({ variant: "primary" })                 src/ui/components/Button
  → <Button variant="primary">Confirmar transferencia</Button>
```

Tailwind v4 compila cada utilidad a una **variable CSS** (`bg-primary` → `var(--color-primary)`, `p-6` → `calc(var(--spacing) * 6)`, `rounded-lg` → `var(--radius-lg)`). Por eso cambiar el valor de un token cambia toda la aplicación sin tocar un solo componente, y redefinir la variable bajo otro selector crea un tema nuevo.

### Tokens semánticos

Los nombres describen el **rol**, no el color: un cambio de marca cambia valores, no nombres ni componentes.

| Token | Valor actual | Rol |
|-------|--------------|-----|
| `--color-background` | `#f3f4f6` | Fondo de la página |
| `--color-foreground` | `#111827` | Texto principal |
| `--color-surface` | `#ffffff` | Tarjetas, campos y encabezado |
| `--color-border` | `#d1d5db` | Bordes y divisores |
| `--color-primary` | `#00e096` | Acción principal y anillo de foco |
| `--color-primary-foreground` | `#111827` | Texto sobre `primary` |
| `--color-success` | `#047857` | Abonos y comprobante |
| `--color-destructive` | `#ef4444` | Errores y campos inválidos |
| `--color-destructive-foreground` | `#fafafa` | Texto sobre `destructive` |
| `--color-muted` | `#f3f4f6` | Fondos secundarios y *hover* |
| `--color-muted-foreground` | `#6b7280` | Texto secundario |
| `--radius-lg` / `--radius-md` / `--radius-sm` | `0.5rem` y derivados | Esquinas de tarjetas, botones y campos |

### Reglas que lo protegen

* ESLint prohíbe `style` en línea (`react/forbid-dom-props`).
* No hay colores literales (`bg-red-500`, hexadecimales) fuera de `globals.css`: todo color pasa por un token semántico.
* Tailwind solo escanea `src/app` y `src/ui` (`source(none)` + `@source`): el dominio, la aplicación y el servidor no pueden contener clases.
* `globals.css` no define clases; los estilos de cada componente viven en sus variantes CVA.
* Las pantallas eligen variantes (`variant`, `size`, `tone`, `invalid`) en lugar de escribir clases de color.
* Las pruebas localizan elementos por rol y nombre accesible, no por clases: un cambio visual no rompe las pruebas.

### Cambiar la paleta

Basta con cambiar los valores en `@theme`. Ningún componente cambia:

```css
@theme {
  --color-primary: #2563eb;
  --color-primary-foreground: #ffffff;
  --color-success: #15803d;
}
```

Al elegir colores, verifica contraste AA en cada par que se usa junto (`primary` con `primary-foreground`, `muted-foreground` sobre `surface`). Los modificadores de opacidad (`bg-destructive/10`) se recalculan solos a partir del token.

### Cambiar tamaños y tipografía

Todas las escalas son tokens de Tailwind v4 y se sobrescriben en el mismo bloque:

```css
@theme {
  --spacing: 0.3rem;               /* Base de p-*, gap-*, h-* y size-* (por defecto 0.25rem): +20 % en toda la app */
  --radius-lg: 0.75rem;            /* Esquinas más redondeadas */
  --radius-md: calc(0.75rem - 2px);
  --radius-sm: calc(0.75rem - 4px);
  --text-sm: 0.9375rem;            /* Tamaño del texto secundario */
  --text-sm--line-height: 1.4;
}
```

`--spacing` también cambia la altura de botones y campos (`h-10`, `h-12`): revisa el área táctil y que no aparezca scroll horizontal en móvil (las E2E lo verifican en Pixel 7).

Para una fuente de marca, `next/font` declara una variable CSS y `@theme inline` la conecta con `font-sans`, que es la fuente base de la aplicación:

```tsx
// src/app/layout.tsx
import { Manrope } from "next/font/google";

const brand = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-brand" });

// <html lang="es" className={brand.variable}>
```

```css
/* src/app/globals.css */
@theme inline {
  --font-sans: var(--font-brand), system-ui, sans-serif;
}
```

### Temas: modo oscuro o varias marcas

Tailwind v4 declara los tokens en `@layer theme`, y la capa `base` tiene prioridad sobre ella. Redefinir las variables en `base` bajo un selector crea un tema completo, sin `!important` y sin variantes `dark:` en los componentes:

```css
@layer base {
  [data-theme="dark"] {
    --color-background: #0b1210;
    --color-foreground: #e5ece8;
    --color-surface: #131c19;
    --color-border: #2a3631;
    --color-muted: #1a2420;
    --color-muted-foreground: #9aa8a1;
    color-scheme: dark;
  }
}
```

El tema se activa con `data-theme="dark"` en `<html>`. Para seguir la preferencia del sistema operativo, se usa el mismo bloque dentro de `@media (prefers-color-scheme: dark)` con `:root` como selector. Con este mismo mecanismo se pueden servir varias marcas (`[data-brand="empresa"]`) desde el mismo código.

### Acoplar un Design System diferente

Los nombres semánticos del proyecto funcionan como **adaptador**: según cuánto del otro Design System se adopte, el cambio queda en un archivo o en una carpeta.

1. **Solo sus tokens (el caso más común):** el Design System corporativo publica variables CSS. Se importan y se apuntan los tokens del proyecto a las suyas con `@theme inline`, que hace que las utilidades lean directamente la variable externa (`bg-primary` → `var(--acme-color-brand-500)`), así los temas del otro sistema siguen funcionando:
   ```css
   @import "tailwindcss" source(none);
   @import "@acme/design-tokens/tokens.css";

   @theme inline {
     --color-primary: var(--acme-color-brand-500);
     --color-primary-foreground: var(--acme-color-on-brand);
     --color-destructive: var(--acme-color-danger-500);
     --color-surface: var(--acme-color-surface);
     --radius-lg: var(--acme-radius-md);
     --font-sans: var(--acme-font-family-base);
   }
   ```
   Cambia solo `globals.css`.
2. **Sus componentes de React:** se reemplaza el interior de `src/ui/components/*` conservando la API de props (`variant`, `size`, `isLoading`, `invalid`, `label`, `error`, `hint`…). Los ensamblajes de `src/ui/features` y las pantallas no cambian. Las pruebas de los componentes (`Button.test.tsx`, `MaskedField.test.tsx`) y las E2E, que buscan por rol y nombre accesible, validan que el contrato se conserve.
3. **Otro motor de estilos (CSS Modules, vanilla-extract…):** el cambio queda dentro de `src/ui` y `globals.css`, más los contenedores de `src/app` que usan clases de distribución (`flex`, `gap`). Dominio, aplicación, servidor y Route Handlers no se tocan.

### Agregar un componente al Design System

* Crear `src/ui/components/<Nombre>/<Nombre>.tsx` con `cva` y variantes con nombre semántico (`tone="error"`, no `color="red"`). Exportar las variantes si otro componente las reutiliza, como `ButtonLink` con `buttonVariants`.
* Usar solo tokens semánticos. Si falta un rol (por ejemplo, `warning`), se agrega primero `--color-warning` en `@theme`.
* Aceptar `className` y combinarlo con `cn()`.
* Cuidar la accesibilidad: rol, atributos `aria-*` y foco visible (`focus-visible:ring-primary`).
* Agregar una prueba con Testing Library si el componente tiene lógica (estado, máscara, carga).

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
11. **Un solo tema:** no hay modo oscuro todavía; el Design System ya lo permite con tokens (ver [Temas](#temas-modo-oscuro-o-varias-marcas)).

## 🧭 Roadmap

* **Calidad de las pruebas:** instalar Stryker y publicar el umbral de mutación sobre `src/domain` y `src/application/hooks` (PR 7, opcional).
* **Observabilidad:** Datadog RUM y APM, con trazas del BFF que incluyan la `Idempotency-Key` para seguir un pago de punta a punta, y logs estructurados. Mixpanel para el embudo Login → Nueva transacción → Comprobante y la tasa de cada resultado de la confirmación. Las variables ya están reservadas en `.env.example`.
* **Rendimiento:** reportar Core Web Vitals (LCP, INP, CLS) con `useReportWebVitals` hacia Datadog, y Lighthouse CI con presupuestos de rendimiento en el pipeline.
* **Calidad y seguridad:** SonarCloud (quality gate, cobertura y duplicación) y Snyk (dependencias y análisis estático) en el CI.
* **Infraestructura:** base de datos transaccional para saldo y movimientos, idempotencia distribuida (Redis o restricción única) y sesiones con revocación.
* **Producto:** compartir el comprobante, abono al destinatario, paginación de movimientos, edición de contactos, modo oscuro y programar una transferencia tras un error de red.

## 📚 Documentación Adjunta

* [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md): plan de entrega por features (vertical slices) y ciclo SDD.
* [`docs/specs/`](docs/specs/): especificaciones de cada feature (reglas derivadas y criterios de aceptación con ID).
* [`DECISIONS.md`](DECISIONS.md): justificación técnica, trade-offs arquitectónicos, edge cases considerados y qué se haría diferente con más tiempo.
* [`AI_USAGE.md`](AI_USAGE.md): bitácora de transparencia sobre el uso de IA.

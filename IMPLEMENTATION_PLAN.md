# 📋 Plan de Implementación y Estrategia de Desarrollo — Mini Wallet

Este documento define el plan de entrega de **Mini Wallet** en Pull Requests orientados a **Features (Vertical Slices)**. Cada PR entrega un flujo completo y funcional de extremo a extremo (Spec → Dominio → API Mock → Estado → UI → Tests) en lugar de construir capas horizontales completas por adelantado.

Mini Wallet es una **prueba de concepto (PoC)** de una wallet digital que simula el flujo Login → Home → Nueva Transacción → Confirmación / Comprobante con datos mockeados, diseñada para un contexto de alto volumen con foco en escalabilidad y mantenibilidad. La fuente de verdad funcional es el **alcance de la PoC** descrito en la matriz de trazabilidad. Toda característica y regla derivada se documenta primero como **especificación (SDD)** y después se implementa y prueba referenciando su ID.

---

## 🧭 Principios

* **Vertical slices:** cada feature recorre todas las capas que necesita, y solo esas. Componentes del Design System, modelos y servicios se crean *cuando una feature los requiere*, no por adelantado.
* **Spec primero (SDD):** ninguna línea de código de una feature se escribe antes de que su spec esté en el PR. El primer commit de cada PR de feature es `docs(spec): ...`.
* **Una sola fuente de verdad para las reglas:** los esquemas y reglas de dominio (`src/domain`) son consumidos tanto por la UI como por las API Routes. El servidor siempre revalida.
* **Trazabilidad:** cada regla y criterio de aceptación tiene un ID; los tests lo citan en su `describe`/`it` y el PR lo referencia en la plantilla.
* **Pragmatismo:** resolver de forma simple y extensible, sin sobre-ingeniería.

---

## 🔁 Ciclo SDD por Feature (fases dentro de cada PR)

Cada PR de feature recorre estas fases **en la medida en que la feature las requiera**:

| # | Fase | Entregable | Ubicación |
|---|------|------------|-----------|
| 0 | **Spec** | Características, reglas derivadas, criterios de aceptación, edge cases, contrato de API y estados de UI | `docs/specs/SPEC-<FEATURE>.md` |
| 1 | **Dominio** | Modelos, esquemas Zod y reglas puras (sin React ni Next) + tests unitarios con ID | `src/domain/{models,schemas,rules}` |
| 2 | **Servicio / API** | Repositorio mock en memoria, servicio y Route Handler que revalida con el mismo esquema | `src/server/*`, `src/app/api/*` |
| 3 | **Aplicación** | Custom hooks y/o store (Zustand) que orquestan el flujo; cero JSX | `src/application/{hooks,store}` |
| 4 | **UI** | Componentes del Design System que la feature necesite (CVA) + ensamblaje de la pantalla | `src/ui/{components,features}`, `src/app/**/page.tsx` |
| 5 | **Pruebas** | Unitarias (reglas, hooks, componentes críticos) y E2E del flujo de la feature | junto al código / `tests/e2e` |
| 6 | **Docs** | Decisiones nuevas en `DECISIONS.md`, limitaciones en `README.md`, uso de IA en `AI_USAGE.md` | raíz |

### Definition of Done (por PR de feature)
- [ ] Spec aprobada y enlazada en la descripción del PR (`ID: SPEC-<FEATURE>`).
- [ ] Cada regla `SPEC-<FEATURE>-Rxx` tiene al menos un test unitario que la cita.
- [ ] Cada criterio `SPEC-<FEATURE>-ACxx` está cubierto por un test unitario o E2E.
- [ ] Estados de UI definidos en la spec (carga, vacío, error, éxito) implementados y probados.
- [ ] `pnpm type-check`, `pnpm lint`, `pnpm test` y `pnpm test:e2e` en verde.
- [ ] Commits atómicos, firmados (`-S`) y con Conventional Commits.

### Convención de IDs

| Elemento | Formato | Ejemplo |
|----------|---------|---------|
| Spec | `SPEC-<FEATURE>` | `SPEC-TX` |
| Regla de negocio derivada | `SPEC-<FEATURE>-Rxx` | `SPEC-TX-R01` — monto mayor a cero |
| Criterio de aceptación | `SPEC-<FEATURE>-ACxx` | `SPEC-TX-AC03` — no permite continuar sin destinatario |
| Test | Cita el ID en el título | `describe('[SPEC-TX-R01] monto mínimo', ...)` |

Features: `AUTH` (login y sesión), `HOME` (dashboard), `CT` (contactos), `TX` (nueva transacción), `CONF` (confirmación / comprobante).

### Plantilla de Spec (`docs/specs/_TEMPLATE.md`)

```markdown
# SPEC-<FEATURE> — <Nombre>
## Contexto y alcance           (qué parte del alcance de la PoC cubre la feature)
## Características              (qué hace la feature)
## Reglas derivadas             (SPEC-<FEATURE>-R01..n, cada una verificable)
## Criterios de aceptación      (SPEC-<FEATURE>-AC01..n en formato Dado / Cuando / Entonces)
## Contrato de API              (método, ruta, request, responses por status code)
## Estados de UI                (carga, vacío, error, éxito, y cómo forzarlos en pruebas)
## Edge cases                   (entradas límite y fallos considerados)
## Fuera de alcance
```

---

## 🗺️ Matriz de Trazabilidad (Alcance → Spec → PR)

| Alcance funcional de la PoC | Spec | PR |
|------------------------|------|----|
| Login con teléfono o email, validaciones de formato y requeridos | `SPEC-AUTH` | PR 3 |
| Login: estados de carga y error simulado | `SPEC-AUTH` | PR 3 |
| Persistencia simple de sesión mockeada y navegación al Home | `SPEC-AUTH` | PR 3 |
| Home: saldo disponible + nombre del usuario | `SPEC-HOME` | PR 4 |
| Home: lista de movimientos recientes; estados carga, vacío y error | `SPEC-HOME` | PR 4 |
| Home: botón para iniciar nueva transacción | `SPEC-HOME` | PR 4 |
| Ingresar monto | `SPEC-TX` | PR 5 |
| Seleccionar contacto favorito o ingresar uno nuevo y guardarlo | `SPEC-CT` | PR 5 |
| Mostrar resumen antes de confirmar | `SPEC-TX` | PR 5 |
| Regla: monto mínimo (ni cero ni negativo) | `SPEC-TX-R01` | PR 5 (UI) + PR 6 (API) |
| Regla: saldo suficiente | `SPEC-TX-R02` | PR 5 (UI) + PR 6 (API) |
| Regla: destinatario obligatorio | `SPEC-TX-R03` | PR 5 (UI) + PR 6 (API) |
| Confirmación aleatoria: éxito, error de red, fondos insuficientes, timeout, error desconocido | `SPEC-CONF` | PR 6 |
| Comprobante / pantalla de éxito | `SPEC-CONF` | PR 6 |
| Servicios con API Routes y datos mockeados | todas | PR 3–6 |
| Testing unitario de validaciones, hooks y componentes críticos | todas | PR 3–6 |
| E2E (Playwright) | todas | PR 2 (infra), PR 3–6 (por feature), PR 7 (transversal) |
| README, DECISIONS, AI_USAGE | — | continuo + PR 8 |

---

## 🔄 Flujo de Desarrollo por Pull Requests (PRs)

### PR 1: Cimientos, CI/CD Bloqueante y Arquitectura Base ✅ Completado
* **Objetivo:** infraestructura base, linters estrictos, validaciones pre-commit (Husky) y firmas GPG.
* **Entregado:** Next.js 16 + TypeScript estricto, Tailwind + CVA + `cn.ts`, Jest + jest-dom, configuración de Stryker (paquetes diferidos), Husky + Commitlint + Lint-staged, pipeline de verificación de firmas GPG, plantilla de PR, `.env.example`, layout raíz y página base.

### PR 2: Saneamiento de Cimientos y Andamiaje SDD 🚧 En revisión
* **Objetivo:** corregir los hallazgos de la revisión del PR 1 y dejar lista la infraestructura que todas las features necesitan (specs, E2E).
* **Hallazgos a corregir** (validados con `pnpm build`, `pnpm lint` y `pnpm test`):

| Severidad | Hallazgo | Corrección |
|-----------|----------|------------|
| 🔴 Crítico | Existe una carpeta `app/` vacía en la raíz. Next.js ignora `src/app` si existe `app/` en la raíz: el build solo genera `/404`. | Eliminar `app/` de la raíz; todas las rutas viven en `src/app`. |
| 🔴 Crítico | Tailwind instalado es v4, pero `globals.css` usa directivas v3 (`@tailwind base/components`) y v4 no carga `tailwind.config.ts` automáticamente: `bg-background`, `text-foreground` y los tokens no se generan. | Migrar los tokens a `@theme` en `globals.css` (nativo de v4), restringir el escaneo con `source(none)` + `@source` y eliminar `tailwind.config.ts`. |
| 🔴 Crítico | `pnpm lint` falla: `next lint` ya no existe en Next 16. | Script `"lint": "eslint ."`. |
| 🟠 Alto | Conviven `.eslintrc.json` (legacy) y `eslint.config.mjs` (flat). ESLint 9 solo lee el flat config: las reglas estrictas (`no-explicit-any`, `jsx-no-bind`, prohibición de `style`) **no se están aplicando**. | Migrar las reglas a `eslint.config.mjs` y eliminar `.eslintrc.json`. |
| 🟠 Alto | `pnpm test` termina con código 1 sin tests y el CI fallaría. Además, Jest recogería los `*.spec.ts` de Playwright. | `testPathIgnorePatterns: ['/tests/e2e/']` y `--passWithNoTests` hasta el primer test. |
| 🟠 Alto | Next 16 renombró `middleware.ts` a `proxy.ts`. | La protección de rutas se implementa en `src/proxy.ts` (PR 3). |
| 🟡 Medio | El CI no ejecuta lint ni build, instala pnpm con `npm -g` y sin lockfile congelado. | `pnpm/action-setup`, cache, `pnpm install --frozen-lockfile`, pasos `lint` y `build`. |
| 🟡 Medio | Coexisten `package-lock.json` y `pnpm-lock.yaml`. | Eliminar `package-lock.json`. |
| 🟡 Medio | El pre-commit borra `.next` en cada commit para evitar tipos de rutas obsoletos (pierde la caché de dev). | `"type-check": "next typegen && tsc --noEmit"` y quitar `rm -rf .next`. |
| 🟡 Medio | `next build` reescribe `tsconfig.json` (`jsx: react-jsx`, include `.next/dev/types`). | Commitear el `tsconfig.json` normalizado. |
| 🟡 Medio | `src/domain/specs` (esquemas Zod) choca con el término SDD "spec" (documentos). | Renombrar a `src/domain/schemas`; actualizar plantilla de PR y `stryker.conf.js`. |
| 🟡 Medio | Contradicción de estilos: `globals.css` y el mensaje de ESLint exigen CSS Modules, mientras que `DECISIONS.md` define Tailwind + CVA. | Unificar en Tailwind + CVA encapsulado en `src/ui` (decisión documentada). |
| 🟢 Bajo | `DECISIONS.md` documenta `app/` en la raíz y `middleware`; el árbol real usa `src/app`. | Actualizar el árbol del proyecto. |
| 🟢 Bajo | Assets sobrantes del template (`public/file.svg`, `globe.svg`, `window.svg`). | Eliminar. |
| 🟢 Bajo | `README.md` menciona `pnpm test:e2e`, pero no existe `playwright.config.ts`; bloques de código y sección de scripts mal formateados. | Crear el config (ver abajo) y corregir el formato. |

* **Andamiaje SDD y E2E:**
  * `docs/specs/_TEMPLATE.md` con la plantilla de spec.
  * `playwright.config.ts` con `webServer` (levanta la app) y `baseURL`, para que cada feature agregue sus E2E desde su propio PR.
  * Actualizar `AGENTS.md` para permitir los tipos `fix` y `refactor` (necesarios a partir de las features).
* **Nota:** los archivos no versionados en `src/domain/` (`models/types.ts`, `specs/contact.schema.ts`) no se commitean aquí; se reubican en la feature que los necesita (PR 3–6).

### PR 3: Feature — Autenticación (Login) y Protección de Rutas · `SPEC-AUTH`
* **Objetivo:** flujo de entrada a la aplicación con sesión mockeada y rutas privadas.
* **Spec (reglas derivadas a documentar):** identificador obligatorio; válido si es email o teléfono de 10 dígitos; normalización (trim, minúsculas en email, sin espacios ni prefijo `+52` en teléfono); error simulado determinista para pruebas; redirección a `/` tras login exitoso; acceso a `/login` con sesión activa redirige a `/`.
* **Entregables:**
  * Dominio: modelos `User` y `Session`; `loginSchema` (Zod) con tests `[SPEC-AUTH-Rxx]`.
  * API: `POST /api/auth` valida con el mismo esquema, simula latencia y asigna la cookie httpOnly `mini-wallet-session`; `DELETE /api/auth` (logout).
  * `src/proxy.ts`: chequeo optimista de la cookie que protege `/` y `/transfer/*` y redirige a `/login`. Los Route Handlers revalidan la sesión (el proxy no es la única barrera).
  * Aplicación: hook `useLoginFlow` (estado idle / loading / error / success y navegación).
  * UI: componentes DS `Button`, `Input`, `FormField` (CVA) y `LoginForm`.
  * Tests: esquema, hook, `LoginForm`; E2E de login exitoso, error de validación, error simulado y redirección sin sesión.

### PR 4: Feature — Dashboard (Home) · `SPEC-HOME`
* **Objetivo:** visualizar el estado de cuenta con manejo asíncrono y responsivo.
* **Spec (reglas derivadas a documentar):** montos en unidades menores (centavos, enteros) para evitar errores de punto flotante; formato de moneda con `Intl.NumberFormat`; orden de movimientos (más recientes primero) y límite de recientes; distinción entre cargo y abono; cómo forzar los estados vacío y error en pruebas.
* **Entregables:**
  * Dominio: `Money` (centavos) + `formatMoney`; modelo `Movement` (dirección, monto, contraparte, fecha, estado).
  * Servicio: repositorio en memoria con usuarios semilla (uno con movimientos y otro sin ellos) y servicio `getWalletSummary(userId)`.
  * API: `GET /api/wallet` (usuario, saldo y movimientos recientes) para refrescos desde el cliente.
  * Renderizado: la página es un Server Component que invoca el servicio directamente (sin hacer fetch a su propia API) dentro de `<Suspense>`; `loading.tsx` con Skeleton y `error.tsx` con reintento. Con `cacheComponents` habilitado, la lectura de `cookies()` queda dentro del límite de Suspense.
  * UI: `Card`, `Skeleton`, `EmptyState`, `ErrorState`, `BalanceCard`, `MovementList` y CTA "Nueva transacción" → `/transfer`.
  * Tests: formateo y orden de movimientos, componentes de lista y estados; E2E del Home con datos, vacío y error.

### PR 5: Feature — Nueva Transacción y Contactos · `SPEC-TX` + `SPEC-CT`
* **Objetivo:** capturar monto y destinatario y mostrar el resumen antes de confirmar.
* **Spec (reglas derivadas a documentar):**
  * `SPEC-TX-R01` monto mayor a cero; `SPEC-TX-R02` monto menor o igual al saldo disponible (igual al saldo está permitido); `SPEC-TX-R03` destinatario obligatorio.
  * Parseo del monto: máximo 2 decimales; se rechazan texto, vacío y notación científica; se acepta coma o punto como separador decimal.
  * Contactos: campos obligatorios y formato de cuenta (tarjeta de 16 dígitos o CLABE de 18); duplicados por cuenta; un contacto nuevo queda guardado en favoritos.
  * Al refrescar el resumen sin borrador en el store se redirige a `/transfer`.
* **Entregables:**
  * Dominio: `parseAmount`, `validateTransfer(draft, balance)` y `contactSchema` (se reubica el archivo existente), con tests `[SPEC-TX-Rxx]` y `[SPEC-CT-Rxx]`.
  * API: `GET /api/contacts` y `POST /api/contacts` (revalida y guarda en memoria).
  * Estado: store Zustand `useTransferStore` (borrador: monto, destinatario, `idempotencyKey`) con selectores atómicos y `reset` al finalizar; hook `useTransferFlow`.
  * Rutas: `/transfer` (monto + selección o alta de contacto) → `/transfer/review` (resumen).
  * UI: `AmountInput`, `ContactList`, `NewContactForm` y `TransferSummary`.
  * Tests: reglas, store, hook y formularios; E2E de captura, alta de contacto y bloqueo por cada regla.

### PR 6: Feature — Confirmación, Motor de Caos y Comprobante · `SPEC-CONF`
* **Objetivo:** el núcleo técnico de la PoC: procesar la transferencia simulando los 5 escenarios y reaccionar correctamente a cada uno.
* **Spec (reglas derivadas a documentar):**
  * El servidor revalida `SPEC-TX-R01..R03` contra el saldo real antes de procesar.
  * Mapeo de escenarios: `SUCCESS` → 201 + comprobante; `INSUFFICIENT_FUNDS` → 422 con mensaje descriptivo; `UNKNOWN_ERROR` → 500 con fallback genérico; `NETWORK_ERROR` → 503 simulado (el cliente también trata un fallo de `fetch` como error de red); `TIMEOUT` → el servidor demora más que `NEXT_PUBLIC_TIMEOUT_MS` y el cliente aborta con `AbortController`.
  * Idempotencia: el header `Idempotency-Key` hace que un reintento devuelva el mismo resultado sin cobrar dos veces (crítico tras un timeout, donde el estado real es incierto).
  * Solo `SUCCESS` descuenta saldo y registra el movimiento (el Home lo refleja).
  * Doble envío bloqueado mientras la solicitud está en vuelo.
* **Entregables:**
  * Dominio: `TransactionResult` como unión discriminada por `status`, de modo que el comprobante solo exista en `SUCCESS` y el error solo en los fallos.
  * API: `POST /api/transactions` con Chaos Engine aleatorio (pesos configurables); el header `x-mock-scenario` fuerza un escenario solo si `ENABLE_TEST_SCENARIOS=true`.
  * Aplicación: hook `useConfirmTransfer` (timeout, reintento con la misma `Idempotency-Key`, mapeo de errores).
  * UI: `/transfer/status` con renderizado condicional: `Receipt` (comprobante), `ErrorState` con reintentar (red y timeout), error descriptivo con opción de editar el monto (fondos insuficientes) y fallback genérico.
  * Tests: motor de caos con escenario forzado, idempotencia, hook (todos los escenarios) y `Receipt`; E2E de los 5 escenarios vía `x-mock-scenario`.

### PR 7: Pruebas E2E Transversales y Resiliencia
* **Objetivo:** validar el recorrido completo como un usuario real, por encima de los E2E de cada feature.
* **Entregables:**
  * *Happy path* completo: Login → Home → Nueva Transacción → Resumen → Comprobante → Home con saldo y movimiento actualizados.
  * Resiliencia: interceptación de peticiones (`page.route`) y `x-mock-scenario` para validar la recuperación de la UI ante caídas de red, timeouts y reintentos.
  * Opcional: instalar Stryker y publicar el umbral de mutación sobre `src/domain` y `src/application/hooks`.

### PR 8: Cierre Documental y Evolución
* **Objetivo:** consolidar la documentación de la PoC para su operación y evolución.
* **Entregables:**
  * `README.md`: instrucciones para levantar el proyecto, scripts, librerías usadas y limitaciones conocidas.
  * `DECISIONS.md`: justificación de la estructura, separación UI / lógica de negocio, renderizado por página (SSR/CSR), elección de estado, **edge cases considerados** (consolidados desde las specs) y **qué se haría diferente con más tiempo**.
  * `AI_USAGE.md`: herramientas usadas (Gemini, Claude Code) y en qué partes; qué se aceptó, corrigió o rechazó; qué decisiones fueron propias.
  * Roadmap futuro: observabilidad (Datadog, Mixpanel), Core Web Vitals y calidad/seguridad (SonarCloud, Snyk).

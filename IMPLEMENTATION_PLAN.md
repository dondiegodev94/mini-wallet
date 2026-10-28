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
| Regla: monto mínimo (ni cero ni negativo) | `SPEC-TX-R01` · `SPEC-CONF-R01` | PR 5 (dominio + UI) + PR 6 (API) |
| Regla: saldo suficiente | `SPEC-TX-R02` · `SPEC-CONF-R01/R02` | PR 5 (dominio + UI) + PR 6 (API) |
| Regla: destinatario obligatorio | `SPEC-TX-R08` · `SPEC-CONF-R01` | PR 5 (dominio + UI) + PR 6 (API) |
| Captura del monto con formato de moneda | `SPEC-TX-R03..R07` | PR 5 |
| Contactos por celular, tarjeta o CLABE con máscara y solo dígitos | `SPEC-CT-R02..R04` · `SPEC-CT-R11..R12` | PR 5 |
| Transferencia sin duplicados (`Idempotency-Key`) | `SPEC-TX-R13` · `SPEC-CONF-R03..R08` | PR 5 (clave del borrador) + PR 6 (API) |
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

### PR 2: Saneamiento de Cimientos y Andamiaje SDD ✅ Completado
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

### PR 3: Feature — Autenticación (Login) y Protección de Rutas · [`SPEC-AUTH`](docs/specs/SPEC-AUTH.md) ✅ Completado
* **Objetivo:** flujo de entrada a la aplicación con sesión mockeada y rutas privadas.
* **Spec (reglas derivadas):** identificador obligatorio; válido si es email o teléfono de 10 dígitos; normalización (trim, minúsculas en email, sin espacios ni prefijo `+52` en teléfono); error simulado determinista (`error@miniwallet.dev`); sesión firmada de 30 minutos; páginas privadas por defecto; `/login` con sesión activa redirige a `/`.
* **Entregables:**
  * Dominio: modelos `User` y `Session`; `loginSchema` (Zod); contratos `apiErrorBodySchema` y `loginResponseSchema`.
  * Servidor: variables de entorno validadas, token de sesión HMAC, repositorio de usuarios semilla y servicio `authenticate`.
  * API: `POST /api/auth` valida con el mismo esquema, simula latencia y asigna la cookie httpOnly `mini-wallet-session`; `DELETE /api/auth` (logout).
  * `src/proxy.ts`: privado por defecto (solo `/login` es pública); verifica la firma de la cookie y redirige.
  * Aplicación: cliente `requestJson` (timeout + validación de contrato) y hook `useLoginFlow` (idle / submitting / error / success, sin doble envío).
  * UI: componentes DS `Button`, `Input`, `TextField`, `Alert` y `Card` (CVA); `AuthLayout` y `LoginForm`; contenedor `LoginScreen`.
  * Tests: 84 unitarios (esquema, sesión, servicio, Route Handler, proxy, cliente HTTP, hook y componentes) y 14 E2E (escritorio y móvil). E2E integrados al CI.

### PR 4: Feature — Dashboard (Home) · [`SPEC-HOME`](docs/specs/SPEC-HOME.md) ✅ Completado
* **Objetivo:** visualizar el estado de cuenta con manejo asíncrono y responsivo.
* **Spec (reglas derivadas):** montos en centavos enteros; formato MXN `es-MX`; signo y texto accesible según cargo/abono; orden del más reciente al más antiguo y límite de 10; fechas en `America/Mexico_City`; resumen solo del usuario de la sesión; escenario `WALLET_UNAVAILABLE`; sin "Nueva transacción" ante error; cierre de sesión.
* **Entregables:**
  * Dominio: modelos `Movement` y `WalletSummary`; regla `selectRecentMovements`; contrato `walletSummarySchema`.
  * Servidor: sesión actual (`getCurrentSession` con `connection()`), escenarios `x-mock-scenario`, repositorio de cuentas semilla (Ana con 12 movimientos, Luis sin movimientos) y servicio `getWalletSummary`.
  * API: `GET /api/wallet` (`401` sin sesión, `503` con el escenario simulado), listo para el flujo de transferencia.
  * Renderizado: route group `(private)` con layout común (encabezado + "Cerrar sesión") y `error.tsx` con `retry()`; Home en *Partial Prerender* con `<Suspense>` y `WalletSkeleton`; el Server Component invoca el servicio directamente.
  * Aplicación: hook `useLogout`.
  * UI: `Skeleton`, `EmptyState`, `ErrorState`, `ButtonLink` y variantes `secondary`/`ghost` de `Button`; `BalanceCard`, `MovementList`, `WalletDashboard`, `WalletSkeleton`, `AppShell` y `LogoutControl`; formateadores de moneda y fecha.
  * Tests: 136 unitarios en total y 28 E2E (escritorio y móvil) con datos, vacío, carga, error con recuperación, CTA, cierre de sesión y ausencia de scroll horizontal.

### PR 5: Feature — Nueva Transacción y Contactos · [`SPEC-TX`](docs/specs/SPEC-TX.md) + [`SPEC-CT`](docs/specs/SPEC-CT.md) 🚧 En revisión
* **Objetivo:** capturar monto y destinatario y mostrar el resumen antes de confirmar.
* **Spec (reglas derivadas):**
  * Monto mayor a cero y menor o igual al saldo (igual está permitido); destinatario obligatorio y propio del usuario; concepto opcional de hasta 40 caracteres.
  * Captura con formato de moneda en vivo: centavos enteros convertidos desde la cadena (sin punto flotante); solo dígitos y punto decimal (la coma es separador de miles en `es-MX`); máximo 2 decimales y 7 dígitos enteros; un cambio que exceda los límites se descarta completo.
  * Contactos por celular (10 dígitos), tarjeta (16, Luhn) o CLABE (18, dígito de control), con máscara por tipo (`2·4·4`, `4·4·4·4`, `3·3·4·4·4`) y solo dígitos; nombre de 3 a 60 caracteres; banco de catálogo; duplicados detectados en el API; la cuenta completa nunca vuelve al cliente.
  * Borrador en memoria con `idempotencyKey` que se regenera al editar y se descarta (antes de navegar) al cancelar, terminar o cerrar sesión; al refrescar el resumen sin borrador se redirige a `/transfer`.
* **Entregables:**
  * Dominio: `sanitizeAmountInput`, `formatAmountInput`, `parseAmountToCents`, `validateTransfer(draft, balance)`, reglas de cuenta (máscara, Luhn, CLABE), `contactInputSchema`, catálogo `BANKS` y `formatMoney` (se mueve desde la UI).
  * API: `GET /api/contacts` y `POST /api/contacts` (revalida con el mismo esquema, detecta duplicados y guarda en memoria por usuario).
  * Estado: store Zustand `useTransferStore` (borrador + `idempotencyKey`) con selectores atómicos y `reset`; hooks `useTransferForm`, `useRecipientPicker`, `useCreateContact` y `useTransferReview`; `useLogout` descarta el borrador y recarga el documento.
  * Rutas: `/transfer` (Partial Prerender: saldo y contactos en servidor) → `/transfer/review` (resumen) dentro de `(private)`.
  * UI: `MaskedField`, `SegmentedControl` y `SelectField` en el Design System; `ContactList`, `NewContactForm`, `RecipientSection`, `TransferForm`, `TransferSummary` y `TransferSkeleton`.
  * Tests: reglas, store, hooks y formularios; E2E de formato y cursor, máscaras, alta y duplicado de contacto, bloqueo por cada regla, edición, recarga, cancelación, aislamiento entre usuarios y cierre de sesión con borrador.

### PR 6: Feature — Confirmación, Motor de Caos y Comprobante · [`SPEC-CONF`](docs/specs/SPEC-CONF.md) (spec redactada con el PR 5)
* **Objetivo:** el núcleo técnico de la PoC: procesar la transferencia simulando los 5 escenarios y reaccionar correctamente a cada uno.
* **Spec (reglas derivadas):**
  * El servidor revalida sesión, `Idempotency-Key`, esquema, destinatario propio y saldo real, en ese orden y antes de cualquier efecto; verificación de saldo y cargo en un bloque atómico.
  * Idempotencia por usuario y clave con huella del cuerpo: repetición → mismo `201` con `Idempotent-Replayed: true`; misma clave con otro contenido → `422`; solicitudes concurrentes con la misma clave → *single-flight*; solo se almacena el éxito (24 h en memoria).
  * Mapeo de escenarios: `SUCCESS` → 201 + comprobante; `INSUFFICIENT_FUNDS` → 422 con mensaje descriptivo; `UNKNOWN_ERROR` → 500 con fallback genérico; `NETWORK_ERROR` → 503 simulado (el cliente también trata un fallo de `fetch` como error de red); `TIMEOUT` → el servidor **procesa con éxito** pero responde después de `NEXT_PUBLIC_TIMEOUT_MS`, el cliente aborta y el reintento con la misma clave recupera el comprobante sin cobrar dos veces.
  * Solo un éxito descuenta saldo y registra el movimiento (el Home lo refleja).
  * Doble envío bloqueado en tres capas: botón, `inFlight` e idempotencia en servidor.
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

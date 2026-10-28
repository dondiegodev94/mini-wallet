# 🛠️ Decisiones de Arquitectura y Stack Tecnológico

Este documento registra los trade-offs y decisiones técnicas tomadas para cumplir con los requerimientos de escalabilidad, mantenibilidad y pragmatismo de la PoC. Se complementan algunas decisiones tomadas documentadas en el AI_USAGE.md para las decisiones que se tomaron sin la ayuda de la AI

## 1. Enrutamiento y Renderizado: App Router (Next.js)
**Decisión:** Uso de `app/` para combinar Server Components (SSR) y Client Components (CSR).
**Justificación:** El `Home` (saldo y usuario) se beneficia de SSR para carga inicial rápida, mientras que la `Nueva Transacción` es altamente interactiva y requiere CSR puro.

## 2. Gestión del Estado: Zustand
**Decisión:** Elegido sobre Context API o Redux.
**Justificación:** Zustand evita re-renders innecesarios mediante suscripciones atómicas y permite desacoplar la lógica de estado en *Custom Hooks* (ej. `useTransferFlow`) fuera del árbol de React, cumpliendo con los principios SOLID y manteniendo los componentes de UI limpios.

## 3. Servicios: API Routes como BFF (Backend-For-Frontend)
**Decisión:** Simular el backend mediante Route Handlers (`app/api/`).
**Justificación:** Las reglas de negocio (monto mínimo, fondos, etc.) deben validarse en un entorno seguro, no solo en la UI. Además, el backend es el lugar ideal para centralizar el motor de aleatoriedad para la pantalla de confirmación.

## 4. Diseño y UI: "Enterprise Tailwind" (Tailwind CSS v4 + CVA)
**Decisión:** Utilizar Tailwind CSS, pero restringir su uso estrictamente a la capa de abstracción del Design System (`src/ui/components`). No se usan CSS Modules ni estilos inline (bloqueados por ESLint).
**Justificación:** Se busca el pragmatismo y la velocidad de desarrollo que ofrece Tailwind, pero evitando la "sopa de clases" en la lógica de negocio. Las pantallas de la aplicación consumen componentes limpios controlados por `class-variance-authority` (CVA), garantizando que si se cambia de framework CSS en el futuro, la refactorización se limite a una sola carpeta.
**Tokens:** con Tailwind v4 los Design Tokens se declaran en CSS mediante `@theme` en `src/app/globals.css` (fuente única de verdad, sin `tailwind.config.ts`). El escaneo de clases se restringe con `source(none)` + `@source` a `src/app` y `src/ui`.

## 5. Estrategia de Testing (Aleatoriedad vs Determinismo)
**Decisión:** Jest (Unitario) + Playwright (E2E).
**Justificación:** Para resolver el problema de testear una pantalla de confirmación 100% aleatoria, el API mockeado acepta un header `x-mock-scenario` (inyectado por Playwright) que fuerza un escenario específico (ej. Timeout o Fondos Insuficientes) durante las pruebas, garantizando pruebas robustas sin *flakiness*.

## 6. Estructura de Directorios (Arquitectura Desacoplada)

La estructura del proyecto sigue una arquitectura basada en capas funcionales. El objetivo principal es aislar el Dominio (reglas de negocio) y la Aplicación (estado y flujos) de la capa de Presentación (UI) y de la Infraestructura (API Routes).

### Árbol del Proyecto

> **Nota:** todas las rutas viven en `src/app`. Next.js ignora `src/app` si existe una carpeta `app/` en la raíz, por lo que esta no debe crearse.

```text
📦 mini-wallet
┣ 📂 .github
┃ ┣ 📂 workflows
┃ ┃ ┗ 📜 ci.yml                     # Firmas GPG, type-check, lint, tests y build
┃ ┗ 📜 pull_request_template.md     # Checklist obligatorio para PRs (Clean Code, Tests, Tokens)
┣ 📂 docs
┃ ┗ 📂 specs                        # 📐 Especificaciones SDD por feature (reglas y criterios con ID)
┃   ┗ 📜 _TEMPLATE.md
┣ 📂 src
┃ ┣ 📂 app                          # 🌐 Infraestructura (Next.js App Router)
┃ ┃ ┣ 📂 api                        # Backend For Frontend (Route Handlers con datos mock)
┃ ┃ ┃ ┣ 📂 auth/route.ts            # Login / logout y cookie de sesión mockeada
┃ ┃ ┃ ┣ 📂 wallet/route.ts          # Saldo y movimientos recientes
┃ ┃ ┃ ┣ 📂 contacts/route.ts        # Listado y alta de contactos
┃ ┃ ┃ ┗ 📂 transactions/route.ts    # Motor de caos (Éxito, Red, Fondos, Timeout, Genérico)
┃ ┃ ┣ 📂 login/page.tsx             # Shell SSR + formulario cliente (useLoginFlow)
┃ ┃ ┣ 📂 transfer
┃ ┃ ┃ ┣ 📜 page.tsx                 # Monto + selección/alta de contacto (CSR, Zustand)
┃ ┃ ┃ ┣ 📂 review/page.tsx          # Resumen antes de confirmar
┃ ┃ ┃ ┗ 📂 status/page.tsx          # Renderizado condicional de comprobante o errores
┃ ┃ ┣ 📜 globals.css                # Design Tokens (@theme de Tailwind v4)
┃ ┃ ┣ 📜 layout.tsx                 # Layout global
┃ ┃ ┗ 📜 page.tsx                   # Home (SSR + Suspense): saldo y movimientos
┃ ┣ 📜 proxy.ts                     # Protección optimista de rutas privadas (antes "middleware" en Next < 16)
┃ ┣ 📂 domain                       # Capa 1: Reglas de Negocio (cero dependencias de React/Next)
┃ ┃ ┣ 📂 models                     # Tipos estables (User, Movement, Contact, TransactionResult)
┃ ┃ ┣ 📂 schemas                    # Esquemas Zod (login, contacto, transferencia)
┃ ┃ ┗ 📂 rules                      # Reglas puras (monto > 0, saldo suficiente, destinatario)
┃ ┣ 📂 server                       # Servicios y repositorios mock en memoria (solo servidor)
┃ ┣ 📂 application                  # Capa 2: Casos de Uso y Estado (Zustand + Custom Hooks)
┃ ┃ ┣ 📂 hooks                      # "Smart" Hooks (useLoginFlow, useTransferFlow) - Zero UI
┃ ┃ ┗ 📂 store                      # Tiendas Zustand (useTransferStore para aislar re-renders)
┃ ┗ 📂 ui                           # Capa 3: Design System y Componentes (Token-Driven)
┃   ┣ 📂 components                 # "Dumb" Components genéricos (Button, Input, Card…) con CVA
┃   ┣ 📂 features                   # Ensamblajes UI complejos (MovementList, TransferSummary…)
┃   ┗ 📂 utils
┃     ┗ 📜 cn.ts                    # Utilidad core para combinar Tailwind y CVA
┣ 📂 tests
┃ ┗ 📂 e2e                          # Playwright (los unitarios viven junto al código: *.test.ts)
┣ 📜 IMPLEMENTATION_PLAN.md
┣ 📜 README.md
┣ 📜 DECISIONS.md
┣ 📜 AI_USAGE.md
┣ 📜 playwright.config.ts
┣ 📜 stryker.conf.js                # Configuración de Mutation Testing
┣ 📜 jest.config.js
┗ 📜 package.json
```

### Justificación de la Estructura

*   **Aislamiento del Dominio (`src/domain/`)**: Toda la validación requerida por el negocio (monto mínimo, saldo suficiente y destinatario obligatorio) reside como esquemas abstractos (`Zod`) en la capa de dominio. Esto permite que tanto el frontend (`src/application/hooks`) como el backend simulado (`app/api/`) consuman **exactamente la misma fuente de verdad**, garantizando consistencia y evitando duplicación de código.
*   **Hooks Inteligentes, Componentes Tontos (`src/application/` vs `src/ui/`)**: La carpeta `ui/` tiene prohibido importar de `api/` o ejecutar lógica de validación. La pantalla de confirmación, que debe reaccionar a 5 escenarios distintos, simplemente renderiza propiedades (props). Es el hook `useTransferFlow` (`application/`) quien orquesta la llamada asíncrona, intercepta los errores y alimenta la UI.
*   **Design System Aislado (`src/ui/components` y `@theme` en `globals.css`)**: Al centralizar los estilos en Tailwind pero limitando su uso a componentes base envueltos con CVA (`class-variance-authority`), garantizamos un renderizado predecible. Si cambian los lineamientos de diseño, solo se modifica la configuración de Tailwind o los archivos base en `ui/components/`, mitigando drásticamente el riesgo de inyectar bugs lógicos por un cambio estético y manteniendo las vistas de la aplicación completamente limpias.

## 7. Estrategia de Calidad y Seguridad en Commits (Iniciativa Propia)
**Decisión:** Implementación de un flujo estricto de control de versiones utilizando Husky, Commitlint, Lint-Staged y validación de firmas GPG en el Pipeline.
**Justificación:** Por decisión analítica propia (no indispensable para una PoC, pero crucial en entornos de alto volumen con millones de usuarios), se definió una barrera de contención local y remota:
* **Commitlint & Husky:** Obliga al uso de Conventional Commits y ejecuta `type-check`, linter y pruebas unitarias automáticas mediante un `pre-commit` hook. Esto evita que código que no compila o rompe pruebas llegue siquiera al repositorio remoto.
* **Firmas GPG Bloqueantes:** Para garantizar el no repudio y la integridad del código financiero, se configuró el pipeline de GitHub Actions para fallar y bloquear cualquier Pull Request que contenga commits no verificados criptográficamente.

## 8. Metodología: Specification-Driven Development por Feature
**Decisión:** Entregar la aplicación en *vertical slices* (una feature completa por PR) y documentar cada feature como especificación (`docs/specs/SPEC-<FEATURE>.md`) antes de implementarla.
**Justificación:** Cada elemento del alcance de la PoC se traduce en reglas derivadas (`SPEC-<FEATURE>-Rxx`) y criterios de aceptación (`SPEC-<FEATURE>-ACxx`) con ID. Los tests citan esos IDs, lo que da trazabilidad completa: Alcance → Spec → Código → Test. Construir por feature (en lugar de por capa) evita crear componentes, modelos o servicios que ninguna pantalla consume todavía. El detalle del ciclo está en `IMPLEMENTATION_PLAN.md`.

# 🛠️ Decisiones de Arquitectura y Stack Tecnológico

Este documento registra los trade-offs y decisiones técnicas tomadas para cumplir con los requerimientos de escalabilidad, mantenibilidad y pragmatismo de la PoC. Se complementan algunas decisiones tomadas documentadas en el AI_USAGE.md para las decisiones que se tomaron sin la ayuda de la AI

## 1. Enrutamiento y Renderizado: App Router (Next.js)
**Decisión:** Uso de `src/app/` para combinar Server Components (SSR) y Client Components (CSR), con Cache Components y Partial Prerendering de Next.js 16.
**Justificación por página:**
* **Login:** shell estático prerenderizado + formulario como Client Component (la interacción es 100% del cliente).
* **Home:** *Partial Prerender*. El encabezado y el skeleton se sirven como HTML estático instantáneo y el resumen (que depende de la cookie de sesión) se renderiza en el servidor y llega por *streaming* dentro de `<Suspense>`. El usuario ve estructura de inmediato y nunca recibe datos de otra sesión desde una caché.
* **Nueva Transacción:** altamente interactiva; CSR con estado en Zustand.

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
┃ ┃ ┣ 📂 login
┃ ┃ ┃ ┣ 📜 page.tsx                 # Shell estático (Server Component)
┃ ┃ ┃ ┗ 📂 _components              # Contenedores cliente: conectan hooks con componentes tontos
┃ ┃ ┃   ┗ 📜 LoginScreen.tsx
┃ ┃ ┣ 📂 (private)                  # Route group: páginas autenticadas (no altera la URL)
┃ ┃ ┃ ┣ 📜 layout.tsx               # Encabezado común con "Cerrar sesión"
┃ ┃ ┃ ┣ 📜 error.tsx                # Estado de error con reintento; el encabezado sigue visible
┃ ┃ ┃ ┣ 📜 page.tsx                 # Home (Partial Prerender + Suspense): saldo y movimientos
┃ ┃ ┃ ┣ 📂 _components              # WalletOverview (Server Component), LogoutButton (cliente)
┃ ┃ ┃ ┗ 📂 transfer
┃ ┃ ┃   ┣ 📜 page.tsx               # Monto + selección/alta de contacto (CSR, Zustand)
┃ ┃ ┃   ┣ 📂 review/page.tsx        # Resumen antes de confirmar
┃ ┃ ┃   ┗ 📂 status/page.tsx        # Renderizado condicional de comprobante o errores
┃ ┃ ┣ 📜 globals.css                # Design Tokens (@theme de Tailwind v4)
┃ ┃ ┗ 📜 layout.tsx                 # Layout global
┃ ┣ 📜 proxy.ts                     # Páginas privadas por defecto; verifica la cookie firmada (antes "middleware")
┃ ┣ 📂 domain                       # Capa 1: Reglas de Negocio (cero dependencias de React/Next)
┃ ┃ ┣ 📂 contracts                  # Contratos de la API validados con Zod (errores, respuestas)
┃ ┃ ┣ 📂 models                     # Tipos estables (User, Session, Movement, Contact…)
┃ ┃ ┣ 📂 schemas                    # Esquemas Zod (login, contacto, transferencia)
┃ ┃ ┗ 📂 rules                      # Reglas puras (monto > 0, saldo suficiente, destinatario)
┃ ┣ 📂 server                       # Solo servidor (`server-only`): nunca se empaqueta en el cliente
┃ ┃ ┣ 📂 auth                       # Token de sesión firmado y servicio de autenticación
┃ ┃ ┣ 📂 config                     # Variables de entorno validadas con Zod
┃ ┃ ┣ 📂 http                       # Respuestas de error homogéneas para los Route Handlers
┃ ┃ ┣ 📂 mock                       # Latencia y escenarios simulados (x-mock-scenario)
┃ ┃ ┣ 📂 users                      # Repositorio de usuarios semilla
┃ ┃ ┗ 📂 wallet                     # Repositorio de cuentas y servicio de resumen
┃ ┣ 📂 application                  # Capa 2: Casos de Uso y Estado (Zustand + Custom Hooks)
┃ ┃ ┣ 📂 http                       # Cliente HTTP con timeout y validación de contratos
┃ ┃ ┣ 📂 hooks                      # "Smart" Hooks (useLoginFlow, useTransferFlow) - Zero UI
┃ ┃ ┗ 📂 store                      # Tiendas Zustand (useTransferStore para aislar re-renders)
┃ ┗ 📂 ui                           # Capa 3: Design System y Componentes (Token-Driven)
┃   ┣ 📂 components                 # "Dumb" Components genéricos (Button, Input, Card, Skeleton…) con CVA
┃   ┣ 📂 features                   # Ensamblajes UI por feature (auth, home, layout)
┃   ┗ 📂 utils
┃     ┣ 📜 cn.ts                    # Utilidad core para combinar Tailwind y CVA
┃     ┗ 📜 format.ts                # Moneda (MXN, es-MX) y fechas (America/Mexico_City)
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
*   **Hooks Inteligentes, Componentes Tontos (`src/application/` vs `src/ui/`)**: La carpeta `ui/` tiene prohibido importar de `api/`, de `application/` o ejecutar lógica de validación. La unión entre ambos ocurre en contenedores cliente dentro de `_components` de cada ruta (ej. `LoginScreen` invoca `useLoginFlow` y pasa props a `LoginForm`). La pantalla de confirmación, que debe reaccionar a 5 escenarios distintos, simplemente renderiza propiedades (props). Es el hook `useTransferFlow` (`application/`) quien orquesta la llamada asíncrona, intercepta los errores y alimenta la UI.
*   **Design System Aislado (`src/ui/components` y `@theme` en `globals.css`)**: Al centralizar los estilos en Tailwind pero limitando su uso a componentes base envueltos con CVA (`class-variance-authority`), garantizamos un renderizado predecible. Si cambian los lineamientos de diseño, solo se modifica la configuración de Tailwind o los archivos base en `ui/components/`, mitigando drásticamente el riesgo de inyectar bugs lógicos por un cambio estético y manteniendo las vistas de la aplicación completamente limpias.

## 7. Estrategia de Calidad y Seguridad en Commits (Iniciativa Propia)
**Decisión:** Implementación de un flujo estricto de control de versiones utilizando Husky, Commitlint, Lint-Staged y validación de firmas GPG en el Pipeline.
**Justificación:** Por decisión analítica propia (no indispensable para una PoC, pero crucial en entornos de alto volumen con millones de usuarios), se definió una barrera de contención local y remota:
* **Commitlint & Husky:** Obliga al uso de Conventional Commits y ejecuta `type-check`, linter y pruebas unitarias automáticas mediante un `pre-commit` hook. Esto evita que código que no compila o rompe pruebas llegue siquiera al repositorio remoto.
* **Firmas GPG Bloqueantes:** Para garantizar el no repudio y la integridad del código financiero, se configuró el pipeline de GitHub Actions para fallar y bloquear cualquier Pull Request que contenga commits no verificados criptográficamente.

## 8. Metodología: Specification-Driven Development por Feature
**Decisión:** Entregar la aplicación en *vertical slices* (una feature completa por PR) y documentar cada feature como especificación (`docs/specs/SPEC-<FEATURE>.md`) antes de implementarla.
**Justificación:** Cada elemento del alcance de la PoC se traduce en reglas derivadas (`SPEC-<FEATURE>-Rxx`) y criterios de aceptación (`SPEC-<FEATURE>-ACxx`) con ID. Los tests citan esos IDs, lo que da trazabilidad completa: Alcance → Spec → Código → Test. Construir por feature (en lugar de por capa) evita crear componentes, modelos o servicios que ninguna pantalla consume todavía. El detalle del ciclo está en `IMPLEMENTATION_PLAN.md`.

## 9. Sesión: Cookie Firmada sin Estado
**Decisión:** La sesión es un token `payload.firma` (HMAC-SHA256 con `SESSION_SECRET`) guardado en la cookie `httpOnly` `mini-wallet-session`, con expiración de 30 minutos. No se usa un almacén de sesiones en memoria.
**Justificación:** Un `Map` en memoria se pierde con cada reinicio o recarga en caliente del servidor y no se comparte entre instancias, lo que en un entorno de alto volumen obliga a sesiones "pegajosas". Un token firmado se verifica en cualquier instancia (proxy, Route Handlers, Server Components) sin consultar estado compartido. Se usa `node:crypto` con comparación en tiempo constante (`timingSafeEqual`) porque el proxy de Next.js 16 corre en el runtime de Node.js. **Trade-off:** no se puede revocar una sesión individual antes de su expiración; en producción se complementaría con una lista de revocación o un almacén de sesiones distribuido.

## 10. Protección de Rutas: Privado por Defecto
**Decisión:** `src/proxy.ts` corre en todas las páginas (excepto API Routes y assets estáticos) y solo `/login` es pública.
**Justificación:** Con una lista de rutas protegidas, cada página nueva queda expuesta hasta que alguien recuerde agregarla. Invertir la regla hace que el olvido falle de forma segura. El proxy solo realiza un chequeo optimista (verifica la firma de la cookie, sin consultar datos); los Route Handlers privados revalidan la sesión antes de acceder a los datos.

## 11. Contratos HTTP Validados en el Cliente
**Decisión:** El cliente consume el BFF con rutas relativas (`/api/...`) mediante `requestJson`, que aplica timeout con `AbortController` y valida la respuesta con el esquema Zod del contrato (`src/domain/contracts`). Los errores se modelan como una unión discriminada (`http`, `timeout`, `network`, `unexpected-response`).
**Justificación:** Un `fetch` con cast (`as T`) acepta en silencio respuestas que no cumplen el contrato. Validar en la frontera convierte esos casos en un estado de error explícito que la UI sabe mostrar, y la unión discriminada obliga a los hooks a tratar cada tipo de fallo. Como el BFF vive en el mismo origen, no se necesita una URL base (`NEXT_PUBLIC_API_URL` se eliminó).

## 12. Montos en Centavos Enteros
**Decisión:** Todo monto viaja y se almacena como entero en centavos (`balanceCents`, `amountCents`); el contrato Zod rechaza decimales. La conversión a pesos ocurre solo al formatear en la UI (`Intl.NumberFormat` `es-MX`/`MXN`).
**Justificación:** La aritmética de punto flotante produce errores de redondeo (`0.1 + 0.2 !== 0.3`) inaceptables en un saldo. Con enteros, sumas y restas son exactas, y el signo de un movimiento lo da su tipo (`DEBIT`/`CREDIT`), no el número.

## 13. Estados Asíncronos del Home: Suspense + Error Boundary
**Decisión:** La carga se expresa con `<Suspense fallback={<WalletSkeleton />}>` y los fallos con `error.tsx` del route group `(private)`, usando `retry()` de Next.js 16 para volver a solicitar los datos. Las páginas privadas comparten un layout con el encabezado y "Cerrar sesión".
**Justificación:** El componente que obtiene datos (`WalletOverview`) solo describe el caso feliz; carga y error son responsabilidad de los límites de React, no de banderas `isLoading`/`isError` repetidas en cada pantalla. Al ubicar `error.tsx` debajo del layout privado, un fallo reemplaza solo el contenido: el usuario conserva la navegación y la opción de cerrar sesión. Sin saldo confirmado se oculta "Nueva transacción", porque no sería posible validar el saldo suficiente.
**Detalle técnico:** la verificación de la sesión llama `connection()` antes de leer el reloj. Con `partialPrefetching`, Next prerenderiza con cookies disponibles pero prohíbe la hora actual en el prerender; la vigencia de una sesión depende de la hora, así que debe evaluarse siempre en tiempo de request.

## 14. Type-check con Tipos de Rutas Frescos
**Decisión:** `pnpm type-check` ejecuta `next typegen` (que regenera `.next/types`) y `tsconfig.json` excluye `.next/dev`.
**Justificación:** `.next/dev/types` solo lo actualiza `next dev`. Si se mueve o elimina una página con el servidor detenido, esos tipos quedan apuntando a archivos inexistentes y el type-check falla sin un error real en el código. Excluirlos evita tener que borrar `.next` en cada commit.

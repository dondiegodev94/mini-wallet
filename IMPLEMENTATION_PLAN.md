# 📋 Plan de Implementación y Estrategia de Desarrollo — Mini Wallet

Este documento detalla el plan paso a paso, dividido en Pull Requests (PRs) atómicos, para garantizar la trazabilidad, alta calidad de código y cumplimiento estricto de las reglas de negocio de la aplicación **Mini Wallet**.

## 🔄 Flujo de Desarrollo por Pull Requests (PRs)

### PR 1: Cimientos, CI/CD Bloqueante y Arquitectura Base (Actual)
* **Objetivo:** Establecer las reglas del juego, configuraciones estrictas, seguridad y la estructura del Design System.
* **Entregables:** 
  * Next.js + TypeScript estricto, Tailwind + CVA, `cn.ts`.
  * Reglas estrictas de ESLint y Jest.
  * **Seguridad y Hooks (Decisión técnica propia):** Integración de Husky, Commitlint y Lint-staged para validaciones pre-commit (`type-check` y `test`).
  * Pipeline de CI/CD (GitHub Actions) con validación obligatoria de firmas GPG para prevenir inyección de código de fuentes no verificadas.
  * proteger branch principal con ruleset definido

### PR 2: Dominio, Especificaciones y Testing (Schema-First)
* **Objetivo:** Definir los contratos y reglas de negocio puras antes de construir la UI.
* **Entregables:** 
  * Esquemas de validación Zod para Autenticación y Transacciones (verificando monto mínimo > 0, saldo suficiente y destinatario obligatorio).
  * Contratos de respuesta (`Result Pattern`) para los 5 escenarios de confirmación.
  * Pruebas unitarias en Jest vinculadas explícitamente mediante IDs de especificación (ej. `[SPEC-TX-01]`).

### PR 3: Design System Base (Componentes Aislados y Tokens)
* **Objetivo:** Construir la capa visual reutilizable guiada por componentes limpios ("Dumb Components").
* **Entregables:** Componentes base (`Button`, `Input`, `Card`) utilizando `class-variance-authority` (CVA) para gestionar variantes visuales y tamaños, aislados mediante CSS/Tailwind y cubiertos por tests unitarios.

### PR 4: Capa de Servicios y API Routes (Mock Backend & Chaos Engine)
* **Objetivo:** Simular el entorno de servidor (BFF) y el motor de aleatoriedad.
* **Entregables:** 
  * Endpoints en `app/api/` para autenticación, obtención de saldo/movimientos y ejecución de transacciones.
  * Motor que procesa los 5 estados de confirmación (Éxito, Error de red, Fondos insuficientes, Timeout, Error desconocido) de forma aleatoria, permitiendo omitir la aleatoriedad mediante el header `x-mock-scenario` para propósitos de testing.

### PR 5: Gestión de Estado, Custom Hooks y Ensamblaje de Vistas
* **Objetivo:** Conectar el dominio y la infraestructura a la UI mediante separación estricta (SOLID).
* **Entregables:**
  * Tienda global ligera con Zustand para la transferencia.
  * Creación de Custom Hooks (`useTransferFlow`, `useAuth`) para encapsular toda la lógica y evitar re-renders innecesarios.
  * Ensamblaje de las pantallas requeridas: Login, Home, Nueva Transacción y Confirmación/Comprobante dinámico.

### PR 6: Pruebas E2E y Resiliencia
* **Objetivo:** Validar flujos completos simulando el comportamiento de un usuario real.
* **Entregables:**
  * Suite de pruebas en **Playwright** evaluando el *Happy Path* (Login -> Home -> Transferencia).
  * Pruebas de resiliencia inyectando el header de escenarios para verificar que la UI se recupera correctamente ante fallos de red o timeouts.

### PR 7: Cierre Documental y Evolución (Roadmap Futuro)
* **Objetivo:** Consolidar la visión a nivel empresarial en el `DECISIONS.md`.
* **Entregables:** Documentación de estrategias futuras de observabilidad (Datadog, Mixpanel), mejora continua de Core Web Vitals y aseguramiento de calidad/seguridad (SonarCloud, Snyk).

# 🤖 Uso de Inteligencia Artificial

Esta bitácora documenta el uso de herramientas IA durante el desarrollo, garantizando transparencia sobre su aplicación y el criterio de ingeniería detrás de cada decisión.

## 1. Herramientas usadas y en qué partes
* **Gemini:** Utilizado en la Fase 0 para estructurar ideas de arquitectura, plan de implementación, establecer la estructura de carpetas (Tree) y redactar el *scaffolding* de documentación inicial (`README.md`, `DECISIONS.md`).
* **Claude Code:** Utilizado para proponer estrategias de commits atómicos (bajo las reglas de `AGENTS.md`), auditar el proyecto contra el alcance de la PoC y reestructurar el `IMPLEMENTATION_PLAN.md`, y aplicar el saneamiento de cimientos del PR 2 (Tailwind v4, ESLint flat config, CI, Playwright). En el PR 3 redactó la spec `SPEC-AUTH` e implementó la feature de login y sesión con sus pruebas unitarias y E2E, validando cada capa con `type-check`, `lint`, `test`, `build` y `test:e2e` antes de proponer los commits.

## 2. Qué se aceptó directamente, corrigió o rechazó
* **Rechazado (Uso directo de Tailwind en pantallas):** La IA suele sugerir mezclar lógica de React con clases de Tailwind inline. Esta sugerencia fue rechazada para priorizar la regla de "Componentes limpios" (Composición React).
* **Corregido (Atribución en commits):** Se rechazó que el agente agregara trailers `Co-Authored-By` a los commits; la regla quedó fijada en `AGENTS.md`.
* **Aceptado tras validación (Hallazgos de auditoría):** Los hallazgos de la revisión del PR 1 (carpeta `app/` en la raíz que anulaba `src/app`, Tailwind v4 ignorando `tailwind.config.ts`, reglas de ESLint inactivas) se aceptaron solo después de reproducirlos con `pnpm build` y `pnpm lint`.
* **Aceptado con modificaciones (CVA + Tailwind):** Se aceptó usar Tailwind por pragmatismo, pero se modificó la estrategia encapsulando las clases usando `class-variance-authority` exclusivamente en la carpeta `src/ui/components/`.

## 3. Decisiones tomadas por criterio humano (Sin IA)
* La decisión de adoptar una arquitectura estricta en tres capas (`domain/`, `application/`, `ui/`) para aplicar el principio de Inversión de Dependencias.
* La inyección del header `x-mock-scenario` para resolver la tensión entre la aleatoriedad del API y la necesidad de pruebas deterministas estables en CI/CD.
* Separar la configuración estructural de Stryker en el PR 1 pero diferir la instalación de sus paquetes pesados hasta que el dominio y las pruebas unitarias principales estén consolidadas.
* No utilizar .gitkeeps a menos que haya una justificación real, mejor esperar a crear los archivos en la estructura de carpetas siguiendo la definición
* **(Decisión Propia):** La implementación de validación estricta pre-commit (Husky, Lint-Staged, Commitlint) y la exigencia de **Commits Firmados (GPG)** con bloqueo automatizado en el pipeline de GitHub Actions para asegurar la autoría e integridad del código en un entorno de simulación financiera.

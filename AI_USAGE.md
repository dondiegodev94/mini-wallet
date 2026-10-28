# 🤖 Uso de Inteligencia Artificial

Esta bitácora documenta el uso de herramientas IA durante el desarrollo, garantizando transparencia sobre su aplicación y el criterio de ingeniería detrás de cada decisión.

## 1. Herramientas usadas y en qué partes
* **Gemini:** Utilizado en la Fase 0 para estructurar ideas de arquitectura, plan de implementación, establecer la estructura de carpetas (Tree) y redactar el *scaffolding* de documentación inicial (`README.md`, `DECISIONS.md`).
* **Claude Code:** Utilizado para proponer estrategias de commits atómicos (bajo las reglas de `AGENTS.md`), auditar el proyecto contra el alcance de la PoC y reestructurar el `IMPLEMENTATION_PLAN.md`, y aplicar el saneamiento de cimientos del PR 2 (Tailwind v4, ESLint flat config, CI, Playwright). En el PR 3 redactó la spec `SPEC-AUTH` e implementó la feature de login y sesión con sus pruebas unitarias y E2E, validando cada capa con `type-check`, `lint`, `test`, `build` y `test:e2e` antes de proponer los commits. En el PR 4 se genera una primer propuesta de `SPEC-HOME`. En el PR 5 se redactaron primero las specs `SPEC-TX`, `SPEC-CT` y `SPEC-CONF` para su revisión y, una vez ajustadas (contactos por celular, máscaras por tipo de cuenta y captura de solo dígitos), se implementó la feature.

## 2. Qué se aceptó directamente, corrigió o rechazó
* **Rechazado (Uso directo de Tailwind en pantallas):** La IA suele sugerir mezclar lógica de React con clases de Tailwind inline. Esta sugerencia fue rechazada para priorizar la regla de "Componentes limpios" (Composición React).
* **Corregido (Atribución en commits):** Se rechazó que el agente agregara trailers `Co-Authored-By` a los commits; la regla quedó fijada en `AGENTS.md`.
* **Aceptado tras validación (Hallazgos de auditoría):** Los hallazgos de la revisión del PR 1 (carpeta `app/` en la raíz que anulaba `src/app`, Tailwind v4 ignorando `tailwind.config.ts`, reglas de ESLint inactivas) se aceptaron solo después de reproducirlos con `pnpm build` y `pnpm lint`.
* **Corregido tras revisar los logs del servidor (PR 4):** la primera versión del Home pasaba todas las pruebas E2E, pero el servidor registraba errores de prerender por leer `Date.now()` al verificar la sesión. No se aceptó un resultado "verde" con errores en los logs; se corrigió con `connection()` y se volvió a validar.
* **Aceptado con modificaciones (CVA + Tailwind):** Se aceptó usar Tailwind por pragmatismo, pero se modificó la estrategia encapsulando las clases usando `class-variance-authority` exclusivamente en la carpeta `src/ui/components/`.
* **Corregido (estado persistente por Router Cache — PR 4 hotfix):** al navegar de vuelta tras cerrar sesión, tanto el botón "Ingresar" como "Cerrar sesión" aparecían en estado de carga y el campo de identificador mantenía el valor del login anterior. Causa raíz: el Router Cache de Next.js guarda el estado de los Client Components al momento de la navegación y lo restaura al volver. Fix: en ambos hooks (`useLoginFlow`, `useLogout`) se resetea el estado a su valor limpio **antes** de llamar a `router.replace`, de modo que el Router Cache guarda el estado en blanco. No se usaron efectos de montaje porque la regla `react-hooks/set-state-in-effect` del linter los prohíbe para actualizar estado directamente.
* **Corregido por revisión humana (specs del PR 5):** antes de implementar se pidió agregar contactos por número de celular, máscaras por tipo de cuenta (`2·4·4`, `4·4·4·4`, `3·3·4·4·4`), bloquear cualquier carácter que no sea dígito y resaltar la `Idempotency-Key` para evitar transferencias duplicadas.
* **Corregido tras validar en el navegador (PR 5):** la prueba E2E del cursor fallaba solo en macOS porque las teclas Home/End no mueven el cursor en un input; se depuró con un script en el navegador antes de cambiar el componente, y el ajuste fue en la prueba, no en el código.
* **Riesgo detectado durante la implementación (PR 5):** con `cacheComponents`, el estado de React de las rutas visitadas sobrevive a una navegación interna, así que el siguiente usuario de la misma pestaña podría ver el borrador o un contacto recién creado por el anterior. El cierre de sesión pasó a recargar el documento completo.
* manejo de montos en centavos
* descripción para botón de logout


## 3. Decisiones tomadas por criterio humano (Sin IA)
* La decisión de adoptar una arquitectura estricta en tres capas (`domain/`, `application/`, `ui/`) para aplicar el principio de Inversión de Dependencias.
* La inyección del header `x-mock-scenario` para resolver la tensión entre la aleatoriedad del API y la necesidad de pruebas deterministas estables en CI/CD.
* Separar la configuración estructural de Stryker en el PR 1 pero diferir la instalación de sus paquetes pesados hasta que el dominio y las pruebas unitarias principales estén consolidadas.
* No utilizar .gitkeeps a menos que haya una justificación real, mejor esperar a crear los archivos en la estructura de carpetas siguiendo la definición
* **(Decisión Propia):** La implementación de validación estricta pre-commit (Husky, Lint-Staged, Commitlint) y la exigencia de **Commits Firmados (GPG)** con bloqueo automatizado en el pipeline de GitHub Actions para asegurar la autoría e integridad del código en un entorno de simulación financiera.

# 🤖 Uso de Inteligencia Artificial

Esta bitácora documenta el uso de herramientas IA durante el desarrollo, garantizando transparencia y demostrando criterio de ingeniería en su aplicación.

## 1. Herramientas usadas y en qué partes
* **Gemini:** Utilizado en la Fase 0 para estructurar ideas de arquitectura, plan de implementación, establecer la estructura de carpetas (Tree) y redactar el *scaffolding* de documentación inicial (`README.md`, `DECISIONS.md`).

## 2. Qué se aceptó directamente, corrigió o rechazó
* **Rechazado (Uso directo de Tailwind en pantallas):** La IA suele sugerir mezclar lógica de React con clases de Tailwind inline. Esta sugerencia fue rechazada para priorizar la regla de "Componentes limpios" (Composición React).
* **Aceptado con modificaciones (CVA + Tailwind):** Se aceptó usar Tailwind por pragmatismo, pero se modificó la estrategia encapsulando las clases usando `class-variance-authority` exclusivamente en la carpeta `src/ui/components/`.

## 3. Decisiones tomadas por criterio humano (Sin IA)
* La decisión de adoptar una arquitectura estricta en tres capas (`domain/`, `application/`, `ui/`) para aplicar el principio de Inversión de Dependencias.
* La inyección del header `x-mock-scenario` para resolver el requerimiento conflictivo entre aleatoriedad en el API y la necesidad de pruebas deterministas estables en CI/CD.
* Separar la configuración estructural de Stryker en el PR 1 pero diferir la instalación de sus paquetes pesados hasta que el dominio y las pruebas unitarias principales estén consolidadas.
* No utilizar .gitkeeps a menos que haya una justificación real, mejor esperar a crear los archivos en la estructura de carpetas siguiendo la definición
* **(Decisión Propia):** La implementación de validación estricta pre-commit (Husky, Lint-Staged, Commitlint) y la exigencia de **Commits Firmados (GPG)** con bloqueo automatizado en el pipeline de GitHub Actions para asegurar la autoría e integridad del código en un entorno de simulación financiera.

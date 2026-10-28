# Instrucciones para Agente de Control de Versiones

Revisa los archivos modificados o creados (git status/git diff) y genera una estrategia de commits atómicos. 

Reglas obligatorias:
1. **Importante** No ejecutes los commits hasta la confirmación explicita de aceptación de la propuesta generada en los siguientes pasos
2. **Importante** Todos los commits deben ir firmados utilizando -S
2. Usa el estándar Conventional Commits: `tipo(scope): descripción en minúsculas`.
3. Agrupa los archivos por su naturaleza lógica, no en un solo commit masivo.
4. Tipos permitidos:
   - `chore`: Modificaciones de configuración, dependencias o herramientas (ej. package.json, eslint, husky).
   - `docs`: Cambios exclusivos en archivos *.md (ej. README, DECISIONS).
   - `feat`: Nuevas características o archivos core (ej. cn.ts).
   - `test`: Archivos de configuración de pruebas (ej. jest.config.js).
   - `ci`: Archivos relacionados con GitHub Actions o pipelines.
5. Entrégame una tabla de los commits propuestos listos para ser ejecutados en la terminal.
6. Tras haber ejecutado los commits entrega sin saludos ni despedidas listos para copiar y pegar el titulo y la descripción para el pull request utilizando la plantilla .github/pull_request_template.md

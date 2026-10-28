# 🚀 Mini Wallet Web App

Bienvenido(a) al repositorio de la **Mini Wallet Web App**. Este proyecto es una simulación de un flujo transaccional para un entorno de alto volumen, construido bajo la metodología **Specification-Driven Development (SDD)**, con una arquitectura orientada a un Design System encapsulado y separación estricta de responsabilidades (SOLID).

## 🛠️ Stack Tecnológico y Librerías Usadas

El proyecto prioriza el pragmatismo y el rendimiento, seleccionando herramientas específicas para resolver problemas del dominio:
* **Framework:** Next.js (App Router) + TypeScript.
* **Gestión de Estado Local:** Zustand (Suscripciones atómicas para evitar re-renders masivos).
* **Validación y Contratos:** Zod (Esquemas de validación unificados para UI y API).
* **Estilos y Design System:** Tailwind CSS + CVA (Class Variance Authority) encapsulados estrictamente en la capa de UI.
* **Testing:** 
  * Unitario: Jest + React Testing Library.
  * E2E: Playwright (Ideal para interceptar red y simular fallos aleatorios).
  * Mutación (Bonus): Stryker (Garantiza la confiabilidad de los tests).

## ⚙️ Prerrequisitos

* **Node.js**: v20.x o superior.
* **Gestor de paquetes**: pnpm (recomendado por velocidad y manejo estricto de dependencias).

## 🚀 Instrucciones para Levantar el Proyecto

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/dondiegodev94/mini-wallet.git
   ```
   ```bash
   cd mini-wallet
    ```
    
2. Configurar Variables de Entorno:
   Crea tu archivo local a partir del ejemplo:
   ```bash
   cp .env.example .env.local
   ```

3. Instalar dependencias:
   ```bash
   pnpm install
   ```
   
4. Levantar el servidor de desarrollo:
   ```bash
   pnpm dev
   ```
   La aplicación estará disponible en http://localhost:3000.

📜 Scripts Disponibles

⚬ pnpm dev: Inicia el entorno de desarrollo.
⚬ pnpm build: Construye la aplicación para producción.
⚬ pnpm type-check: Ejecuta el compilador de TypeScript para asegurar la integridad de los tipos sin compilar. (Paso bloqueante en el pipeline).
⚬ pnpm lint: Ejecuta ESLint verificando reglas de Clean Code, prohibición de funciones inline y accesibilidad.
⚬ pnpm test: Ejecuta la suite de pruebas unitarias con Jest.
⚬ pnpm test:e2e: Ejecuta las pruebas de flujos completos en el navegador usando Playwright.

⚠️ Limitaciones Conocidas

Para mantener el enfoque en la arquitectura del frontend y cumplir con el alcance del reto, el sistema presenta las siguientes limitaciones intencionales:

1. Persistencia Volátil: Los datos de sesión, contactos creados, reducción de saldo y movimientos recientes se guardan en memoria en la capa de API Routes (servidor simulado). Al reiniciar el servidor de Node (pnpm dev), la base de datos vuelve a su estado inicial.
2. Aleatoriedad Determinista (Testing): La pantalla de confirmación genera 5 escenarios aleatorios. Para poder probar el sistema sin inestabilidad (flakiness), se debe enviar el header x-mock-scenario desde los tests.
3. Autenticación Mockeada: No se implementa JWT, solo validación de formato y sesión simulada.

📚 Documentación Adjunta

⚬ DECISIONS.md: Justificación técnica profunda y trade-offs arquitectónicos.
⚬ AI_USAGE.md: Bitácora de transparencia sobre el uso de IA.
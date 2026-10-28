import { defineConfig, devices } from "@playwright/test";

// Puerto dedicado para no reutilizar un `pnpm dev` levantado con otra configuración.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;
// En CI el valor se incrusta en el build, así que el paso de build debe usar el mismo.
const E2E_TRANSFER_TIMEOUT_MS = process.env.NEXT_PUBLIC_TRANSFER_TIMEOUT_MS ?? "3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: process.env.CI ? `pnpm start --port ${PORT}` : `pnpm dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: {
      ENABLE_TEST_SCENARIOS: "true",
      // Tiempo límite corto para no esperar los 15 s reales en el escenario TIMEOUT (SPEC-CONF-R25).
      NEXT_PUBLIC_TRANSFER_TIMEOUT_MS: E2E_TRANSFER_TIMEOUT_MS,
      SESSION_SECRET: process.env.SESSION_SECRET ?? "e2e-session-secret-with-at-least-32-chars",
    },
  },
});

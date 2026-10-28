import { expect, type Page, type Request } from "@playwright/test";
import { loginAs } from "./session";

export const TRANSACTIONS_URL = "**/api/transactions";

export type TransferScenario = "SUCCESS" | "NETWORK_ERROR" | "INSUFFICIENT_FUNDS" | "TIMEOUT" | "UNKNOWN_ERROR";

export function amountField(page: Page) {
  return page.getByLabel("¿Cuánto quieres enviar?");
}

export function continueButton(page: Page) {
  return page.getByRole("button", { name: "Continuar" });
}

export function newContactForm(page: Page) {
  return page.getByRole("form", { name: "Nuevo contacto" });
}

export async function openTransfer(page: Page, identifier = "ana@miniwallet.dev") {
  await loginAs(page, identifier);
  await page.goto("/transfer");
  await expect(page.getByRole("heading", { name: "Nueva transacción" })).toBeVisible();
}

export async function chooseContact(page: Page, name: string) {
  await page.getByRole("radiogroup", { name: "Contactos favoritos" }).getByText(name).click();
}

export async function createCardContact(page: Page, name: string, card: string) {
  const form = newContactForm(page);
  await form.getByLabel("Nombre").fill(name);
  await form.getByText("Tarjeta", { exact: true }).click();
  await form.getByLabel("Número de tarjeta").pressSequentially(card);
  await form.getByLabel("Banco").selectOption("HSBC");
  await form.getByRole("button", { name: "Guardar contacto" }).click();
}

// Captura en la nueva transacción ya abierta y avanza hasta el resumen.
export async function fillTransfer(page: Page, { contact, amount, concept }: { contact: string; amount: string; concept?: string }) {
  await amountField(page).pressSequentially(amount);
  await chooseContact(page, contact);
  if (concept) await page.getByLabel("Concepto (opcional)").fill(concept);
  await continueButton(page).click();
  await expect(page.getByRole("heading", { name: "Revisa tu transferencia" })).toBeVisible();
}

// Fuerza el resultado del motor de caos solo en la confirmación; el servidor lo respeta con ENABLE_TEST_SCENARIOS.
export async function forceTransferScenario(page: Page, scenario: TransferScenario) {
  await page.unroute(TRANSACTIONS_URL);
  await page.route(TRANSACTIONS_URL, (route) =>
    route.continue({ headers: { ...route.request().headers(), "x-mock-scenario": scenario } }),
  );
}

export function confirmButton(page: Page) {
  return page.getByRole("button", { name: "Confirmar transferencia" });
}

export function homeButton(page: Page) {
  return page.getByRole("button", { name: "Volver al inicio" });
}

export function retryButton(page: Page) {
  return page.getByRole("button", { name: "Reintentar" });
}

// Registra cada confirmación enviada para verificar claves y número de solicitudes.
export function recordTransactionRequests(page: Page): Request[] {
  const requests: Request[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/transactions") && request.method() === "POST") requests.push(request);
  });
  return requests;
}

export function idempotencyKeyOf(request: Request | undefined): string | undefined {
  return request?.headers()["idempotency-key"];
}

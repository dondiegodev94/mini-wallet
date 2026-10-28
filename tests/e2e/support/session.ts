import { expect, type Page } from "@playwright/test";

export async function loginAs(page: Page, identifier: string) {
  const response = await page.request.post("/api/auth", { data: { identifier } });
  expect(response.ok()).toBe(true);
}

// Cuenta aislada con el saldo, movimientos y contactos de la plantilla: las pruebas que mueven dinero no se pisan.
export async function createTestAccount(page: Page, template: "ana" | "luis"): Promise<string> {
  const response = await page.request.post("/api/test/accounts", { data: { template } });
  expect(response.status()).toBe(201);
  return (await response.json()).email;
}

export async function loginAsNewAccount(page: Page, template: "ana" | "luis"): Promise<string> {
  const email = await createTestAccount(page, template);
  await loginAs(page, email);
  return email;
}

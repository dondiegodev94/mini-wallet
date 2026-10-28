import { expect, test, type Page } from "@playwright/test";
import { formatCard, uniqueCardNumber } from "./support/accounts";
import { balance, movementItems } from "./support/home";
import { createTestAccount, loginAsNewAccount } from "./support/session";
import {
  amountField,
  chooseContact,
  confirmButton,
  continueButton,
  createCardContact,
  fillTransfer,
  forceTransferScenario,
  homeButton,
  idempotencyKeyOf,
  recordTransactionRequests,
} from "./support/transfer";

async function startNewTransfer(page: Page) {
  await page.getByRole("link", { name: "Nueva transacción" }).click();
  await expect(page.getByRole("heading", { name: "Nueva transacción" })).toBeVisible();
}

async function confirmAndReturnHome(page: Page) {
  await confirmButton(page).click();
  await expect(page.getByRole("heading", { name: "Transferencia enviada" })).toBeVisible();
  await homeButton(page).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe("SPEC-CONF — Recorridos de inicio a fin", () => {
  test.beforeEach(async ({ page }) => {
    await forceTransferScenario(page, "SUCCESS");
  });

  test("[SPEC-CONF-E2E01] login, transferencia a un contacto, comprobante, Home actualizado y cierre de sesión", async ({
    page,
  }) => {
    const email = await createTestAccount(page, "ana");

    await page.goto("/login");
    await page.getByLabel("Teléfono o email").fill(email);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page.getByRole("heading", { name: "Hola, Ana" })).toBeVisible();
    await expect(balance(page)).toHaveText("$12,450.75");

    await startNewTransfer(page);
    await fillTransfer(page, { contact: "Carlos Núñez", amount: "2345.67", concept: "Bicicleta" });
    await expect(page.getByRole("definition").last()).toHaveText("$10,105.08");

    await confirmButton(page).click();
    await expect(page.getByRole("heading", { name: "Transferencia enviada" })).toBeVisible();
    await expect(page.getByText("Tarjeta •••• 5675", { exact: true })).toBeVisible();
    await homeButton(page).click();

    await expect(balance(page)).toHaveText("$10,105.08");
    const latest = movementItems(page).first();
    await expect(latest).toContainText("Carlos Núñez");
    await expect(latest).toContainText("Bicicleta");
    await expect(latest).toContainText("Cargo: -$2,345.67");

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("[SPEC-CONF-E2E02] un usuario sin contactos da de alta uno y hace su primera transferencia", async ({
    page,
  }) => {
    await loginAsNewAccount(page, "luis");
    await page.goto("/");
    await expect(page.getByText("Aún no tienes movimientos")).toBeVisible();

    await startNewTransfer(page);
    const card = uniqueCardNumber();
    await createCardContact(page, "Beatriz Ríos", formatCard(card));
    await expect(page.getByRole("radio", { name: /Beatriz Ríos/ })).toBeChecked();
    await amountField(page).pressSequentially("500");
    await continueButton(page).click();

    await confirmAndReturnHome(page);

    await expect(page.getByText("Aún no tienes movimientos")).toHaveCount(0);
    await expect(balance(page)).toHaveText("$2,500.00");
    await expect(movementItems(page)).toHaveCount(1);
    await expect(movementItems(page).first()).toContainText("Beatriz Ríos");
    await expect(movementItems(page).first()).toContainText("Transferencia");
  });

  for (const [scenario, title] of [
    ["INSUFFICIENT_FUNDS", "Fondos insuficientes"],
    ["UNKNOWN_ERROR", "Algo salió mal"],
  ] as const) {
    test(`[SPEC-CONF-E2E05] tras ${scenario} el saldo queda intacto y el flujo empieza de cero`, async ({
      page,
    }) => {
      await loginAsNewAccount(page, "ana");
      await page.goto("/");
      await startNewTransfer(page);
      await fillTransfer(page, { contact: "Luis Pérez", amount: "800", concept: "Cena" });
      await forceTransferScenario(page, scenario);

      await confirmButton(page).click();
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
      await homeButton(page).click();

      await expect(balance(page)).toHaveText("$12,450.75");
      await startNewTransfer(page);
      await expect(amountField(page)).toHaveValue("");
      await expect(page.getByRole("radio", { name: /Luis Pérez/ })).not.toBeChecked();
      await expect(page.getByLabel("Concepto (opcional)")).toHaveValue("");
    });
  }

  test("[SPEC-CONF-E2E06] dos transferencias seguidas, cada una con su propia clave", async ({ page }) => {
    const requests = recordTransactionRequests(page);
    await loginAsNewAccount(page, "ana");
    await page.goto("/");

    await startNewTransfer(page);
    await fillTransfer(page, { contact: "Mariana Soto", amount: "100" });
    await confirmAndReturnHome(page);
    await expect(balance(page)).toHaveText("$12,350.75");

    await startNewTransfer(page);
    await expect(page.getByText("Saldo disponible: $12,350.75")).toBeVisible();
    await chooseContact(page, "Luis Pérez");
    await amountField(page).pressSequentially("200");
    await continueButton(page).click();
    await confirmAndReturnHome(page);

    await expect(balance(page)).toHaveText("$12,150.75");
    await expect(movementItems(page).nth(0)).toContainText("Cargo: -$200.00");
    await expect(movementItems(page).nth(1)).toContainText("Cargo: -$100.00");
    expect(requests).toHaveLength(2);
    expect(idempotencyKeyOf(requests[0])).not.toBe(idempotencyKeyOf(requests[1]));
  });
});

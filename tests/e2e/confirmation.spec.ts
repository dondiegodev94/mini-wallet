import { expect, test, type Page } from "@playwright/test";
import { balance, movementItems } from "./support/home";
import { loginAsNewAccount } from "./support/session";
import {
  TRANSACTIONS_URL,
  amountField,
  confirmButton,
  fillTransfer,
  forceTransferScenario,
  homeButton,
  idempotencyKeyOf,
  recordTransactionRequests,
  retryButton,
} from "./support/transfer";

const ANA_BALANCE = "$12,450.75";
// El servidor de pruebas usa un tiempo límite corto (R25); se deja margen para la latencia simulada.
const TIMEOUT_SCREEN = { timeout: 15_000 };

async function reviewAsNewAna(page: Page, amount = "1250.50") {
  await loginAsNewAccount(page, "ana");
  await page.goto("/transfer");
  await fillTransfer(page, { contact: "Mariana Soto", amount, concept: "Renta" });
}

async function goHome(page: Page) {
  await homeButton(page).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Hola, Ana" })).toBeVisible();
}

function heading(page: Page, name: string) {
  return page.getByRole("heading", { name });
}

test.describe("SPEC-CONF — Confirmación", () => {
  test("[SPEC-CONF-AC01][SPEC-CONF-R16][SPEC-CONF-R22] éxito: comprobante con el saldo resultante y Home actualizado", async ({
    page,
  }) => {
    await reviewAsNewAna(page);
    await forceTransferScenario(page, "SUCCESS");

    await confirmButton(page).click();

    await expect(page.getByRole("status")).toHaveText(/Procesando tu transferencia/);
    await expect(homeButton(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/transfer\/status$/);
    await expect(heading(page, "Transferencia enviada")).toBeFocused();
    await expect(page.getByText(/^MW\d{8}$/)).toBeVisible();
    await expect(page.getByRole("definition").last()).toHaveText("$11,200.25");

    await goHome(page);
    await expect(balance(page)).toHaveText("$11,200.25");
    await expect(movementItems(page).first()).toContainText("Mariana Soto");
    await expect(movementItems(page).first()).toContainText("Renta");
    await expect(movementItems(page).first()).toContainText("Cargo: -$1,250.50");
  });

  test("[SPEC-CONF-AC02][SPEC-CONF-E2E03] error de red: reintentar usa la misma clave y cobra una vez", async ({
    page,
  }) => {
    const requests = recordTransactionRequests(page);
    await reviewAsNewAna(page, "321.09");
    await forceTransferScenario(page, "NETWORK_ERROR");

    await confirmButton(page).click();

    await expect(heading(page, "No pudimos conectar con el servidor")).toBeFocused();
    await expect(homeButton(page)).toBeVisible();

    await forceTransferScenario(page, "SUCCESS");
    await retryButton(page).click();

    await expect(heading(page, "Transferencia enviada")).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(idempotencyKeyOf(requests[0])).toBeTruthy();
    expect(idempotencyKeyOf(requests[1])).toBe(idempotencyKeyOf(requests[0]));

    await goHome(page);
    await expect(balance(page)).toHaveText("$12,129.66");
    await expect(movementItems(page).filter({ hasText: "-$321.09" })).toHaveCount(1);
  });

  test("[SPEC-CONF-R17] una conexión cortada se trata como error de red", async ({ page }) => {
    await reviewAsNewAna(page);
    await page.route(TRANSACTIONS_URL, (route) => route.abort("internetdisconnected"));

    await confirmButton(page).click();

    await expect(heading(page, "No pudimos conectar con el servidor")).toBeVisible();
    await expect(retryButton(page)).toBeVisible();
  });

  test("[SPEC-CONF-AC03][SPEC-CONF-E2E04] timeout: reintentar devuelve el comprobante original sin cobrar dos veces", async ({
    page,
  }) => {
    await reviewAsNewAna(page, "432.10");
    await forceTransferScenario(page, "TIMEOUT");

    await confirmButton(page).click();

    await expect(heading(page, "Tu transferencia está tardando más de lo normal")).toBeVisible(TIMEOUT_SCREEN);
    await expect(page.getByRole("alert").filter({ hasText: "no se te cobrará dos veces" })).toBeVisible();

    const replay = page.waitForResponse(TRANSACTIONS_URL);
    await retryButton(page).click();

    expect((await replay).headers()["idempotent-replayed"]).toBe("true");
    await expect(heading(page, "Transferencia enviada")).toBeVisible();

    await goHome(page);
    await expect(balance(page)).toHaveText("$12,018.65");
    await expect(movementItems(page).filter({ hasText: "-$432.10" })).toHaveCount(1);
  });

  test("[SPEC-CONF-AC04] timeout: el Home ya refleja el cargo", async ({ page }) => {
    await reviewAsNewAna(page);
    await forceTransferScenario(page, "TIMEOUT");

    await confirmButton(page).click();
    await expect(heading(page, "Tu transferencia está tardando más de lo normal")).toBeVisible(TIMEOUT_SCREEN);

    await goHome(page);
    await expect(balance(page)).toHaveText("$11,200.25");
  });

  test("[SPEC-CONF-AC05] fondos insuficientes simulados: solo permite volver al inicio y no cobra", async ({
    page,
  }) => {
    await reviewAsNewAna(page);
    await forceTransferScenario(page, "INSUFFICIENT_FUNDS");

    await confirmButton(page).click();

    await expect(heading(page, "Fondos insuficientes")).toBeFocused();
    await expect(page.getByRole("alert").filter({ hasText: "No se realizó ningún cargo." })).toBeVisible();
    await expect(retryButton(page)).toHaveCount(0);

    await goHome(page);
    await expect(balance(page)).toHaveText(ANA_BALANCE);
  });

  test("[SPEC-CONF-AC06] fondos insuficientes reales: el saldo bajó después de abrir la transferencia", async ({
    page,
  }) => {
    await reviewAsNewAna(page, "10000");
    const otherCharge = await page.request.post("/api/transactions", {
      headers: { "Idempotency-Key": crypto.randomUUID(), "x-mock-scenario": "SUCCESS" },
      data: { contactId: "ct_carlos", amountCents: 500000 },
    });
    expect(otherCharge.status()).toBe(201);
    await forceTransferScenario(page, "SUCCESS");

    await confirmButton(page).click();

    await expect(heading(page, "Fondos insuficientes")).toBeVisible();
    await goHome(page);
    await expect(balance(page)).toHaveText("$7,450.75");
  });

  test("[SPEC-CONF-AC07] error desconocido: pantalla genérica sin cargo", async ({ page }) => {
    await reviewAsNewAna(page);
    await forceTransferScenario(page, "UNKNOWN_ERROR");

    await confirmButton(page).click();

    await expect(heading(page, "Algo salió mal")).toBeFocused();
    await expect(retryButton(page)).toHaveCount(0);

    await goHome(page);
    await expect(balance(page)).toHaveText(ANA_BALANCE);
  });

  test("[SPEC-CONF-AC08] un doble clic en confirmar envía una sola solicitud", async ({ page }) => {
    const requests = recordTransactionRequests(page);
    await reviewAsNewAna(page);
    await forceTransferScenario(page, "SUCCESS");

    await confirmButton(page).evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });

    await expect(heading(page, "Transferencia enviada")).toBeVisible();
    expect(requests).toHaveLength(1);
    await goHome(page);
    await expect(balance(page)).toHaveText("$11,200.25");
  });

  test("[SPEC-CONF-AC09] desde el resultado no se puede volver al resumen", async ({ page }) => {
    await reviewAsNewAna(page);
    await forceTransferScenario(page, "SUCCESS");
    await confirmButton(page).click();
    await expect(heading(page, "Transferencia enviada")).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL(/\/transfer$/);
    await expect(amountField(page)).toHaveValue("");
    await expect(confirmButton(page)).toHaveCount(0);

    await page.goto("/transfer/status");
    await expect(page).toHaveURL(/\/$/);
    await expect(balance(page)).toHaveText("$11,200.25");
  });

  test("[SPEC-CONF-R17] si la sesión expiró al confirmar, vuelve a /login", async ({ page }) => {
    await reviewAsNewAna(page);
    await page.context().clearCookies();

    await confirmButton(page).click();

    await expect(page).toHaveURL(/\/login$/);
  });
});

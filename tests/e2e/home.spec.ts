import { expect, test, type Page } from "@playwright/test";

async function loginAs(page: Page, identifier: string) {
  const response = await page.request.post("/api/auth", { data: { identifier } });
  expect(response.ok()).toBe(true);
}

function movementsList(page: Page) {
  return page.getByRole("list", { name: "Movimientos recientes" });
}

test.describe("SPEC-HOME — Dashboard", () => {
  test("[SPEC-HOME-AC01][SPEC-HOME-AC02] muestra nombre, saldo y los 10 movimientos más recientes", async ({
    page,
  }) => {
    await loginAs(page, "ana@miniwallet.dev");
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Hola, Ana" })).toBeVisible();
    await expect(page.getByRole("definition")).toHaveText("$12,450.75");

    const items = movementsList(page).getByRole("listitem");
    await expect(items).toHaveCount(10);
    await expect(items.first()).toContainText("Luis Pérez");
    await expect(items.first()).toContainText("Cargo: -$350.00");
    await expect(items.last()).toContainText("Boletos de cine");
  });

  test("[SPEC-HOME-AC03] un usuario sin movimientos ve el estado vacío", async ({ page }) => {
    await loginAs(page, "luis@miniwallet.dev");
    await page.goto("/");

    await expect(page.getByText("Aún no tienes movimientos")).toBeVisible();
    await expect(page.getByRole("definition")).toHaveText("$3,000.00");
    await expect(movementsList(page)).toHaveCount(0);
  });

  test("[SPEC-HOME-AC04] muestra el skeleton mientras carga el resumen", async ({ page }) => {
    await loginAs(page, "ana@miniwallet.dev");
    await page.goto("/", { waitUntil: "commit" });

    await expect(page.getByRole("status")).toContainText("Cargando tu información");
    await expect(page.getByRole("heading", { name: "Hola, Ana" })).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("[SPEC-HOME-AC05] ante la caída del servicio permite reintentar y recuperarse", async ({
    page,
  }) => {
    await loginAs(page, "ana@miniwallet.dev");
    await page.route("**/*", (route) =>
      route.continue({
        headers: { ...route.request().headers(), "x-mock-scenario": "WALLET_UNAVAILABLE" },
      }),
    );
    await page.goto("/");

    await expect(page.getByText("No pudimos cargar tu información")).toBeVisible();
    await expect(page.getByRole("link", { name: "Nueva transacción" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();

    await page.unroute("**/*");
    await page.getByRole("button", { name: "Reintentar" }).click();

    await expect(page.getByRole("heading", { name: "Hola, Ana" })).toBeVisible();
    await expect(page.getByText("No pudimos cargar tu información")).toHaveCount(0);
  });

  test("[SPEC-HOME-AC06] el botón de nueva transacción apunta a /transfer", async ({ page }) => {
    await loginAs(page, "ana@miniwallet.dev");
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Nueva transacción" })).toHaveAttribute(
      "href",
      "/transfer",
    );
  });

  test("[SPEC-HOME-AC07] cerrar sesión lleva a /login y protege el Home", async ({ page }) => {
    await loginAs(page, "ana@miniwallet.dev");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Hola, Ana" })).toBeVisible();

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("[SPEC-HOME-AC08] el contenido cabe en el viewport sin scroll horizontal", async ({ page }) => {
    await loginAs(page, "ana@miniwallet.dev");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Hola, Ana" })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

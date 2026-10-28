import { expect, test, type Page } from "@playwright/test";

const SESSION_COOKIE = "mini-wallet-session";

// Next.js también renderiza un anunciador de rutas con role="alert"; se filtra por texto.
function formAlert(page: Page, text: string) {
  return page.getByRole("alert").filter({ hasText: text });
}

async function submitLogin(page: Page, identifier: string) {
  await page.getByLabel("Teléfono o email").fill(identifier);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

test.describe("SPEC-AUTH — Login y sesión", () => {
  test("[SPEC-AUTH-AC06] las páginas privadas sin sesión redirigen a /login", async ({ page }) => {
    for (const path of ["/", "/transfer"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    }
  });

  test("[SPEC-AUTH-AC02] el formulario vacío muestra el error de campo", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(page.getByText("Ingresa tu teléfono o email.")).toBeVisible();
    await expect(page.getByLabel("Teléfono o email")).toHaveAttribute("aria-invalid", "true");
  });

  test("[SPEC-AUTH-AC03] un teléfono incompleto muestra el error de formato", async ({ page }) => {
    await page.goto("/login");
    await submitLogin(page, "55123");

    await expect(page.getByText("Ingresa un teléfono de 10 dígitos.")).toBeVisible();
  });

  test("[SPEC-AUTH-AC04] un usuario no registrado ve un error genérico", async ({ page }) => {
    await page.goto("/login");
    await submitLogin(page, "nadie@miniwallet.dev");

    await expect(formAlert(page, "No encontramos una cuenta con esos datos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("[SPEC-AUTH-AC05] el error de servicio simulado permite reintentar", async ({ page }) => {
    await page.goto("/login");
    await submitLogin(page, "error@miniwallet.dev");

    await expect(
      formAlert(page, "El servicio no está disponible. Intenta de nuevo en unos momentos."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Ingresar" })).toBeEnabled();
  });

  test("[SPEC-AUTH-AC01][SPEC-AUTH-AC07][SPEC-AUTH-AC08] login con teléfono, persistencia y redirección desde /login", async ({
    page,
    context,
  }) => {
    await page.goto("/login");
    await submitLogin(page, "+52 55 1234 5678");

    await expect(page.getByRole("button", { name: "Ingresando…" })).toBeDisabled();
    await expect(page).toHaveURL(/\/$/);

    const session = (await context.cookies()).find((cookie) => cookie.name === SESSION_COOKIE);
    expect(session).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });

    await page.reload();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/login");
    await expect(page).toHaveURL(/\/$/);
  });

  test("[SPEC-AUTH-AC01] login con email", async ({ page }) => {
    await page.goto("/login");
    await submitLogin(page, "  LUIS@miniwallet.dev ");

    await expect(page).toHaveURL(/\/$/);
  });
});

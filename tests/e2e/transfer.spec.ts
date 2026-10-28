import { expect, test, type Locator, type Page } from "@playwright/test";
import { formatCard, uniqueCardNumber } from "./support/accounts";
import { loginAs } from "./support/session";

function amountField(page: Page) {
  return page.getByLabel("¿Cuánto quieres enviar?");
}

async function placeCaret(input: Locator, position: number) {
  await input.evaluate(
    (element: HTMLInputElement, caret) => element.setSelectionRange(caret, caret),
    position,
  );
}

function continueButton(page: Page) {
  return page.getByRole("button", { name: "Continuar" });
}

function newContactForm(page: Page) {
  return page.getByRole("form", { name: "Nuevo contacto" });
}

async function openTransfer(page: Page, identifier = "ana@miniwallet.dev") {
  await loginAs(page, identifier);
  await page.goto("/transfer");
  await expect(page.getByRole("heading", { name: "Nueva transacción" })).toBeVisible();
}

async function chooseContact(page: Page, name: string) {
  await page.getByRole("radiogroup", { name: "Contactos favoritos" }).getByText(name).click();
}

async function createCardContact(page: Page, name: string, card: string) {
  const form = newContactForm(page);
  await form.getByLabel("Nombre").fill(name);
  await form.getByText("Tarjeta", { exact: true }).click();
  await form.getByLabel("Número de tarjeta").pressSequentially(card);
  await form.getByLabel("Banco").selectOption("HSBC");
  await form.getByRole("button", { name: "Guardar contacto" }).click();
}

test.describe("SPEC-TX — Captura del monto", () => {
  test("[SPEC-TX-AC01] da formato de moneda mientras se escribe y completa los centavos al salir", async ({
    page,
  }) => {
    await openTransfer(page);
    const amount = amountField(page);

    await amount.pressSequentially("1234567.8");
    await expect(amount).toHaveValue("1,234,567.8");

    await amount.blur();
    await expect(amount).toHaveValue("1,234,567.80");
  });

  test("[SPEC-TX-AC02] ignora caracteres no permitidos y cambios fuera de límite", async ({ page }) => {
    await openTransfer(page);
    const amount = amountField(page);

    await amount.pressSequentially("12.34");
    await amount.pressSequentially("5a-e,");
    await expect(amount).toHaveValue("12.34");

    await amount.fill("1.234,56");
    await expect(amount).toHaveValue("12.34");

    await amount.fill("");
    await amount.pressSequentially("123456789");
    await expect(amount).toHaveValue("1,234,567");
  });

  test("[SPEC-TX-R06] el cursor no salta al editar en medio ni al borrar una coma", async ({ page }) => {
    await openTransfer(page);
    const amount = amountField(page);
    await amount.pressSequentially("1234");

    // Home/End no mueven el cursor en macOS: se coloca explícitamente.
    await placeCaret(amount, 1);
    await amount.press("5");
    await amount.press("6");
    await expect(amount).toHaveValue("156,234");

    await placeCaret(amount, 4);
    await amount.press("Backspace");
    await expect(amount).toHaveValue("15,234");
    expect(await amount.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(2);
  });

  test("[SPEC-TX-AC03] con el monto vacío no continúa y enfoca el monto", async ({ page }) => {
    await openTransfer(page);
    await chooseContact(page, "Mariana Soto");

    await continueButton(page).click();

    await expect(page.getByText("Ingresa un monto.")).toBeVisible();
    await expect(amountField(page)).toBeFocused();
    await expect(page).toHaveURL(/\/transfer$/);

    await amountField(page).pressSequentially("0");
    await amountField(page).blur();
    await expect(page.getByText("El monto debe ser mayor a $0.00.")).toBeVisible();
  });

  test("[SPEC-TX-AC04] con un monto mayor al saldo no continúa", async ({ page }) => {
    await openTransfer(page);
    await chooseContact(page, "Mariana Soto");

    await amountField(page).pressSequentially("12450.76");
    await continueButton(page).click();

    await expect(
      page.getByText("El monto supera tu saldo disponible de $12,450.75."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/transfer$/);
  });

  test("[SPEC-TX-AC06] sin destinatario no continúa", async ({ page }) => {
    await openTransfer(page);
    await amountField(page).pressSequentially("100");

    await continueButton(page).click();

    await expect(page.getByText("Selecciona un destinatario.")).toBeVisible();
    await expect(page.getByRole("group", { name: "Destinatario" })).toBeFocused();
  });
});

test.describe("SPEC-TX — Resumen", () => {
  test("[SPEC-TX-AC05][SPEC-TX-AC07] con el saldo completo llega al resumen con saldo resultante en $0.00", async ({
    page,
  }) => {
    await openTransfer(page);
    await amountField(page).pressSequentially("12450.75");
    await chooseContact(page, "Mariana Soto");
    await page.getByLabel("Concepto (opcional)").fill("Renta");

    await continueButton(page).click();

    await expect(page).toHaveURL(/\/transfer\/review$/);
    await expect(page.getByRole("heading", { name: "Revisa tu transferencia" })).toBeVisible();
    const summary = page.getByRole("definition");
    await expect(summary.filter({ hasText: "$12,450.75" }).first()).toBeVisible();
    await expect(summary.filter({ hasText: "Mariana Soto" })).toBeVisible();
    await expect(summary.filter({ hasText: "CLABE •••• 7899" })).toBeVisible();
    await expect(summary.filter({ hasText: "Renta" })).toBeVisible();
    await expect(summary.last()).toHaveText("$0.00");
  });

  test("Enter en el monto envía el formulario de la transacción", async ({ page }) => {
    await openTransfer(page);
    await chooseContact(page, "Carlos Núñez");
    await amountField(page).pressSequentially("50");

    await amountField(page).press("Enter");

    await expect(page).toHaveURL(/\/transfer\/review$/);
  });

  test("[SPEC-TX-AC08] editar desde el resumen conserva el borrador", async ({ page }) => {
    await openTransfer(page);
    await amountField(page).pressSequentially("1500");
    await chooseContact(page, "Luis Pérez");
    await page.getByLabel("Concepto (opcional)").fill("Cena");
    await continueButton(page).click();
    await expect(page).toHaveURL(/\/transfer\/review$/);

    await page.getByRole("button", { name: "Editar" }).click();

    await expect(page).toHaveURL(/\/transfer$/);
    await expect(amountField(page)).toHaveValue("1,500.00");
    await expect(page.getByRole("radio", { name: /Luis Pérez/ })).toBeChecked();
    await expect(page.getByLabel("Concepto (opcional)")).toHaveValue("Cena");
  });

  test("[SPEC-TX-AC09] al recargar el resumen vuelve a /transfer sin borrador", async ({ page }) => {
    await openTransfer(page);
    await amountField(page).pressSequentially("100");
    await chooseContact(page, "Mariana Soto");
    await continueButton(page).click();
    await expect(page).toHaveURL(/\/transfer\/review$/);

    await page.reload();

    await expect(page).toHaveURL(/\/transfer$/);
    await expect(amountField(page)).toHaveValue("");
  });

  test("[SPEC-TX-AC10] cancelar vuelve al Home y descarta el borrador", async ({ page }) => {
    await openTransfer(page);
    await amountField(page).pressSequentially("100");
    await chooseContact(page, "Mariana Soto");

    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("heading", { name: "Hola, Ana" })).toBeVisible();

    await page.getByRole("link", { name: "Nueva transacción" }).click();
    await expect(amountField(page)).toHaveValue("");
    await expect(page.getByRole("radio", { name: /Mariana Soto/ })).not.toBeChecked();
  });

  test("[SPEC-TX-AC11] cerrar sesión descarta el borrador para el siguiente usuario", async ({ page }) => {
    await openTransfer(page);
    await amountField(page).pressSequentially("777");
    await page.getByRole("button", { name: "Nuevo contacto" }).click();
    await newContactForm(page).getByLabel("Nombre").fill("Borrador de Ana");

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login$/);
    // El cierre de sesión recarga el documento: se espera a que React hidrate antes de escribir.
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Teléfono o email").fill("luis@miniwallet.dev");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await page.getByRole("link", { name: "Nueva transacción" }).click();

    await expect(page.getByText("Aún no tienes contactos guardados")).toBeVisible();
    await expect(amountField(page)).toHaveValue("");
    await expect(newContactForm(page).getByLabel("Nombre")).toHaveValue("");
    await expect(page.getByText("Saldo disponible: $3,000.00")).toBeVisible();
  });

  test("[SPEC-TX-AC12] sin saldo disponible muestra el error y permite reintentar", async ({ page }) => {
    await loginAs(page, "ana@miniwallet.dev");
    await page.route("**/*", (route) =>
      route.continue({
        headers: { ...route.request().headers(), "x-mock-scenario": "WALLET_UNAVAILABLE" },
      }),
    );
    await page.goto("/transfer");

    await expect(page.getByText("No pudimos cargar tu información")).toBeVisible();
    await expect(amountField(page)).toHaveCount(0);

    await page.unroute("**/*");
    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(amountField(page)).toBeVisible();
  });

  test("[SPEC-TX-AC13] el flujo cabe en el viewport sin scroll horizontal", async ({ page }) => {
    await openTransfer(page);
    await page.getByRole("button", { name: "Nuevo contacto" }).click();
    await newContactForm(page).getByText("CLABE", { exact: true }).click();
    await newContactForm(page).getByLabel("Número de CLABE").pressSequentially("012180001234567899");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("SPEC-CT — Contactos", () => {
  test("[SPEC-CT-AC01] lista los favoritos en orden alfabético con la cuenta enmascarada", async ({
    page,
  }) => {
    await openTransfer(page);
    const seedNames = ["Carlos Núñez", "Luis Pérez", "Mariana Soto"];
    const options = page.getByRole("radiogroup", { name: "Contactos favoritos" }).getByRole("radio");

    // Otras pruebas agregan contactos en paralelo: se verifica el orden relativo de los de demostración.
    const labels = await options.evaluateAll((inputs) =>
      inputs.map((input) => input.closest("label")?.textContent ?? ""),
    );
    const listedSeeds = labels.flatMap((label) => seedNames.filter((name) => label.includes(name)));
    expect(listedSeeds).toEqual(seedNames);

    await expect(page.getByText("Banorte · Tarjeta •••• 5675")).toBeVisible();
    await expect(page.getByText("Mini Wallet · Celular •••• 4321")).toBeVisible();
    await expect(page.getByText("BBVA · CLABE •••• 7899")).toBeVisible();
  });

  test("[SPEC-CT-AC02] un usuario sin contactos ve el estado vacío y el alta", async ({ page }) => {
    await openTransfer(page, "luis@miniwallet.dev");

    await expect(page.getByText("Aún no tienes contactos guardados")).toBeVisible();
    await expect(newContactForm(page)).toBeVisible();
    await expect(newContactForm(page).getByRole("button", { name: "Cancelar" })).toHaveCount(0);
  });

  test("[SPEC-CT-AC04] cada tipo de cuenta usa su máscara y solo acepta dígitos", async ({ page }) => {
    await openTransfer(page);
    await page.getByRole("button", { name: "Nuevo contacto" }).click();
    const form = newContactForm(page);

    const phone = form.getByLabel("Número de celular");
    await phone.pressSequentially("55a1234-5678");
    await expect(phone).toHaveValue("55 1234 5678");
    await phone.pressSequentially("9");
    await expect(phone).toHaveValue("55 1234 5678");

    await form.getByText("Tarjeta", { exact: true }).click();
    const card = form.getByLabel("Número de tarjeta");
    await expect(card).toHaveValue("");
    await card.pressSequentially("4915600212345675");
    await expect(card).toHaveValue("4915 6002 1234 5675");

    await form.getByText("CLABE", { exact: true }).click();
    const clabe = form.getByLabel("Número de CLABE");
    await clabe.pressSequentially("012180001234567899");
    await expect(clabe).toHaveValue("012 180 0012 3456 7899");
  });

  test("[SPEC-CT-AC05] valida los campos sin llamar al API", async ({ page }) => {
    await openTransfer(page);
    await page.getByRole("button", { name: "Nuevo contacto" }).click();
    const form = newContactForm(page);
    let contactRequests = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/api/contacts") && request.method() === "POST") contactRequests += 1;
    });

    await form.getByLabel("Número de celular").pressSequentially("551234567");
    await form.getByRole("button", { name: "Guardar contacto" }).click();

    await expect(form.getByText("Ingresa el nombre del contacto.")).toBeVisible();
    await expect(form.getByText("El celular debe tener 10 dígitos.")).toBeVisible();
    await expect(form.getByText("Selecciona el banco.")).toBeVisible();
    await expect(form.getByLabel("Nombre")).toBeFocused();

    await form.getByText("Tarjeta", { exact: true }).click();
    await form.getByLabel("Número de tarjeta").pressSequentially("4915600212345670");
    await form.getByRole("button", { name: "Guardar contacto" }).click();
    await expect(form.getByText("El número de tarjeta no es válido.")).toBeVisible();
    expect(contactRequests).toBe(0);
  });

  test("[SPEC-CT-AC03] un contacto nuevo queda guardado y seleccionado", async ({ page }) => {
    await openTransfer(page);
    const card = uniqueCardNumber();
    const name = `Contacto ${card.slice(-6)}`;

    await page.getByRole("button", { name: "Nuevo contacto" }).click();
    await createCardContact(page, name, card);

    await expect(newContactForm(page)).toHaveCount(0);
    const option = page.getByRole("radio", { name: new RegExp(name) });
    await expect(option).toBeChecked();
    await expect(page.getByText(`HSBC · Tarjeta •••• ${card.slice(-4)}`)).toBeVisible();

    await page.reload();
    await expect(page.getByRole("radio", { name: new RegExp(name) })).toBeVisible();
  });

  test("[SPEC-CT-AC06] rechaza una cuenta duplicada", async ({ page }) => {
    await openTransfer(page);
    await page.getByRole("button", { name: "Nuevo contacto" }).click();

    await createCardContact(page, "Carlos Duplicado", "4915600212345675");

    const form = newContactForm(page);
    await expect(form.getByText("Ya tienes un contacto con esa cuenta.")).toBeVisible();
    await expect(form.getByLabel("Número de tarjeta")).toHaveValue(formatCard("4915600212345675"));
    await expect(page.getByText("Carlos Duplicado")).toHaveCount(0);
  });

  test("[SPEC-CT-AC07] los contactos de un usuario no los ve otro", async ({ page }) => {
    await openTransfer(page);
    const card = uniqueCardNumber();
    const name = `Privado ${card.slice(-6)}`;
    await page.getByRole("button", { name: "Nuevo contacto" }).click();
    await createCardContact(page, name, card);
    await expect(page.getByRole("radio", { name: new RegExp(name) })).toBeChecked();

    await page.context().clearCookies();
    await openTransfer(page, "luis@miniwallet.dev");

    await expect(page.getByText(name)).toHaveCount(0);
  });
});

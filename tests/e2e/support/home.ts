import type { Page } from "@playwright/test";

export function balance(page: Page) {
  return page.getByRole("definition");
}

export function movementItems(page: Page) {
  return page.getByRole("list", { name: "Movimientos recientes" }).getByRole("listitem");
}

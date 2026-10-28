import { expect, type Page } from "@playwright/test";

export async function loginAs(page: Page, identifier: string) {
  const response = await page.request.post("/api/auth", { data: { identifier } });
  expect(response.ok()).toBe(true);
}

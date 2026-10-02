import { type Page } from "@playwright/test";

export async function chooseLevel(page: Page, level: number): Promise<void> {
  await page
    .getByRole("button", { name: "Schwierigkeitsstufe", exact: true })
    .click();
  await page.locator(`input[name="difficulty"][value="${level}"]`).click();
}

export async function startLevel(page: Page, level: number): Promise<void> {
  await chooseLevel(page, level);
  await page.getByRole("button", { name: "Neue Kette" }).click();
}

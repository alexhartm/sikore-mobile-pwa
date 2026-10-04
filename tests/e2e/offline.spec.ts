import { expect, test } from "@playwright/test";

test("reopens the installed shell and engine while offline", async ({
  context,
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("#answer")).toBeEnabled();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator("#answer")).toBeEnabled();

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#answer")).toBeEnabled();
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);
});

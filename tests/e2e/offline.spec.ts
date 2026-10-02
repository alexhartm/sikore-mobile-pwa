import { expect, test } from "@playwright/test";

test("reopens the installed shell and engine while offline", async ({
  context,
  page,
}) => {
  await page.goto("./");
  await expect(page.getByText("Bereit", { exact: true })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByText("Bereit", { exact: true })).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("Bereit", { exact: true })).toBeVisible();
  await expect(page.getByText("offline", { exact: true })).toBeVisible();
});

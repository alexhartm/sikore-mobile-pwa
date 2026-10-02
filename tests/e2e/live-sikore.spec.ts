import { expect, test } from "@playwright/test";
import { startLevel } from "./helpers";

test("the current upstream runtime satisfies the adapter contract", async ({
  page,
}) => {
  test.skip(
    process.env.SIKORE_LIVE_TEST !== "1",
    "Set SIKORE_LIVE_TEST=1 to contact the upstream service.",
  );
  await page.goto("./");
  await expect(page.getByText("Bereit", { exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByLabel("Dein Ergebnis")).toBeEnabled();
  await expect(page.locator("#current-operation")).not.toHaveText("–");

  const firstResult = await page.evaluate(
    () => (window as Window & { results: number[] }).results[0],
  );
  await page.getByLabel("Dein Ergebnis").fill(String(firstResult));
  await page.getByRole("button", { name: "Prüfen" }).click();
  await expect(page.locator("#progress-text")).toHaveText("2 von 12");

  for (const level of [1, 2, 4, 17, 19, 39]) {
    await startLevel(page, level);
    await expect(page.getByLabel("Dein Ergebnis")).toBeEnabled();
    await expect(page.locator("#current-operation")).not.toHaveText("–");
  }
});

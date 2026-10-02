import { expect, test } from "@playwright/test";
import { chooseLevel, startLevel } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await expect(page.getByText("Bereit", { exact: true })).toBeVisible();
});

test("solves a chain and reports mistakes", async ({ page }) => {
  const answer = page.getByLabel("Dein Ergebnis");
  await expect(page.locator("#progress-bar")).toHaveAttribute("value", "0");

  await answer.fill("9");
  await page.getByRole("button", { name: "Prüfen" }).click();
  await expect(
    page.getByText("Noch nicht richtig. Versuch es noch einmal."),
  ).toBeVisible();
  await expect(page.locator("#success-animation")).not.toHaveClass(/is-active/);
  await expect(page.locator("#mistakes")).toHaveText("1");

  for (let value = 11; value <= 22; value += 1) {
    await answer.fill(String(value));
    await page.getByRole("button", { name: "Prüfen" }).click();
    if (value === 11) {
      await expect(page.locator("#success-animation")).toHaveClass(/is-active/);
      await expect(page.locator("#progress-bar")).toHaveAttribute("value", "1");
    }
  }

  await expect(page.getByText("Fertig", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Stark gerechnet!", { exact: false }),
  ).toBeVisible();
});

test("changes and persists the selected level", async ({ page }) => {
  await chooseLevel(page, 5);
  await expect(page.locator("#level-description")).toHaveText(
    "bis 100, plus und minus",
  );
  await page.reload();
  await expect(page.locator("#level-title")).toHaveText("Level 5");
});

test("uses school notation and stable layouts for each operation", async ({
  page,
}) => {
  const stage = page.locator("#problem-stage");

  await startLevel(page, 5);
  await expect(stage).toHaveAttribute("data-layout", "stacked");
  await expect(page.locator("#current-operation")).toHaveText("+ 1");

  await startLevel(page, 13);
  await expect(stage).toHaveAttribute("data-layout", "inline");
  await expect(page.locator("#current-operation")).toHaveText("· 4");

  await startLevel(page, 15);
  await expect(stage).toHaveAttribute("data-layout", "inline");
  await expect(page.locator("#current-operation")).toHaveText(": 2");
});

test("opens credits and returns to the trainer", async ({ page }) => {
  await page
    .getByRole("link", { name: "Informationen über SIKORE Mobile" })
    .click();
  await expect(
    page.getByRole("heading", { name: "SIKORE Mobile" }),
  ).toBeVisible();
  await expect(page.getByText("Christian Schiffner")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "SIKORE Mobile auf GitHub" }),
  ).toHaveAttribute("href", "https://github.com/alexhartm/sikore-mobile-pwa");

  await page.getByRole("link", { name: "Zurück zum Rechnen" }).click();
  await expect(page.locator("#trainer-view")).toBeVisible();
});

test("shows a recoverable error when the engine is unavailable", async ({
  page,
}) => {
  await page.route("**/fake-sikore.js", (route) => route.abort());
  await page.goto("./");
  await expect(
    page.getByText("Die SIKORE-Engine konnte nicht geladen werden."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Erneut versuchen" }),
  ).toBeVisible();

  await page.unroute("**/fake-sikore.js");
  await page.getByRole("button", { name: "Erneut versuchen" }).click();
  await expect(page.getByText("Bereit", { exact: true })).toBeVisible();
});

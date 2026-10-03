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

for (const width of [320, 390, 430]) {
  test(`shows the full completion message within the unchanged frame at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "20px";
    });
    const card = page.locator(".exercise-card");
    const initial = (await card.boundingBox())!;
    const answer = page.getByLabel("Dein Ergebnis");
    const submit = page.getByRole("button", { name: "Prüfen" });
    for (let value = 11; value <= 22; value++) {
      await answer.fill(String(value));
      await submit.click();
    }

    const feedback = page.locator("#feedback");
    await expect(feedback).toHaveAttribute("data-kind", "complete");
    await expect(answer).toBeHidden();
    await expect(submit).toBeHidden();
    const completed = (await card.boundingBox())!;
    expect(completed.width).toBe(initial.width);
    expect(completed.height).toBe(initial.height);
    // Chromium rounds text overflow and element height differently by 1px.
    expect(
      await feedback.evaluate(
        (element) => element.scrollHeight - element.clientHeight,
      ),
    ).toBeLessThanOrEqual(1);
    const message = (await feedback.boundingBox())!;
    expect(message.y).toBeGreaterThanOrEqual(completed.y);
    expect(message.y + message.height).toBeLessThanOrEqual(
      completed.y + completed.height,
    );

    await page.getByRole("button", { name: "Neue Kette" }).click();
    await expect(answer).toBeVisible();
    await expect(answer).toBeEnabled();
    await expect(submit).toBeVisible();
    expect((await card.boundingBox())!.height).toBe(initial.height);
  });
}

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

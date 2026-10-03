import { expect, test, type Page } from "@playwright/test";
import { chooseLevel, startLevel } from "./helpers";

test.use({ reducedMotion: "reduce" });

async function finishChain(page: Page): Promise<void> {
  const answer = page.getByLabel("Dein Ergebnis");
  for (let result = 11; result <= 22; result++) {
    await answer.fill(String(result));
    await page.getByRole("button", { name: "Prüfen", exact: true }).click();
  }
  await expect(page.locator("#completion-actions")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-03T10:00:00Z"));
  await page.goto("./");
  await expect(page.getByText("Bereit", { exact: true })).toBeVisible();
});

test("shows mistakes, solved tasks and final duration in the requested order", async ({
  page,
}) => {
  const answer = page.getByLabel("Dein Ergebnis");
  for (let attempt = 0; attempt < 2; attempt++) {
    await answer.fill("9");
    await page.getByRole("button", { name: "Prüfen", exact: true }).click();
  }
  await page.clock.setFixedTime(new Date("2026-10-03T10:00:17Z"));
  await finishChain(page);

  await expect(page.locator("#completion-stats dt")).toHaveText([
    "Fehler",
    "Richtig gelöst",
    "Dauer",
  ]);
  await expect(page.locator("#completion-mistakes")).toHaveText("2");
  await expect(page.locator("#completion-mistakes-hint")).toHaveText(
    "falsche Versuche",
  );
  await expect(page.locator("#completion-correct")).toHaveText("12");
  await expect(page.locator("#completion-total")).toHaveText("/ 12");
  await expect(page.locator("#completion-correct-hint")).toHaveText(
    "mit Korrektur",
  );
  await expect(page.locator("#completion-elapsed")).toHaveText("17 s");
  await page.clock.setFixedTime(new Date("2026-10-03T10:00:40Z"));
  await expect(page.locator("#completion-elapsed")).toHaveText("17 s");
  await expect(page.getByRole("button", { name: "Nochmal" })).toBeFocused();
});

test("repeats the completed level and resets the round despite a pending selection", async ({
  page,
}) => {
  await startLevel(page, 1);
  await chooseLevel(page, 5);
  await page.getByLabel("Dein Ergebnis").fill("9");
  await page.getByRole("button", { name: "Prüfen", exact: true }).click();
  await page.clock.setFixedTime(new Date("2026-10-03T10:00:17Z"));
  await finishChain(page);
  await page.getByRole("button", { name: "Nochmal", exact: true }).click();

  await expect(page.locator("#progress-level")).toHaveText("Level 1");
  await expect(page.locator("#level-title")).toHaveText("Level 1");
  await expect(page.locator("#progress-bar")).toHaveAttribute("value", "0");
  await expect(page.locator("#mistakes")).toHaveText("0");
  await expect(page.locator("#elapsed")).toHaveText("0 s");
  await expect(page.locator("#completion-stats")).toBeHidden();
  await expect(page.locator("#completion-actions")).toBeHidden();
  await expect(page.locator("#level-hint")).toBeHidden();
  await expect(page.getByLabel("Dein Ergebnis")).toBeFocused();
  await expect(page.getByLabel("Dein Ergebnis")).toBeEnabled();
  await page.reload();
  await expect(page.locator("#progress-level")).toHaveText("Level 1");
});

test("starts and persists the level after the completed one", async ({
  page,
}) => {
  await startLevel(page, 5);
  await chooseLevel(page, 10);
  await finishChain(page);
  await page.getByRole("button", { name: "Nächstes Level" }).click();

  await expect(page.locator("#progress-level")).toHaveText("Level 6");
  await expect(page.locator("#level-title")).toHaveText("Level 6");
  await expect(page.locator("#level-description")).toHaveText(
    "bis 100, mal und geteilt bis 10",
  );
  await expect(page.locator("#progress-bar")).toHaveAttribute("value", "0");
  await expect(page.locator("#completion-actions")).toBeHidden();
  await expect(page.getByLabel("Dein Ergebnis")).toBeFocused();
  await page.reload();
  await expect(page.locator("#progress-level")).toHaveText("Level 6");
});

test("keeps repetition available at the final level", async ({ page }) => {
  await startLevel(page, 39);
  await finishChain(page);
  await expect(page.locator("#next-level")).toBeHidden();
  const repeat = page.getByRole("button", { name: "Nochmal", exact: true });
  await expect(repeat).toBeVisible();
  await repeat.click();
  await expect(page.locator("#progress-level")).toHaveText("Level 39");
  await expect(page.locator("#completion-actions")).toBeHidden();
});

for (const size of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
]) {
  test(`fits the complete result and actions in the unchanged frame at ${size.width}x${size.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(size);
    const card = page.locator(".exercise-card");
    const initial = (await card.boundingBox())!;
    await page.clock.setFixedTime(new Date("2026-10-03T10:03:07Z"));
    await finishChain(page);
    const completed = (await card.boundingBox())!;
    expect(completed.width).toBe(initial.width);
    expect(completed.height).toBe(initial.height);
    expect(
      await card.evaluate((element) => ({
        x: element.scrollWidth - element.clientWidth,
        y: element.scrollHeight - element.clientHeight,
      })),
    ).toEqual({ x: 0, y: 0 });
    for (const selector of [
      ".calculation",
      "#feedback",
      "#completion-stats",
      "#completion-actions",
    ]) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(completed.x);
      expect(box.y).toBeGreaterThanOrEqual(completed.y);
      expect(box.x + box.width).toBeLessThanOrEqual(
        completed.x + completed.width,
      );
      expect(box.y + box.height).toBeLessThanOrEqual(
        completed.y + completed.height,
      );
    }
    await expect(page.locator("#completion-elapsed")).toHaveText("3:07 min");
    await page.screenshot({ path: testInfo.outputPath("completion.png") });
    await page.getByRole("button", { name: "Nochmal", exact: true }).click();
    const restarted = (await card.boundingBox())!;
    expect(restarted.width).toBe(initial.width);
    expect(restarted.height).toBe(initial.height);
  });
}

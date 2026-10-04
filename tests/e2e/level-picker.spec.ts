import { expect, test } from "@playwright/test";
import { chooseLevel } from "./helpers";

test("selects the next level without resetting an ongoing chain", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("#answer")).toBeEnabled();
  await page.getByLabel("Dein Ergebnis").fill("11");
  await page.getByRole("button", { name: "Prüfen" }).click();
  await expect(page.locator("#progress-text")).toHaveText("2 von 12");
  await chooseLevel(page, 13);
  await expect(page.locator("#level-dialog")).not.toBeVisible();
  await expect(page.locator("#level-select")).toBeFocused();
  await expect(page.locator("#level-hint")).toBeVisible();
  await expect(page.locator("#progress-text")).toHaveText("2 von 12");
  await expect(page.locator("#current-operation")).toHaveText("+ 1");
  await page.getByRole("button", { name: "Neue Kette" }).click();
  await expect(page.locator("#progress-text")).toHaveText("1 von 12");
  await expect(page.locator("#current-operation")).toHaveText("· 4");
  await expect(page.locator("#level-hint")).toBeHidden();
});

test("closes with Escape, the close button and the backdrop", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("#answer")).toBeEnabled();
  const trigger = page.getByRole("button", {
    name: "Schwierigkeitsstufe",
    exact: true,
  });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await page.getByRole("button", { name: "Auswahl schließen" }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(5, 5);
  await expect(page.locator("#level-dialog")).not.toBeVisible();
  await expect(page.locator("#level-title")).toHaveText("Level 12");
});

for (const width of [320, 390, 430]) {
  test(`shows complete descriptions and the selected level at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.addInitScript(() =>
      localStorage.setItem("sikore-mobile-level", "6"),
    );
    await page.goto("./");
    await expect(page.locator("#answer")).toBeEnabled();
    await expect(page.locator("#level-description")).toHaveText(
      "bis 100, mal und geteilt bis 10",
    );
    await page
      .getByRole("button", { name: "Schwierigkeitsstufe", exact: true })
      .click();
    await expect(page.getByRole("radio")).toHaveCount(39);
    const selected = page.locator('input[value="6"]');
    await expect(selected).toBeChecked();
    await expect(selected).toBeFocused();
    const option = selected.locator("..");
    await expect(option).toContainText("bis 100, mal und geteilt bis 10");
    const listBox = (await page.locator("#level-options").boundingBox())!;
    const selectedBox = (await option.boundingBox())!;
    expect(selectedBox.y).toBeGreaterThanOrEqual(listBox.y);
    expect(selectedBox.y + selectedBox.height).toBeLessThanOrEqual(
      listBox.y + listBox.height,
    );
    expect(
      await page
        .locator("#level-options")
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("level-picker.png") });
    await page.locator('input[value="39"]').click();
    await expect(page.locator("#level-title")).toHaveText("Level 39");
    expect(
      await page
        .locator("#level-select")
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Schwierigkeitsstufe", exact: true })
      .click();
    await expect(page.locator('input[value="39"]')).toBeFocused();
    await page.locator('input[value="39"]').click();
    await expect(page.locator("#level-dialog")).not.toBeVisible();
  });
}

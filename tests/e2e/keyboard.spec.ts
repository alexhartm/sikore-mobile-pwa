import { expect, test, type Page } from "@playwright/test";

async function resizeVisibleArea(page: Page, height: number, offsetTop = 0) {
  await page.evaluate(
    ({ height, offsetTop }) => {
      const viewport = window.visualViewport!;
      Object.defineProperty(viewport, "height", {
        value: height,
        configurable: true,
      });
      Object.assign(viewport, { offsetTop });
      viewport.dispatchEvent(new Event("resize"));
      viewport.dispatchEvent(new Event("scroll"));
    },
    { height, offsetTop },
  );
}

// Browser automation does not open the real iOS keyboard. Simulate its
// viewport events to verify geometry and interaction; device testing remains
// necessary for the operating system's animation and focus behavior.
for (const size of [
  { width: 320, height: 568, visible: 300 },
  { width: 390, height: 844, visible: 440 },
  { width: 430, height: 932, visible: 530 },
  { width: 844, height: 390, visible: 210 },
]) {
  test(`keeps rapid entry visible at ${size.width}x${size.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.addInitScript(() => {
      Object.defineProperty(window, "visualViewport", {
        value: Object.assign(
          Object.defineProperties(new EventTarget(), {
            height: { get: () => window.innerHeight, configurable: true },
            width: { get: () => window.innerWidth },
          }),
          {
            offsetTop: 0,
            offsetLeft: 0,
            scale: 1,
          },
        ),
        configurable: true,
      });
    });
    await page.goto("./");
    await expect(page.locator("#answer")).toBeEnabled();
    const answer = page.getByLabel("Dein Ergebnis");
    const submit = page.getByRole("button", { name: "Prüfen" });
    await answer.focus();
    await resizeVisibleArea(page, size.visible, 24);
    await expect(page.locator("html")).toHaveClass(/keyboard-open/);

    for (const level of ["5", "13", "15"]) {
      // Settings are intentionally hidden while typing; change the selection
      // programmatically to exercise both notation layouts in the same mode.
      await page
        .locator(`input[name="difficulty"][value="${level}"]`)
        .evaluate((element) => {
          (element as HTMLInputElement).checked = true;
          element.dispatchEvent(new Event("change"));
        });
      await page
        .locator("#new-chain")
        .evaluate((element) => (element as HTMLButtonElement).click());
      for (const selector of [
        ".calculation",
        "#answer",
        "#submit-answer",
        "#feedback",
      ]) {
        const box = await page.locator(selector).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.y).toBeGreaterThanOrEqual(24);
        expect(box!.y + box!.height).toBeLessThanOrEqual(24 + size.visible);
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
      }
      if (level === "13") {
        await answer.fill("998999001");
        expect(
          await answer.evaluate(
            (element) => element.scrollWidth <= element.clientWidth,
          ),
        ).toBe(true);
      }
    }

    await page
      .locator('input[name="difficulty"][value="5"]')
      .evaluate((element) => {
        (element as HTMLInputElement).checked = true;
        element.dispatchEvent(new Event("change"));
      });
    await page
      .locator("#new-chain")
      .evaluate((element) => (element as HTMLButtonElement).click());
    const originalButton = await submit.boundingBox();
    await answer.fill("9");
    await submit.click();
    await expect(answer).toBeFocused();
    await expect(answer).toHaveValue("9");
    await expect(page.locator("#feedback")).toContainText("Noch nicht richtig");
    expect(await submit.boundingBox()).toEqual(originalButton);

    for (let value = 11; value <= 13; value++) {
      await answer.fill(String(value));
      await submit.click();
      await expect(answer).toBeFocused();
      await expect(answer).toHaveValue("");
      await expect(page.locator("html")).toHaveClass(/keyboard-open/);
      expect(await submit.boundingBox()).toEqual(originalButton);
      await expect(page.locator("#success-animation")).toBeVisible();
    }

    // Dismissal can leave the input focused on iOS.
    await resizeVisibleArea(page, size.height);
    await expect(page.locator("html")).not.toHaveClass(/keyboard-open/);
    await resizeVisibleArea(page, size.visible);
    await expect(page.locator("html")).toHaveClass(/keyboard-open/);
    for (let value = 14; value <= 22; value++) {
      await answer.fill(String(value));
      await submit.click();
    }
    await expect(page.getByText("Fertig", { exact: true })).toBeVisible();
    await expect(page.locator("html")).not.toHaveClass(/keyboard-open/);
    await expect(
      page.getByRole("button", { name: "Neue Kette" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Nochmal", exact: true }),
    ).toBeFocused();
  });
}

import { expect, test } from "@playwright/test";

// Compare the layout itself, without the initial page entrance animation.
test.use({ reducedMotion: "reduce" });

for (const size of [
  { width: 320, height: 568, keyboard: false },
  { width: 390, height: 844, keyboard: false },
  { width: 844, height: 390, keyboard: false },
  { width: 390, height: 844, keyboard: true },
]) {
  test(`keeps frame and submit fixed across mixed operations (${size.width}, keyboard ${size.keyboard})`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto("./");
    await expect(page.locator("#answer")).toBeEnabled();
    await page.evaluate(() => {
      const runtime = window as unknown as {
        erzeuge_blatt: () => void;
        curpos: number;
        kettenstart: number[];
        kettenoperands: number[][];
        kettenoperations: number[][];
        results: number[];
      };
      runtime.erzeuge_blatt = () => {
        runtime.curpos = 0;
        runtime.kettenstart = [4];
        runtime.kettenoperands = [[4, 4, 4, 2, 3, 1, 2, 4, 6, 1, 3, 1]];
        runtime.kettenoperations = [[2, 0, 3, 1, 2, 0, 3, 2, 1, 0, 3, 0]];
        runtime.results = [16, 20, 5, 3, 9, 10, 5, 20, 14, 15, 5, 6];
      };
    });
    await page.getByRole("button", { name: "Neue Kette" }).click();
    const answer = page.getByLabel("Dein Ergebnis");
    if (size.keyboard) {
      await page.evaluate(() => {
        Object.defineProperty(window.visualViewport, "height", {
          value: 440,
          configurable: true,
        });
        window.visualViewport!.dispatchEvent(new Event("resize"));
      });
      await expect(page.locator("html")).toHaveClass(/keyboard-open/);
    }
    const geometry = async () =>
      page.evaluate(() => {
        return [".exercise-card", "#submit-answer"].map((selector) => {
          const rect = document
            .querySelector(selector)!
            .getBoundingClientRect();
          return {
            x: rect.x + window.scrollX,
            y: rect.y + window.scrollY,
            width: rect.width,
            height: rect.height,
          };
        });
      });
    const initial = await geometry();
    for (const result of [16, 20, 5, 3, 9, 10, 5, 20, 14, 15, 5]) {
      await answer.fill("999");
      await page.getByRole("button", { name: "Prüfen" }).click();
      expect(await geometry()).toEqual(initial);
      if (
        !size.keyboard &&
        (await page.locator("#problem-stage").getAttribute("data-layout")) ===
          "stacked"
      ) {
        const operation = (await page
          .locator("#current-operation")
          .boundingBox())!;
        const input = (await answer.boundingBox())!;
        expect(operation.y + operation.height).toBeLessThanOrEqual(input.y);
      }
      await answer.fill(String(result));
      await page.getByRole("button", { name: "Prüfen" }).click();
      expect(await geometry()).toEqual(initial);
    }
  });
}

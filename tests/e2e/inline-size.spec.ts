import { expect, test } from "@playwright/test";

for (const width of [320, 390, 430]) {
  test(`centers and fits the whole equation at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./");
    await expect(page.getByText("Bereit", { exact: true })).toBeVisible();
    const sizes: number[] = [];
    for (const step of [
      { value: 4, operand: 4, operation: 2, result: 16 },
      { value: 2, operand: 500, operation: 2, result: 1000 },
      { value: 500, operand: 2, operation: 3, result: 250 },
      { value: 999999, operand: 999, operation: 2, result: 998999001 },
    ]) {
      await page.evaluate((step) => {
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
          runtime.kettenstart = [step.value];
          runtime.kettenoperands = [Array(12).fill(step.operand)];
          runtime.kettenoperations = [Array(12).fill(step.operation)];
          runtime.results = Array(12).fill(step.result);
        };
      }, step);
      await page.getByRole("button", { name: "Neue Kette" }).click();
      await expect(page.locator("#problem-stage")).toHaveAttribute(
        "data-layout",
        "inline",
      );
      const calculation = (await page.locator(".calculation").boundingBox())!;
      const answer = (await page.locator("#answer").boundingBox())!;
      const stage = (await page.locator("#problem-stage").boundingBox())!;
      expect(calculation.x).toBeGreaterThanOrEqual(stage.x);
      expect(answer.x + answer.width).toBeLessThanOrEqual(
        stage.x + stage.width,
      );
      expect(
        Math.abs(
          (calculation.x + answer.x + answer.width) / 2 -
            (stage.x + stage.width / 2),
        ),
      ).toBeLessThan(1);
      const fontSize = await page
        .locator(".calculation")
        .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
      sizes.push(fontSize);
      await page.getByLabel("Dein Ergebnis").fill(String(step.result));
      expect(
        await page
          .locator("#answer")
          .evaluate((element) => element.scrollWidth <= element.clientWidth),
      ).toBe(true);
      if (width === 390 && step.value === 4) {
        await page.screenshot({
          path: testInfo.outputPath("inline-small.png"),
        });
      }
    }
    expect(sizes[0]).toBeGreaterThan(sizes[1]);
    // Equal task lengths, but multiplication needs an extra solution digit.
    expect(sizes[1]).toBeLessThan(sizes[2]);
    expect(sizes[2]).toBeGreaterThan(sizes[3]);
  });
}

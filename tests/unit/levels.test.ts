import { describe, expect, it } from "vitest";
import {
  DEFAULT_LEVEL,
  LEVELS,
  describeLevel,
  getLevel,
} from "../../src/app/levels";

describe("SIKORE level presets", () => {
  it("contains all published levels in order", () => {
    expect(LEVELS).toHaveLength(39);
    expect(LEVELS[0]).toMatchObject({
      id: 1,
      engineValue: "10",
      maxResult: 10,
      maxFactor: null,
    });
    expect(LEVELS[38]).toMatchObject({
      id: 39,
      engineValue: "999999M999",
      maxResult: 999999,
      maxFactor: 999,
    });
  });

  it("maps the default preset to the original Level 12 settings", () => {
    expect(getLevel(DEFAULT_LEVEL)).toMatchObject({
      engineValue: "500M10",
      maxResult: 500,
      maxPlusMinus: 250,
      maxFactor: 10,
    });
  });

  it("describes no-carry and multiplication levels", () => {
    expect(describeLevel(getLevel(2))).toBe("bis 19, ohne Übertrag");
    expect(describeLevel(getLevel(12))).toBe("bis 500, mal und geteilt bis 10");
  });

  it("rejects unknown levels", () => {
    expect(() => getLevel(0)).toThrow(RangeError);
    expect(() => getLevel(40)).toThrow(RangeError);
  });
});

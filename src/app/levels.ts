export interface LevelPreset {
  readonly id: number;
  readonly engineValue: string;
  readonly maxResult: number;
  readonly maxPlusMinus: number;
  readonly maxFactor: number | null;
}

const engineValues = [
  "10",
  "19",
  "20",
  "99",
  "100",
  "100M10",
  "200",
  "200M10",
  "250",
  "250M15",
  "500",
  "500M10",
  "500M20",
  "1000",
  "1000M10",
  "1000M20",
  "1000M30",
  "2000",
  "2000M20",
  "2000M30",
  "2000M40",
  "5000",
  "5000M30",
  "5000M50",
  "5000M70",
  "10000",
  "10000M30",
  "10000M50",
  "10000M100",
  "100000",
  "100000M50",
  "100000M100",
  "100000M300",
  "500000",
  "500000M100",
  "500000M300",
  "500000M500",
  "999999",
  "999999M999",
] as const;

function nextSupportedPlusMinus(value: number): number {
  const supported = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65,
    70, 75, 80, 85, 90, 95, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500,
    550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 2000, 2500, 3000, 4000,
    5000, 6000, 7000, 8000, 9000, 10000, 20000, 25000, 30000, 40000, 50000,
    60000, 70000, 80000, 90000, 100000, 200000, 250000, 300000, 400000, 499999,
  ];
  return supported.find((candidate) => candidate >= value) ?? supported.at(-1)!;
}

export const LEVELS: readonly LevelPreset[] = engineValues.map(
  (engineValue, index) => {
    const [maximum, factor] = engineValue.split("M").map(Number);
    if (maximum === undefined)
      throw new Error(`Invalid SIKORE level value: ${engineValue}`);

    return {
      id: index + 1,
      engineValue,
      maxResult: maximum,
      maxPlusMinus: nextSupportedPlusMinus(Math.floor(maximum / 2)),
      maxFactor: factor ?? null,
    };
  },
);

export const DEFAULT_LEVEL = 12;

export function getLevel(levelId: number): LevelPreset {
  const level = LEVELS[levelId - 1];
  if (!level) throw new RangeError(`Unknown level: ${levelId}`);
  return level;
}

export function describeLevel(level: LevelPreset): string {
  if (level.engineValue === "19" || level.engineValue === "99") {
    return `bis ${level.maxResult}, ohne Übertrag`;
  }
  if (level.maxFactor === null) return `bis ${level.maxResult}, plus und minus`;
  return `bis ${level.maxResult}, mal und geteilt bis ${level.maxFactor}`;
}

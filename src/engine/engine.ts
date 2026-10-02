import type { LevelPreset } from "../app/levels";

export const CHAIN_LENGTH = 12;

export type OperationSymbol = "+" | "−" | "·" | ":";

export interface ExerciseStep {
  readonly value: number;
  readonly operation: OperationSymbol;
  readonly operand: number;
}

export interface EngineSnapshot {
  readonly position: number;
  readonly total: number;
  readonly mistakes: number;
  readonly completed: boolean;
  readonly step: ExerciseStep | null;
}

export interface AnswerResult {
  readonly correct: boolean;
  readonly snapshot: EngineSnapshot;
}

export interface ArithmeticEngine {
  load(): Promise<void>;
  start(level: LevelPreset): EngineSnapshot;
  submit(answer: number): AnswerResult;
}

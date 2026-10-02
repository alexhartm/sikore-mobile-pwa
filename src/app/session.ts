import type { LevelPreset } from "./levels";
import type { ArithmeticEngine, EngineSnapshot } from "../engine/engine";

export type Feedback = "idle" | "correct" | "incorrect" | "invalid";

export interface SessionState {
  readonly snapshot: EngineSnapshot;
  readonly feedback: Feedback;
  readonly startedAt: number;
  readonly elapsedSeconds: number;
}

export class ExerciseSession {
  readonly #engine: ArithmeticEngine;
  #state: SessionState | null = null;

  constructor(engine: ArithmeticEngine) {
    this.#engine = engine;
  }

  start(level: LevelPreset, now = Date.now()): SessionState {
    this.#state = {
      snapshot: this.#engine.start(level),
      feedback: "idle",
      startedAt: now,
      elapsedSeconds: 0,
    };
    return this.#state;
  }

  submit(rawAnswer: string, now = Date.now()): SessionState {
    if (!this.#state)
      throw new Error("Es wurde noch keine Rechenkette gestartet.");
    const answer = rawAnswer.trim();
    if (!/^-?\d+$/.test(answer)) {
      this.#state = { ...this.#state, feedback: "invalid" };
      return this.#state;
    }

    const result = this.#engine.submit(Number(answer));
    this.#state = {
      ...this.#state,
      snapshot: result.snapshot,
      feedback: result.correct ? "correct" : "incorrect",
      elapsedSeconds: Math.max(
        0,
        Math.floor((now - this.#state.startedAt) / 1000),
      ),
    };
    return this.#state;
  }
}

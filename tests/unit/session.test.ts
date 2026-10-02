import { describe, expect, it } from "vitest";
import { getLevel } from "../../src/app/levels";
import { ExerciseSession } from "../../src/app/session";
import type {
  AnswerResult,
  ArithmeticEngine,
  EngineSnapshot,
} from "../../src/engine/engine";

class FakeEngine implements ArithmeticEngine {
  snapshot: EngineSnapshot = {
    position: 0,
    total: 2,
    mistakes: 0,
    completed: false,
    step: { value: 10, operation: "+", operand: 2 },
  };

  async load(): Promise<void> {}

  start(): EngineSnapshot {
    return this.snapshot;
  }

  submit(answer: number): AnswerResult {
    if (answer !== 12) {
      this.snapshot = {
        ...this.snapshot,
        mistakes: this.snapshot.mistakes + 1,
      };
      return { correct: false, snapshot: this.snapshot };
    }
    this.snapshot = {
      position: 1,
      total: 2,
      mistakes: this.snapshot.mistakes,
      completed: false,
      step: { value: 12, operation: "−", operand: 3 },
    };
    return { correct: true, snapshot: this.snapshot };
  }
}

describe("ExerciseSession", () => {
  it("starts with idle feedback", () => {
    const session = new ExerciseSession(new FakeEngine());
    const state = session.start(getLevel(12), 1_000);
    expect(state.feedback).toBe("idle");
    expect(state.startedAt).toBe(1_000);
  });

  it("rejects non-integer input without calling the engine", () => {
    const engine = new FakeEngine();
    const session = new ExerciseSession(engine);
    session.start(getLevel(12));
    const state = session.submit("12.5");
    expect(state.feedback).toBe("invalid");
    expect(state.snapshot.mistakes).toBe(0);
  });

  it("tracks incorrect and correct submissions", () => {
    const session = new ExerciseSession(new FakeEngine());
    session.start(getLevel(12), 1_000);

    const incorrect = session.submit("11", 2_500);
    expect(incorrect.feedback).toBe("incorrect");
    expect(incorrect.snapshot.mistakes).toBe(1);

    const correct = session.submit("12", 4_900);
    expect(correct.feedback).toBe("correct");
    expect(correct.snapshot.position).toBe(1);
    expect(correct.elapsedSeconds).toBe(3);
  });
});

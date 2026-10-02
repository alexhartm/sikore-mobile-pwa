import type { LevelPreset } from "../app/levels";
import {
  CHAIN_LENGTH,
  type AnswerResult,
  type ArithmeticEngine,
  type EngineSnapshot,
  type OperationSymbol,
} from "./engine";
import { createCompatibilityDom } from "./compatibility-dom";

const DEFAULT_SIKORE_SCRIPT_URL =
  "https://sikore.schiffner-tischer.de/scripting.js";

export function getSikoreScriptUrl(baseUrl: string): string {
  return new URL(
    import.meta.env.VITE_SIKORE_SCRIPT_URL ?? DEFAULT_SIKORE_SCRIPT_URL,
    baseUrl,
  ).href;
}

interface SikoreGlobals extends Window {
  erzeuge_blatt?: (mode: number) => void;
  liveblur?: (position: number, clicked: boolean) => void;
  curpos?: number;
  results?: number[];
  kettenstart?: number[];
  kettenoperands?: number[][];
  kettenoperations?: number[][];
}

const operationSymbols: readonly OperationSymbol[] = ["+", "−", "·", ":"];

function setSelectValue(
  id: string,
  values: readonly string[],
  selected = 0,
): void {
  const element = document.querySelector<HTMLSelectElement>(`#${id}`);
  if (!element) throw new Error(`SIKORE-Kompatibilitätselement fehlt: ${id}`);
  element.replaceChildren(...values.map((value) => new Option(value, value)));
  element.selectedIndex = selected;
}

function installColorboxAdapter(): void {
  const colorbox = Object.assign(() => undefined, { close: () => undefined });
  Object.defineProperty(window, "$", {
    configurable: true,
    value: { colorbox },
  });
}

function loadScript(): Promise<void> {
  const scriptUrl = getSikoreScriptUrl(document.baseURI);
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${scriptUrl}"]`,
  );
  if (existing?.dataset.loaded === "true") return Promise.resolve();
  existing?.remove();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.charset = "iso-8859-1";
    const timeout = window.setTimeout(() => {
      script.remove();
      reject(new Error("Das Laden der SIKORE-Engine dauert zu lange."));
    }, 15_000);
    script.addEventListener(
      "load",
      () => {
        window.clearTimeout(timeout);
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => {
        window.clearTimeout(timeout);
        script.remove();
        reject(new Error("Die SIKORE-Engine konnte nicht geladen werden."));
      },
      {
        once: true,
      },
    );
    document.head.append(script);
  });
}

export class SikoreAdapter implements ArithmeticEngine {
  readonly #runtime: SikoreGlobals;

  constructor(runtime: SikoreGlobals = window) {
    this.#runtime = runtime;
  }

  async load(): Promise<void> {
    createCompatibilityDom();
    installColorboxAdapter();
    await loadScript();
    this.#assertContract();
  }

  reload(): void {
    document
      .querySelector<HTMLScriptElement>(
        `script[src="${getSikoreScriptUrl(document.baseURI)}"]`,
      )
      ?.remove();
  }

  start(level: LevelPreset): EngineSnapshot {
    this.#assertContract();
    this.#configure(level);
    this.#runtime.erzeuge_blatt!(1);

    const snapshot = this.#snapshot();
    if (snapshot.completed || snapshot.step === null) {
      throw new Error("SIKORE hat keine gültige Rechenkette erzeugt.");
    }
    return snapshot;
  }

  submit(answer: number): AnswerResult {
    this.#assertContract();
    const position = this.#runtime.curpos!;
    if (position >= CHAIN_LENGTH)
      return { correct: false, snapshot: this.#snapshot() };

    const input = document.forms
      .namedItem("liveform")
      ?.elements.namedItem(`i${position}`);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("Das aktuelle SIKORE-Eingabefeld fehlt.");
    }

    input.value = String(answer);
    this.#runtime.liveblur!(position, true);
    return {
      correct: this.#runtime.curpos! > position,
      snapshot: this.#snapshot(),
    };
  }

  #configure(level: LevelPreset): void {
    setSelectValue("level", [level.engineValue]);
    setSelectValue("fmaxresult", [String(level.maxResult)]);
    setSelectValue("fnegativ", ["nein", "ja"]);
    setSelectValue("fminplusminus", ["1"]);
    setSelectValue("fmaxplusminus", [String(level.maxPlusMinus)]);
    setSelectValue(
      "fchancemal",
      ["0", "1", "2"],
      level.maxFactor === null ? 0 : 2,
    );
    setSelectValue("fminmal", ["2"]);
    setSelectValue("fmaxmal", [String(level.maxFactor ?? 2)]);
    setSelectValue("flimitfakt", ["ja", "nein"], level.id >= 18 ? 1 : 0);
    setSelectValue(
      "fchancegeteilt",
      ["0", "1", "2"],
      level.maxFactor === null ? 0 : 2,
    );
    setSelectValue("fmingeteilt", ["2"]);
    setSelectValue("fmaxgeteilt", [String(level.maxFactor ?? 2)]);
    setSelectValue("flimitquot", ["ja", "nein"], level.id >= 18 ? 1 : 0);
  }

  #snapshot(): EngineSnapshot {
    const position = this.#runtime.curpos!;
    const start = this.#runtime.kettenstart?.[0];
    const operands = this.#runtime.kettenoperands?.[0];
    const operations = this.#runtime.kettenoperations?.[0];
    const results = this.#runtime.results;
    const mistakes = Number(
      document.querySelector<HTMLInputElement>("#ffehler")?.value ?? 0,
    );
    const completed = position >= CHAIN_LENGTH;

    if (start === undefined || !operands || !operations || !results) {
      throw new Error(
        "Die SIKORE-Engine liefert keine vollständige Rechenkette.",
      );
    }

    const operationIndex = operations[position];
    const operand = operands[position];
    const value = position === 0 ? start : results[position - 1];
    const operation =
      operationIndex === undefined
        ? undefined
        : operationSymbols[operationIndex];
    if (
      !completed &&
      (value === undefined || operand === undefined || operation === undefined)
    ) {
      throw new Error("Die aktuelle SIKORE-Aufgabe ist unvollständig.");
    }

    return {
      position,
      total: CHAIN_LENGTH,
      mistakes,
      completed,
      step: completed
        ? null
        : { value: value!, operation: operation!, operand: operand! },
    };
  }

  #assertContract(): void {
    if (
      typeof this.#runtime.erzeuge_blatt !== "function" ||
      typeof this.#runtime.liveblur !== "function" ||
      (this.#runtime.curpos !== undefined &&
        typeof this.#runtime.curpos !== "number")
    ) {
      throw new Error(
        "Die geladene SIKORE-Version ist nicht mit dieser App kompatibel.",
      );
    }
  }
}

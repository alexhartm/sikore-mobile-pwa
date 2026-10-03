import "./ui/app.css";
import { DEFAULT_LEVEL, LEVELS, describeLevel, getLevel } from "./app/levels";
import { ExerciseSession, type SessionState } from "./app/session";
import { SikoreAdapter } from "./engine/sikore-adapter";
import { setupKeyboardLayout } from "./ui/keyboard-layout";
import {
  clearCachedEngine,
  registerServiceWorker,
} from "./pwa/register-service-worker";

const STORAGE_KEY = "sikore-mobile-level";

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`UI element missing: ${selector}`);
  return element;
}

const ui = {
  status: required<HTMLElement>("#runtime-status"),
  network: required<HTMLElement>("#network-status"),
  trainerView: required<HTMLElement>("#trainer-view"),
  infoView: required<HTMLElement>("#info-view"),
  level: required<HTMLButtonElement>("#level-select"),
  levelTitle: required<HTMLElement>("#level-title"),
  levelDescription: required<HTMLElement>("#level-description"),
  levelHint: required<HTMLElement>("#level-hint"),
  levelDialog: required<HTMLDialogElement>("#level-dialog"),
  levelOptions: required<HTMLElement>("#level-options"),
  closeLevelDialog: required<HTMLButtonElement>("#close-level-dialog"),
  successAnimation: required<HTMLElement>("#success-animation"),
  progressLevel: required<HTMLElement>("#progress-level"),
  progress: required<HTMLElement>("#progress-text"),
  progressBar: required<HTMLProgressElement>("#progress-bar"),
  prompt: required<HTMLElement>("#exercise-prompt"),
  currentValue: required<HTMLElement>("#current-value"),
  operation: required<HTMLElement>("#current-operation"),
  problemStage: required<HTMLElement>("#problem-stage"),
  answerForm: required<HTMLFormElement>("#answer-form"),
  answer: required<HTMLInputElement>("#answer"),
  submit: required<HTMLButtonElement>("#submit-answer"),
  feedback: required<HTMLElement>("#feedback"),
  completionStats: required<HTMLElement>("#completion-stats"),
  completionMistakes: required<HTMLElement>("#completion-mistakes"),
  completionMistakesHint: required<HTMLElement>("#completion-mistakes-hint"),
  completionCorrect: required<HTMLElement>("#completion-correct"),
  completionTotal: required<HTMLElement>("#completion-total"),
  completionCorrectHint: required<HTMLElement>("#completion-correct-hint"),
  completionElapsed: required<HTMLElement>("#completion-elapsed"),
  completionActions: required<HTMLElement>("#completion-actions"),
  nextLevel: required<HTMLButtonElement>("#next-level"),
  repeatChain: required<HTMLButtonElement>("#repeat-chain"),
  mistakes: required<HTMLElement>("#mistakes"),
  elapsed: required<HTMLElement>("#elapsed"),
  newChain: required<HTMLButtonElement>("#new-chain"),
  retry: required<HTMLButtonElement>("#retry-engine"),
};

const engine = new SikoreAdapter();
setupKeyboardLayout(ui.answer, ui.submit);
const session = new ExerciseSession(engine);
let engineReady = false;
let selectedLevelId = storedLevel();
let activeLevelId = selectedLevelId;

function storedLevel(): number {
  const value = Number(localStorage.getItem(STORAGE_KEY));
  return LEVELS.some((level) => level.id === value) ? value : DEFAULT_LEVEL;
}

function selectedLevel() {
  return getLevel(selectedLevelId);
}

function nextLevel() {
  const index = LEVELS.findIndex((level) => level.id === activeLevelId);
  return LEVELS[index + 1];
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0
    ? `${minutes}:${String(remainder).padStart(2, "0")} min`
    : `${remainder} s`;
}

function setControlsEnabled(enabled: boolean): void {
  ui.level.disabled = !enabled;
  ui.newChain.disabled = !enabled;
  ui.nextLevel.disabled = !enabled;
  ui.repeatChain.disabled = !enabled;
  ui.answer.disabled = !enabled;
  ui.submit.disabled = !enabled;
}

function updateNetworkStatus(): void {
  const online = navigator.onLine;
  ui.network.textContent = online ? "online" : "offline";
  ui.network.dataset.state = online ? "online" : "offline";
}

function updateLevelDescription(): void {
  ui.levelTitle.textContent = `Level ${selectedLevelId}`;
  ui.levelDescription.textContent = describeLevel(selectedLevel());
  ui.levelHint.hidden = selectedLevelId === activeLevelId;
  for (const input of ui.levelOptions.querySelectorAll<HTMLInputElement>(
    "input",
  )) {
    input.checked = Number(input.value) === selectedLevelId;
  }
}

function updateView(): void {
  const showsInfo = window.location.hash === "#info";
  ui.trainerView.hidden = showsInfo;
  ui.infoView.hidden = !showsInfo;
}

function playSuccessAnimation(): void {
  ui.successAnimation.classList.remove("is-active");
  if (document.documentElement.classList.contains("keyboard-open")) return;
  void ui.successAnimation.offsetWidth;
  ui.successAnimation.classList.add("is-active");
}

function clearAnswerPulse(): void {
  delete ui.answer.dataset.feedbackPulse;
}

function playAnswerPulse(feedback: "incorrect" | "invalid"): void {
  clearAnswerPulse();
  // Restart even when the same answer is submitted during an active pulse.
  void ui.answer.offsetWidth;
  ui.answer.dataset.feedbackPulse = feedback;
}

function render(state: SessionState): void {
  const { snapshot } = state;
  ui.progressLevel.textContent = `Level ${activeLevelId}`;
  ui.mistakes.textContent = String(snapshot.mistakes);
  ui.elapsed.textContent = formatDuration(state.elapsedSeconds);
  ui.progressBar.max = snapshot.total;
  ui.progressBar.value = snapshot.position;
  ui.completionStats.hidden = !snapshot.completed;
  ui.completionActions.hidden = !snapshot.completed;

  if (snapshot.completed) {
    ui.problemStage.dataset.layout = "stacked";
    delete ui.problemStage.dataset.density;
    ui.progress.textContent = `${snapshot.total} von ${snapshot.total}`;
    ui.prompt.textContent = `Geschafft. ${snapshot.position} von ${snapshot.total} Aufgaben richtig gelöst, ${snapshot.mistakes} Fehler, Dauer ${formatDuration(state.elapsedSeconds)}.`;
    ui.currentValue.textContent = "Fertig";
    ui.operation.textContent = "✓";
    ui.answer.value = "";
    ui.answer.disabled = true;
    ui.submit.disabled = true;
    ui.feedback.textContent = "Stark gerechnet!";
    ui.feedback.dataset.kind = "complete";
    ui.completionMistakes.textContent = String(snapshot.mistakes);
    ui.completionMistakesHint.textContent =
      snapshot.mistakes === 1 ? "falscher Versuch" : "falsche Versuche";
    ui.completionCorrect.textContent = String(snapshot.position);
    ui.completionTotal.textContent = `/ ${snapshot.total}`;
    ui.completionCorrectHint.textContent =
      snapshot.mistakes > 0 ? "mit Korrektur" : "alle Aufgaben";
    ui.completionElapsed.textContent = formatDuration(state.elapsedSeconds);
    ui.nextLevel.hidden = !nextLevel();
    // Let the blur handler restore the settings before focusing the next action.
    ui.answer.blur();
    window.requestAnimationFrame(() => {
      if (!ui.completionActions.hidden)
        ui.repeatChain.focus({ preventScroll: true });
    });
    return;
  }

  const step = snapshot.step!;
  const usesInlineLayout = step.operation === "·" || step.operation === ":";
  ui.problemStage.dataset.layout = usesInlineLayout ? "inline" : "stacked";
  ui.problemStage.dataset.density =
    `${step.value}${step.operation}${step.operand}`.length > 10
      ? "compact"
      : "regular";
  ui.progress.textContent = `${snapshot.position + 1} von ${snapshot.total}`;
  ui.prompt.textContent = `Aufgabe ${snapshot.position + 1} von ${snapshot.total}: ${step.value} ${step.operation} ${step.operand}`;
  ui.currentValue.textContent = String(step.value);
  ui.operation.textContent = `${step.operation} ${step.operand}`;
  if (usesInlineLayout) {
    const result =
      step.operation === "·"
        ? step.value * step.operand
        : step.value / step.operand;
    ui.problemStage.dataset.resultCharacters = String(
      Math.max(2, String(result).length),
    );
    updateInlineSize();
  }
  ui.answer.disabled = false;
  ui.submit.disabled = false;
  ui.answer.setAttribute(
    "aria-invalid",
    state.feedback === "incorrect" || state.feedback === "invalid"
      ? "true"
      : "false",
  );

  const messages = {
    idle: "",
    correct: "Richtig. Weiter geht’s!",
    incorrect: "Noch nicht richtig. Versuch es noch einmal.",
    invalid: "Bitte gib eine ganze Zahl ein.",
  } as const;
  ui.feedback.textContent = messages[state.feedback];
  ui.feedback.dataset.kind = state.feedback;
}

function updateInlineSize(): void {
  if (ui.problemStage.dataset.layout !== "inline") return;
  const answerCharacters = Math.max(
    Number(ui.problemStage.dataset.resultCharacters),
    ui.answer.value.length,
  );
  // Monospace glyphs occupy about 0.62em. Include operators, spacing,
  // input padding and the answer's digits when fitting the entire equation.
  const taskCharacters =
    ui.currentValue.textContent!.length + ui.operation.textContent!.length + 1;
  ui.problemStage.style.setProperty(
    "--answer-characters",
    String(answerCharacters),
  );
  ui.problemStage.style.setProperty(
    "--equation-units",
    String((taskCharacters + answerCharacters) * 0.62 + 2.15),
  );
  ui.problemStage.style.setProperty(
    "--task-units",
    String(taskCharacters * 0.62 + 0.6),
  );
}

function startChain(): void {
  if (!engineReady) return;
  const level = selectedLevel();
  localStorage.setItem(STORAGE_KEY, String(level.id));
  activeLevelId = level.id;
  updateLevelDescription();
  clearAnswerPulse();
  ui.answer.value = "";
  ui.feedback.textContent = "";
  render(session.start(level));
  ui.answer.focus({ preventScroll: true });
}

async function bootEngine(): Promise<void> {
  setControlsEnabled(false);
  ui.retry.hidden = true;
  ui.status.textContent = "Rechenengine wird geladen …";
  ui.status.dataset.state = "loading";

  try {
    await engine.load();
    engineReady = true;
    ui.status.textContent = "Bereit";
    ui.status.dataset.state = "ready";
    setControlsEnabled(true);
    startChain();
  } catch (error) {
    engineReady = false;
    setControlsEnabled(false);
    ui.status.textContent =
      error instanceof Error
        ? error.message
        : "Die Rechenengine ist nicht verfügbar.";
    ui.status.dataset.state = "error";
    ui.progress.textContent = "Nicht gestartet";
    ui.progressBar.value = 0;
    ui.prompt.textContent = "Keine Aufgabe verfügbar.";
    ui.currentValue.textContent = "–";
    ui.operation.textContent = "–";
    ui.problemStage.dataset.layout = "stacked";
    delete ui.problemStage.dataset.density;
    ui.retry.hidden = false;
  }
}

for (const level of LEVELS) {
  const option = document.createElement("label");
  option.className = "level-option";
  const input = document.createElement("input");
  input.type = "radio";
  input.name = "difficulty";
  input.value = String(level.id);
  const copy = document.createElement("span");
  copy.className = "level-picker-copy";
  const title = document.createElement("strong");
  title.textContent = `Level ${level.id}`;
  const description = document.createElement("span");
  description.className = "level-description";
  description.textContent = describeLevel(level);
  copy.append(title, description);
  option.append(input, copy);
  ui.levelOptions.append(option);
  input.addEventListener("change", () => {
    selectedLevelId = level.id;
    localStorage.setItem(STORAGE_KEY, String(level.id));
    updateLevelDescription();
  });
  input.addEventListener("click", () => ui.levelDialog.close());
}
updateLevelDescription();
updateNetworkStatus();

ui.level.addEventListener("click", () => {
  ui.levelDialog.showModal();
  ui.level.setAttribute("aria-expanded", "true");
  const selected =
    ui.levelOptions.querySelector<HTMLInputElement>("input:checked")!;
  selected.focus({ preventScroll: true });
  selected.closest("label")!.scrollIntoView({ block: "center" });
});
ui.closeLevelDialog.addEventListener("click", () => ui.levelDialog.close());
ui.levelDialog.addEventListener("click", (event) => {
  if (event.target !== ui.levelDialog) return;
  const bounds = ui.levelDialog.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  ) {
    ui.levelDialog.close();
  }
});
ui.levelDialog.addEventListener("close", () => {
  ui.level.setAttribute("aria-expanded", "false");
  ui.level.focus({ preventScroll: true });
});
ui.answer.addEventListener("input", () => {
  clearAnswerPulse();
  if (
    ui.feedback.dataset.kind === "incorrect" ||
    ui.feedback.dataset.kind === "invalid"
  ) {
    ui.answer.setAttribute("aria-invalid", "false");
    ui.feedback.textContent = "";
    ui.feedback.dataset.kind = "idle";
  }
  updateInlineSize();
});
ui.answer.addEventListener("animationend", (event) => {
  if (event.animationName === "answer-error-pulse") clearAnswerPulse();
});
ui.newChain.addEventListener("click", startChain);
ui.repeatChain.addEventListener("click", () => {
  if (ui.completionActions.hidden) return;
  selectedLevelId = activeLevelId;
  startChain();
});
ui.nextLevel.addEventListener("click", () => {
  if (ui.completionActions.hidden) return;
  const level = nextLevel();
  if (!level) return;
  selectedLevelId = level.id;
  startChain();
});
ui.retry.addEventListener("click", () => {
  void clearCachedEngine().then(() => {
    engine.reload();
    return bootEngine();
  });
});
ui.answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const state = session.submit(ui.answer.value);
  clearAnswerPulse();
  render(state);
  if (state.feedback === "correct") {
    ui.answer.value = "";
    updateInlineSize();
    playSuccessAnimation();
  } else if (state.feedback === "incorrect" || state.feedback === "invalid") {
    playAnswerPulse(state.feedback);
  }
  if (!state.snapshot.completed) {
    ui.answer.focus({ preventScroll: true });
    if (state.feedback !== "correct") ui.answer.select();
  }
});
window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);
window.addEventListener("hashchange", updateView);
ui.successAnimation.addEventListener("animationend", (event) => {
  if (event.target === ui.successAnimation) {
    ui.successAnimation.classList.remove("is-active");
  }
});

updateView();

void registerServiceWorker();
void bootEngine();

/** Keep the exercise in the visible area while a software keyboard is open. */
export function setupKeyboardLayout(
  answer: HTMLInputElement,
  submit: HTMLButtonElement,
): void {
  const viewport = window.visualViewport;
  if (!viewport) return;

  const root = document.documentElement;
  let restingHeight = Math.max(window.innerHeight, viewport.height);
  let restingWidth = window.innerWidth;
  let active = false;
  let savedScroll = { x: 0, y: 0 };
  let frame = 0;

  function update(): void {
    frame = 0;
    // A width change usually means rotation. Do not mistake the shorter
    // landscape screen or pinch zoom for a software keyboard.
    if (window.innerWidth !== restingWidth) {
      restingWidth = window.innerWidth;
      restingHeight = window.innerHeight;
    }
    const focused = document.activeElement === answer && !answer.disabled;
    if (!focused && !active) {
      restingHeight = Math.max(window.innerHeight, viewport!.height);
    }
    const availableHeight = viewport!.height;
    const keyboardOpen =
      focused &&
      Math.abs(viewport!.scale - 1) < 0.05 &&
      restingHeight - availableHeight > 120 &&
      availableHeight < restingHeight * 0.82;

    if (keyboardOpen) {
      root.style.setProperty("--keyboard-height", `${availableHeight}px`);
      root.style.setProperty("--keyboard-top", `${viewport!.offsetTop}px`);
      root.style.setProperty("--keyboard-width", `${viewport!.width}px`);
      root.style.setProperty("--keyboard-left", `${viewport!.offsetLeft}px`);
      root.classList.add("keyboard-open");
      root.classList.toggle("keyboard-short", availableHeight < 300);
    } else if (active) {
      root.classList.remove("keyboard-open", "keyboard-short");
      window.scrollTo(savedScroll.x, savedScroll.y);
    }
    active = keyboardOpen;
  }

  function scheduleUpdate(): void {
    if (!frame) frame = window.requestAnimationFrame(update);
  }

  // Moving focus to the button would dismiss the keyboard between answers.
  // Keyboard users can still focus and activate the button normally.
  submit.addEventListener("pointerdown", (event) => {
    if (document.activeElement === answer && !answer.disabled) {
      event.preventDefault();
    }
  });
  answer.addEventListener("focus", () => {
    if (!active) savedScroll = { x: window.scrollX, y: window.scrollY };
    scheduleUpdate();
  });
  answer.addEventListener("blur", scheduleUpdate);
  viewport.addEventListener("resize", scheduleUpdate);
  viewport.addEventListener("scroll", scheduleUpdate);
  window.addEventListener("resize", scheduleUpdate);
}

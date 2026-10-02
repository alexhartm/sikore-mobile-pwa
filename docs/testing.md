# Testing

## Unit Tests

```sh
mise run test
```

Vitest checks preset mapping, session startup, input validation, mistake handling, correct transitions, and elapsed time. Unit tests do not contact SIKORE.

## Deterministic Browser Tests

Install browser binaries once:

```sh
npx playwright install chromium webkit
```

Then run:

```sh
mise run test-e2e
```

Routine browser tests build the app with a small, test-only same-origin engine artifact. They cover:

- Chromium desktop behavior.
- WebKit at an iPhone-sized viewport.
- Correct and incorrect answers.
- Full chain completion.
- Level persistence.
- Recoverable engine-load failure.
- A service-worker-controlled offline reload.

The fake exists only under `tests/`; Vite emits it only when the browser-test environment variable is set. It does not attempt to reproduce SIKORE generation behavior. The deterministic offline test validates shell and engine-cache control flow, but a same-origin fixture cannot reproduce the browser's opaque-response semantics. That remaining behavior is part of the manual iPhone gate.

## Live Contract Test

```sh
mise run test-live
```

This test contacts the original SIKORE server and checks that the current runtime loads, passes adapter validation, produces a chain, and enables answer input. It is intentionally separate because upstream availability must not make ordinary tests flaky.

## Full Local Check

```sh
mise run check
mise run test-e2e
mise run test-live
```

`mise run check` includes formatting, ESLint, strict TypeScript checks, unit tests, and a production build.

## Manual iPhone Gate

Before treating a release as ready:

1. Load it over trusted HTTPS in Safari.
2. Verify multiple levels and deliberately enter wrong answers.
3. Add it to the Home Screen.
4. Launch it in standalone mode.
5. Force-quit and relaunch online.
6. Enable airplane mode, force-quit, and relaunch offline.
7. Check the numeric keyboard, focus, safe areas, and landscape layout.
8. Use VoiceOver to verify that each new problem and feedback message is announced.
9. Clear Safari website data and verify that the failure and recovery behavior is understandable.

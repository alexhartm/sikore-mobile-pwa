# Architecture

## Goals

SIKORE Mobile should remain a small static application that is easy to understand, test, and host. Its output must work from a simple static file server, under either a domain root or a path prefix, without Node.js on the server.

## Boundaries

### Application

`src/main.ts` coordinates the UI. It knows about controls and German presentation text, but not SIKORE globals or compatibility elements.

`src/app/session.ts` owns answer parsing, feedback state, elapsed time, and the current engine snapshot. It depends only on the `ArithmeticEngine` interface.

`src/app/levels.ts` contains the published preset mapping. This is application-owned configuration derived from the options exposed by the SIKORE website.

### Engine

`src/engine/engine.ts` defines the replaceable engine interface. A future local arithmetic engine can implement this interface without changing session or UI code.

`src/engine/sikore-adapter.ts` is the only application module that accesses SIKORE globals. It:

1. Creates the compatibility DOM.
2. Loads the remote classic script.
3. Verifies required functions.
4. Configures the selected preset.
5. Starts a chain with `erzeuge_blatt(1)`.
6. Reads generated arithmetic from the runtime arrays.
7. Submits answers through `liveblur(position, true)`.
8. Converts the result into an application-owned snapshot.

`src/engine/compatibility-dom.ts` contains only the elements required by generation and validation. It is inert, hidden, and removed from keyboard and assistive-technology navigation.

### PWA

Vite creates hashed application assets. `vite-plugin-pwa` injects those assets into `src/pwa/service-worker.ts` during a production build.

The service worker keeps same-origin shell assets and the cross-origin SIKORE script in separate, application-prefixed caches. Cache cleanup never touches caches owned by another application on the same origin.

## Runtime Flow

```text
index.html
    |
    +-- register service worker independently
    |
    +-- create compatibility DOM
    |
    +-- load original scripting.js
    |
    +-- validate adapter contract
    |
    +-- start selected level
    |
    `-- render typed snapshots
```

If the engine load fails, the shell remains visible and offers a retry action. Service-worker registration is not coupled to successful engine startup.

## Deliberate Constraints

- The SIKORE live implementation hard-codes twelve steps, so the first milestone does the same.
- The app does not parse SIKORE presentation HTML. Generated arrays are less fragile and avoid upstream character-encoding issues.
- The app owns completion copy and accessibility announcements.
- No client-side router is used. Every deployment consists of one document and static assets.

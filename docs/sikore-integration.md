# SIKORE Integration

## Upstream Resource

The application loads this classic script directly in the browser:

```text
https://sikore.schiffner-tischer.de/scripting.js
```

Observed on 18 September 2026:

- `Content-Type: application/javascript`
- `Content-Length: 44942`
- `Last-Modified: Tue, 26 Mar 2024 15:19:20 GMT`
- No blocking `Cross-Origin-Resource-Policy` header
- No CORS header, which is acceptable for a classic script but prevents straightforward cross-origin Subresource Integrity

These values are observations, not a version guarantee.

## Private Contract

The adapter currently requires:

- `erzeuge_blatt(1)` to generate and initialize a live chain.
- `liveblur(position, true)` to validate an answer.
- `curpos` for the active position.
- `kettenstart[0]`, `kettenoperands[0]`, and `kettenoperations[0]` for generated arithmetic.
- `results` for intermediate values.
- `#ffehler` for the original mistake count.
- Named `liveform.i0` through `liveform.i11` inputs and named `im0` through `im11` images.

The names are not a public, versioned API. The live contract test exists to detect changes before deployment:

```sh
mise run test-live
```

## Presets

All 39 published level values are represented in `src/app/levels.ts`. The adapter writes concrete option values into its compatibility controls instead of calling the upstream `levelchanged()` presentation function.

Two levels, 2 and 4, use the upstream no-carry behavior identified by engine values `19` and `99`.

## Updating Against Upstream

1. Run `mise run test-live`.
2. Exercise several low, middle, and high levels manually.
3. Verify correct and incorrect answers.
4. Complete a full chain in WebKit.
5. Build a new application release so its engine cache starts with an intentional version boundary.
6. Update the observed response metadata in this document when it changes.

Do not copy a new upstream script into this repository as part of this process.

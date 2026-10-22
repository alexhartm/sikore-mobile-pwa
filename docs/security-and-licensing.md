# Security and Licensing

This document records constraints rather than offering legal advice.

## Node Toolchain

Node is a build, test, and deployment-tool dependency, not a production server for this static application. The [October 21, 2026 security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) fixes issues including Brotli memory corruption and DNS/TLS validation. Local or CI tools processing remote data still need the fixes even when production only serves static files.

- `mise.toml` pins Node 24.22.1. Run `mise install` and verify `mise exec -- node --version` before installing dependencies or running tooling.
- The npm manifests accept patched releases in the 22, 24, and 26 lines: `^22.23.4 || ^24.22.1 || ^26.12.1`. `.npmrc` enables `engine-strict`, so installation fails on unsupported runtimes. This is an installation check, not a runtime sandbox or a check on every direct `node` invocation.
- Apply the patched runtime requirement to every Node-based tool, including build and release automation. Check the actual executable and published artifacts: npm audits and overrides do not inspect or replace dependencies embedded inside bundled tools.
- Updating Node does not update standalone npm dependencies or independently configured build interpreters. Review those separately.
- Keep the runtime pin and supported release floors current with security releases. A reproducible pin is not an automatic update policy. Do not bypass an engine failure with `--force`.

Patching Node does not isolate the upstream browser script described below, nor does it establish that the upstream server runs vulnerable PHP.

## Remote Executable Code

The SIKORE script is loaded as a classic cross-origin script. Like every classic script, it executes in the application page's origin and can access that page's DOM and browser storage. This is a meaningful supply-chain boundary.

Additional limitations:

- The upstream URL is not versioned.
- The server does not provide CORS headers needed for straightforward cross-origin Subresource Integrity.
- The cached response is opaque and cannot be inspected by the application.
- An opaque response can conceal an upstream HTTP error. The retry action clears the engine cache before another download attempt.
- The upstream code currently uses `eval`, so a strict CSP without `unsafe-eval` would prevent it from running.

Do not place credentials, personal records, authentication tokens, or unrelated sensitive data on the same origin as this application.

## Data Handling

SIKORE Mobile has no backend and sends no learner answers to its application host. It stores only the last selected level in `localStorage`. The upstream script is fetched from the SIKORE host, which necessarily receives normal request metadata such as IP address and user agent.

## Source Separation

This repository intentionally contains:

- Original SIKORE Mobile source code.
- An application-owned compatibility description.
- Original icon and visual assets.
- Test-only fake runtime code.

It intentionally does not contain:

- `scripting.js` from SIKORE.
- SIKORE logos, figures, or screenshots.
- A modified or mirrored SIKORE distribution.

The browser obtains the upstream runtime directly and may store it in its own Cache Storage for offline reuse.

## Licensing

The MIT license in this repository covers only original repository content. SIKORE is a separate third-party work and remains subject to its owner's terms and applicable law. Free use of a website is not automatically permission to redistribute its source code.

Before publishing this application broadly, seek permission from the SIKORE author for the intended integration, naming, attribution, and persistent offline caching behavior.

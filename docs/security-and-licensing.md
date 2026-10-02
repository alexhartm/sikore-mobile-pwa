# Security and Licensing

This document records constraints rather than offering legal advice.

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

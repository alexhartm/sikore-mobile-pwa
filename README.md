# SIKORE Mobile

SIKORE Mobile is a mobile-first Progressive Web App for working through [SIKORE](https://sikore.schiffner-tischer.de/) mental-arithmetic chains on a phone.

This is an independent project. It is not affiliated with, endorsed by, or an official product of the original SIKORE project or its authors.

The application owns the interface, session state, installation experience, and offline shell. The original SIKORE JavaScript runtime still generates each chain and validates answers. No SIKORE source code, branding, or illustrations are stored in this repository or served by the application host.

## Current Scope

- German learner-facing interface.
- All 39 published SIKORE level presets.
- Twelve-step chains with immediate validation and mistake counting.
- Last-selected level stored locally on the device.
- Installable PWA shell with offline reuse after one successful online load.
- Responsive phone and desktop layouts with keyboard and screen-reader semantics.
- Framework-free TypeScript application built with Vite.
- Unit tests, deterministic Chromium/WebKit tests, an offline test, and an opt-in live SIKORE contract test.

Advanced custom SIKORE settings, timers, and deployment configuration are intentionally outside the first milestone.

## Requirements

- [mise](https://mise.jdx.dev/) for the pinned Node and pre-commit toolchain.
- Internet access on the first application load so the browser can obtain the SIKORE runtime from its original server.

## Quick Start

```sh
mise install
mise run install
mise run dev
```

Open the URL printed by Vite. The development server provides hot reload but deliberately does not run the production service worker.

To exercise the generated production service worker rather than the development server:

```sh
mise run serve
```

Open `http://localhost:4173`. Localhost is a secure context, so this command builds the application, serves the deployable `dist/` directory, and enables service-worker testing on the same machine.

## Common Commands

| Command                | Purpose                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `mise run dev`         | Start the development server on localhost and the LAN          |
| `mise run serve`       | Build and serve the production PWA                             |
| `mise run build`       | Create the static `dist/` artifact                             |
| `mise run test`        | Run unit tests                                                 |
| `mise run test-watch`  | Run unit tests in watch mode                                   |
| `mise run test-e2e`    | Run deterministic Chromium, WebKit, and offline tests          |
| `mise run test-live`   | Contact SIKORE and verify the current private runtime contract |
| `mise run check`       | Run formatting, linting, types, unit tests, and a build        |
| `mise run pre-commit`  | Run all pre-commit hooks against all files                     |
| `mise run setup-hooks` | Install commit and push hooks                                  |

Playwright browsers are installed once with:

```sh
npx playwright install chromium webkit
```

## Install on iPhone

The site must be served over trusted HTTPS when accessed from an iPhone. A plain HTTP address on a local network can display the application but cannot install its service worker.

1. Open the HTTPS site in Safari while online.
2. Wait until the status reads **Bereit**.
3. Use **Share > Add to Home Screen**.
4. Open SIKORE Mobile once from the Home Screen while online.
5. Test airplane-mode startup before relying on it away from the network.

iOS may evict website storage. Offline availability is therefore a convenience, not a permanent guarantee.

## Project Layout

```text
src/app/          Level definitions and application session state
src/engine/       Typed engine contract and isolated SIKORE adapter
src/pwa/          Service-worker registration and caching implementation
src/ui/           Responsive application styling
public/           Manifest and application-owned icon assets
tests/unit/       Deterministic domain tests
tests/e2e/        Browser, offline, and live upstream checks
```

## Documentation

- [Architecture](docs/architecture.md)
- [SIKORE integration](docs/sikore-integration.md)
- [Offline model](docs/offline-model.md)
- [Testing](docs/testing.md)
- [Static hosting contract](docs/hosting-contract.md)
- [Security and licensing](docs/security-and-licensing.md)

## License

The original code in this repository is available under the [MIT License](LICENSE). This license does not apply to SIKORE or any resource loaded from the SIKORE server.

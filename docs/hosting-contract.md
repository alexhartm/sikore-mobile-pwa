# Static Hosting Contract

Deployment implementation is intentionally outside this repository. Any host is compatible when it satisfies this contract.

## Build Artifact

```sh
mise run build
```

Serve only the generated `dist/` directory. A production server does not need Node.js, npm, or write access to the artifact.

The Vite build uses relative asset URLs. The same artifact can therefore be mounted at a root such as `/` or behind a stripped path prefix such as `/rechnen/`. A prefix without a trailing slash, such as `/rechnen`, must redirect to `/rechnen/`; otherwise browser URL resolution points assets and the service worker at the site root.

## Required Behavior

- Trusted HTTPS for every non-localhost deployment.
- Static file serving for all files under `dist/`.
- `index.html` returned for the application root.
- `service-worker.js` served as JavaScript without redirects.
- `manifest.webmanifest` served as `application/manifest+json` or another valid JSON manifest type.
- A trailing-slash redirect when the application is mounted below the domain root.
- No authentication redirect on static asset or service-worker requests.
- Internet egress from the client to `https://sikore.schiffner-tischer.de/scripting.js` on first use.

## Recommended Headers

```text
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Recommended caching:

- Hashed files under `assets/`: long-lived and immutable.
- `service-worker.js`: no-cache or a very short lifetime.
- `index.html` and `manifest.webmanifest`: revalidate.

A strict Content Security Policy is complicated by the current upstream runtime because it uses `eval`. See [Security and licensing](security-and-licensing.md).

## Cloudflare Pages Compatibility

The corresponding generic settings are:

```text
Build command: mise run build (or npm ci && npm run build)
Output directory: dist
```

No functions, database, environment secrets, or server-side routes are required.

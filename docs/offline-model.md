# Offline Model

## What Is Cached

The production service worker keeps two caches:

- `sikore-mobile-shell-<revision>`: generated HTML, CSS, JavaScript, manifest, and icons. The revision is derived from the injected build manifest, so an installing worker never mutates the active worker's shell cache.
- `sikore-mobile-engine-v1`: the opaque response for the original SIKORE script.

The engine response is fetched directly from the original server. It is never relayed through the application host.

## First Visit

A first visit requires connectivity to both the application host and the SIKORE host. The page loads the engine while the service worker independently attempts to cache it. Failure to cache the engine does not prevent installation of the local shell.

After the service worker controls the page, subsequent requests for the engine prefer the cached response. Same-origin hashed assets also prefer their precached responses.

## Navigation

Document navigations use the network when available and fall back to the cached `index.html`. This allows a new deployment to be discovered without sacrificing offline startup.

## Updates

An updated worker installs into its own revisioned shell cache and waits until existing tabs stop using the old worker. The next application launch activates the new worker and removes obsolete application caches. The app does not force an immediate update in the middle of an exercise.

Cache names are application-prefixed. Activation only removes obsolete `sikore-mobile-*` caches, never unrelated caches on a shared origin.

## Limitations

- A cached cross-origin response is opaque; application code cannot inspect or hash it.
- Because an opaque response hides its HTTP status and content type, an upstream error document can be cached. The **Erneut versuchen** action evicts that response before fetching again.
- Browser storage may be cleared manually or evicted automatically, especially on iOS.
- The upstream URL is unversioned. A new installation can receive a runtime that has changed since this app was tested.
- Offline behavior on desktop WebKit is useful coverage but is not a substitute for an installed iPhone test.

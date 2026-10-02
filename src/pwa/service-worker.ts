/// <reference lib="webworker" />

import { getSikoreScriptUrl } from "../engine/sikore-adapter";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision?: string | null }>;
};

const CACHE_PREFIX = "sikore-mobile-";
const manifest = self.__WB_MANIFEST;

function hashManifest(): string {
  const source = manifest
    .map((entry) =>
      typeof entry === "string"
        ? entry
        : `${entry.url}:${entry.revision ?? "hashed"}`,
    )
    .join("|");
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

const SHELL_CACHE = `${CACHE_PREFIX}shell-${hashManifest()}`;
const ENGINE_CACHE = `${CACHE_PREFIX}engine-v1`;
const SIKORE_SCRIPT_URL = getSikoreScriptUrl(self.registration.scope);
const precacheUrls = manifest.map(
  (entry) =>
    new URL(
      typeof entry === "string" ? entry : entry.url,
      self.registration.scope,
    ).href,
);

async function cacheEngine(): Promise<void> {
  const cache = await caches.open(ENGINE_CACHE);
  const request = new Request(SIKORE_SCRIPT_URL, { mode: "no-cors" });
  const response = await fetch(request);
  await cache.put(request, response);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then((cache) => cache.addAll(precacheUrls)),
      cacheEngine().catch((error: unknown) =>
        console.info("SIKORE konnte nicht vorgeladen werden:", error),
      ),
    ]),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith(CACHE_PREFIX) &&
                key !== SHELL_CACHE &&
                key !== ENGINE_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.url === SIKORE_SCRIPT_URL) {
    event.respondWith(
      caches.open(ENGINE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request, { ignoreVary: true });
        if (cached) return cached;
        const response = await fetch(event.request);
        try {
          await cache.put(event.request, response.clone());
        } catch (error) {
          console.info(
            "SIKORE konnte nicht zwischengespeichert werden:",
            error,
          );
        }
        return response;
      }),
    );
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) return response;
          const cache = await caches.open(SHELL_CACHE);
          return (
            (await cache.match(
              new URL("index.html", self.registration.scope).href,
            )) ?? Response.error()
          );
        })
        .catch(async () => {
          const cache = await caches.open(SHELL_CACHE);
          return (
            (await cache.match(
              new URL("index.html", self.registration.scope).href,
            )) ?? Response.error()
          );
        }),
    );
    return;
  }

  event.respondWith(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreVary: true });
      return cached ?? fetch(event.request);
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CLEAR_ENGINE_CACHE") return;
  event.waitUntil(
    caches.delete(ENGINE_CACHE).then(() => {
      event.ports[0]?.postMessage({ cleared: true });
    }),
  );
});

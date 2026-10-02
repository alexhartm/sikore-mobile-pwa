export async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}service-worker.js`,
      {
        scope: "./",
      },
    );
  } catch (error) {
    console.info("Service Worker nicht aktiv:", error);
  }
}

export async function clearCachedEngine(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const worker = navigator.serviceWorker.controller ?? registration?.active;
  if (!worker) return;

  await new Promise<void>((resolve) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(resolve, 1_000);
    channel.port1.onmessage = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    worker.postMessage({ type: "CLEAR_ENGINE_CACHE" }, [channel.port2]);
  });
}

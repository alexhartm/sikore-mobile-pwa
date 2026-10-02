import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const usesTestEngine =
  process.env.VITE_SIKORE_SCRIPT_URL === "./fake-sikore.js";
const plugins: Plugin[] = [];

if (usesTestEngine) {
  plugins.push({
    name: "test-sikore-engine",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "fake-sikore.js",
        source: readFileSync(
          new URL("./tests/e2e/fixtures/fake-sikore.js", import.meta.url),
          "utf8",
        ),
      });
    },
  });
}

plugins.push(
  ...VitePWA({
    strategies: "injectManifest",
    srcDir: "src/pwa",
    filename: "service-worker.ts",
    injectRegister: false,
    manifest: false,
    injectManifest: {
      globPatterns: ["**/*.{css,html,ico,png,svg,webmanifest,js}"],
    },
  }),
);

export default defineConfig({
  base: "./",
  plugins,
  server: { host: true },
  preview: { host: true },
});

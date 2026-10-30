import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Unit + contract suite. Node environment only: nothing here boots a browser,
 * hits the network or needs a database credential. The Octo transport is always
 * stubbed, so a green run proves the shapes and rules — not live authentication.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
    restoreMocks: true,
  },
});

import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // The component tagger stamps every element with debug attributes: for the dev server only, never the shipped build.
  plugins: [...(command === "serve" ? [dyadComponentTagger()] : []), react(), nitro()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

import { defineConfig } from "nitro";

export default defineConfig({
  serverDir: "./server",
  // Nitro serves the build's /assets folder as immutable for a year, and our
  // pictures share that path. They keep their names when redrawn, so they are
  // cached for a day instead; generated pictures also carry a content hash
  // (?v=). A missing file here is a 404, never the app's page.
  publicAssets: [{ dir: "public/assets/kresilo", baseURL: "/assets/kresilo", maxAge: 86400 }],
  routeRules: { "/assets/kresilo/**": { headers: { "cache-control": "public, max-age=86400" } } },
});

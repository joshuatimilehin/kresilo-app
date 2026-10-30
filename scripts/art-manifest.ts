import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

/**
 * Rebuilds src/creative/portfolio/generated.ts from the images saved in
 * public/assets/kresilo/gen, so a cover only asks for a file that exists. Each
 * key carries a short hash of its file, which goes on the picture's URL so a
 * regenerated picture is never served from an old cache.
 * Run: pnpm exec jiti scripts/art-manifest.ts
 */
const dir = "public/assets/kresilo/gen";
const entries = readdirSync(dir)
  .filter((f) => f.endsWith(".jpg"))
  .map((f) => [f.slice(0, -4).replace(/--/g, ":"), createHash("sha1").update(readFileSync(`${dir}/${f}`)).digest("hex").slice(0, 8)])
  .sort(([a], [b]) => (a < b ? -1 : 1));
writeFileSync(
  "src/creative/portfolio/generated.ts",
  `/** Generated sample images in public/assets/kresilo/gen, by key, with a short hash of each file. Rebuilt by scripts/art-manifest.ts; do not edit by hand. */\nexport const generatedArt: ReadonlyMap<string, string> = new Map([\n${entries.map(([k, h]) => `  ["${k}", "${h}"],\n`).join("")}]);\n`,
);
console.log(`${entries.length} generated images`);

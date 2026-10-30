/**
 * Writes docs/models.manifest.json from the model registry.
 * Run with: pnpm models:manifest   (uses jiti, already a dependency)
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { manifestPath, renderModelsManifest } from "../src/models/manifest";

const target = resolve(process.cwd(), manifestPath);
writeFileSync(target, renderModelsManifest());
console.log(`Wrote ${manifestPath}`);

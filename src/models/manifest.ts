import { modelRegistry } from "./index";

/**
 * The manifest is generated from the registry, never edited by hand:
 *   pnpm models:manifest     (writes docs/models.manifest.json)
 * tests/models-registry.test.ts fails when the committed file is out of date.
 */
export const manifestPath = "docs/models.manifest.json";

export const buildModelsManifest = () => ({
  manifestVersion: 1,
  generatedFrom: "src/models/index.ts",
  note: "Generated. Do not edit. Run `pnpm models:manifest`.",
  models: modelRegistry.map((m) => ({
    name: m.name,
    version: m.version,
    status: m.status,
    issue: m.issue,
    storage: m.storage,
    file: m.file,
  })),
});

export const renderModelsManifest = () =>
  `${JSON.stringify(buildModelsManifest(), null, 2)}\n`;

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  allowedIssues,
  modelStatuses,
  schemaVersionFor,
  semverPattern,
  storageKinds,
} from "../src/models/common";
import { modelRegistry } from "../src/models/index";
import {
  manifestPath,
  renderModelsManifest,
} from "../src/models/manifest";

const root = resolve(__dirname, "..");
const kebab = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

describe("model registry", () => {
  it("lists every model file in src/models and nothing else", () => {
    const infrastructure = new Set(["common.ts", "index.ts", "manifest.ts"]);
    const onDisk = readdirSync(join(root, "src/models"))
      .filter((f) => f.endsWith(".ts") && !infrastructure.has(f))
      .map((f) => `src/models/${f}`)
      .sort();
    expect(modelRegistry.map((m) => m.file).sort()).toEqual(onDisk);
  });

  it("has unique names and files", () => {
    const names = modelRegistry.map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
    const files = modelRegistry.map((m) => m.file);
    expect(new Set(files).size).toBe(files.length);
  });

  it("is sorted by name so the manifest is stable", () => {
    const names = modelRegistry.map((m) => m.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  describe.each(modelRegistry.map((m) => [m.name, m] as const))("%s", (_n, m) => {
    it("declares complete metadata", () => {
      expect(m.version).toMatch(semverPattern);
      expect(modelStatuses).toContain(m.status);
      expect(allowedIssues as readonly number[]).toContain(m.issue);
      expect(storageKinds).toContain(m.storage.kind);
      expect(m.storage.location.length).toBeGreaterThan(3);
      expect(m.file).toBe(`src/models/${kebab(m.name)}.ts`);
      expect(existsSync(join(root, m.file))).toBe(true);
    });

    it("never targets the read-only research schema or a second database", () => {
      expect(m.storage.location).not.toMatch(/kresilo_research|public\./);
      if (m.storage.kind === "new-table" || m.storage.kind === "extend-table")
        expect(m.storage.location).toMatch(/^kresilo_demo\.[a-z_]+/);
    });

    it("keeps planned models below 1.0.0 and live models at or above it", () => {
      const major = Number(m.version.split(".")[0]);
      if (m.status === "planned") expect(major).toBe(0);
      else expect(major).toBeGreaterThanOrEqual(1);
    });

    it("parses its valid sample and stamps the same schemaVersion", () => {
      const parsed = m.schema.safeParse(m.example);
      expect(parsed.success, JSON.stringify(parsed)).toBe(true);
      const stamped = (m.example as { schemaVersion?: string }).schemaVersion;
      if (stamped !== undefined) expect(stamped).toBe(m.version);
    });

    it("rejects its invalid sample", () => {
      expect(m.schema.safeParse(m.invalidExample).success).toBe(false);
    });

    it("rejects unknown fields and a schemaVersion from another major", () => {
      const sample = m.example as Record<string, unknown>;
      if (!("schemaVersion" in sample)) return;
      expect(m.schema.safeParse({ ...sample, unexpected: true }).success).toBe(false);
      const nextMajor = `${Number(m.version.split(".")[0]) + 1}.0.0`;
      expect(m.schema.safeParse({ ...sample, schemaVersion: nextMajor }).success).toBe(false);
      const sameMajorLater = `${m.version.split(".")[0]}.9.9`;
      expect(m.schema.safeParse({ ...sample, schemaVersion: sameMajorLater }).success).toBe(true);
    });
  });

  it("schemaVersionFor accepts the same major and rejects others", () => {
    const v = schemaVersionFor("2.3.1");
    expect(v.safeParse("2.0.0").success).toBe(true);
    expect(v.safeParse("2.9.4").success).toBe(true);
    expect(v.safeParse("3.0.0").success).toBe(false);
    expect(v.safeParse("1.9.9").success).toBe(false);
    expect(v.safeParse("2").success).toBe(false);
  });
});

describe("models manifest", () => {
  it("docs/models.manifest.json matches the registry (run `pnpm models:manifest`)", () => {
    const committed = readFileSync(join(root, manifestPath), "utf8");
    expect(committed).toBe(renderModelsManifest());
  });
});

describe("planned models stay unwired", () => {
  const skipDirs = new Set([
    "node_modules",
    ".git",
    ".claude",
    ".output",
    "dist",
    "coverage",
    ".nitro",
  ]);
  // The manifest generator is the one deliberate consumer outside the folder.
  const allowed = new Set(["scripts/write-models-manifest.ts"]);
  const importsModels =
    /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)["'](?:[^"']*\/)?models(?:\/[^"']*)?["']/;

  const walk = (dir: string, out: string[] = []) => {
    for (const entry of readdirSync(dir)) {
      if (skipDirs.has(entry)) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, out);
      else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry)) out.push(full);
    }
    return out;
  };

  it("detects a models import (self-check of the pattern)", () => {
    expect(importsModels.test(`import { x } from "../models/index";`)).toBe(true);
    expect(importsModels.test(`import { x } from "@/models";`)).toBe(true);
    expect(importsModels.test(`const m = await import("../src/models/asset")`)).toBe(true);
    expect(importsModels.test(`import { x } from "./userModels";`)).toBe(false);
  });

  it("no file outside src/models and tests imports from src/models", () => {
    const offenders = walk(root)
      .map((f) => relative(root, f))
      .filter(
        (f) =>
          !f.startsWith("src/models/") &&
          !f.startsWith("tests/") &&
          !allowed.has(f),
      )
      .filter((f) => importsModels.test(readFileSync(join(root, f), "utf8")));
    expect(offenders).toEqual([]);
  });
});

describe("docs/data-models.md", () => {
  const doc = readFileSync(join(root, "docs/data-models.md"), "utf8");
  const sections = doc.split(/^### /m).slice(1);
  const statusLine = (name: string) =>
    sections
      .find((s) => s.startsWith(`${name}\n`))
      ?.split("\n")
      .find((l) => l.startsWith("Status: "));

  it.each(modelRegistry.map((m) => [m.name, m] as const))(
    "%s has a section whose status, version and issue match the registry",
    (_n, m) => {
      const status = statusLine(m.name);
      expect(status, `missing "### ${m.name}" with a Status line`).toBeDefined();
      expect(status).toContain(m.status);
      expect(status).toContain(`version ${m.version}`);
      expect(status).toContain(`issue #${m.issue}`);
    },
  );

  it.each(modelRegistry.map((m) => [m.name, m] as const))(
    "%s appears in the registry-at-a-glance table with its version",
    (_n, m) => {
      const row = doc.split("\n").find((l) => l.startsWith(`| ${m.name} `));
      expect(row, `no table row for ${m.name}`).toBeDefined();
      expect(row).toContain(`| ${m.version} |`);
      expect(row).toContain(`#${m.issue}`);
    },
  );

  it("documents exactly the registered models", () => {
    const documented = sections
      .map((s) => s.split("\n")[0])
      .filter((n) => statusLine(n) !== undefined);
    expect(documented.sort()).toEqual(modelRegistry.map((m) => m.name).sort());
  });

  it("includes a Mermaid ER diagram", () => {
    expect(doc).toMatch(/```mermaid\nerDiagram/);
  });
});

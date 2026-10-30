/**
 * Checks the visual library: src/creative/visuals/library.json against the
 * pictures in public/assets/kresilo/visuals. The generation pipeline runs it
 * before a batch is committed; a test runs it over what is committed.
 *
 *   pnpm visuals:manifest            (uses jiti, already a dependency)
 *
 * Errors (exit 1): an entry with no file, a file with no entry, an id that is
 * not kebab-case or is used twice, an unknown kind, category, hand or shape,
 * fewer than 8 or more than 20 concepts, an empty title or description, a
 * file that is not a JPEG. Warnings (exit 0): a title that is not two to five
 * words.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { visualCategories } from "../src/creative/visuals/types";

export const LIBRARY_FILE = "src/creative/visuals/library.json";
export const PICTURE_DIR = "public/assets/kresilo/visuals";
export const MIN_CONCEPTS = 8;
export const MAX_CONCEPTS = 20;

const kinds = ["ink", "duotone"];
const hands = ["line", "brush", "linocut", "stipple", "geometric", "photo", "texture"];
const shapes = ["portrait", "landscape", "square"];
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ManifestReport = { entries: number; files: number; errors: string[]; warnings: string[] };

/** Validates a library (already parsed) against the names of the files in the picture folder. */
export function checkManifest(library: unknown, files: readonly string[], readFile?: (name: string) => Buffer | undefined): ManifestReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!Array.isArray(library)) return { entries: 0, files: files.length, errors: ["library.json must be a list"], warnings };
  const ids = new Set<string>();
  library.forEach((raw, i) => {
    const e = (raw ?? {}) as Record<string, unknown>;
    const id = typeof e.id === "string" ? e.id : "";
    const at = id ? `"${id}"` : `entry ${i}`;
    if (!ID.test(id)) errors.push(`${at}: id must be kebab-case (letters, digits and dashes)`);
    else if (ids.has(id)) errors.push(`${at}: id is used twice`);
    ids.add(id);
    if (!kinds.includes(e.kind as string)) errors.push(`${at}: kind must be ${kinds.join(" or ")}`);
    if (!(visualCategories as readonly string[]).includes(e.category as string)) errors.push(`${at}: category "${String(e.category)}" is not one of the ${visualCategories.length} categories`);
    if (!hands.includes(e.hand as string)) errors.push(`${at}: hand must be one of ${hands.join(", ")}`);
    if (!shapes.includes(e.shape as string)) errors.push(`${at}: shape must be one of ${shapes.join(", ")}`);
    if (typeof e.title !== "string" || !e.title.trim()) errors.push(`${at}: title is empty`);
    else {
      const words = e.title.trim().split(/\s+/).length;
      if (words < 2 || words > 5) warnings.push(`${at}: title has ${words} word${words === 1 ? "" : "s"}; two to five read best`);
    }
    if (typeof e.about !== "string" || !e.about.trim()) errors.push(`${at}: about is empty`);
    const concepts = Array.isArray(e.concepts) ? e.concepts : null;
    if (!concepts || concepts.some((c) => typeof c !== "string" || !c.trim())) errors.push(`${at}: concepts must be a list of words`);
    else if (concepts.length < MIN_CONCEPTS || concepts.length > MAX_CONCEPTS) errors.push(`${at}: ${concepts.length} concepts; ${MIN_CONCEPTS} to ${MAX_CONCEPTS} are needed`);
    else if (new Set(concepts.map((c: string) => c.trim().toLowerCase())).size !== concepts.length) errors.push(`${at}: concepts repeat`);
  });
  const names = new Set(files.filter((f) => !f.startsWith(".")));
  for (const id of ids) if (id && !names.has(`${id}.jpg`)) errors.push(`"${id}": no file ${id}.jpg in the picture folder`);
  for (const name of names) {
    const id = name.replace(/\.jpg$/, "");
    if (!name.endsWith(".jpg")) errors.push(`${name}: not a .jpg file`);
    else if (!ids.has(id)) errors.push(`${name}: no entry in library.json`);
    else if (readFile) {
      const bytes = readFile(name);
      if (!bytes || bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) errors.push(`${name}: not a JPEG`);
    }
  }
  return { entries: library.length, files: names.size, errors, warnings };
}

/** Reads the committed library and picture folder (paths relative to the repository root) and checks them. */
export function checkLibraryOnDisk(root = process.cwd()): ManifestReport {
  const dir = resolve(root, PICTURE_DIR);
  const library = JSON.parse(readFileSync(resolve(root, LIBRARY_FILE), "utf8"));
  const files = existsSync(dir) ? readdirSync(dir) : [];
  return checkManifest(library, files, (name) => readFileSync(resolve(dir, name)));
}

if (process.argv[1]?.endsWith("visuals-manifest.ts")) {
  const report = checkLibraryOnDisk();
  for (const w of report.warnings) console.warn(`warning: ${w}`);
  for (const e of report.errors) console.error(`error: ${e}`);
  console.log(`${report.entries} entries, ${report.files} pictures, ${report.errors.length} errors, ${report.warnings.length} warnings`);
  process.exit(report.errors.length ? 1 : 0);
}

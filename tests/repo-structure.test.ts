import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(p, "utf8");
const files = (dir: string, deep = false): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return deep ? files(full, true) : [];
    return [full];
  });

describe("files do not fly everywhere", () => {
  it("lists every creative UI and logic file in its module map", () => {
    const readme = read("src/creative/README.md");
    const missing = files("src/creative", true)
      .filter((f) => !f.endsWith("README.md"))
      .map((f) => f.replace("src/creative/", ""))
      .filter((f) => !readme.includes(`\`${f}\``));
    expect(missing).toEqual([]);
  });

  it("lists every server creative file in its map", () => {
    const readme = read("server/creative/README.md");
    const missing = files("server/creative")
      .filter((f) => !f.endsWith("README.md"))
      .map((f) => f.replace("server/creative/", ""))
      .filter((f) => !readme.includes(`\`${f}\``));
    expect(missing).toEqual([]);
  });

  it("lists every document in docs/ in the docs index", () => {
    const readme = read("docs/README.md");
    const missing = files("docs")
      .map((f) => f.replace("docs/", ""))
      .filter((f) => f !== "README.md" && !readme.includes(f))
      .filter((f) => {
        // A few documents are listed together in one row by short name.
        return !["asset_inventory.md"].includes(f) || !readme.includes("asset_inventory");
      });
    expect(missing).toEqual([]);
    expect(existsSync("docs/qa")).toBe(true);
    expect(readme).toContain("`qa/`");
  });

  it("keeps the version in package.json and the changelog the same", () => {
    const version = JSON.parse(read("package.json")).version as string;
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    const first = read("CHANGELOG.md").match(/^## (\d+\.\d+\.\d+)/m)?.[1];
    expect(first).toBe(version);
  });

  it("ignores the temporary agent working copies", () => {
    expect(read(".gitignore")).toContain(".claude/worktrees/");
  });
});

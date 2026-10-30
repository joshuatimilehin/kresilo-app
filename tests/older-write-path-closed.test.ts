/**
 * Only /api/creative accepts project writes. The older /api/command and
 * /api/session routes stay registered only as fences that answer 410 and touch
 * no storage, and the older interface and command service are gone.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import commandRoute from "../server/routes/api/command.post";
import sessionRoute from "../server/routes/api/session.get";

const root = join(__dirname, "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("older write routes are fenced", () => {
  it.each([
    ["POST /api/command", commandRoute],
    ["GET /api/session", sessionRoute],
  ])("%s answers 410 and does nothing else", async (_name, handler) => {
    const response = (await (handler as unknown as (event: unknown) => Promise<Response>)({})) as Response;
    expect(response.status).toBe(410);
    expect(response.headers.get("set-cookie")).toBeNull();
    const body = (await response.json()) as { ok: boolean; code: string };
    expect(body).toMatchObject({ ok: false, code: "GONE" });
  });

  it("the fence files import nothing but the handler wrapper", () => {
    for (const file of ["command.post.ts", "session.get.ts"]) {
      const text = readFileSync(join(root, "server/routes/api", file), "utf8");
      const imports = text.match(/^import .*$/gm) ?? [];
      expect(imports).toEqual(['import { defineHandler } from "nitro";']);
    }
  });
});

describe("older command service and interface are removed", () => {
  it.each([
    "src/pages/Studio.tsx",
    "src/lib/studio.tsx",
    "src/lib/previewStore.ts",
    "src/components/studio/TerminalPanel.tsx",
    "src/domain/service.ts",
    "src/domain/terminal.ts",
    "src/domain/verbs.ts",
    "server/utils/copilot.ts",
  ])("%s no longer exists", (file) => {
    expect(existsSync(join(root, file))).toBe(false);
  });

  it("no source file calls the older routes or the proposal functions", () => {
    const files = [...sourceFiles(join(root, "src")), ...sourceFiles(join(root, "server"))].filter(
      (f) => !/server\/routes\/api\/(command\.post|session\.get)\.ts$/.test(f),
    );
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/\/api\/(command|session)\b/);
      expect(text, file).not.toMatch(/kresilo_demo\.(create|edit|approve|decline)_proposal/);
    }
  });
});

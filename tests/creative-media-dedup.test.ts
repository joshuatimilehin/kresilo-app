import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { newProject, type ProjectRecord } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

// A real 1x1 PNG.
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
let record: ProjectRecord;
beforeEach(() => {
  const document = newProject(crypto.randomUUID(), "A study", "Study");
  record = { id: document.id, revision: 1, owner: true, document };
  query.mockReset();
  query.mockImplementation(async (name: string, args: unknown[]) => {
    if (name === "creative_open") return { person: { name: "Ayo Bello" }, projects: [record] };
    if (name === "creative_get") return structuredClone(record);
    if (name === "creative_media_save_once") return { id: args[2] };
    if (name === "creative_save") {
      record = { id: record.id, revision: record.revision + 1, owner: true, document: structuredClone(args[3]) as ProjectRecord["document"] };
      return structuredClone(record);
    }
    throw new Error("Unexpected storage call");
  });
});

const importIt = (name: string) =>
  executeCreative("h", "media.import", { projectId: record.id, name, contentType: "image/png", base64: PNG, reason: "Texture" });

describe("importing the same image twice", () => {
  it("sends the same content hash both times, so storage keeps one copy", async () => {
    expect((await importIt("a.png")).ok).toBe(true);
    expect((await importIt("b.png")).ok).toBe(true);
    const saves = query.mock.calls.filter((c) => c[0] === "creative_media_save_once");
    expect(saves).toHaveLength(2);
    const expected = createHash("sha256").update(Buffer.from(PNG, "base64")).digest("hex");
    expect(saves.map((c) => c[1][6])).toEqual([expected, expected]);
    expect(saves[0][1][2]).not.toBe(saves[1][1][2]);
  });

  it("no longer uses the copy-every-time save for imports", async () => {
    await importIt("a.png");
    expect(query.mock.calls.some((c) => c[0] === "creative_media_save")).toBe(false);
  });

  it("falls back to the older save when the database has not had migration 007 yet", async () => {
    const base = query.getMockImplementation()!;
    query.mockImplementation(async (name: string, args: unknown[]) => {
      if (name === "creative_media_save_once") throw new Error("function does not exist");
      if (name === "creative_media_save") return { id: args[2] };
      return base(name, args);
    });
    const r = await importIt("a.png");
    expect(r.ok).toBe(true);
    const older = query.mock.calls.filter((c) => c[0] === "creative_media_save");
    expect(older).toHaveLength(1);
    expect(older[0][1].slice(3)).toEqual(["image/png", PNG, "a.png"]);
  });
});

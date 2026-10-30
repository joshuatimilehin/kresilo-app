import { beforeEach, describe, expect, it, vi } from "vitest";
import { CANVAS_SCENE_MAX, commands, newProject } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
vi.mock("../server/creative/assistant", () => ({ draftCreativeProposal: vi.fn() }));
import { executeCreative } from "../server/creative/service";

const id = "11111111-2222-4333-8444-555555555555";
const scene = JSON.stringify({ elements: [{ id: "a", type: "frame" }], appState: { scrollX: 0, scrollY: 0, zoom: { value: 1 } } });
const record = () => ({ id, revision: 3, owner: true, document: newProject(id, "A brief", "Canvas study", "culture-cover") });
const savedDocument = () =>
  query.mock.calls.find((c) => c[0] === "creative_save")?.[1].find((x: unknown) => x && typeof x === "object" && "canvas" in (x as object));

describe("the infinite canvas is saved by one command", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (name: string, params: unknown[]) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      if (name === "creative_get") return record();
      if (name === "creative_save") return { ...record(), revision: 4, document: params[3] };
      return {};
    });
  });

  it("accepts a scene and adds no history entry", async () => {
    const before = record().document.history.length;
    const r = await executeCreative("h", "canvas.save", { projectId: id, revision: 3, scene });
    expect(r.ok).toBe(true);
    const doc = savedDocument();
    expect(doc.canvas.scene).toBe(scene);
    expect(doc.history.length).toBe(before);
  });

  it("refuses a save made against an older revision", async () => {
    const r = await executeCreative("h", "canvas.save", { projectId: id, revision: 2, scene });
    expect(r.ok === false && r.code).toBe("CONFLICT");
    expect(savedDocument()).toBeUndefined();
  });

  it("keeps the marks list beside the design", async () => {
    const withMarks = JSON.stringify({ elements: [{ id: "a" }], marks: [{ id: "m" }] });
    const r = await executeCreative("h", "canvas.save", { projectId: id, revision: 3, scene: withMarks });
    expect(r.ok).toBe(true);
    expect(JSON.parse(savedDocument().canvas.scene).marks).toEqual([{ id: "m" }]);
  });

  it("refuses text that is not a scene", async () => {
    for (const bad of ["not json", JSON.stringify({ nothing: true }), JSON.stringify([]), JSON.stringify({ elements: [], marks: "x" })]) {
      const r = await executeCreative("h", "canvas.save", { projectId: id, revision: 3, scene: bad });
      expect(r.ok === false && r.code).toBe("INVALID_INPUT");
    }
  });

  it("limits the size of a scene and rejects extra fields", () => {
    const base = { projectId: id, revision: 1, scene };
    expect(commands["canvas.save"].safeParse(base).success).toBe(true);
    expect(commands["canvas.save"].safeParse({ ...base, scene: "x".repeat(CANVAS_SCENE_MAX + 1) }).success).toBe(false);
    expect(commands["canvas.save"].safeParse({ ...base, extra: 1 }).success).toBe(false);
  });
});

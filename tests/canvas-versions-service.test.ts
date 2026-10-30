import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands, newProject } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
vi.mock("../server/creative/assistant", () => ({ draftCreativeProposal: vi.fn() }));
import { executeCreative } from "../server/creative/service";

const id = "11111111-2222-4333-8444-555555555555";
const scene = (n: number) => JSON.stringify({ elements: [{ id: `a${n}`, type: "rectangle" }], marks: [], drafts: [] });
let doc: ReturnType<typeof newProject>;
const record = () => ({ id, revision: 3, owner: true, document: doc });
const savedDoc = () => query.mock.calls.find((c) => c[0] === "creative_save")?.[1][3];

describe("canvas versions", () => {
  beforeEach(() => {
    doc = newProject(id, "A brief", "Canvas study", "culture-cover");
    doc.canvas = { at: "t", scene: scene(9) };
    query.mockReset();
    query.mockImplementation(async (name: string, params: unknown[]) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [record()] };
      if (name === "creative_get") return record();
      if (name === "creative_save") return { ...record(), revision: 4, document: params[3] };
      return {};
    });
  });

  it("keeps a version without touching the live scene or the history, and replies without scenes", async () => {
    const r = await executeCreative("h", "canvas.version", { projectId: id, revision: 3, kind: "clean", scene: scene(1) });
    expect(r.ok).toBe(true);
    const saved = savedDoc();
    expect(saved.canvas.scene).toBe(scene(9));
    expect(saved.canvas.versions).toHaveLength(1);
    expect(saved.canvas.versions[0]).toMatchObject({ kind: "clean", scene: scene(1) });
    expect(saved.history.length).toBe(doc.history.length);
    const sent = r.ok ? r.project?.document.canvas : undefined;
    expect(sent?.scene).toBe("");
    expect(sent?.versions?.[0]).toMatchObject({ kind: "clean", scene: "" });
  });

  it("a canvas save keeps the versions", async () => {
    doc.canvas = { at: "t", scene: scene(9), versions: [{ id: "v1", at: "t", kind: "manual", scene: scene(2) }] };
    await executeCreative("h", "canvas.save", { projectId: id, revision: 3, scene: scene(5) });
    expect(savedDoc().canvas.versions).toHaveLength(1);
  });

  it("opening a project lists versions without their scenes, and restore answers with one", async () => {
    doc.canvas = { at: "t", scene: scene(9), versions: [{ id: "v1", at: "t", kind: "manual", scene: scene(2) }] };
    const open = await executeCreative("h", "project.get", { projectId: id });
    expect(open.ok && open.project?.document.canvas?.scene).toBe(scene(9));
    expect(open.ok && open.project?.document.canvas?.versions?.[0].scene).toBe("");
    const back = await executeCreative("h", "canvas.restore", { projectId: id, versionId: "v1" });
    expect(back.ok && back.scene).toBe(scene(2));
    const gone = await executeCreative("h", "canvas.restore", { projectId: id, versionId: "nope" });
    expect(gone.ok === false && gone.code).toBe("NOT_FOUND");
    expect(savedDoc()).toBeUndefined();
  });

  it("refuses an older revision and a kind that is not one of ours", async () => {
    const stale = await executeCreative("h", "canvas.version", { projectId: id, revision: 2, kind: "manual", scene: scene(1) });
    expect(stale.ok === false && stale.code).toBe("CONFLICT");
    expect(commands["canvas.version"].safeParse({ projectId: id, revision: 3, kind: "party", scene: scene(1) }).success).toBe(false);
  });
});

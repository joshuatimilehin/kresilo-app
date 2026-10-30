import { beforeEach, describe, expect, it, vi } from "vitest";
import { newProject } from "../src/creative/contracts";
const { query, draft } = vi.hoisted(() => ({ query: vi.fn(), draft: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
vi.mock("../server/creative/assistant", () => ({ draftCreativeProposal: draft }));
import { executeCreative } from "../server/creative/service";

const id = "11111111-2222-4333-8444-555555555555";
const record = (extra: Record<string, unknown> = {}) => {
  const p = newProject(id, "A brief", "Dusk study", "culture-cover");
  p.references.push({ id: crypto.randomUUID(), workId: "dusk-study", asset: "dusk-study", title: "Dusk", creator: "Ayo", source: "/work/dusk-study", reason: "Light", tags: [] });
  return { id, revision: 1, owner: true, document: { ...p, ...extra } };
};
let saved: { document: { proposals: { patch: Record<string, unknown> }[] } } | null;

describe("the service keeps only what the artist allows", () => {
  beforeEach(() => {
    saved = null;
    query.mockReset();
    draft.mockReset();
    query.mockImplementation(async (name: string, params: unknown[]) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      if (name === "creative_get") return record();
      if (name === "creative_save") {
        const doc = params.find((x) => x && typeof x === "object" && "proposals" in (x as object));
        saved = { document: doc as never };
        return { ...record(), document: doc };
      }
      return {};
    });
  });
  const suggestion = (patch: Record<string, unknown>) => ({ id: crypto.randomUUID(), intent: "glitter", rationale: "r", cites: [], patch, baseVersion: 1, status: "proposed", provenance: "test" });

  it("refuses a suggestion that only rewrites the title while words are off", async () => {
    draft.mockResolvedValue(suggestion({ title: "Collapsing Star" }));
    const r = await executeCreative("h", "proposal.request", { projectId: id, intent: "add glitter" });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.code).toBe("AI_NOT_ALLOWED");
    expect(r.ok === false && r.message).toMatch(/Words/);
  });

  it("keeps the allowed part of a mixed suggestion", async () => {
    draft.mockResolvedValue(suggestion({ title: "Collapsing Star", color: "#ff00aa" }));
    const r = await executeCreative("h", "proposal.request", { projectId: id, intent: "add glitter" });
    expect(r.ok).toBe(true);
    expect(saved?.document.proposals.at(-1)?.patch).toEqual({ color: "#ff00aa" });
  });

  it("refuses every AI request on a hand-only project, without calling the model", async () => {
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      if (name === "creative_get") return record({ aiApply: "off" });
      return {};
    });
    const r = await executeCreative("h", "proposal.request", { projectId: id, intent: "add glitter" });
    expect(r.ok === false && r.code).toBe("AI_OFF");
    expect(draft).not.toHaveBeenCalled();
  });

  it("turns the assistant off and back on", async () => {
    await executeCreative("h", "project.ai", { projectId: id, revision: 1, apply: "off" });
    const doc = query.mock.calls.find((c) => c[0] === "creative_save")?.[1].find((x: unknown) => x && typeof x === "object" && "aiApply" in (x as object));
    expect(doc?.aiApply).toBe("off");
  });

  it("stores a toggle", async () => {
    await executeCreative("h", "project.ai", { projectId: id, revision: 1, allow: { words: true } });
    const doc = query.mock.calls.find((c) => c[0] === "creative_save")?.[1].find((x: unknown) => x && typeof x === "object" && "aiAllow" in (x as object));
    expect(doc?.aiAllow).toEqual({ words: true, layout: true, look: true, images: true });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { changedParts, marksAfterAi, marksAfterHand } from "../src/creative/aiMarks";
import { newProject, type ImageLayer } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

const L1 = "11111111-2222-4333-8444-555555555551";
const L2 = "11111111-2222-4333-8444-555555555552";
const layer = (id: string, x: number): ImageLayer => ({ id, name: id.slice(-1), asset: "dusk-study", x, y: 0, width: 10, height: 10, rotation: 0, opacity: 1, visible: true, filter: "none" }) as ImageLayer;
const base = () => ({ ...newProject("11111111-2222-4333-8444-555555555555", "b", "Title", "culture-cover").art, layers: [layer(L1, 0), layer(L2, 50)] });

describe("marking what the assistant changed", () => {
  it("finds changed parts", () => {
    const a = base();
    expect(changedParts(a, { ...a, title: "New" })).toEqual(["title"]);
    expect(changedParts(a, { ...a, backgroundFilter: "warm" })).toEqual(["background"]);
    expect(changedParts(a, { ...a, layers: [layer(L1, 5), layer(L2, 50)] })).toEqual([L1]);
  });

  it("adds marks after an approved suggestion and keeps earlier ones", () => {
    const a = { ...base(), aiMarks: ["caption"] };
    expect(marksAfterAi(a, { ...a, color: "#ff0000" }).sort()).toEqual(["caption", "title"]);
  });

  it("takes a mark away when the artist edits that part, and only that part", () => {
    const a = { ...base(), aiMarks: [L1, L2, "title"] };
    expect(marksAfterHand(a, { ...a, layers: [layer(L1, 9), layer(L2, 50)] }).sort()).toEqual([L2, "title"].sort());
  });

  it("does not count a layer sent back with its fields in another order", () => {
    const a = base();
    const reordered = Object.fromEntries(Object.entries(layer(L1, 0)).reverse()) as ImageLayer;
    expect(changedParts(a, { ...a, layers: [reordered, layer(L2, 50)] })).toEqual([]);
  });

  it("drops marks for removed layers", () => {
    const a = { ...base(), aiMarks: [L2] };
    expect(marksAfterHand(a, { ...a, layers: [layer(L1, 0)] })).toEqual([]);
  });
});

describe("the server owns the marks", () => {
  const id = "11111111-2222-4333-8444-555555555555";
  let saved: { art: { aiMarks?: string[] } } | null = null;
  beforeEach(() => {
    saved = null;
    query.mockReset();
    query.mockImplementation(async (name: string, params: unknown[]) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      if (name === "creative_get") {
        const p = newProject(id, "b", "Title", "culture-cover");
        p.art = { ...base(), aiMarks: [L1] };
        return { id, revision: 1, owner: true, document: p };
      }
      if (name === "creative_save") {
        saved = params.find((x) => x && typeof x === "object" && "art" in (x as object)) as never;
        return { id, revision: 2, owner: true, document: saved };
      }
      return {};
    });
  });

  it("ignores marks sent with a hand edit and clears the edited layer's mark", async () => {
    await executeCreative("h", "artwork.edit", {
      projectId: id,
      revision: 1,
      patch: { layers: [layer(L1, 20), layer(L2, 50)], aiMarks: [L2, "title"] },
    });
    expect(saved?.art.aiMarks).toEqual([]);
  });
});

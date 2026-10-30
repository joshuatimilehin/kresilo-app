import { describe, expect, it } from "vitest";
import { readPlan } from "../server/creative/plan";

describe("reading a model reply", () => {
  it("drops an empty title instead of refusing the whole suggestion (the live failure)", () => {
    const r = readPlan({ rationale: "Warmer palette for a Lisbon sunset.", cites: [], patch: { title: "", caption: "", color: "#E85D04", backgroundFilter: "warm" }, motion: {} });
    expect(r.success).toBe(true);
    expect(r.success && r.data.patch).toEqual({ color: "#E85D04", backgroundFilter: "warm" });
  });

  it("removes one bad field or list entry and keeps the rest", () => {
    const r = readPlan({
      rationale: "Bigger title, a texture and a fade.",
      cites: [],
      patch: { size: 30, color: "orange" },
      addLayers: [{ asset: "not-an-asset", name: "X" }, { asset: "mineral", name: "Paper texture", opacity: 0.3 }],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.patch).toEqual({ size: 30 });
      expect(r.data.addLayers).toEqual([{ asset: "mineral", name: "Paper texture", opacity: 0.3 }]);
    }
  });

  it("still refuses a reply with no usable rationale", () => {
    expect(readPlan({ rationale: "", cites: [], patch: {} }).success).toBe(false);
  });

  it("reads British colour as color and moves text and shape edits out of layerPatches", () => {
    const r = readPlan({
      rationale: "Neon palette.",
      cites: [],
      patch: { colour: "#C084FC" },
      layerPatches: [{ layer: "Dot", fill: "#C084FC", strokeWidth: 0 }, { layer: "Photo", opacity: 0.8 }],
      markPatches: [{ mark: "When and where", colour: "#9D8AD4" }],
    });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.patch).toMatchObject({ color: "#C084FC" });
    expect(r.data.layerPatches).toEqual([{ layer: "Photo", opacity: 0.8 }]);
    expect(r.data.markPatches).toEqual(expect.arrayContaining([{ mark: "When and where", color: "#9D8AD4" }, { mark: "Dot", fill: "#C084FC", strokeWidth: 0 }]));
  });
});

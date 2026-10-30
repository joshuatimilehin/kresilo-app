import { describe, expect, it } from "vitest";
import { aiAllowOf, aiAllowRule, defaultAiAllow, limitPatch } from "../src/creative/aiAllow";
import { commands, newProject, type ImageLayer } from "../src/creative/contracts";

const art = () => {
  const a = newProject(crypto.randomUUID(), "A brief", "Dusk study", "culture-cover").art;
  const layer = { id: "11111111-2222-4333-8444-555555555555", name: "Dusk photo", asset: "dusk-study", x: 10, y: 10, width: 50, height: 50, rotation: 0, opacity: 1, visible: true, filter: "none" } as ImageLayer;
  return { ...a, layers: [layer] };
};

describe("what the assistant may change", () => {
  it("keeps words off until the artist turns them on", () => {
    expect(defaultAiAllow).toEqual({ words: false, layout: true, look: true, images: true });
    expect(aiAllowOf({})).toEqual(defaultAiAllow);
    expect(aiAllowOf({ aiAllow: { words: true } }).words).toBe(true);
  });

  it("drops a title rewrite but keeps the colour change from the same suggestion", () => {
    const a = art();
    const r = limitPatch(a, { title: "Collapsing Star", color: "#ff00aa" }, defaultAiAllow);
    expect(r.patch).toEqual({ color: "#ff00aa" });
    expect(r.blocked).toEqual(["words"]);
  });

  it("lets an unchanged title through, since nothing is rewritten", () => {
    const a = art();
    expect(limitPatch(a, { title: a.title, size: 20 }, defaultAiAllow)).toEqual({ patch: { title: a.title, size: 20 }, blocked: [] });
  });

  it("splits a layer change by kind: position kept, filter dropped when look is off", () => {
    const a = art();
    const moved = { ...a.layers[0], x: 30, filter: "warm" as const };
    const r = limitPatch(a, { layers: [moved] }, { ...defaultAiAllow, look: false });
    expect(r.patch.layers?.[0].x).toBe(30);
    expect(r.patch.layers?.[0].filter).toBe("none");
    expect(r.blocked).toEqual(["look"]);
  });

  it("refuses new and removed pictures when images is off", () => {
    const a = art();
    const added = { ...a.layers[0], id: "99999999-2222-4333-8444-555555555555", name: "Mineral sparkle" };
    const add = limitPatch(a, { layers: [...a.layers, added] }, { ...defaultAiAllow, images: false });
    expect(add.patch.layers).toBeUndefined();
    expect(add.blocked).toEqual(["images"]);
    const removed = limitPatch(a, { layers: [] }, { ...defaultAiAllow, images: false });
    expect(removed.patch.layers).toBeUndefined();
    expect(removed.blocked).toEqual(["images"]);
  });

  it("tells the model plainly", () => {
    expect(aiAllowRule(defaultAiAllow)).toMatch(/Do not change: words/);
    expect(aiAllowRule({ words: true, layout: true, look: true, images: true })).toMatch(/every kind/);
  });

  it("accepts a toggle on its own and refuses an empty or unknown one", () => {
    const base = { projectId: "11111111-2222-4333-8444-555555555555", revision: 1 };
    expect(commands["project.ai"].safeParse({ ...base, allow: { words: true } }).success).toBe(true);
    expect(commands["project.ai"].safeParse({ ...base, apply: "auto" }).success).toBe(true);
    expect(commands["project.ai"].safeParse({ ...base, allow: { everything: true } }).success).toBe(false);
  });
});

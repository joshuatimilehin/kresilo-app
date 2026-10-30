import { describe, expect, it } from "vitest";
import { artPatch, formatRatio, ratioOf } from "../src/creative/contracts";
import { limitPatch, defaultAiAllow } from "../src/creative/aiAllow";
import { newProject } from "../src/creative/contracts";

describe("canvas formats", () => {
  it("defaults to the 3:4 poster and accepts the four formats", () => {
    expect(ratioOf({})).toBe(3 / 4);
    expect(ratioOf({ format: "story" })).toBe(9 / 16);
    for (const f of Object.keys(formatRatio)) expect(artPatch.safeParse({ format: f }).success).toBe(true);
    expect(artPatch.safeParse({ format: "banner" }).success).toBe(false);
  });

  it("counts a format change as layout for the assistant", () => {
    const art = newProject(crypto.randomUUID(), "x", "y").art;
    const { blocked } = limitPatch(art, { format: "square" }, { ...defaultAiAllow, layout: false });
    expect(blocked).toEqual(["layout"]);
  });
});

describe("canvas colour", () => {
  it("accepts a hex colour and counts it as look for the assistant", () => {
    expect(artPatch.safeParse({ canvasColor: "#ff6b9d" }).success).toBe(true);
    expect(artPatch.safeParse({ canvasColor: "red" }).success).toBe(false);
    const art = newProject(crypto.randomUUID(), "x", "y").art;
    const { blocked } = limitPatch(art, { canvasColor: "#111111" }, { ...defaultAiAllow, look: false });
    expect(blocked).toEqual(["look"]);
  });
});

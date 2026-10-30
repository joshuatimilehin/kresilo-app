import { describe, expect, it } from "vitest";
import { assistedAfterAi, assistedAfterHand, partOrigins } from "../src/creative/aiMarks";
import { newProject, type ImageLayer } from "../src/creative/contracts";
import { publicStory } from "../src/creative/publicStory";

const L1 = "11111111-2222-4333-8444-555555555551";
const L2 = "11111111-2222-4333-8444-555555555552";
const layer = (id: string, x: number): ImageLayer => ({ id, name: id.slice(-1), asset: "dusk-study", x, y: 0, width: 10, height: 10, rotation: 0, opacity: 1, visible: true, filter: "none" }) as ImageLayer;
const base = () => ({ ...newProject("11111111-2222-4333-8444-555555555555", "b", "T", "culture-cover").art, layers: [layer(L1, 0), layer(L2, 50)] });

describe("where each part of the artwork came from", () => {
  it("moves an AI part to AI-assisted when the artist edits it, never to hand", () => {
    const a = { ...base(), aiMarks: [L1] };
    expect(assistedAfterHand(a, { ...a, layers: [layer(L1, 5), layer(L2, 50)] })).toEqual([L1]);
    expect(assistedAfterHand(a, { ...a, layers: [layer(L1, 0), layer(L2, 55)] })).toEqual([]);
  });

  it("makes an assisted part AI-generated again after a new AI change", () => {
    const a = { ...base(), aiAssisted: [L1] };
    expect(assistedAfterAi(a, { ...a, layers: [layer(L1, 9), layer(L2, 50)] })).toEqual([]);
    expect(assistedAfterAi(a, { ...a, title: "New" })).toEqual([L1]);
  });

  it("counts parts by origin with the written rule", () => {
    const a = { ...base(), aiMarks: ["title", L1], aiAssisted: [L2] };
    expect(partOrigins(a)).toEqual({ hand: 2, assisted: 1, generated: 2 });
    expect(partOrigins(base())).toEqual({ hand: 5, assisted: 0, generated: 0 });
  });

  it("travels with a published story when authorship is shown", () => {
    const p = newProject("11111111-2222-4333-8444-555555555555", "b", "T", "culture-cover");
    p.art = { ...base(), aiMarks: [L1] };
    expect(publicStory(p, { authorship: true }).authorship?.parts).toEqual({ hand: 4, assisted: 0, generated: 1 });
    expect(publicStory(p, { authorship: false }).authorship).toBeUndefined();
  });
});

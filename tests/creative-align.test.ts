import { describe, expect, it } from "vitest";
import { newProject, type ImageLayer } from "../src/creative/contracts";
import { addImageLayer } from "../src/creative/layers";
import { alignInArt, alignLayer, boxOf, POSTER } from "../src/creative/align";
import { bounds } from "../src/creative/transform";

const layer = (over: Partial<ImageLayer> = {}): ImageLayer =>
  ({
    ...addImageLayer(newProject(crypto.randomUUID(), "x").art, { asset: "mineral" }, "Mineral")[0],
    x: 20,
    y: 30,
    width: 30,
    height: 20,
    rotation: 0,
    ...over,
  }) as ImageLayer;

describe("align to the canvas", () => {
  it("puts an upright layer against each edge and on each centre line", () => {
    const l = layer();
    expect(alignLayer(l, "left").x).toBe(0);
    expect(alignLayer(l, "right").x).toBe(70);
    expect(alignLayer(l, "centre").x).toBe(35);
    expect(alignLayer(l, "top").y).toBe(0);
    expect(alignLayer(l, "bottom").y).toBe(80);
    expect(alignLayer(l, "middle").y).toBe(40);
  });

  it("only moves along the axis it aligns", () => {
    const l = layer();
    expect(alignLayer(l, "left").y).toBe(l.y);
    expect(alignLayer(l, "top").x).toBe(l.x);
  });

  it("aligns a turned layer by the box that contains it, so no corner crosses the edge", () => {
    const l = layer({ rotation: 30 });
    for (const edge of ["left", "right", "top", "bottom"] as const) {
      const moved = { ...l, ...alignLayer(l, edge) };
      const b = bounds(boxOf(moved), POSTER);
      if (edge === "left") expect(b.left).toBeCloseTo(0, 1);
      if (edge === "right") expect(b.right).toBeCloseTo(100, 1);
      if (edge === "top") expect(b.top).toBeCloseTo(0, 1);
      if (edge === "bottom") expect(b.bottom).toBeCloseTo(100, 1);
    }
  });

  it("stays inside the limits the schema allows", () => {
    const wide = layer({ width: 190, height: 190, x: 90, y: 90 });
    for (const edge of ["left", "centre", "right", "top", "middle", "bottom"] as const) {
      const p = alignLayer(wide, edge);
      expect(p.x).toBeGreaterThanOrEqual(-100);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBeGreaterThanOrEqual(-100);
      expect(p.y).toBeLessThanOrEqual(100);
    }
  });

  it("changes only the chosen layer in an artwork and leaves its size, turn and look alone", () => {
    const a = layer({ id: crypto.randomUUID() });
    const b = layer({ id: crypto.randomUUID(), x: 55, y: 55 });
    const art = { ...newProject(crypto.randomUUID(), "x").art, layers: [a, b] };
    const out = alignInArt(art, a.id, "right");
    expect(out[1]).toEqual(b);
    expect(out[0]).toEqual({ ...a, x: 70 });
    expect(out[0].width).toBe(a.width);
  });
});

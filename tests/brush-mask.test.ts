import { describe, expect, it } from "vitest";
import { brushMaskSvg, brushMaskImage, layerStyle } from "../src/creative/layers";
import { imageLayerSchema, type ImageLayer } from "../src/creative/contracts";
import { thinStroke, toLayerPoint } from "../src/creative/transform";

const layer = (mask: ImageLayer["mask"]): ImageLayer =>
  ({ id: crypto.randomUUID(), name: "Photo", asset: "dusk-study", x: 10, y: 10, width: 50, height: 50, rotation: 0, opacity: 1, visible: true, filter: "none", mask }) as ImageLayer;
const stroke = { size: 10, points: [[10, 10], [50, 50], [90, 20]] as [number, number][] };

describe("brush masks", () => {
  it("are part of the layer schema, with bounded strokes", () => {
    expect(imageLayerSchema.safeParse(layer({ shape: "brush", feather: 4, invert: false, strokes: [stroke] })).success).toBe(true);
    expect(imageLayerSchema.safeParse(layer({ shape: "brush", feather: 4, invert: false, strokes: [{ size: 10, points: [[120, 5]] }] })).success).toBe(false);
    expect(imageLayerSchema.safeParse(layer({ shape: "brush", feather: 4, invert: false, strokes: [{ size: 99, points: [[5, 5]] }] })).success).toBe(false);
  });

  it("show the whole layer before anything is painted", () => {
    expect(brushMaskSvg({ shape: "brush", feather: 0, invert: false })).toContain("<rect width='100' height='100'/>");
  });

  it("draw painted strokes, softened by feather, and invert with a mask", () => {
    const svg = brushMaskSvg({ shape: "brush", feather: 8, invert: false, strokes: [stroke] });
    expect(svg).toContain("M10 10L50 50L90 20");
    expect(svg).toContain("stroke-width='10'");
    expect(svg).toContain("feGaussianBlur stdDeviation='2'");
    const inverted = brushMaskSvg({ shape: "brush", feather: 0, invert: true, strokes: [stroke] });
    expect(inverted).toContain("<mask id='m'>");
    expect(inverted).not.toContain("feGaussianBlur");
  });

  it("become the layer's CSS mask image, sized to the layer", () => {
    const style = layerStyle(layer({ shape: "brush", feather: 0, invert: false, strokes: [stroke] }));
    expect(style.maskImage).toBe(brushMaskImage({ shape: "brush", feather: 0, invert: false, strokes: [stroke] }));
    expect(style.maskSize).toBe("100% 100%");
    expect(String(style.maskImage)).toMatch(/^url\("data:image\/svg\+xml,/);
  });

  it("map a canvas point into the layer, undoing turn and flip", () => {
    const rect = { left: 0, top: 0, width: 400, height: 400 };
    const box = { x: 25, y: 25, width: 50, height: 50 };
    expect(toLayerPoint(200, 200, rect, box)).toEqual([50, 50]);
    expect(toLayerPoint(100, 100, rect, box)).toEqual([0, 0]);
    expect(toLayerPoint(100, 200, rect, { ...box, flipX: true })).toEqual([100, 50]);
    const turned = toLayerPoint(200, 100, rect, { ...box, rotation: 90 });
    expect(turned[0]).toBeCloseTo(0, 0);
    expect(turned[1]).toBeCloseTo(50, 0);
  });

  it("thin long strokes and keep both ends", () => {
    const long = Array.from({ length: 500 }, (_, i) => [i / 5, 0] as [number, number]);
    const thin = thinStroke(long, 200);
    expect(thin).toHaveLength(200);
    expect(thin[0]).toEqual(long[0]);
    expect(thin.at(-1)).toEqual(long.at(-1));
  });
});

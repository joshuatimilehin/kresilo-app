import { describe, expect, it } from "vitest";
import { markSchema, artPatch } from "../src/creative/contracts";
import { drawingSvg, strokePath, describeMark } from "../src/creative/marks";

const drawing = {
  id: crypto.randomUUID(),
  name: "Drawing 1",
  kind: "path" as const,
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
  opacity: 1,
  visible: true,
  strokes: [{ points: [[10, 10], [20, 30], [40, 35]] as [number, number][], color: "#ff6b5b", size: 1.4 }],
};

describe("drawing by hand", () => {
  it("is a mark the server accepts, with bounded points and colours", () => {
    expect(markSchema.safeParse(drawing).success).toBe(true);
    expect(artPatch.safeParse({ marks: [drawing] }).success).toBe(true);
    expect(markSchema.safeParse({ ...drawing, strokes: [{ ...drawing.strokes[0], color: "red" }] }).success).toBe(false);
    expect(markSchema.safeParse({ ...drawing, strokes: [{ ...drawing.strokes[0], points: [[120, 5]] }] }).success).toBe(false);
  });

  it("draws a smooth path through the points", () => {
    expect(strokePath([[10, 10], [20, 30], [40, 35]])).toBe("M10 10Q20 30 30 32.5L40 35");
    expect(strokePath([[5, 5]])).toMatch(/^M5 5l0.01 0$/);
  });

  it("exports as SVG with only checked values, and reads plainly", () => {
    const svg = drawingSvg(drawing);
    expect(svg).toContain('stroke="#ff6b5b"');
    expect(svg).toContain("stroke-width=\"7.56\"");
    expect(describeMark(drawing)).toBe("Drawing, 1 stroke");
  });
});

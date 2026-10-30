import { describe, expect, it } from "vitest";
import {
  angleAround,
  bounds,
  resizeBox,
  rotateBox,
  snapMove,
  snapResize,
  type Box,
  type Canvas,
} from "../src/creative/transform";

const canvas: Canvas = { width: 800, height: 600 };
const box = (over: Partial<Box> = {}): Box => ({
  x: 10,
  y: 10,
  width: 50,
  height: 40,
  rotation: 0,
  ...over,
});

/** World position of a box's top-left corner in pixels, honouring rotation. */
function topLeft(b: Box) {
  const w = (b.width / 100) * canvas.width,
    h = (b.height / 100) * canvas.height;
  const cx = (b.x / 100) * canvas.width + w / 2,
    cy = (b.y / 100) * canvas.height + h / 2;
  const t = (b.rotation * Math.PI) / 180;
  const ox = -w / 2,
    oy = -h / 2;
  return {
    x: cx + ox * Math.cos(t) - oy * Math.sin(t),
    y: cy + ox * Math.sin(t) + oy * Math.cos(t),
  };
}
function bottomRight(b: Box) {
  const w = (b.width / 100) * canvas.width,
    h = (b.height / 100) * canvas.height;
  const cx = (b.x / 100) * canvas.width + w / 2,
    cy = (b.y / 100) * canvas.height + h / 2;
  const t = (b.rotation * Math.PI) / 180;
  const ox = w / 2,
    oy = h / 2;
  return {
    x: cx + ox * Math.cos(t) - oy * Math.sin(t),
    y: cy + ox * Math.sin(t) + oy * Math.cos(t),
  };
}

describe("resize handles", () => {
  it("grows from the south-east corner and keeps the north-west corner fixed", () => {
    const next = resizeBox(box(), "se", { x: 100, y: 0 }, canvas, {
      keepAspect: false,
    });
    expect(next.x).toBe(10);
    expect(next.y).toBe(10);
    expect(next.width).toBeCloseTo(62.5, 2);
    expect(next.height).toBe(40);
  });

  it("keeps the aspect ratio on corners when asked", () => {
    const next = resizeBox(box(), "se", { x: 100, y: 0 }, canvas, {
      keepAspect: true,
    });
    expect((next.width * canvas.width) / (next.height * canvas.height)).toBeCloseTo(
      (50 * canvas.width) / (40 * canvas.height),
      2,
    );
    expect(next.width).toBeCloseTo(62.5, 2);
    expect(next.height).toBeCloseTo(50, 2);
  });

  it("changes only one dimension from an edge handle", () => {
    const next = resizeBox(box(), "n", { x: 0, y: -60 }, canvas);
    expect(next.width).toBe(50);
    expect(next.height).toBeCloseTo(50, 2);
    expect(next.y).toBeCloseTo(0, 2);
  });

  it("keeps the opposite corner fixed even when the layer is rotated", () => {
    const start = box({ rotation: 30 });
    const before = topLeft(start);
    const delta = { x: 70, y: 40 };
    const next = resizeBox(start, "se", delta, canvas, { keepAspect: false });
    const after = topLeft(next);
    expect(after.x).toBeCloseTo(before.x, 0);
    expect(after.y).toBeCloseTo(before.y, 0);
    expect(next.rotation).toBe(30);
    const sw = resizeBox(start, "nw", delta, canvas, { keepAspect: false });
    const fixed = bottomRight(sw);
    expect(fixed.x).toBeCloseTo(bottomRight(start).x, 0);
    expect(fixed.y).toBeCloseTo(bottomRight(start).y, 0);
  });

  it("resizes from the centre when asked", () => {
    const start = box();
    const next = resizeBox(start, "e", { x: 40, y: 0 }, canvas, {
      fromCenter: true,
    });
    const centreBefore = start.x + start.width / 2;
    expect(next.x + next.width / 2).toBeCloseTo(centreBefore, 2);
    expect(next.width).toBeCloseTo(60, 2);
  });

  it("never goes below or above the layer limits", () => {
    const tiny = resizeBox(box(), "se", { x: -5000, y: -5000 }, canvas, {
      keepAspect: true,
    });
    expect(tiny.width).toBeGreaterThanOrEqual(5);
    expect(tiny.height).toBeGreaterThanOrEqual(5);
    const huge = resizeBox(box(), "se", { x: 9000, y: 9000 }, canvas, {
      keepAspect: false,
    });
    expect(huge.width).toBeLessThanOrEqual(200);
    expect(huge.height).toBeLessThanOrEqual(200);
    expect(huge.x).toBeGreaterThanOrEqual(-100);
    expect(huge.x).toBeLessThanOrEqual(100);
  });
});

describe("rotate handle", () => {
  const centre = { x: (10 + 25) * 8, y: (10 + 20) * 6 };
  it("turns with the pointer around the layer's centre", () => {
    const start = { x: centre.x, y: centre.y - 100 };
    const right = { x: centre.x + 100, y: centre.y };
    expect(angleAround(centre, start)).toBeCloseTo(0, 5);
    expect(angleAround(centre, right)).toBeCloseTo(90, 5);
    expect(rotateBox(box(), start, right, canvas).rotation).toBe(90);
  });

  it("clings to common angles and snaps to 15 degrees with Shift", () => {
    const start = { x: centre.x, y: centre.y - 100 };
    const at = (deg: number) => ({
      x: centre.x + 100 * Math.sin((deg * Math.PI) / 180),
      y: centre.y - 100 * Math.cos((deg * Math.PI) / 180),
    });
    expect(rotateBox(box(), start, at(2), canvas).rotation).toBe(0);
    expect(rotateBox(box(), start, at(20), canvas).rotation).toBeCloseTo(20, 0);
    expect(rotateBox(box(), start, at(37), canvas, { snap: true }).rotation).toBe(30);
  });

  it("wraps past 180 degrees and stays inside the schema range", () => {
    const start = { x: centre.x, y: centre.y - 100 };
    const turned = { x: centre.x + 100 * Math.sin((20 * Math.PI) / 180), y: centre.y - 100 * Math.cos((20 * Math.PI) / 180) };
    const next = rotateBox(box({ rotation: 170 }), start, turned, canvas);
    expect(next.rotation).toBeGreaterThanOrEqual(-180);
    expect(next.rotation).toBeLessThanOrEqual(180);
    expect(next.rotation).toBeCloseTo(-170, 0);
  });
});

describe("snap guides", () => {
  it("measures a rotated layer by the box that contains it", () => {
    const b = bounds(box({ x: 0, y: 0, width: 25, height: 50, rotation: 90 }), canvas);
    // 200 x 300 px turned a quarter becomes 300 x 200 px.
    expect(b.right - b.left).toBeCloseTo((300 / 800) * 100, 2);
    expect(b.bottom - b.top).toBeCloseTo((200 / 600) * 100, 2);
  });

  it("snaps a moving layer to the canvas centre and shows a guide", () => {
    const moving = box({ x: 24.2, y: 10 });
    const { box: snapped, guides } = snapMove(moving, [], canvas);
    expect(snapped.x + snapped.width / 2).toBeCloseTo(50, 2);
    expect(guides).toContainEqual({ axis: "x", at: 50 });
  });

  it("snaps to the canvas edge and to another layer", () => {
    const edge = snapMove(box({ x: 0.8, y: 30, width: 30 }), [], canvas);
    expect(edge.box.x).toBe(0);
    expect(edge.guides).toContainEqual({ axis: "x", at: 0 });
    const other = box({ x: 60, y: 60, width: 20, height: 20 });
    const near = snapMove(box({ x: 10, y: 59.2, width: 20, height: 10 }), [other], canvas);
    expect(near.box.y).toBeCloseTo(60, 2);
    expect(near.guides).toContainEqual({ axis: "y", at: 60 });
  });

  it("does not snap when nothing is close", () => {
    const { box: out, guides } = snapMove(box({ x: 17, y: 13 }), [], canvas);
    expect(out.x).toBe(17);
    expect(out.y).toBe(13);
    expect(guides).toEqual([]);
  });

  it("snaps the edge being resized to the canvas edge", () => {
    const start = box({ x: 10, y: 10, width: 50, height: 40 });
    const candidate = box({ x: 10, y: 10, width: 89.2, height: 40 });
    const { box: out, guides } = snapResize(start, "e", candidate, [], canvas);
    expect(out.x + out.width).toBeCloseTo(100, 2);
    expect(guides).toContainEqual({ axis: "x", at: 100 });
  });

  it("keeps proportions when a corner snaps with the aspect locked", () => {
    const start = box({ x: 10, y: 10, width: 40, height: 40 });
    const candidate = box({ x: 10, y: 10, width: 89.3, height: 60 });
    const { box: out } = snapResize(start, "se", candidate, [], canvas, {
      keepAspect: true,
    });
    expect(out.x + out.width).toBeCloseTo(100, 2);
    const ratioStart = (start.width * canvas.width) / (start.height * canvas.height);
    expect((out.width * canvas.width) / (out.height * canvas.height)).toBeCloseTo(ratioStart, 1);
  });

  it("leaves a rotated layer alone while resizing", () => {
    const start = box({ rotation: 20 });
    const candidate = box({ rotation: 20, width: 89.5 });
    const { box: out, guides } = snapResize(start, "e", candidate, [], canvas);
    expect(out).toEqual(candidate);
    expect(guides).toEqual([]);
  });
});

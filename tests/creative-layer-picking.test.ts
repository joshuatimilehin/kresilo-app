import { describe, expect, it } from "vitest";
import {
  hitsBox,
  pickLayer,
  visibleHandleSpots,
  type Box,
  type Canvas,
  type Rect,
} from "../src/creative/transform";

const canvas: Canvas = { width: 400, height: 500 };
const box = (over: Partial<Box> = {}): Box => ({
  x: 10,
  y: 10,
  width: 50,
  height: 40,
  rotation: 0,
  ...over,
});

describe("hitsBox", () => {
  it("is true inside and false outside an unrotated box", () => {
    // x 40..240, y 50..250 in pixels
    expect(hitsBox(box(), { x: 100, y: 100 }, canvas)).toBe(true);
    expect(hitsBox(box(), { x: 30, y: 100 }, canvas)).toBe(false);
    expect(hitsBox(box(), { x: 100, y: 260 }, canvas)).toBe(false);
  });

  it("follows the rotation of the box", () => {
    // a wide strip turned a quarter turn becomes a tall strip
    const strip = box({ x: 25, y: 40, width: 50, height: 10, rotation: 90 });
    const cx = 200,
      cy = 225;
    expect(hitsBox(strip, { x: cx, y: cy + 80 }, canvas)).toBe(true);
    expect(hitsBox(strip, { x: cx + 80, y: cy }, canvas)).toBe(false);
  });
});

describe("pickLayer", () => {
  const titleBox: Rect = { left: 20, top: 300, right: 300, bottom: 460 };
  // the lettering occupies one band of the box
  const onInk = (p: { x: number; y: number }) =>
    p.x >= 20 && p.x <= 180 && p.y >= 320 && p.y <= 380;
  const photo = {
    id: "layer-photo",
    box: box({ x: 0, y: 55, width: 100, height: 45 }),
  };
  const base = { canvas, titleBox, onTitleInk: onInk, images: [photo] };

  it("picks the image under the title box when the point misses the lettering", () => {
    expect(pickLayer({ ...base, point: { x: 250, y: 420 } })).toBe(
      "layer-photo",
    );
  });

  it("picks the title when the point lands on its lettering", () => {
    expect(pickLayer({ ...base, point: { x: 60, y: 340 } })).toBe("title");
  });

  it("picks the title where no image lies under its box", () => {
    expect(pickLayer({ ...base, images: [], point: { x: 250, y: 420 } })).toBe(
      "title",
    );
  });

  it("picks the topmost visible image where images overlap", () => {
    const top = {
      id: "layer-top",
      box: box({ x: 10, y: 60, width: 60, height: 30 }),
    };
    expect(
      pickLayer({ ...base, images: [photo, top], point: { x: 250, y: 420 } }),
    ).toBe("layer-top");
  });

  it("picks an image outside the title box without asking about lettering", () => {
    let asked = false;
    const id = pickLayer({
      ...base,
      onTitleInk: () => ((asked = true), true),
      point: { x: 350, y: 470 },
    });
    expect(id).toBe("layer-photo");
    expect(asked).toBe(false);
  });

  it("returns null when nothing is under the point", () => {
    expect(pickLayer({ ...base, point: { x: 390, y: 20 } })).toBeNull();
  });

  it("ignores the title when it is hidden", () => {
    expect(
      pickLayer({ ...base, titleBox: null, point: { x: 60, y: 340 } }),
    ).toBe("layer-photo");
  });
});

/** World pixel position of a handle drawn at local percent (left, top). */
function world(b: Box, spot: { left: number; top: number }) {
  const w = (b.width / 100) * canvas.width,
    h = (b.height / 100) * canvas.height;
  const cx = (b.x / 100) * canvas.width + w / 2,
    cy = (b.y / 100) * canvas.height + h / 2;
  const t = (b.rotation * Math.PI) / 180;
  const lx = (spot.left / 100) * w - w / 2,
    ly = (spot.top / 100) * h - h / 2;
  return {
    x: cx + lx * Math.cos(t) - ly * Math.sin(t),
    y: cy + lx * Math.sin(t) + ly * Math.cos(t),
  };
}

describe("visibleHandleSpots", () => {
  const inset = 9,
    rotateOffset = 34;
  const all = (b: Box) => {
    const v = visibleHandleSpots(b, canvas, inset, rotateOffset);
    return [...Object.values(v.spots), v.rotate].map((s) => world(b, s));
  };

  it("leaves handles on the box edges when the layer sits inside the canvas", () => {
    const v = visibleHandleSpots(box(), canvas, inset, rotateOffset);
    expect(v.spots.nw).toEqual({ left: 0, top: 0 });
    expect(v.spots.se).toEqual({ left: 100, top: 100 });
    expect(v.spots.n).toEqual({ left: 50, top: 0 });
    expect(v.rotateMoved).toBe(false);
  });

  it("pulls handles of a layer that passes the canvas edge back inside", () => {
    const wide = box({ x: -30, y: -10, width: 160, height: 80 });
    for (const p of all(wide)) {
      expect(p.x).toBeGreaterThanOrEqual(inset - 0.05);
      expect(p.x).toBeLessThanOrEqual(canvas.width - inset + 0.05);
      expect(p.y).toBeGreaterThanOrEqual(inset - 0.05);
      expect(p.y).toBeLessThanOrEqual(canvas.height - inset + 0.05);
    }
  });

  it("keeps rotated layers' handles inside too", () => {
    const turned = box({ x: 70, y: 70, width: 60, height: 50, rotation: 35 });
    for (const p of all(turned)) {
      expect(p.x).toBeLessThanOrEqual(canvas.width - inset + 0.05);
      expect(p.y).toBeLessThanOrEqual(canvas.height - inset + 0.05);
    }
  });

  it("moves the rotate handle in from above the top edge", () => {
    const top = box({ x: 20, y: 0, width: 40, height: 30 });
    const v = visibleHandleSpots(top, canvas, inset, rotateOffset);
    expect(v.rotateMoved).toBe(true);
    expect(world(top, v.rotate).y).toBeGreaterThanOrEqual(inset - 0.05);
  });

  it("does not change the box it is given", () => {
    const b = box({ x: -30, width: 160 });
    const copy = { ...b };
    visibleHandleSpots(b, canvas, inset, rotateOffset);
    expect(b).toEqual(copy);
  });
});

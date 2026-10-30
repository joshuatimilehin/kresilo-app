import { describe, expect, it } from "vitest";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { MARK_LIMIT, anchorFor, anchorOf, isMark, joinScene, splitScene, tagMark } from "../src/creative/canvasMarks";

const el = (id: string, type: string, x: number, y: number, width: number, height: number, extra: Record<string, unknown> = {}) =>
  ({ id, type, x, y, width, height, version: 1, versionNonce: 1, updated: 1, isDeleted: false, frameId: null, customData: undefined, ...extra }) as unknown as ExcalidrawElement;

const phone = el("phone", "frame", 0, 0, 390, 844);
const tablet = el("tablet", "frame", 470, 0, 820, 1180);
const card = el("card", "rectangle", 20, 600, 300, 120, { frameId: "phone" });
const button = el("button", "rectangle", 150, 650, 100, 36, { frameId: "phone" });
const title = el("title", "text", 20, 40, 200, 40, { frameId: "phone" });
const scene = [phone, tablet, card, button, title];

describe("a mark points at what is under it", () => {
  it("picks the smallest element holding the mark's centre, not the one that merely overlaps", () => {
    const circle = el("m1", "ellipse", 130, 640, 140, 60); // a loop round the button, inside the card
    expect(anchorFor(circle, scene)).toEqual({ id: "button", kind: "rectangle", board: "phone" });
  });

  it("falls back to the outer element when only it is under the centre", () => {
    const stroke = el("m2", "freedraw", 30, 610, 60, 20);
    expect(anchorFor(stroke, scene)?.id).toBe("card");
  });

  it("takes the element a stroke mostly covers when its centre sits beside it", () => {
    const over = el("m4", "freedraw", 10, 30, 230, 20); // centre at y 40 lies on the title's top edge
    expect(anchorFor(over, scene)?.id).toBe("title");
  });

  it("points at the board when nothing smaller is under it", () => {
    const stroke = el("m5", "freedraw", 100, 300, 50, 50);
    expect(anchorFor(stroke, scene)).toEqual({ id: "phone", kind: "frame", board: "phone" });
  });

  it("finds the right board among several", () => {
    const stroke = el("m6", "freedraw", 700, 300, 50, 50);
    expect(anchorFor(stroke, scene)?.board).toBe("tablet");
  });

  it("is null on empty canvas and ignores deleted elements and other marks", () => {
    expect(anchorFor(el("m7", "freedraw", 3000, 3000, 40, 40), scene)).toBeNull();
    const gone = el("gone", "rectangle", 140, 640, 120, 60, { isDeleted: true });
    const other = tagMark(el("old", "ellipse", 140, 640, 120, 60), scene);
    expect(anchorFor(el("m8", "ellipse", 130, 640, 140, 60), [...scene, gone, other])?.id).toBe("button");
  });
});

describe("marks stay apart from the design", () => {
  it("tags a mark with its anchor and time, without changing the original", () => {
    const raw = el("m9", "ellipse", 130, 640, 140, 60);
    const tagged = tagMark(raw, scene, new Date("2026-10-26T10:00:00Z"));
    expect(isMark(tagged)).toBe(true);
    expect(anchorOf(tagged)?.id).toBe("button");
    expect(tagged.version).toBe(raw.version + 1);
    expect(raw.customData).toBeUndefined();
  });

  it("splits a scene into design and marks and joins it back", () => {
    const mark = tagMark(el("m10", "freedraw", 30, 610, 60, 20), scene);
    const deleted = el("x", "rectangle", 0, 0, 5, 5, { isDeleted: true });
    const { design, marks } = splitScene([...scene, mark, deleted]);
    expect(design.map((e) => e.id)).toEqual(["phone", "tablet", "card", "button", "title"]);
    expect(marks.map((e) => e.id)).toEqual(["m10"]);
    expect(joinScene(design, marks).map((e) => e.id)).toEqual(["phone", "tablet", "card", "button", "title", "m10"]);
  });

  it("never lets a mark ride in the design list, and caps how many are kept", () => {
    const mark = tagMark(el("m11", "freedraw", 30, 610, 60, 20), scene);
    expect(joinScene([...scene, mark], []).some(isMark)).toBe(false);
    const many = Array.from({ length: MARK_LIMIT + 20 }, (_, i) => tagMark(el(`k${i}`, "freedraw", 30, 610, 60, 20), scene));
    expect(splitScene(many).marks).toHaveLength(MARK_LIMIT);
  });
});

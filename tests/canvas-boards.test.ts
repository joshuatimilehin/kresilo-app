import { describe, expect, it } from "vitest";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { BOARD_GAP, BOARD_PRESETS, nextBoardSlot } from "../src/creative/canvasBoards";
import { tagMark } from "../src/creative/canvasMarks";

const el = (id: string, type: string, x: number, y: number, width: number, height: number, extra: Record<string, unknown> = {}) =>
  ({ id, type, x, y, width, height, version: 1, versionNonce: 1, updated: 1, isDeleted: false, frameId: null, customData: undefined, ...extra }) as unknown as ExcalidrawElement;

describe("boards can be added in seven sizes", () => {
  it("offers the three devices and the four artwork formats, each with a distinct name and id", () => {
    expect(BOARD_PRESETS.map((b) => b.name)).toEqual(["Phone", "Tablet", "Desktop", "Poster", "Story", "Square", "Wide"]);
    expect(new Set(BOARD_PRESETS.map((b) => b.id)).size).toBe(7);
    const ratio = (id: string) => {
      const b = BOARD_PRESETS.find((x) => x.id === id)!;
      return b.width / b.height;
    };
    expect(ratio("poster")).toBeCloseTo(3 / 4);
    expect(ratio("story")).toBeCloseTo(9 / 16);
    expect(ratio("square")).toBe(1);
    expect(ratio("wide")).toBeCloseTo(16 / 9);
  });
});

describe("a new board goes beside everything, level with the top board", () => {
  it("starts at the origin on an empty canvas", () => {
    expect(nextBoardSlot([])).toEqual({ x: 0, y: 0 });
  });

  it("goes to the right of the rightmost thing, with a gap, at the height of the top board", () => {
    const scene = [el("a", "frame", 0, 40, 390, 844), el("b", "frame", 470, 10, 820, 1180)];
    expect(nextBoardSlot(scene)).toEqual({ x: 1290 + BOARD_GAP, y: 10 });
  });

  it("clears draft boards and pictures to the right of the boards, but not marks or deleted elements", () => {
    const scene = [el("a", "frame", 0, 0, 390, 844), el("draft", "frame", 510, 0, 390, 844), el("pic", "image", 1000, 100, 300, 200)];
    expect(nextBoardSlot(scene).x).toBe(1300 + BOARD_GAP);
    const mark = tagMark(el("m", "freedraw", 5000, 0, 100, 100), scene);
    const gone = el("g", "rectangle", 9000, 0, 100, 100, { isDeleted: true });
    expect(nextBoardSlot([...scene, mark, gone]).x).toBe(1300 + BOARD_GAP);
  });

  it("lines up with the real boards, not a draft board that sits higher or lower", () => {
    const draft = el("d", "frame", 510, -60, 390, 844, { customData: { draft: { source: "a", ops: {}, marks: [], at: "t" } } });
    expect(nextBoardSlot([el("a", "frame", 0, 0, 390, 844), draft])).toEqual({ x: 900 + BOARD_GAP, y: 0 });
  });

  it("works from loose elements when there is no board", () => {
    expect(nextBoardSlot([el("s", "freedraw", 100, 50, 200, 100)])).toEqual({ x: 300 + BOARD_GAP, y: 50 });
  });
});

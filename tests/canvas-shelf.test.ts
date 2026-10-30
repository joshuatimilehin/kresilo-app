import { describe, expect, it } from "vitest";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { SHELF_SIZE, coloursOfVisual, fitWithin, frameAt, libraryData, libraryOf } from "../src/creative/canvasShelf";
import { visuals } from "../src/creative/visuals/library";
import { visualRefSchema } from "../src/creative/visuals/schema";

const el = (id: string, type: string, x: number, y: number, width: number, height: number, extra: Record<string, unknown> = {}) =>
  ({ id, type, x, y, width, height, version: 1, versionNonce: 1, updated: 1, isDeleted: false, frameId: null, customData: undefined, ...extra }) as unknown as ExcalidrawElement;

describe("library pictures take the canvas palette", () => {
  it("draws ink pictures in ivory and duotones from ink shadows to ivory highlights", () => {
    expect(coloursOfVisual({ kind: "ink" })).toEqual({ ink: "#edeae3" });
    const duo = coloursOfVisual({ kind: "duotone" });
    expect(duo).toEqual({ ink: "#0a0c0e", ground: "#edeae3" });
  });

  it("keeps every library picture's colours valid for storage", () => {
    const sample = [visuals.find((v) => v.kind === "ink")!, visuals.find((v) => v.kind === "duotone")!];
    for (const v of sample) expect(visualRefSchema.safeParse(libraryData(v, coloursOfVisual(v), 1).library).success).toBe(true);
  });
});

describe("a placed picture", () => {
  it("starts at a fixed long side and keeps its shape", () => {
    expect(fitWithin(1024, 1024)).toEqual({ w: SHELF_SIZE, h: SHELF_SIZE });
    expect(fitWithin(800, 400)).toEqual({ w: SHELF_SIZE, h: SHELF_SIZE / 2 });
    expect(fitWithin(300, 600)).toEqual({ w: SHELF_SIZE / 2, h: SHELF_SIZE });
  });

  it("lands on the smallest real board holding its centre, and on none in empty canvas", () => {
    const phone = el("phone", "frame", 0, 0, 390, 844);
    const inner = el("inner", "frame", 100, 100, 200, 200);
    const draft = el("draft", "frame", 0, 0, 390, 844, { customData: { draft: { source: "phone", ops: {}, marks: [], at: "t" } } });
    const gone = el("gone", "frame", 150, 150, 20, 20, { isDeleted: true });
    expect(frameAt([phone, inner, draft, gone], 160, 160)?.id).toBe("inner");
    expect(frameAt([phone, inner], 20, 700)?.id).toBe("phone");
    expect(frameAt([phone, draft], 20, 700)?.id).toBe("phone");
    expect(frameAt([phone], 900, 900)).toBeUndefined();
  });

  it("remembers its library id and colours, marked as AI-made library art, and reads them back safely", () => {
    const v = visuals.find((x) => x.kind === "duotone")!;
    const data = libraryData(v, coloursOfVisual(v), 1);
    expect(data.ai).toEqual({ made: "generated", source: "library", version: 1 });
    const placed = el("p", "image", 0, 0, 10, 10, { customData: data });
    expect(libraryOf(placed)).toEqual({ id: v.id, ink: "#0a0c0e", ground: "#edeae3" });
    expect(libraryOf(el("q", "image", 0, 0, 1, 1))).toBeUndefined();
    expect(libraryOf(el("r", "image", 0, 0, 1, 1, { customData: { library: { id: "<script>", ink: "red" } } }))).toBeUndefined();
  });
});

import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { aiTag } from "./canvasOrigins";
import { isDraft, isMark } from "./canvasMarks";
import { coloursFor, paletteFor } from "./visuals/palette";
import { visualRefSchema, type VisualRef } from "./visuals/schema";
import type { Visual, VisualColours } from "./visuals/types";

/**
 * Library pictures on the Studio canvas. A picture is recoloured to the canvas palette when it is placed and
 * remembered by its library id and colours, not uploaded, so it is always rebuilt the same way when the project
 * opens and stays shareable (the pictures people upload themselves are private; see canvasImages.ts).
 */
/** The canvas look the shelf recolours for: ivory ink on the ink ground. */
export const SHELF_ART = { style: null, color: "#edeae3", canvasColor: "#0a0c0e" } as const;
/** The long side, in canvas units, a placed picture starts at. */
export const SHELF_SIZE = 320;

/** The colours a picture takes on the canvas: ink pictures in ivory; duotones from ink shadows to ivory highlights. */
export function coloursOfVisual(v: Pick<Visual, "kind">): VisualColours {
  return coloursFor(v.kind, paletteFor({ art: SHELF_ART }, v.kind));
}

export function fitWithin(width: number, height: number, max = SHELF_SIZE): { w: number; h: number } {
  const k = max / Math.max(1, width, height);
  return { w: Math.max(8, Math.round(width * k)), h: Math.max(8, Math.round(height * k)) };
}

/** The smallest real board holding a point, so a picture dropped on a board belongs to it. */
export function frameAt(elements: readonly ExcalidrawElement[], x: number, y: number): ExcalidrawElement | undefined {
  const holds = (e: ExcalidrawElement) => x >= Math.min(e.x, e.x + e.width) && x <= Math.max(e.x, e.x + e.width) && y >= Math.min(e.y, e.y + e.height) && y <= Math.max(e.y, e.y + e.height);
  const boards = elements.filter((e) => !e.isDeleted && (e.type === "frame" || e.type === "magicframe") && !isDraft(e) && !isMark(e) && holds(e));
  return boards.sort((a, b) => Math.abs(a.width * a.height) - Math.abs(b.width * b.height))[0];
}

/** The library reference an image element carries, if it is a valid one. */
export function libraryOf(e: ExcalidrawElement): VisualRef | undefined {
  const raw = (e.customData as { library?: unknown } | undefined)?.library;
  const r = visualRefSchema.safeParse(raw);
  return r.success ? r.data : undefined;
}

/** What a placed picture records on its element: where it came from, its colours, and that it is AI-made library art. */
export const libraryData = (v: Pick<Visual, "id">, c: VisualColours, version: number) => ({
  library: { id: v.id, ink: c.ink, ...(c.ground ? { ground: c.ground } : {}) } satisfies VisualRef,
  ...aiTag("library", version),
});

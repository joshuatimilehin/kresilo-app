import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

/**
 * Marks are the temporary scribbles drawn on the Studio canvas: a stroke, a circle, an arrow or a note.
 * Each one remembers the element and board under it, so a later request can say "this one" exactly.
 * Marks are kept apart from the design: they are saved in their own list and never part of the artwork.
 */
export const MARK_COLORS = ["#edeae3", "#c7fe02", "#8b5cf8", "#0a0c0e"] as const;
export type MarkColor = (typeof MARK_COLORS)[number];
export const MARK_LIMIT = 200;

export type MarkAnchor = { id: string; kind: string; board: string | null };
type MarkData = { mark: true; anchor: MarkAnchor | null; at: string };
/** A draft board Copilot made beside the original: the board it came from, the edits it holds and the marks it answers. */
export type DraftData = { source: string; ops: unknown; marks: string[]; at: string };
type Box = { x0: number; y0: number; x1: number; y1: number };

const dataOf = (e: ExcalidrawElement): Partial<MarkData> | undefined =>
  e.customData as Partial<MarkData> | undefined;
export const isMark = (e: ExcalidrawElement) => dataOf(e)?.mark === true;
export const draftOf = (e: ExcalidrawElement): DraftData | null =>
  ((e.customData as { draft?: DraftData } | undefined)?.draft ?? null);
export const isDraft = (e: ExcalidrawElement) => draftOf(e) !== null;
export const anchorOf = (e: ExcalidrawElement): MarkAnchor | null => (isMark(e) ? dataOf(e)?.anchor ?? null : null);

const boxOf = (e: ExcalidrawElement): Box => ({
  x0: Math.min(e.x, e.x + e.width),
  y0: Math.min(e.y, e.y + e.height),
  x1: Math.max(e.x, e.x + e.width),
  y1: Math.max(e.y, e.y + e.height),
});
const area = (b: Box) => Math.max(1, (b.x1 - b.x0) * (b.y1 - b.y0));
const overlap = (a: Box, b: Box) => {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? w * h : 0;
};
const holds = (b: Box, x: number, y: number) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;
const isFrame = (e: ExcalidrawElement) => e.type === "frame" || e.type === "magicframe";

/**
 * The element a mark points at: the smallest design element holding the mark's centre, else the one it
 * covers most of. If nothing is under it, the board it sits on; null when it sits on empty canvas.
 */
export function anchorFor(mark: ExcalidrawElement, elements: readonly ExcalidrawElement[]): MarkAnchor | null {
  const mb = boxOf(mark);
  const cx = (mb.x0 + mb.x1) / 2;
  const cy = (mb.y0 + mb.y1) / 2;
  const live = elements.filter((e) => !e.isDeleted && !isMark(e) && !isDraft(e) && e.id !== mark.id);
  const boardOf = (e: ExcalidrawElement): string | null => {
    if (isFrame(e)) return e.id;
    if (e.frameId) return e.frameId;
    const inside = live.filter((f) => isFrame(f) && holds(boxOf(f), cx, cy));
    return inside.length ? inside.reduce((a, b) => (area(boxOf(a)) <= area(boxOf(b)) ? a : b)).id : null;
  };
  const things = live.filter((e) => !isFrame(e));
  const under = things.filter((e) => holds(boxOf(e), cx, cy));
  let pick: ExcalidrawElement | undefined = under.length
    ? under.reduce((a, b) => (area(boxOf(a)) <= area(boxOf(b)) ? a : b))
    : undefined;
  if (!pick) {
    // A loop round an element holds its centre too, but a stroke beside one only touches it: take the most covered.
    let best = 0;
    for (const e of things) {
      const share = overlap(mb, boxOf(e)) / Math.min(area(mb), area(boxOf(e)));
      if (share > best && share >= 0.25) {
        best = share;
        pick = e;
      }
    }
  }
  if (pick) return { id: pick.id, kind: pick.type, board: boardOf(pick) };
  const board = live.filter((f) => isFrame(f) && holds(boxOf(f), cx, cy));
  if (!board.length) return null;
  const f = board.reduce((a, b) => (area(boxOf(a)) <= area(boxOf(b)) ? a : b));
  return { id: f.id, kind: f.type, board: f.id };
}

/** Tags a finished mark with what it points at. A new object, because scene elements are never changed in place. */
export function tagMark(mark: ExcalidrawElement, elements: readonly ExcalidrawElement[], now = new Date()): ExcalidrawElement {
  const data: MarkData = { mark: true, anchor: anchorFor(mark, elements), at: now.toISOString() };
  return {
    ...mark,
    customData: { ...(mark.customData ?? {}), ...data },
    version: mark.version + 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    updated: now.getTime(),
  };
}

/** The design, the marks and the draft boards, kept in separate lists. */
export function splitScene<T extends ExcalidrawElement>(elements: readonly T[]) {
  const live = elements.filter((e) => !e.isDeleted);
  return {
    design: live.filter((e) => !isMark(e) && !isDraft(e)),
    marks: live.filter(isMark).slice(-MARK_LIMIT),
    drafts: live.filter((e) => !isMark(e) && isDraft(e)),
  };
}
export function joinScene<T extends ExcalidrawElement>(design: readonly T[], marks: readonly T[] = [], drafts: readonly T[] = []): T[] {
  return [...design.filter((e) => !isMark(e) && !isDraft(e)), ...marks.filter(isMark), ...drafts.filter((e) => !isMark(e) && isDraft(e))];
}

/** Takes an element off the canvas. A new object with a higher version, so undo can bring it back. */
export function retire<T extends ExcalidrawElement>(e: T, now = Date.now()): T {
  return { ...e, isDeleted: true, version: e.version + 1, versionNonce: Math.floor(Math.random() * 2 ** 31), updated: now };
}

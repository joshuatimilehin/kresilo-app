import type { Art, ImageLayer } from "./contracts";
import { bounds, type Box, type Canvas } from "./transform";

/**
 * Aligning a layer to the canvas (issue #53): move it so the box that contains
 * it (turned layers included) touches an edge or sits on a centre line. Pure
 * and non-destructive: only the layer's position changes, and it stays inside
 * the limits the schema allows.
 */
export type Edge = "left" | "centre" | "right" | "top" | "middle" | "bottom";

export const edgeLabel: Record<Edge, string> = {
  left: "Left",
  centre: "Centre",
  right: "Right",
  top: "Top",
  middle: "Middle",
  bottom: "Bottom",
};
export const horizontalEdges: Edge[] = ["left", "centre", "right"];
export const verticalEdges: Edge[] = ["top", "middle", "bottom"];

/** The posters are 3:4, the size the motion export uses. */
export const POSTER: Canvas = { width: 540, height: 720 };

/** A layer's position, size and turn as a box (the schema allows a layer to omit none of them). */
export const boxOf = (l: ImageLayer): Box => ({
  x: l.x ?? 0,
  y: l.y ?? 0,
  width: l.width ?? 0,
  height: l.height ?? 0,
  rotation: l.rotation ?? 0,
});

const clamp = (n: number) => Math.min(100, Math.max(-100, Math.round(n * 100) / 100));

export function alignLayer(layer: ImageLayer, edge: Edge, canvas: Canvas = POSTER): { x: number; y: number } {
  const b = bounds(boxOf(layer), canvas);
  let x = layer.x ?? 0,
    y = layer.y ?? 0;
  if (edge === "left") x += 0 - b.left;
  if (edge === "centre") x += 50 - b.cx;
  if (edge === "right") x += 100 - b.right;
  if (edge === "top") y += 0 - b.top;
  if (edge === "middle") y += 50 - b.cy;
  if (edge === "bottom") y += 100 - b.bottom;
  return { x: clamp(x), y: clamp(y) };
}

/** The layers of an artwork with one layer aligned; everything else is untouched. */
export function alignInArt(art: Art, id: string, edge: Edge): ImageLayer[] {
  return (art.layers ?? []).map((l) => (l.id === id ? { ...l, ...alignLayer(l, edge) } : l));
}

/*
 * Several layers at once (issue #53): align them to each other, spread them
 * evenly, move them together, and keep them as a group. All pure; every
 * function returns the artwork's full layer list with only the chosen layers
 * changed.
 */

/** The box around several layers, turned layers included, in canvas percent. */
export function selectionBounds(layers: readonly ImageLayer[], canvas: Canvas = POSTER) {
  const all = layers.map((l) => bounds(boxOf(l), canvas));
  const left = Math.min(...all.map((b) => b.left)),
    right = Math.max(...all.map((b) => b.right)),
    top = Math.min(...all.map((b) => b.top)),
    bottom = Math.max(...all.map((b) => b.bottom));
  return { left, right, top, bottom, cx: (left + right) / 2, cy: (top + bottom) / 2 };
}

/** Lines the chosen layers up on one edge or centre line of their own shared box. */
export function alignSelection(art: Art, ids: readonly string[], edge: Edge, canvas: Canvas = POSTER): ImageLayer[] {
  const chosen = (art.layers ?? []).filter((l) => ids.includes(l.id));
  if (chosen.length < 2) return art.layers ?? [];
  const s = selectionBounds(chosen, canvas);
  return (art.layers ?? []).map((l) => {
    if (!ids.includes(l.id)) return l;
    const b = bounds(boxOf(l), canvas);
    let x = l.x ?? 0,
      y = l.y ?? 0;
    if (edge === "left") x += s.left - b.left;
    if (edge === "centre") x += s.cx - b.cx;
    if (edge === "right") x += s.right - b.right;
    if (edge === "top") y += s.top - b.top;
    if (edge === "middle") y += s.cy - b.cy;
    if (edge === "bottom") y += s.bottom - b.bottom;
    return { ...l, x: clamp(x), y: clamp(y) };
  });
}

/**
 * Spreads three or more layers so the gaps between them are equal (by their
 * containing boxes, turned layers included); the outer two stay put. For
 * layers of one size this is the same as spacing their centres evenly.
 */
export function distributeSelection(art: Art, ids: readonly string[], axis: "x" | "y", canvas: Canvas = POSTER): ImageLayer[] {
  const chosen = (art.layers ?? []).filter((l) => ids.includes(l.id));
  if (chosen.length < 3) return art.layers ?? [];
  const box = (l: ImageLayer) => {
    const b = bounds(boxOf(l), canvas);
    return axis === "x" ? { start: b.left, size: b.right - b.left } : { start: b.top, size: b.bottom - b.top };
  };
  const sorted = [...chosen].sort((a, b) => box(a).start - box(b).start);
  const first = box(sorted[0]),
    last = box(sorted[sorted.length - 1]);
  const total = sorted.reduce((n, l) => n + box(l).size, 0);
  const gap = (last.start + last.size - first.start - total) / (sorted.length - 1);
  const target = new Map<string, number>();
  let at = first.start;
  for (const l of sorted) {
    target.set(l.id, at);
    at += box(l).size + gap;
  }
  return (art.layers ?? []).map((l) => {
    const t = target.get(l.id);
    if (t === undefined) return l;
    const shift = t - box(l).start;
    return axis === "x" ? { ...l, x: clamp((l.x ?? 0) + shift) } : { ...l, y: clamp((l.y ?? 0) + shift) };
  });
}

/** Moves the chosen layers by the same amount. */
export function moveSelection(art: Art, ids: readonly string[], dx: number, dy: number): ImageLayer[] {
  return (art.layers ?? []).map((l) => (ids.includes(l.id) ? { ...l, x: clamp((l.x ?? 0) + dx), y: clamp((l.y ?? 0) + dy) } : l));
}

/** The layers that belong with this one: its group, or just itself. */
export function groupMates(art: Art, id: string): string[] {
  const layer = art.layers?.find((l) => l.id === id);
  if (!layer?.group) return [id];
  return (art.layers ?? []).filter((l) => l.group === layer.group).map((l) => l.id);
}

/** True when every chosen layer already shares one group. */
export const isOneGroup = (art: Art, ids: readonly string[]) => {
  const groups = new Set((art.layers ?? []).filter((l) => ids.includes(l.id)).map((l) => l.group));
  return ids.length > 1 && groups.size === 1 && !groups.has(undefined);
};

/** Groups the chosen layers, or ungroups them when they already are one group. */
export function toggleGroup(art: Art, ids: readonly string[], newId: () => string = () => Math.random().toString(36).slice(2, 10)): ImageLayer[] {
  if (isOneGroup(art, ids))
    return (art.layers ?? []).map((l) => {
      if (!ids.includes(l.id)) return l;
      const { group: _drop, ...rest } = l;
      return rest as ImageLayer;
    });
  const group = newId().replace(/[^a-z0-9]/g, "").padEnd(4, "0").slice(0, 12);
  return (art.layers ?? []).map((l) => (ids.includes(l.id) ? { ...l, group } : l));
}

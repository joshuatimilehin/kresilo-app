import { z } from "zod";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { MARK_LIMIT, anchorOf, draftOf, isDraft, isMark, type DraftData } from "./canvasMarks";
import type { AiAllow, AiAllowKey } from "./aiAllow";
import { aiTag, type AiSource } from "./canvasOrigins";

/**
 * Copilot's drafts. The person circles and writes on a board; Copilot answers with a small list of edits
 * to that board. The canvas shows the answer as a copy of the board beside the original, and the person
 * accepts it (the edits land on the original) or declines it. Everything here is plain data and pure
 * functions, so the server and the canvas read an answer the same way.
 */
const BRAND = ["#0a0c0e", "#101315", "#edeae3", "#c7fe02", "#8b5cf8", "transparent"] as const;
const id = z.string().min(1).max(64);
const pos = z.number().finite().min(-20000).max(20000);
const size = z.number().finite().min(1).max(20000);
const color = z.enum(BRAND);

/** What the canvas sends: the board, what is on it and the marks that point at it. */
export const draftElement = z
  .object({
    id,
    type: z.string().max(24),
    x: pos,
    y: pos,
    width: pos,
    height: pos,
    text: z.string().max(300).optional(),
    strokeColor: z.string().max(24).optional(),
    backgroundColor: z.string().max(24).optional(),
  })
  .strict();
export const draftMark = z
  .object({
    kind: z.string().max(24),
    note: z.string().trim().max(300).optional(),
    anchor: z.object({ id, kind: z.string().max(24) }).nullable(),
    x: pos,
    y: pos,
    width: pos,
    height: pos,
  })
  .strict();
export const draftRequest = z
  .object({
    board: z.object({ id, width: size, height: size }).strict(),
    elements: z.array(draftElement).max(150),
    marks: z.array(draftMark).min(1).max(MARK_LIMIT),
    request: z.string().trim().max(300).optional(),
  })
  .strict();
export type DraftRequest = z.infer<typeof draftRequest>;

/** What Copilot answers with. Positions are relative to the board's top-left corner. */
const settable = z
  .object({
    x: pos,
    y: pos,
    width: size,
    height: size,
    backgroundColor: color,
    strokeColor: color,
    strokeWidth: z.number().min(1).max(8),
    opacity: z.number().min(0).max(100),
    text: z.string().max(200),
    fontSize: z.number().min(8).max(200),
  })
  .partial();
export const draftOps = z.object({
  rationale: z.string().trim().min(1).max(300),
  edits: z.array(z.object({ id, set: settable })).max(40).default([]),
  adds: z
    .array(
      z.object({
        type: z.enum(["rectangle", "ellipse", "text", "line", "arrow"]),
        x: pos,
        y: pos,
        width: size.optional(),
        height: size.optional(),
        text: z.string().max(200).optional(),
        fontSize: z.number().min(8).max(200).optional(),
        strokeColor: color.optional(),
        backgroundColor: color.optional(),
      }),
    )
    .max(12)
    .default([]),
  removes: z.array(id).max(10).default([]),
});
export type DraftOps = z.infer<typeof draftOps>;
export type Addition = DraftOps["adds"][number];
export const draftChanges = (o: DraftOps) => o.edits.length + o.adds.length + o.removes.length;

/** Reads a model reply (a string or parsed JSON) into ops, keeping only what the board can take. */
export function readDraft(raw: unknown, known: ReadonlySet<string>, board: { width?: number; height?: number }): DraftOps | null {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    } catch {
      return null;
    }
  }
  // A property outside the brand set drops that property, not the whole answer.
  const parsed = draftOps.safeParse(prune(value));
  if (!parsed.success) return null;
  const ops = parsed.data;
  const inside = <T extends { x?: number; y?: number; width?: number; height?: number }>(o: T): T => ({
    ...o,
    ...(o.x !== undefined ? { x: Math.min(Math.max(o.x, 0), board.width ?? 20000) } : {}),
    ...(o.y !== undefined ? { y: Math.min(Math.max(o.y, 0), board.height ?? 20000) } : {}),
  });
  const clean: DraftOps = {
    rationale: ops.rationale,
    edits: ops.edits.filter((e) => known.has(e.id) && Object.keys(e.set).length).map((e) => ({ id: e.id, set: inside(e.set) })),
    adds: ops.adds.map(inside),
    removes: [...new Set(ops.removes.filter((r) => known.has(r)))],
  };
  return draftChanges(clean) ? clean : null;
}

function prune(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const v = value as { edits?: { set?: Record<string, unknown> }[]; adds?: Record<string, unknown>[] };
  const keepBrand = (o: Record<string, unknown>) => {
    for (const k of ["strokeColor", "backgroundColor"]) if (k in o && !(BRAND as readonly unknown[]).includes(o[k])) delete o[k];
    return o;
  };
  return {
    ...v,
    edits: Array.isArray(v.edits) ? v.edits.map((e) => (e && typeof e === "object" ? { ...e, set: e.set && typeof e.set === "object" ? keepBrand({ ...e.set }) : {} } : e)) : v.edits,
    adds: Array.isArray(v.adds) ? v.adds.map((a) => (a && typeof a === "object" ? keepBrand({ ...a }) : a)) : v.adds,
  };
}

/** Which allow switch each property of an edit needs: positions and sizes are layout, colour and line are look, words and type are words. */
const SET_ALLOW: Record<string, AiAllowKey> = {
  x: "layout",
  y: "layout",
  width: "layout",
  height: "layout",
  backgroundColor: "look",
  strokeColor: "look",
  strokeWidth: "look",
  opacity: "look",
  text: "words",
  fontSize: "words",
};

/**
 * Keeps only what the artist allows, as the artwork assistant does. A new shape is look and a new text is words;
 * taking away a text is words and taking away anything else is layout. `blocked` names the switches that cost the
 * draft something.
 */
export function limitDraft(ops: DraftOps, allow: AiAllow, types: ReadonlyMap<string, string>): { ops: DraftOps; blocked: AiAllowKey[] } {
  const blocked = new Set<AiAllowKey>();
  const edits = ops.edits.flatMap((e) => {
    const set: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(e.set)) {
      const kind = SET_ALLOW[k];
      if (kind && !allow[kind]) blocked.add(kind);
      else set[k] = v;
    }
    return Object.keys(set).length ? [{ id: e.id, set: set as typeof e.set }] : [];
  });
  const adds = ops.adds.flatMap((a) => {
    const kind: AiAllowKey = a.type === "text" ? "words" : "look";
    if (!allow[kind]) {
      blocked.add(kind);
      return [];
    }
    if (a.text !== undefined && !allow.words) {
      blocked.add("words");
      const { text: _dropped, ...rest } = a;
      void _dropped;
      return [rest];
    }
    return [a];
  });
  const removes = ops.removes.filter((id) => {
    const kind: AiAllowKey = types.get(id) === "text" ? "words" : "layout";
    if (allow[kind]) return true;
    blocked.add(kind);
    return false;
  });
  return { ops: { ...ops, edits, adds, removes }, blocked: [...blocked] };
}

// ---- Canvas side -----------------------------------------------------------------------------

const isBoard = (e: ExcalidrawElement) => e.type === "frame" || e.type === "magicframe";
const live = (e: ExcalidrawElement) => !e.isDeleted && !isMark(e) && !isDraft(e);
const num = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n * 10) / 10 : 0);
const textOf = (e: ExcalidrawElement) => (e as { text?: string }).text;
const origin = (frame: ExcalidrawElement) => ({ x: Math.min(frame.x, frame.x + frame.width), y: Math.min(frame.y, frame.y + frame.height) });

/** What is on a board (not marks, not drafts). */
export const boardChildren = (elements: readonly ExcalidrawElement[], frame: ExcalidrawElement) =>
  elements.filter((e) => live(e) && e.frameId === frame.id);

/** The marks that answer a board: pointing at it or something on it, or loose beside it (a word beside an arrow) with it the nearest board. */
export function marksFor(elements: readonly ExcalidrawElement[], frame: ExcalidrawElement, reach = 500): ExcalidrawElement[] {
  const boards = elements.filter((e) => !e.isDeleted && isBoard(e) && !isDraft(e));
  const gap = (b: ExcalidrawElement, cx: number, cy: number) => {
    const o = origin(b);
    const dx = Math.max(o.x - cx, 0, cx - (o.x + Math.abs(b.width)));
    const dy = Math.max(o.y - cy, 0, cy - (o.y + Math.abs(b.height)));
    return Math.hypot(dx, dy);
  };
  return elements.filter((m) => {
    if (m.isDeleted || !isMark(m)) return false;
    const board = anchorOf(m)?.board ?? null;
    if (board) return board === frame.id;
    const cx = m.x + m.width / 2;
    const cy = m.y + m.height / 2;
    const mine = gap(frame, cx, cy);
    return mine <= reach && boards.every((b) => b.id === frame.id || gap(b, cx, cy) > mine);
  });
}

/** The request the canvas sends for one board: positions relative to the board, marks with their notes. */
export function buildRequest(elements: readonly ExcalidrawElement[], frame: ExcalidrawElement, marks: readonly ExcalidrawElement[], request?: string): DraftRequest {
  const o = origin(frame);
  return {
    board: { id: frame.id, width: Math.abs(num(frame.width)) || 1, height: Math.abs(num(frame.height)) || 1 },
    elements: boardChildren(elements, frame)
      .slice(0, 150)
      .map((e) => ({
        id: e.id,
        type: e.type,
        x: num(e.x - o.x),
        y: num(e.y - o.y),
        width: num(e.width),
        height: num(e.height),
        ...(textOf(e) ? { text: textOf(e)!.slice(0, 300) } : {}),
        strokeColor: e.strokeColor,
        backgroundColor: e.backgroundColor,
      })),
    marks: marks.slice(0, MARK_LIMIT).map((m) => ({
      kind: m.type,
      ...(m.type === "text" && textOf(m)?.trim() ? { note: textOf(m)!.trim().slice(0, 300) } : {}),
      anchor: anchorOf(m) ? { id: anchorOf(m)!.id, kind: anchorOf(m)!.kind } : null,
      x: num(m.x - o.x),
      y: num(m.y - o.y),
      width: num(m.width),
      height: num(m.height),
    })),
    ...(request?.trim() ? { request: request.trim().slice(0, 300) } : {}),
  };
}

type Ids = { id: () => string; random: () => number };
const stamp = (e: ExcalidrawElement, ids: Ids, now: number): ExcalidrawElement => ({
  ...e,
  version: e.version + 1,
  versionNonce: Math.floor(ids.random() * 2 ** 31),
  updated: now,
});

/** Edits one element. `at` is the board's top-left, so the model's relative positions become canvas positions. */
function edit(e: ExcalidrawElement, set: DraftOps["edits"][number]["set"], at: { x: number; y: number }, ids: Ids, now: number): ExcalidrawElement {
  const next: Record<string, unknown> = {};
  if (set.x !== undefined) next.x = at.x + set.x;
  if (set.y !== undefined) next.y = at.y + set.y;
  for (const k of ["width", "height", "backgroundColor", "strokeColor", "strokeWidth", "opacity", "fontSize"] as const)
    if (set[k] !== undefined) next[k] = set[k];
  if (set.text !== undefined && e.type === "text") {
    next.text = set.text;
    next.originalText = set.text;
  }
  const changed = stamp({ ...e, ...next } as ExcalidrawElement, ids, now);
  // Copilot changed it: record that, with the version it left it at, so a later hand edit shows as AI-assisted.
  const prior = (e.customData as { ai?: { source?: AiSource } } | undefined)?.ai?.source;
  return { ...changed, customData: { ...(changed.customData ?? {}), ...aiTag(prior ?? "copilot", changed.version) } } as ExcalidrawElement;
}

function sketch(a: Addition, at: { x: number; y: number }) {
  return { ...a, x: at.x + a.x, y: at.y + a.y };
}
export type Skeleton = ReturnType<typeof sketch>;

/**
 * A copy of the board beside the original, with Copilot's edits applied. Returns the copied elements and
 * the new things to draw; the caller turns those into elements and adds `frameId`.
 */
export function planDraft(
  elements: readonly ExcalidrawElement[],
  frame: ExcalidrawElement,
  ops: DraftOps,
  markIds: readonly string[],
  ids: Ids = { id: () => crypto.randomUUID(), random: Math.random },
  now = Date.now(),
): { frame: ExcalidrawElement; children: ExcalidrawElement[]; adds: Skeleton[] } {
  const f = origin(frame);
  const dx = Math.abs(frame.width) + 120;
  const map = new Map<string, string>([[frame.id, ids.id()]]);
  const kids = boardChildren(elements, frame);
  for (const k of kids) map.set(k.id, ids.id());
  const stampNew = (e: ExcalidrawElement, newId: string): ExcalidrawElement => ({
    ...e,
    id: newId,
    x: e.x + dx,
    version: 1,
    versionNonce: Math.floor(ids.random() * 2 ** 31),
    seed: Math.floor(ids.random() * 2 ** 31),
    updated: now,
    groupIds: [],
    boundElements: null,
    ...("containerId" in e ? { containerId: e.containerId ? map.get(e.containerId) ?? null : null } : {}),
    ...("startBinding" in e ? { startBinding: null, endBinding: null } : {}),
  });
  const data: DraftData = { source: frame.id, ops, marks: [...markIds], at: new Date(now).toISOString() };
  const copy = stampNew(frame, map.get(frame.id)!);
  const draftFrame = { ...copy, name: "Draft", customData: { ...(frame.customData ?? {}), draft: data } } as ExcalidrawElement;
  const at = { x: f.x + dx, y: f.y };
  const removed = new Set(ops.removes);
  const edits = new Map(ops.edits.map((e) => [e.id, e.set]));
  const children = kids
    .filter((k) => !removed.has(k.id))
    .map((k) => {
      let c = { ...stampNew(k, map.get(k.id)!), frameId: draftFrame.id } as ExcalidrawElement;
      const set = edits.get(k.id);
      if (set) c = edit(c, set, at, ids, now);
      return { ...c, customData: { ...(c.customData ?? {}), draft: data } } as ExcalidrawElement;
    });
  return { frame: draftFrame, children, adds: ops.adds.map((a) => sketch(a, at)) };
}

/** Applies a draft's edits to the original board. Returns the full element list and what is new to draw. */
export function planAccept(
  elements: readonly ExcalidrawElement[],
  frame: ExcalidrawElement,
  ops: DraftOps,
  ids: Ids = { id: () => crypto.randomUUID(), random: Math.random },
  now = Date.now(),
): { elements: ExcalidrawElement[]; adds: Skeleton[] } {
  const at = origin(frame);
  const removed = new Set(ops.removes);
  const edits = new Map(ops.edits.map((e) => [e.id, e.set]));
  const kids = new Set(boardChildren(elements, frame).map((k) => k.id));
  return {
    elements: elements.map((e) => {
      if (!kids.has(e.id)) return e;
      if (removed.has(e.id)) return stamp({ ...e, isDeleted: true }, ids, now);
      const set = edits.get(e.id);
      return set ? edit(e, set, at, ids, now) : e;
    }),
    adds: ops.adds.map((a) => sketch(a, at)),
  };
}

/** Everything that belongs to a draft: its board, its children and its edits, and the marks it answers. */
export function draftParts(elements: readonly ExcalidrawElement[]) {
  const boards = elements.filter((e) => !e.isDeleted && isBoard(e) && isDraft(e));
  return boards.map((board) => ({
    board,
    data: draftOf(board)!,
    members: elements.filter((e) => !e.isDeleted && isDraft(e) && (e.id === board.id || e.frameId === board.id)),
  }));
}

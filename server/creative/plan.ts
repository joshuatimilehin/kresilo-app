import { z } from "zod";
import {
  MAX_MARKS,
  artPatch,
  markSchema,
  shapeKinds,
  titleAligns,
  titleFonts,
  assetKeys,
  layerAdjustment,
  motionMovements,
  type Art,
  type ImageLayer,
  type Mark,
  type Project,
} from "@/creative/contracts";
import { newMark } from "@/creative/marks";
import { addImageLayer, isAiLocked } from "@/creative/layers";
import { asksForImages, asksForMotion } from "@/creative/aiAllow";
import { visualIdPattern } from "@/creative/visuals/schema";
import { visualById } from "@/creative/visuals/library";
import { visualLayer } from "@/creative/visuals/layer";
import { DEFAULT_CANVAS, paletteFor } from "@/creative/visuals/palette";
import { contrastRatio } from "@/creative/visuals/colour";
import { packById } from "@/creative/packs/data";
import { packLayout } from "@/creative/packs/layouts";
import { titleBottom } from "./context";

/**
 * What the model may return. It can change one layer, several layers, or the
 * whole composition, add layers from the asset catalogue, and name them. The
 * values stay bounded numbers and closed words (the same schema a person's
 * own edits use) so a reply can never become executable CSS.
 */
const layerName = z.string().trim().min(1).max(160);
export const layerPatchEntry = layerAdjustment.extend({ layer: layerName });
const hexColour = z.string().regex(/^#[0-9a-f]{6}$/i);
/** What may change on a text or shape layer; the same bounds as a person's own edits. */
const markFields = {
  x: z.number().min(-20).max(100).optional(),
  y: z.number().min(-20).max(100).optional(),
  width: z.number().min(2).max(120).optional(),
  height: z.number().min(2).max(120).optional(),
  rotation: z.number().min(-180).max(180).optional(),
  opacity: z.number().min(0).max(1).optional(),
  visible: z.boolean().optional(),
  text: z.string().trim().min(1).max(80).optional(),
  color: hexColour.optional(),
  size: z.number().min(2).max(40).optional(),
  font: z.enum(titleFonts).optional(),
  italic: z.boolean().optional(),
  weight: z.number().int().min(400).max(900).optional(),
  align: z.enum(titleAligns).optional(),
  fill: z.union([hexColour, z.literal("none")]).optional(),
  stroke: hexColour.optional(),
  strokeWidth: z.number().min(0).max(20).optional(),
  radius: z.number().min(0).max(50).optional(),
};
export const markPatchEntry = z.object({ mark: layerName, ...markFields }).strict();
export const newMarkEntry = z
  .object({ kind: z.enum(["text", ...shapeKinds]), name: z.string().trim().min(1).max(60), ...markFields })
  .strict();
/**
 * A layer to add: a picture from the asset catalogue (`asset`, with a name), or
 * a visual from the library (`visual`: its id) in the project's colours or the
 * `ink` and `ground` given. Visuals take their name from their title.
 */
export const newLayerEntry = layerAdjustment
  .extend({
    asset: z.enum(assetKeys).optional(),
    visual: z.string().regex(visualIdPattern).optional(),
    ink: hexColour.optional(),
    ground: hexColour.optional(),
    name: layerName.optional(),
  })
  .strict()
  .superRefine((e, ctx) => {
    if (Boolean(e.asset) === Boolean(e.visual)) ctx.addIssue({ code: "custom", message: "Choose an asset or a visual" });
    else if (e.asset && !e.name) ctx.addIssue({ code: "custom", path: ["name"], message: "Name the layer" });
    else if (!e.visual && (e.ink || e.ground)) ctx.addIssue({ code: "custom", message: "Only a visual takes ink and ground" });
  });
export const designPlanSchema = z
  .object({
    rationale: z.string().min(10).max(700),
    // References are cited when there are any; a project started from an idea alone has none.
    cites: z.array(z.string()).max(8),
    patch: artPatch.omit({ layers: true, backgroundMediaId: true }).default({}),
    layerPatch: layerAdjustment.optional(),
    layerPatches: z.array(layerPatchEntry).max(14).optional(),
    addLayers: z.array(newLayerEntry).max(6).optional(),
    markPatches: z.array(markPatchEntry).max(MAX_MARKS).optional(),
    addMarks: z.array(newMarkEntry).max(6).optional(),
    /** Start the whole composition from a template pack's layout (see packs/). */
    startFrom: z.object({ pack: z.string().regex(/^[a-z0-9-]{1,60}$/), layout: z.number().int().min(0).max(9).optional() }).strict().optional(),
    motion: z
      .object({
        seconds: z.number().int().min(2).max(12).optional(),
        movement: z.enum(motionMovements).optional(),
        loop: z.boolean().optional(),
        beat: z.number().min(0.25).max(0.75).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type DesignPlan = z.infer<typeof designPlanSchema>;

/**
 * Reads a model reply leniently: empty strings are dropped first (models send
 * `"title": ""` for "leave it"), then any field that still breaks the format is
 * removed, a few times at most, so one bad field never sinks a good
 * suggestion. Rationale and citations are never dropped.
 */
/** Fields only text and shapes have; a layer change that carries them was meant for a text or shape. */
const MARK_ONLY = new Set(["fill", "stroke", "strokeWidth", "radius", "text", "color", "font", "italic", "weight", "align", "size"]);

/**
 * Fixes the two slips models make most: British "colour" for "color", and
 * text or shape edits filed under layerPatches. Both are moved to where they
 * belong rather than thrown away, so a good idea is not lost to a typo.
 */
function tidyPlan(v: Record<string, unknown>) {
  const spell = (e: unknown) => {
    if (e && typeof e === "object" && "colour" in e) {
      const o = e as Record<string, unknown>;
      if (!("color" in o)) o.color = o.colour;
      delete o.colour;
    }
  };
  for (const key of ["markPatches", "addMarks", "layerPatches", "addLayers"]) if (Array.isArray(v[key])) (v[key] as unknown[]).forEach(spell);
  // A visual's colour is called ink; "colour" and "color" on one are meant as that.
  if (Array.isArray(v.addLayers))
    for (const e of v.addLayers as Record<string, unknown>[])
      if (e && typeof e === "object" && e.visual && "color" in e) {
        if (!("ink" in e)) e.ink = e.color;
        delete e.color;
      }
  spell(v.patch);
  if (!Array.isArray(v.layerPatches)) return;
  const keep: unknown[] = [],
    move: Record<string, unknown>[] = [];
  for (const e of v.layerPatches as unknown[])
    if (e && typeof e === "object" && Object.keys(e).some((k) => MARK_ONLY.has(k))) move.push(e as Record<string, unknown>);
    else keep.push(e);
  if (!move.length) return;
  v.layerPatches = keep;
  v.markPatches = [...((v.markPatches as unknown[]) ?? []), ...move.map(({ layer, ...rest }) => ({ mark: layer, ...rest }))];
}

export function readPlan(raw: unknown) {
  const clean = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(clean);
    if (v && typeof v === "object")
      return Object.fromEntries(
        Object.entries(v as Record<string, unknown>)
          .filter(([, x]) => x !== "" && x !== null)
          .map(([k, x]) => [k, clean(x)]),
      );
    return v;
  };
  const value = clean(raw) as Record<string, unknown>;
  tidyPlan(value);
  for (let attempt = 0; attempt < 12; attempt++) {
    const parsed = designPlanSchema.safeParse(value);
    if (parsed.success) return parsed;
    const path = parsed.error.issues[0]?.path ?? [];
    if (!path.length || path[0] === "rationale" || path[0] === "cites") return parsed;
    // Inside a list (a layer to add, a layer to change), drop that whole entry;
    // elsewhere drop just the field.
    const at = path.findIndex((k) => typeof k === "number");
    const cut = at >= 0 ? path.slice(0, at + 1) : path;
    let parent: unknown = value;
    for (const key of cut.slice(0, -1)) parent = (parent as Record<string | number, unknown>)?.[key as string];
    const last = cut[cut.length - 1];
    if (Array.isArray(parent) && typeof last === "number") parent.splice(last, 1);
    else if (parent && typeof parent === "object" && (last as string) in (parent as object)) delete (parent as Record<string, unknown>)[last as string];
    else return parsed;
  }
  return designPlanSchema.safeParse(value);
}

const MAX_LAYERS = 12;
const titleKeys = ["title", "color", "size", "x", "y", "titleVisible"];
const captionKeys = ["caption", "captionVisible"];
const backgroundKeys = ["asset", "backgroundOpacity", "backgroundFilter", "canvasColor"];
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Finds a layer by id or by its name; a name shared by two layers is ambiguous and skipped. */
export function findLayer(layers: ImageLayer[], ref: string): ImageLayer | "ambiguous" | undefined {
  const byId = layers.find((l) => l.id === ref);
  if (byId) return byId;
  const matches = layers.filter((l) => norm(l.name) === norm(ref));
  return matches.length > 1 ? "ambiguous" : matches[0];
}

/** A name not yet used in the project, so people always know which layer is which. */
export function uniqueLayerName(layers: ImageLayer[], wanted: string): string {
  const taken = new Set(layers.map((l) => norm(l.name)));
  if (!taken.has(norm(wanted))) return wanted;
  for (let i = 2; i < 50; i++) {
    const candidate = `${wanted.slice(0, 150)} ${i}`;
    if (!taken.has(norm(candidate))) return candidate;
  }
  return `${wanted.slice(0, 140)} ${crypto.randomUUID().slice(0, 4)}`;
}

export type AppliedPlan = {
  patch: Partial<Art>;
  /** Plain sentences about what was left alone and why, shown to the artist. */
  notes: string[];
  changed: boolean;
  /** The motion to set, only when the request asked for motion. */
  motion?: DesignPlan["motion"];
};

/**
 * Turns a model reply into one artwork patch. `targets` is the artist's focus:
 * empty means the whole composition is open; otherwise only those layers (ids,
 * or title, caption, background) change. Layers the artist has locked to
 * hand-only are always left alone, and the reply says so.
 */
export function applyDesignPlan(
  p: Pick<Project, "art">,
  plan: DesignPlan,
  targets: string[] = [],
  opts: { intent?: string } = {},
): AppliedPlan {
  const notes: string[] = [];
  const started = plan.startFrom ? startFromPack(p, plan, targets.length > 0, notes) : null;
  if (started) p = { art: { ...p.art, ...started } };
  // With the request at hand, only what it asked for: motion only when motion
  // is asked for, new pictures and a swapped background only when pictures are.
  const asked = opts.intent;
  const motion = asked === undefined || asksForMotion(asked) ? plan.motion : undefined;
  const pictures = asked === undefined || asksForImages(asked);
  if (plan.motion && !motion) notes.push("Motion was left out because the request did not ask for it.");
  if (!pictures && (plan.addLayers?.length || "asset" in plan.patch))
    notes.push("Pictures were left out because the request did not ask for them.");
  const focus = new Set(targets);
  const focused = focus.size > 0;
  const layers = (p.art.layers ?? []).map((l) => ({ ...l }));
  let layersChanged = false;

  const entries: (z.infer<typeof layerPatchEntry> | { layer: string; patch: z.infer<typeof layerAdjustment> })[] = [];
  for (const e of plan.layerPatches ?? []) entries.push(e);
  if (plan.layerPatch) {
    const only = [...focus].filter((t) => layers.some((l) => l.id === t));
    if (only.length === 1) entries.push({ layer: only[0], ...plan.layerPatch });
  }
  for (const entry of entries) {
    const { layer: ref, ...adjust } = entry as { layer: string } & Record<string, unknown>;
    const found = findLayer(layers, ref);
    if (!found) {
      notes.push(`There is no layer called "${ref}", so it was skipped.`);
      continue;
    }
    if (found === "ambiguous") {
      notes.push(`More than one layer is called "${ref}", so it was skipped.`);
      continue;
    }
    if (isAiLocked(found)) {
      notes.push(`Left "${found.name}" alone because you locked it to hand-only.`);
      continue;
    }
    if (focused && !focus.has(found.id)) {
      notes.push(`"${found.name}" is outside the layers you focused on, so it was left as it is.`);
      continue;
    }
    Object.assign(found, layerAdjustment.parse(adjust));
    layersChanged = true;
  }

  const add = pictures ? (plan.addLayers ?? []) : [];
  const visualEntries: typeof add = [];
  if (add.length && focused) notes.push("New layers were skipped because you focused on specific layers.");
  else
    for (const entry of add) {
      if (entry.visual) {
        // Visuals are placed once the colours this plan sets are known (below).
        visualEntries.push(entry);
        continue;
      }
      const { asset, name, visual: _visual, ink: _ink, ground: _ground, ...adjust } = entry;
      if (layers.length >= MAX_LAYERS) {
        notes.push(`The canvas holds ${MAX_LAYERS} layers, so "${name}" was not added.`);
        continue;
      }
      const base = addImageLayer({ ...p.art, layers }, { asset: asset! }, uniqueLayerName(layers, name!)).at(-1)!;
      layers.push({ ...base, ...layerAdjustment.parse(adjust) });
      layersChanged = true;
    }

  const patch: Record<string, unknown> = {};
  const wants: [string, string[]][] = [
    ["title", titleKeys],
    ["caption", captionKeys],
    ["background", backgroundKeys],
  ];
  for (const [target, keys] of wants) {
    const given = keys.filter((k) => k in plan.patch && (pictures || k !== "asset"));
    if (!given.length) continue;
    if (focused && !focus.has(target)) {
      notes.push(`The ${target} is outside the layers you focused on, so it was left as it is.`);
      continue;
    }
    for (const k of given) patch[k] = (plan.patch as Record<string, unknown>)[k];
  }
  // Visuals come from the library, in the project's colours as they will be after this plan.
  if (visualEntries.length) {
    const colours = { ...p.art, ...(patch as Partial<Art>) };
    for (const entry of visualEntries) {
      const visual = visualById(entry.visual!);
      if (!visual) {
        notes.push(`There is no picture "${entry.visual}" in the library, so it was left out.`);
        continue;
      }
      if (layers.length >= MAX_LAYERS) {
        notes.push(`The canvas holds ${MAX_LAYERS} layers, so "${visual.title}" was not added.`);
        continue;
      }
      const { asset: _asset, visual: _visual, ink, ground, name, ...adjust } = entry;
      const palette = paletteFor({ art: colours }, visual.kind);
      const canvas = colours.canvasColor ?? DEFAULT_CANVAS;
      // An ink colour that cannot be seen on the canvas is replaced by the palette's.
      const seen = visual.kind === "duotone" || !ink || contrastRatio(ink, canvas) >= 1.5;
      if (ink && !seen) notes.push(`The ink colour for "${visual.title}" would not show on the canvas, so the project's colour was used.`);
      const layer = visualLayer(
        visual,
        { ink: seen && ink ? ink : palette.ink, ground: ground ?? palette.ground },
        layers,
        p.art.format,
        uniqueLayerName(layers, name ?? visual.title),
      );
      layers.push({ ...layer, ...layerAdjustment.parse(adjust) });
      layersChanged = true;
    }
  }
  if (layersChanged) patch.layers = layers;
  // A new ground colour behind a picture that covers it would change nothing anyone can see.
  if ("canvasColor" in patch && Number(patch.backgroundOpacity ?? p.art.backgroundOpacity ?? 1) >= 1)
    notes.push("The new ground colour sits behind the background picture, so it shows once the picture is hidden.");
  const titled = { ...p.art, ...patch } as Art;
  const marks = applyMarks(p.art.marks ?? [], plan, focused, notes, titled.titleVisible === false ? null : { top: titled.y, bottom: titleBottom(titled) });
  if (marks) patch.marks = marks;
  const checked = artPatch.safeParse({ ...(started ?? {}), ...patch });
  if (!checked.success) throw new Error("INVALID_PROPOSAL");
  return {
    patch: checked.data as Partial<Art>,
    notes,
    changed: Object.keys(checked.data).length > 0,
    ...(motion ? { motion } : {}),
  };
}

const START_KEYS = ["title", "titleType", "titleVisible", "color", "size", "x", "y", "format", "canvasColor", "asset", "backgroundOpacity", "backgroundFilter", "captionVisible", "marks", "layers"] as const;

/**
 * The artwork a template pack's layout gives this project: its title or the
 * brand named in the reply, in the project's own colours (its Style, or its
 * title and canvas colours) completed by the pack's. Null, with a note, when
 * the pack is unknown, the artist focused on specific layers, or a layer is
 * locked to hand-only, because starting over would replace it.
 */
function startFromPack(p: Pick<Project, "art">, plan: DesignPlan, focused: boolean, notes: string[]): Partial<Art> | null {
  const want = plan.startFrom!;
  const pack = packById(want.pack);
  if (!pack) {
    notes.push(`There is no template pack "${want.pack}", so nothing was started from it.`);
    return null;
  }
  if (focused) {
    notes.push("Starting from a template was skipped because you focused on specific layers.");
    return null;
  }
  if ((p.art.layers ?? []).some(isAiLocked)) {
    notes.push("Starting from a template was skipped because a layer is locked to hand-only.");
    return null;
  }
  const own = paletteFor(p).swatches;
  const palette = [...new Set([p.art.canvasColor ?? DEFAULT_CANVAS, p.art.color, ...own, ...pack.palette].map((c) => c.toLowerCase()))].slice(0, 4);
  const brand = String(plan.patch.title ?? p.art.title).replace(/\s+/g, " ").trim().slice(0, 40);
  const layout = packLayout(pack.id, { brand, palette }, want.layout ?? 0);
  if (!layout) return null;
  return Object.fromEntries(START_KEYS.flatMap((k) => (layout[k] === undefined ? [] : [[k, layout[k]]]))) as Partial<Art>;
}

/** Fields that do not apply to a mark's kind are dropped, so a shape never gets text and a text never gets a fill. */
const TEXT_ONLY = ["text", "color", "size", "font", "italic", "weight", "align"];
const SHAPE_ONLY = ["fill", "stroke", "strokeWidth", "radius"];
function fieldsFor(mark: Mark, fields: Record<string, unknown>) {
  const drop = mark.kind === "text" ? SHAPE_ONLY : TEXT_ONLY;
  return Object.fromEntries(Object.entries(fields).filter(([k, v]) => v !== undefined && !drop.includes(k)));
}

/**
 * Text and shape layers: edits by exact name, then new ones. Returns the new
 * list, or null when nothing changed. Every result is checked against the same
 * schema a person's own edits use.
 */
function applyMarks(
  current: readonly Mark[],
  plan: DesignPlan,
  focused: boolean,
  notes: string[],
  title: { top: number; bottom: number } | null,
): Mark[] | null {
  const edits = plan.markPatches ?? [];
  const adds = plan.addMarks ?? [];
  if (!edits.length && !adds.length) return null;
  if (focused) {
    notes.push("Text and shapes were left alone because you focused on specific layers.");
    return null;
  }
  const marks = current.map((m) => ({ ...m }));
  let changed = false;
  for (const { mark: ref, ...fields } of edits) {
    const matches = marks.filter((m) => m.id === ref || norm(m.name) === norm(ref));
    if (matches.length !== 1) {
      notes.push(matches.length ? `More than one text or shape is called "${ref}", so it was skipped.` : `There is no text or shape called "${ref}", so it was skipped.`);
      continue;
    }
    if (matches[0].kind === "path") {
      notes.push(`"${matches[0].name}" is a drawing by hand, so it was left as drawn.`);
      continue;
    }
    const next = markSchema.safeParse({ ...matches[0], ...fieldsFor(matches[0], fields) });
    if (!next.success) continue;
    Object.assign(matches[0], next.data);
    changed = true;
  }
  for (const { kind, name, ...fields } of adds) {
    if (marks.length >= MAX_MARKS) {
      notes.push(`The canvas holds ${MAX_MARKS} text and shape layers, so "${name}" was not added.`);
      continue;
    }
    const base = newMark(kind, marks);
    const next = markSchema.safeParse({ ...base, name: name.slice(0, 60), ...fieldsFor(base, fields) });
    if (!next.success) continue;
    if (next.data.kind === "text" && title) clearOfTitle(next.data as { y: number; height: number }, title);
    marks.push(next.data);
    changed = true;
  }
  return changed ? marks : null;
}

/**
 * New text never lands on the title: when it overlaps the title's band it
 * moves just under it, or just above when there is no room below.
 */
export function clearOfTitle(m: { y: number; height: number }, title: { top: number; bottom: number }) {
  if (m.y + m.height <= title.top || m.y >= title.bottom) return;
  if (title.bottom + 1 + m.height <= 100) m.y = title.bottom + 1;
  else if (title.top - 1 - m.height >= 0) m.y = title.top - 1 - m.height;
}

import type { Art, ImageLayer, Mark, Motion } from "./contracts";

/**
 * What a suggestion really changes, in a few plain words, read from the patch
 * that will land rather than from the model's own account of it. When part of
 * a reply was left out (a switch was off, motion or pictures were not asked
 * for, a layer was locked, a limit was reached), the model's rationale can
 * describe things that will never happen, so the summary is shown instead.
 */
/** Key order does not count: a patch that went through the schema lists fields in the schema's order. */
const stable = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(stable)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>)
            .filter(([, x]) => x !== undefined)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([k, x]) => [k, stable(x)]),
        )
      : v;
const same = (a: unknown, b: unknown) => JSON.stringify(stable(a ?? null)) === JSON.stringify(stable(b ?? null));
const quote = (s: string) => {
  const one = s.replace(/\s+/g, " ").trim();
  return `“${one.length > 40 ? `${one.slice(0, 39).trimEnd()}…` : one}”`;
};
const MAX_PARTS = 5;

function artParts(art: Art, patch: Partial<Art>): string[] {
  const out: string[] = [];
  const changed = (k: keyof Art) => k in patch && !same(patch[k], art[k]);
  if (changed("title") && patch.title) out.push(`title ${quote(patch.title)}`);
  if (changed("titleVisible")) out.push(patch.titleVisible === false ? "title hidden" : "title shown");
  if (changed("titleType")) out.push("title type");
  if (changed("color")) out.push("title colour");
  if (changed("size")) out.push("title size");
  if (changed("x") || changed("y")) out.push("title position");
  if (changed("caption")) out.push(patch.caption?.trim() ? `caption ${quote(patch.caption)}` : "caption removed");
  if (changed("captionVisible")) out.push(patch.captionVisible === false ? "caption hidden" : "caption shown");
  if (changed("canvasColor")) out.push("ground colour");
  if (changed("asset") || changed("backgroundMediaId")) out.push("background picture");
  if (changed("backgroundFilter")) out.push("background filter");
  if (changed("backgroundOpacity")) out.push(patch.backgroundOpacity === 0 ? "background hidden" : "background opacity");
  if (changed("format")) out.push("canvas shape");
  if (changed("style")) out.push("style");
  return out;
}

function layerParts(before: readonly ImageLayer[], after: readonly ImageLayer[] | undefined): string[] {
  if (!after) return [];
  const old = new Map(before.map((l) => [l.id, l]));
  const kept = new Set(after.map((l) => l.id));
  const out: string[] = [];
  for (const l of after) {
    const was = old.get(l.id);
    if (!was) out.push(`new picture ${quote(l.name)}`);
    else if (!same(was, l)) out.push(`layer ${quote(l.name)}`);
  }
  for (const l of before) if (!kept.has(l.id)) out.push(`removed ${quote(l.name)}`);
  return out;
}

const shapeWord = (m: Mark) => (m.kind === "text" ? "text" : m.kind === "path" ? "drawing" : m.shape);

function markParts(before: readonly Mark[], after: readonly Mark[] | undefined): string[] {
  if (!after) return [];
  const old = new Map(before.map((m) => [m.id, m]));
  const kept = new Set(after.map((m) => m.id));
  const out: string[] = [];
  for (const m of after) {
    const was = old.get(m.id);
    if (!was) out.push(m.kind === "text" ? `new text ${quote(m.text)}` : `new ${shapeWord(m)} ${quote(m.name)}`);
    else if (!same(was, m))
      out.push(m.kind === "text" && was.kind === "text" && m.text !== was.text ? `text ${quote(m.text)}` : `${shapeWord(m)} ${quote(m.name)}`);
  }
  for (const m of before) if (!kept.has(m.id)) out.push(`removed ${quote(m.name)}`);
  return out;
}

/** The parts a patch (and motion) change, each a short phrase, in reading order. */
export function changedParts(art: Art, patch: Partial<Art>, motion?: Partial<Motion>): string[] {
  return [
    ...artParts(art, patch),
    ...layerParts(art.layers ?? [], patch.layers),
    ...markParts(art.marks ?? [], patch.marks),
    ...(motion && Object.keys(motion).length ? ["motion"] : []),
  ];
}

/** One line naming what changes: "Title colour, ground colour, new text “Opening Saturday 9am”." */
export function changeSummary(art: Art, patch: Partial<Art>, motion?: Partial<Motion>): string {
  const parts = changedParts(art, patch, motion);
  if (!parts.length) return "No visible change.";
  const shown = parts.slice(0, MAX_PARTS);
  const more = parts.length - shown.length;
  const line = shown.join(", ") + (more ? ` and ${more} more change${more === 1 ? "" : "s"}` : "");
  return `${line[0].toUpperCase()}${line.slice(1)}.`;
}

/**
 * Which of the artist's own things a suggestion was made from, in plain words.
 * The stored provenance also names the model and what the provider reported;
 * that stays in the record and the logs and is never shown on a working screen.
 */
export function suggestionInputs(provenance: string | undefined): string {
  const text = (provenance ?? "").toLowerCase();
  if (text.includes("project references")) return "Your references, saved reasons and canvas";
  if (text.includes("brief and canvas")) return "Your brief and canvas";
  return "Your request and canvas";
}

/**
 * The explanation a suggestion shows. The model's own words when everything it
 * proposed is kept; a summary of what will actually change when anything was
 * left out, so the explanation never promises a texture that is not there.
 */
export function truthfulReason(input: {
  rationale: string;
  dropped: boolean;
  art: Art;
  patch: Partial<Art>;
  motion?: Partial<Motion>;
}): string {
  const untrue = overclaims(input.rationale, input.art, input.patch, input.motion);
  return input.dropped || untrue ? changeSummary(input.art, input.patch, input.motion) : input.rationale;
}

const PICTURE_WORDS = /\b(textures?|textured|grain|paper|pattern|photos?|photograph|pictures?|images?|overlays?|illustrations?|drawn|drawing)\b/i;
const MOTION_WORDS = /\b(motion|animat\w*|drift|moving|loop)\b/i;

/**
 * Whether an explanation speaks of pictures or motion the suggestion does not
 * contain, which a model sometimes does when it only changed colours. Text and
 * shapes count as "drawn" things, so only new picture layers, a new background
 * picture, filter or motion make such words true.
 */
export function overclaims(rationale: string, art: Art, patch: Partial<Art>, motion?: Partial<Motion>): boolean {
  const newPicture =
    layerParts(art.layers ?? [], patch.layers).some((p) => p.startsWith("new picture")) ||
    ("asset" in patch && !same(patch.asset, art.asset)) ||
    ("backgroundMediaId" in patch && !same(patch.backgroundMediaId, art.backgroundMediaId)) ||
    ("backgroundFilter" in patch && !same(patch.backgroundFilter, art.backgroundFilter));
  const newDrawing = markParts(art.marks ?? [], patch.marks).some((p) => p.startsWith("new") && !p.startsWith("new text"));
  if (PICTURE_WORDS.test(rationale) && !newPicture && !newDrawing) return true;
  return MOTION_WORDS.test(rationale) && !(motion && Object.keys(motion).length);
}

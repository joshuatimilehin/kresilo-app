import type { AiAllowKey } from "./aiAllow";
/**
 * Plain answers when an AI request did nothing or could not be understood.
 * The assistant can only move, resize, rotate, crop, mask, shadow, blend, flip
 * and adjust layers, change the title, caption and colour, add catalog images
 * and set motion. Effects outside that (glitter, glow, 3D) cannot be made, so
 * the result says so and offers the nearest thing that can.
 */
export const WHAT_AI_CAN_DO =
  "Move, resize, rotate, crop, mask, add a shadow, blend, flip, change brightness, contrast, saturation, blur, tint or grain, change the title, caption and colour, change or add text and shapes, add a catalog image, or set the motion.";

type Unsupported = { words: RegExp; what: string; instead: string };

const UNSUPPORTED: Unsupported[] = [
  { words: /\b(glitter|sparkl\w*|shimmer\w*|twinkl\w*|bling)\b/i, what: "Glitter and sparkle", instead: "Try “add grain” or “make it brighter”, or place a texture from Assets." },
  { words: /\b(glow\w*|neon|aura|halo)\b/i, what: "Glow", instead: "Try “add a soft shadow” or “brightness 1.3”." },
  { words: /\b(3d|three.?d|emboss\w*|bevel\w*|extrude\w*)\b/i, what: "3D effects", instead: "Try “add a hard shadow” for depth." },
  { words: /\b(remove (the )?background|cut ?out|erase)\b/i, what: "Removing a background", instead: "Try “mask ellipse” or crop the layer by hand." },
  { words: /\b(draw|paint|sketch|brush)\b/i, what: "Drawing", instead: "Add a shape from Shapes, or place an image from Assets." },
  { words: /\b(upload|import|my photo|my image)\b/i, what: "Importing your own images", instead: "Import it under Assets, then Yours; the assistant only adds catalog images." },
];

/** What a request asked for that the assistant cannot make, or null when it looks possible. */
export function unsupportedAsk(intent: string): { what: string; instead: string } | null {
  const hit = UNSUPPORTED.find((u) => u.words.test(intent));
  return hit ? { what: hit.what, instead: hit.instead } : null;
}

export type AiOutcome =
  | { kind: "nothing"; headline: string; detail: string; allow?: AiAllowKey[] }
  | { kind: "proposed"; headline: string; detail: string }
  | { kind: "applied"; headline: string; detail: string }
  | { kind: "kept"; headline: string; detail: string };

/** The artist turned a suggestion down: their own version stays, which is a result, not a failure. */
export const keptYours = (): AiOutcome => ({ kind: "kept", headline: "Kept yours.", detail: "Your artwork is unchanged." });

/** The message shown after a request that failed or produced nothing. */
export function nothingChanged(intent: string, reason?: string): AiOutcome {
  const miss = unsupportedAsk(intent);
  return {
    kind: "nothing",
    headline: miss ? `Nothing changed. ${miss.what} is not something the assistant can make yet.` : "Nothing changed.",
    detail: miss ? miss.instead : `${reason ?? "The request could not be understood."} The assistant can: ${WHAT_AI_CAN_DO}`,
  };
}

/** The message shown when a proposal came back or was applied. */
export function changedSummary(rationale: string, applied: boolean, fields: string[]): AiOutcome {
  const touched = fields.length ? ` It changes: ${fields.join(", ")}.` : "";
  return applied
    ? { kind: "applied", headline: "Applied. Undo brings the last version back.", detail: `${rationale}${touched}` }
    : { kind: "proposed", headline: "A proposal is ready for your decision.", detail: `${rationale}${touched}` };
}

const WORDS = new Set(["title", "caption"]);
/** Names the parts of the artwork a proposal touches, in plain words, so surprises are visible. */
export function touchedParts(patch: Record<string, unknown> | undefined, layerCount: number, addedLayers: number): string[] {
  const out: string[] = [];
  const keys = Object.keys(patch ?? {});
  if (keys.some((k) => WORDS.has(k))) out.push("your words (title or caption)");
  if (keys.includes("color")) out.push("the title colour");
  if (keys.some((k) => ["x", "y", "size"].includes(k))) out.push("title position or size");
  if (keys.some((k) => ["asset", "backgroundOpacity", "backgroundFilter", "backgroundMediaId"].includes(k))) out.push("the background");
  if (layerCount > 0) out.push(`${layerCount} existing layer${layerCount === 1 ? "" : "s"}`);
  if (addedLayers > 0) out.push(`${addedLayers} new catalog image${addedLayers === 1 ? "" : "s"}`);
  return out;
}

/** How many existing layers a proposed set of layers changes, and how many it adds. */
export function layerDelta(before: readonly { id: string }[] | undefined, after: readonly { id: string }[] | undefined): { changed: number; added: number } {
  const old = new Map((before ?? []).map((l) => [l.id, JSON.stringify(l)]));
  let changed = 0;
  let added = 0;
  for (const l of after ?? []) {
    const was = old.get(l.id);
    if (was === undefined) added++;
    else if (was !== JSON.stringify(l)) changed++;
  }
  return { changed, added };
}

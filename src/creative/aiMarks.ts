import type { Art } from "./contracts";

/**
 * Where the assistant's work still shows (issue #51: "everything AI did is
 * marked"). `art.aiMarks` lists the parts an approved suggestion changed:
 * layer ids, and "title", "caption" or "background". A hand edit to a part
 * takes its mark away. The command service computes the list on both sides,
 * so a client cannot mark or unmark anything itself.
 */
export type MarkPart = string;

const TITLE_KEYS = ["title", "color", "size", "x", "y", "titleType", "titleVisible"] as const;
const CAPTION_KEYS = ["caption", "captionVisible"] as const;
const BACKGROUND_KEYS = ["asset", "backgroundMediaId", "backgroundOpacity", "backgroundFilter"] as const;

/** Field order does not matter: a layer sent back unchanged is not a change. */
const stable = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(stable)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>)
            .filter(([, x]) => x !== undefined)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, x]) => [k, stable(x)]),
        )
      : v;
const same = (a: unknown, b: unknown) => JSON.stringify(stable(a ?? null)) === JSON.stringify(stable(b ?? null));

/** The parts that differ between two versions of an artwork. */
export function changedParts(before: Art, after: Art): MarkPart[] {
  const out: MarkPart[] = [];
  const b = before as Record<string, unknown>,
    a = after as Record<string, unknown>;
  if (TITLE_KEYS.some((k) => !same(b[k], a[k]))) out.push("title");
  if (CAPTION_KEYS.some((k) => !same(b[k], a[k]))) out.push("caption");
  if (BACKGROUND_KEYS.some((k) => !same(b[k], a[k]))) out.push("background");
  const old = new Map((before.layers ?? []).map((l) => [l.id, l]));
  for (const l of after.layers ?? []) {
    const was = old.get(l.id);
    if (!was || !same(was, l)) out.push(l.id);
  }
  return out;
}

/** After an approved suggestion: everything it changed is marked, on top of what was marked. */
export function marksAfterAi(before: Art, after: Art): MarkPart[] {
  return keepLive(after, [...new Set([...(before.aiMarks ?? []), ...changedParts(before, after)])]);
}

/** After a hand edit: whatever the artist touched is theirs again. */
export function marksAfterHand(before: Art, after: Art): MarkPart[] {
  const touched = new Set(changedParts(before, after));
  return keepLive(after, (before.aiMarks ?? []).filter((m) => !touched.has(m)));
}

/**
 * Parts the assistant changed and the artist then edited by hand: AI-assisted.
 * A later AI change makes a part AI-generated again; it is never shown as
 * plain hand work once AI has touched it (issue #50).
 */
export function assistedAfterHand(before: Art, after: Art): MarkPart[] {
  const touched = new Set(changedParts(before, after));
  const fromMarks = (before.aiMarks ?? []).filter((m) => touched.has(m));
  return keepLive(after, [...new Set([...(before.aiAssisted ?? []), ...fromMarks])]);
}

export function assistedAfterAi(before: Art, after: Art): MarkPart[] {
  const changed = new Set(changedParts(before, after));
  return keepLive(after, (before.aiAssisted ?? []).filter((m) => !changed.has(m)));
}

export type PartOrigins = { hand: number; assisted: number; generated: number };

/** The parts of an artwork that count: each layer, plus the title, the caption and the background. */
export const countedParts = (art: Art): MarkPart[] => ["title", "caption", "background", ...(art.layers ?? []).map((l) => l.id)];

/** How many parts of the final artwork are by hand, AI-assisted or AI-generated. */
export function partOrigins(art: Art): PartOrigins {
  const marks = new Set(art.aiMarks ?? []),
    assisted = new Set(art.aiAssisted ?? []);
  const out: PartOrigins = { hand: 0, assisted: 0, generated: 0 };
  for (const part of countedParts(art)) {
    if (marks.has(part)) out.generated++;
    else if (assisted.has(part)) out.assisted++;
    else out.hand++;
  }
  return out;
}

export const PART_ORIGINS_FORMULA =
  "Each layer, the title, the caption and the background is one part. A part is AI-generated when an approved suggestion changed it and the artist has not edited it since; AI-assisted when the artist edited it after an AI change; by hand otherwise.";

export const isAiAssisted = (art: Art, part: MarkPart) => (art.aiAssisted ?? []).includes(part);

/** Drops marks for layers that no longer exist. */
function keepLive(art: Art, marks: MarkPart[]): MarkPart[] {
  const ids = new Set((art.layers ?? []).map((l) => l.id));
  return marks.filter((m) => m === "title" || m === "caption" || m === "background" || ids.has(m)).slice(0, 40);
}

export const isAiMarked = (art: Art, part: MarkPart) => (art.aiMarks ?? []).includes(part);

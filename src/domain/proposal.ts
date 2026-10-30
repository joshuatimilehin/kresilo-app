/**
 * Prototype guidance: deterministic, context-dependent proposal generation.
 *
 * No external model is called. A direction is derived from the typed intent
 * plus the reasons already saved on THIS project's references, so:
 *   - the same context always produces the same proposal,
 *   - every proposal cites at least one reference that exists on the project,
 *   - every cited reference contributes its real saved reason to the rationale,
 *   - a source that is not on the project is never named.
 */
import type {
  PosterPalette,
  PosterPatch,
  PosterModel,
  ProposalDraft,
  ReferenceItem,
  StudioSnapshot,
} from "./types";
import { COST_LABEL_DB } from "./types";

/** Max rationale length the database will accept (proposals_rationale length). */
export const RATIONALE_LIMIT = 600;
const MAX_CITES = 3;

interface GuidanceRule {
  id: string;
  /** lower-cased substrings of the intent that trigger the rule */
  when: string[];
  /** preferred reference keys; only used if they exist on this project */
  citeKeys: string[];
  /** what the rule does to the board, phrased as design direction */
  direction: string;
  patch: PosterPatch;
}

/** The mint/cream horizon + single terracotta sun offered as the quiet variant. */
const QUIET_PALETTE = {
  canvas: "#33504E",
  surface: "#2C4644",
  horizonFrom: "#BFE3CE",
  horizonTo: "#F3EDE1",
  hairline: "#7C8E8B",
} satisfies Partial<PosterPalette>;

export const GUIDANCE_RULES: GuidanceRule[] = [
  {
    id: "rule-quiet",
    when: ["quiet", "quieter", "calm", "simpler", "less", "mute", "soft", "still"],
    citeKeys: ["ref-contours", "ref-ground", "pack-crust", "pack-contour"],
    direction:
      "quieter reads as fewer marks: the ring goes, the disc turns mint into cream, and one terracotta sun is left",
    patch: {
      palette: QUIET_PALETTE,
      composition: {
        ring: { show: false },
        sun: { show: true, cx: 121, cy: 27, r: 4.2, tone: "accent" },
        rule: { show: true, y: 123 },
      },
      typography: { titleSize: 52, titleY: 170 },
    },
  },
  {
    id: "rule-warm-note",
    when: ["warm", "terracotta", "accent", "sun", "single note", "one warm"],
    citeKeys: ["ref-contours", "ref-patchwork", "pack-contour", "pack-grid"],
    direction: "the warm note is held to a single sun in the upper right, nothing else takes the colour",
    patch: {
      palette: { accent: "#C85731" },
      composition: { sun: { show: true, cx: 121, cy: 27, r: 4.2, tone: "accent" } },
    },
  },
  {
    id: "rule-scale",
    when: ["scale", "figure", "human", "person", "size", "small"],
    citeKeys: ["ref-horizon", "ref-note", "pack-dusk", "pack-margin"],
    direction: "the figure stays a mark at the centre of the disc so the flat keeps its real size",
    patch: { composition: { horizon: { figure: true, cx: 58, cy: 98, r: 43 } } },
  },
  {
    id: "rule-grid",
    when: ["grid", "rhythm", "align", "repeat", "structure", "spacing"],
    citeKeys: ["ref-patchwork", "ref-ground", "pack-grid", "pack-crust"],
    direction: "horizon, hairline and type snap back to the study spacing: disc at 58/98, rule at 123",
    patch: {
      composition: { horizon: { cx: 58, cy: 98, r: 43 }, rule: { show: true, y: 123 } },
    },
  },
  {
    id: "rule-horizon",
    when: ["horizon", "gradient", "lilac", "cream", "circle", "disc", "light"],
    citeKeys: ["ref-horizon", "pack-dusk"],
    direction: "the disc stays crisp — lilac edge, cream centre — and keeps its role as the only light source",
    patch: {
      palette: { horizonFrom: "#C8B4F2", horizonTo: "#F4EEE2" },
      composition: { horizon: { cx: 58, cy: 98, r: 43 } },
    },
  },
  {
    id: "rule-type",
    when: ["type", "lettering", "title", "word", "serif", "italic", "baseline", "salt"],
    citeKeys: ["ref-note", "pack-margin"],
    direction: "the italic serif takes more of the foot so the rest of the board can stay sparse",
    patch: { typography: { titleSize: 52, titleY: 170, title: "Salt" } },
  },
  {
    id: "rule-texture",
    when: ["texture", "ground", "crack", "surface", "crust"],
    citeKeys: ["ref-ground", "pack-crust"],
    direction: "the ground keeps its texture and the lower board stays unprinted, so the rule carries the width",
    patch: { palette: { surface: QUIET_PALETTE.surface, hairline: QUIET_PALETTE.hairline } },
  },
];

export const DEFAULT_DIRECTION_RULE = GUIDANCE_RULES[0];

/* ------------------------------------------------------------- matching -- */

/** Lower-case words, so tags/reasons/names and the intent compare on equal terms. */
export function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2);
}

function scoreReference(intent: string, ref: ReferenceItem): number {
  const text = intent.toLowerCase();
  const intentWords = new Set(words(text));
  let score = 0;
  for (const tag of ref.tags) {
    const t = tag.toLowerCase();
    if (t.length > 2 && intentWords.has(t)) score += 3;
  }
  for (const w of words(ref.name)) if (intentWords.has(w)) score += 2;
  for (const w of words(ref.reason)) if (intentWords.has(w)) score += 1;
  return score;
}

export interface IntentMatch {
  ruleIds: string[];
  /** ordered best-first; only references that exist on this project */
  citedRefs: ReferenceItem[];
  /** true when no rule keyword and no reference tag/name/reason word matched */
  unmatched: boolean;
}

/** Deterministic intent → rules + references, restricted to this project's references. */
export function matchIntent(intent: string, references: ReferenceItem[]): IntentMatch {
  const text = intent.toLowerCase();
  const matched = GUIDANCE_RULES.filter((rule) =>
    rule.when.some((token) => text.includes(token)),
  );

  const byId = new Map(references.map((r) => [r.id, r]));
  const ordered: ReferenceItem[] = [];
  const push = (ref: ReferenceItem | undefined) => {
    if (ref && !ordered.some((r) => r.id === ref.id)) ordered.push(ref);
  };

  // 1. references the matched rules prefer, when this project actually holds them
  for (const rule of matched) for (const key of rule.citeKeys) push(byId.get(key));
  // 2. references whose own tags / name / saved reason appear in the intent
  const scored = references
    .map((ref) => ({ ref, score: scoreReference(text, ref) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || (a.ref.position ?? 0) - (b.ref.position ?? 0))
    .map((row) => row.ref);
  for (const ref of scored) push(ref);

  const unmatched = matched.length === 0 && ordered.length === 0;
  // 3. never invent a source: fall back to the first reference the project holds
  if (!ordered.length && references.length) push(references[0]);

  return {
    ruleIds: matched.map((m) => m.id),
    citedRefs: ordered.slice(0, MAX_CITES),
    unmatched,
  };
}

/* ---------------------------------------------------------------- patch -- */

function mergePatch(base: PosterPatch, next: PosterPatch): PosterPatch {
  const out: PosterPatch = {};
  const pa = { ...(base.palette ?? {}), ...(next.palette ?? {}) };
  const ty = { ...(base.typography ?? {}), ...(next.typography ?? {}) };
  const co = base.composition ?? {};
  const cn = next.composition ?? {};
  if (Object.keys(next).length) {
    if (Object.keys(pa).length) out.palette = pa;
    if (Object.keys(ty).length) out.typography = ty;
    const composition: PosterPatch["composition"] = {};
    for (const key of ["horizon", "ring", "sun", "rule"] as const) {
      const merged = { ...(co[key] ?? {}), ...(cn[key] ?? {}) };
      if (Object.keys(merged).length) (composition as Record<string, unknown>)[key] = merged;
    }
    const caption = cn.caption ?? co.caption;
    if (caption) composition.caption = caption;
    if (Object.keys(composition).length) out.composition = composition;
  }
  return out;
}

/** Palette keys touched by the patch, as a before/after pair for the swatch diff. */
export function paletteDiff(
  poster: PosterModel,
  patch: PosterPatch,
): { before: Partial<PosterPalette>; after: Partial<PosterPalette> } {
  const before: Partial<PosterPalette> = {};
  const after: Partial<PosterPalette> = {};
  for (const [key, value] of Object.entries(patch.palette ?? {})) {
    const k = key as keyof PosterPalette;
    (before as Record<string, unknown>)[k] = poster.palette[k];
    (after as Record<string, unknown>)[k] = value;
  }
  return { before, after };
}

/* --------------------------------------------------------------- draft --- */

/**
 * Rationale assembly keeps the saved reasons inside the database's 600-char
 * limit by dropping whole sentences, never by cutting a reason in half. Every
 * reference that ends up cited therefore also ends up quoted, verbatim.
 */
function buildRationale(parts: {
  direction: string;
  quoted: ReferenceItem[];
  tail: string;
}): { rationale: string; cited: ReferenceItem[] } {
  const quoted = parts.quoted.slice(0, MAX_CITES);

  for (let count = quoted.length; count >= 1; count -= 1) {
    const kept = quoted.slice(0, count);
    const quotes = kept.map((q) => `“${q.reason}” (${q.name})`).join("; ");
    const sources = kept.map((q) => q.name).join(", ");
    const body = `${parts.direction} ${quotes} Sources: ${sources}. ${parts.tail}`;
    if (body.length <= RATIONALE_LIMIT) return { rationale: body, cited: kept };
  }

  // Only reachable with one very long saved reason: keep the record, drop the prose.
  const only = quoted[0];
  const shortDirection = parts.direction.slice(0, 120);
  return {
    rationale: only
      ? `${shortDirection} “${only.reason}” (${only.name}). ${parts.tail}`.slice(0, RATIONALE_LIMIT)
      : `${shortDirection} ${parts.tail}`.slice(0, RATIONALE_LIMIT),
    cited: only ? [only] : [],
  };
}

/**
 * Returns null when no proposal can be honest: an empty intent, or a project
 * with no references to cite. The caller surfaces that as a command failure.
 */
export function buildProposalDraft(
  snapshot: StudioSnapshot,
  intent: string,
): ProposalDraft | null {
  const trimmed = intent.trim();
  if (!trimmed) return null;

  const references = snapshot.references;
  if (!references.length) return null;

  const { ruleIds, citedRefs, unmatched } = matchIntent(trimmed, references);

  let patch: PosterPatch = {};
  const directions: string[] = [];
  for (const rule of GUIDANCE_RULES) {
    if (!ruleIds.includes(rule.id)) continue;
    patch = mergePatch(patch, rule.patch);
    directions.push(rule.direction);
  }

  if (!patch.palette && !patch.composition && !patch.typography) {
    // Nothing matched: offer the project's default quiet direction rather than
    // pretending the intent did something it did not.
    patch = mergePatch({}, DEFAULT_DIRECTION_RULE.patch);
    directions.unshift(
      `nothing in “${trimmed}” matched a stored reason, so the default quiet direction is offered from the closest reference`,
    );
  }

  const tail = unmatched
    ? "Prototype guidance — no external model called. Cite a reason with reference.add and ask again to narrow it. Nothing on the board changes until you approve."
    : "Prototype guidance — no external model called. Nothing on the board changes until you approve.";

  const assembled = buildRationale({
    direction: directions.join("; "),
    quoted: citedRefs,
    tail,
  });

  const cites = assembled.cited.map((r) => r.id);

  const { before, after } = paletteDiff(snapshot.project.poster, patch);

  return {
    intent: trimmed.slice(0, 300),
    rationale: assembled.rationale,
    patch,
    paletteBefore: before,
    paletteAfter: after,
    cites,
    source: "prototype-guidance",
    costLabel: COST_LABEL_DB,
  };
}

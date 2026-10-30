/**
 * Brand tokens + the seeded Salt Flats project, expressed as editable data.
 * The poster is a typed model rendered with SVG/CSS — never a screenshot.
 */
import type {
  HorizonArtwork,
  PosterModel,
  PosterPalette,
  ProposalDraft,
  ReferenceItem,
} from "./types";
import { buildProposalDraft } from "./proposal";

export const TOKENS = {
  ink: "#111111",
  ivory: "#F2F1ED",
  chartreuse: "#C7FE02",
  violet: "#8B5CF8",
  mint: "#7ED5B5",
  pink: "#FF6B9D",
  teal: "#204F4D",
  terracotta: "#C85731",
  canvas: "#181918",
  rule: "#2C2E2C",
} as const;

/** Poster board coordinate space (matches the ~150x188 tile in the desktop study). */
export const POSTER_UNITS = { width: 150, height: 188 } as const;

export const SEED_PALETTE: PosterPalette = {
  canvas: "#204F4D",
  surface: "#1A4341",
  horizonFrom: "#C8B4F2",
  horizonTo: "#F4EEE2",
  accent: "#C85731",
  type: "#F2F1ED",
  hairline: "#6E8280",
};

/**
 * The seeded Salt Flats poster, measured off the supplied study at 150x188:
 * a crisp horizon disc centred at (58,98) with radius 43, its figure at the
 * centre of the disc, the hairline at y123 and the italic "Salt" baseline at
 * y168. A fine outer ring with a filled ivory sun sits top right.
 */
export const SEED_POSTER: PosterModel = {
  width: POSTER_UNITS.width,
  height: POSTER_UNITS.height,
  label: "Poster v4",
  palette: SEED_PALETTE,
  composition: {
    horizon: { cx: 58, cy: 98, r: 43, figure: true },
    ring: { show: true, cx: 121, cy: 27, r: 8 },
    sun: { show: true, cx: 121, cy: 27, r: 3.4, tone: "ivory" },
    rule: { show: true, y: 123 },
    caption: "Salt Flats Identity",
  },
  typography: {
    eyebrow: "Salt Flats Identity",
    title: "Salt",
    titleSize: 44,
    titleY: 168,
    family: "serif-italic",
  },
};

/**
 * Bundled references — conceptual reproductions of the supplied Salt Flats
 * artwork, each carrying a source and a reason. Reasons are what the
 * prototype guidance reads when it forms a proposal.
 */
export const SEED_REFERENCES: ReferenceItem[] = [
  {
    id: "ref-horizon",
    kind: "bundled",
    artwork: "horizon",
    name: "Lilac horizon with one figure",
    source: "Salt Flats study — reference 1",
    reason: "one figure gives scale",
    tags: ["scale", "figure", "horizon", "gradient", "quiet"],
    swatches: ["#C8B4F2", "#F4EEE2", "#111111"],
    position: 1,
  },
  {
    id: "ref-note",
    kind: "bundled",
    artwork: "note",
    name: "Ivory note",
    source: "Salt Flats study — annotation",
    reason: "one figure gives scale, kept as a written note",
    tags: ["note", "scale", "figure", "annotation"],
    swatches: ["#F2F1ED", "#C85731"],
    position: 2,
  },
  {
    id: "ref-patchwork",
    kind: "bundled",
    artwork: "patchwork",
    name: "Teal / ivory / terracotta patchwork",
    source: "Salt Flats study — reference 2",
    reason: "grid rhythm",
    tags: ["grid", "rhythm", "alignment", "repeat", "warm"],
    swatches: ["#204F4D", "#F2F1ED", "#C85731"],
    position: 3,
  },
  {
    id: "ref-ground",
    kind: "bundled",
    artwork: "cracked-ground",
    name: "Cracked pale ground",
    source: "Salt Flats study — reference 3",
    reason: "ground texture",
    tags: ["texture", "ground", "quiet", "silence"],
    swatches: ["#EDE7DA", "#D6CFC0"],
    position: 4,
  },
  {
    id: "ref-contours",
    kind: "bundled",
    artwork: "contours",
    name: "Terracotta contour lines",
    source: "Salt Flats study — reference 4",
    reason: "quiet, one warm note",
    tags: ["quiet", "warm", "contour", "single-note", "line"],
    swatches: ["#C85731", "#F4EEE2"],
    position: 5,
  },
];

/**
 * Bundled Salt Flats pack: faithful, code-native recreations of plates in the
 * original Kresilo design study, each with a suggested reason. The folder UI
 * currently offers the seed set above; this pack shares that one source so a
 * future chooser cannot invent different metadata.
 */
export interface ReferencePackItem {
  key: string;
  name: string;
  source: string;
  suggestedReason: string;
  tags: string[];
  swatches: string[];
  artwork: HorizonArtwork;
}

export const SALT_FLATS_PACK: ReferencePackItem[] = [
  {
    key: "pack-dusk",
    name: "Horizon at dusk",
    source: "Kresilo design study — plate 6",
    suggestedReason: "the disc alone can hold the whole board",
    tags: ["horizon", "gradient", "dusk", "quiet"],
    swatches: ["#C8B4F2", "#F4EEE2", "#204F4D"],
    artwork: "horizon",
  },
  {
    key: "pack-grid",
    name: "Teal grid study",
    source: "Kresilo design study — plate 7",
    suggestedReason: "grid rhythm keeps the foot of the poster open",
    tags: ["grid", "rhythm", "alignment", "repeat"],
    swatches: ["#204F4D", "#F2F1ED", "#C85731"],
    artwork: "patchwork",
  },
  {
    key: "pack-crust",
    name: "Cracked crust, macro",
    source: "Kresilo design study — plate 3",
    suggestedReason: "ground texture instead of a second shape",
    tags: ["texture", "ground", "crack", "silence"],
    swatches: ["#EDE7DA", "#D6CFC0"],
    artwork: "cracked-ground",
  },
  {
    key: "pack-contour",
    name: "Terracotta contour print",
    source: "Kresilo design study — plate 4",
    suggestedReason: "one warm note carries the flat",
    tags: ["warm", "terracotta", "contour", "single-note", "line"],
    swatches: ["#C85731", "#F4EEE2"],
    artwork: "contours",
  },
  {
    key: "pack-margin",
    name: "Ivory margin note",
    source: "Kresilo design study — annotation sheet",
    suggestedReason: "the reason travels with the reference",
    tags: ["note", "annotation", "type", "serif"],
    swatches: ["#F2F1ED", "#C85731"],
    artwork: "note",
  },
];

/**
 * The SQL snapshot has no artwork column, so the trusted code-native artwork id
 * is reconstructed from these known seed/pack keys. Anything else renders as a
 * labelled metadata tile rather than an invented picture.
 */
function artworkMap(items: Array<{ key: string; artwork: HorizonArtwork }>): Record<string, HorizonArtwork> {
  const out: Record<string, HorizonArtwork> = {};
  for (const item of items) out[item.key] = item.artwork;
  return out;
}

export const BUNDLED_ARTWORK: Record<string, HorizonArtwork> = {
  ...artworkMap(SEED_REFERENCES.map((r) => ({ key: r.id, artwork: r.artwork ?? "note" }))),
  ...artworkMap(SALT_FLATS_PACK),
};

export function artworkForReference(id: string): HorizonArtwork | null {
  return BUNDLED_ARTWORK[id] ?? null;
}

/** Seed decisions carry the version history the desktop study shows. */
export const SEED_DECISIONS = [
  {
    id: "dec-scale",
    title: "Keep a single human figure for scale",
    reason: "A tiny silhouette holds the horizon at real size.",
    kind: "seed" as const,
    sourceReferenceIds: ["ref-horizon", "ref-note"],
    versionNumber: 1,
  },
  {
    id: "dec-warm",
    title: "One warm note only",
    reason: "Terracotta stays a single accent so the ground can stay quiet.",
    kind: "seed" as const,
    sourceReferenceIds: ["ref-contours", "ref-patchwork"],
    versionNumber: 1,
  },
];

/**
 * The board opens with one quiet variant already proposed and untouched, exactly
 * as the desktop study shows it. It is produced by the same deterministic
 * guidance the copilot uses, so a seeded proposal can never disagree with what
 * `proposal.create` would have written for the same ask.
 */
export const SEED_PROPOSAL_INTENT = "Quieter, with one warm note";

export function buildSeedProposal(): ProposalDraft | null {
  return buildProposalDraft(
    {
      project: {
        id: "seed",
        title: "Salt Flats Identity",
        visibility: "private",
        poster: SEED_POSTER,
        posterVersion: 1,
      },
      references: SEED_REFERENCES,
      proposals: [],
      approvals: [],
      decisions: [],
      versions: [],
      history: [],
    },
    SEED_PROPOSAL_INTENT,
  );
}

export function buildGuestSeed() {
  const proposal = buildSeedProposal();
  return {
    title: "Salt Flats Identity",
    poster: SEED_POSTER,
    references: SEED_REFERENCES.map((r) => ({
      key: r.id,
      kind: r.kind,
      name: r.name,
      source: r.source,
      reason: r.reason,
      tags: r.tags,
      swatches: r.swatches,
    })),
    decisions: SEED_DECISIONS.map((d) => ({
      title: d.title,
      reason: d.reason,
      sourceReferenceIds: d.sourceReferenceIds,
    })),
    proposals: proposal
      ? [
          {
            intent: proposal.intent,
            rationale: proposal.rationale,
            patch: proposal.patch,
            paletteBefore: proposal.paletteBefore,
            paletteAfter: proposal.paletteAfter,
            cites: proposal.cites,
            source: proposal.source,
            costLabel: proposal.costLabel,
          },
        ]
      : [],
  };
}

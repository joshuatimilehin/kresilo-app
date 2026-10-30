import type { Art, Project, Suggestion } from "./contracts";

/**
 * Authorship: where AI helped and where the artist worked (issue #50).
 *
 * This is derived from records a project already keeps; nothing new is stored.
 * Be clear about what is READ and what is INFERRED:
 *
 *  - READ: the version list (number, note, art snapshot), the decisions (each
 *    carries the version number it was approved into) and the proposals
 *    (intent, status, patch, provenance).
 *  - INFERRED: history stores one `actor` string (the person's name), so it
 *    cannot tell a hand edit from an approved AI change. We therefore classify
 *    each version from its note, its matching decision and its proposal. A
 *    version we cannot connect to a proposal is treated as the artist's own
 *    edit, because every AI change today passes through a proposal. If a
 *    future code path records AI work without a proposal or the "AI applied"
 *    note, it would be mislabelled hand; the real fix is a per-event record
 *    (issue #50), which this module is built to be replaced by.
 *  - Steps that only move between versions (undo, redo, restore, the start of
 *    the project) are not listed: they add no new work, and any AI work that
 *    ends up in the artwork is still listed at the step where it was made.
 *  - Only versions on the path to the artwork as it stands count (see
 *    `versionPath`). A change that was undone, or left behind by an edit after
 *    undo, is not in the artwork, so it is not credited to anyone.
 */
export type Origin = "hand" | "ai-assisted" | "ai-generated";

export type AuthorshipStep = {
  /** 1-based position in the list shown to viewers. */
  step: number;
  origin: Origin;
  /** Named for AI steps only: the model, "Preset prompt controls" or "Copilot rules". */
  tool?: string;
  summary: string;
  /** The saved version this step produced. */
  version: number;
  /** One short phrase saying how the origin was decided. */
  basis: string;
};

export const originLabel: Record<Origin, string> = {
  hand: "By hand",
  "ai-assisted": "AI-assisted",
  "ai-generated": "AI-generated",
};

const UNKNOWN_TOOL = "Unknown AI tool";

/** Names the tool from a proposal's provenance text. */
export function toolFromProvenance(provenance: string | undefined): string {
  const text = (provenance ?? "").trim();
  if (!text) return UNKNOWN_TOOL;
  const lower = text.toLowerCase();
  if (lower.startsWith("prototype guidance")) {
    return lower.includes("preset prompt controls")
      ? "Preset prompt controls"
      : "Copilot rules";
  }
  // A model-written proposal starts with the model name: "model · ...".
  const model = text.split("·")[0].trim();
  return model || UNKNOWN_TOOL;
}

const isNavigation = (note: string) =>
  /^(restored version|undo to version|redo to version)/i.test(note) ||
  /^started the project$/i.test(note);

function addedLayers(proposal: Suggestion, before: Art | undefined) {
  const known = new Set((before?.layers ?? []).map((l) => l.id));
  return (proposal.patch.layers ?? []).filter((l) => !known.has(l.id)).length;
}

const words: [keyof Art, string][] = [
  ["title", "title"],
  ["caption", "caption"],
  ["color", "colour"],
  ["size", "type size"],
  ["asset", "background image"],
  ["backgroundMediaId", "background image"],
  ["backgroundOpacity", "background"],
  ["backgroundFilter", "background"],
  ["titleVisible", "title"],
  ["captionVisible", "caption"],
];

/** A plain description of what changed between two saved versions. */
function describeChange(before: Art | undefined, after: Art): string {
  if (!before) return "Edited the artwork";
  const nouns = new Set<string>();
  for (const [key, word] of words)
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key]))
      nouns.add(word);
  if (before.x !== after.x || before.y !== after.y) nouns.add("title position");
  const pieces: string[] = [];
  if (nouns.size) {
    const list = [...nouns];
    pieces.push(
      `Changed the ${list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list.at(-1)}` : list[0]}`,
    );
  }
  const a = before.layers ?? [],
    b = after.layers ?? [];
  if (b.length > a.length) pieces.push("Added an image layer");
  else if (b.length < a.length) pieces.push("Removed an image layer");
  else if (JSON.stringify(a) !== JSON.stringify(b))
    pieces.push("Adjusted image layers");
  return pieces.join("; ") || "Edited the artwork";
}

const navigatedTo = (note: string) =>
  /^(?:restored version|undo to version|redo to version)\s+(\d+)/i.exec(note.trim());

/**
 * The saved versions behind the artwork on the canvas now, oldest first. It
 * walks back from the current version (the undo pointer, or the latest): each
 * version came from its `parent`, else the one saved before it, and a version
 * that restored (or, in older projects, undid to) version N came from N.
 * Versions on the redo stack or on an abandoned branch are not on the path.
 */
export function versionPath(p: Project): Project["versions"] {
  const at = p.versionNavigation?.at;
  const byId = new Map(p.versions.map((v) => [v.id, v]));
  const byNumber = new Map(p.versions.map((v) => [v.number, v]));
  const path: Project["versions"] = [];
  const seen = new Set<string>();
  let v = (at ? byId.get(at) : undefined) ?? p.versions.at(-1);
  while (v && !seen.has(v.id)) {
    seen.add(v.id);
    path.push(v);
    const jump = navigatedTo(v.note);
    const index = p.versions.indexOf(v);
    v = jump
      ? byNumber.get(Number(jump[1]))
      : v.parent
        ? byId.get(v.parent)
        : index > 0
          ? p.versions[index - 1]
          : undefined;
  }
  return path.reverse();
}

/** True when two texts say the same thing, ignoring case and spacing. */
export const sameText = (a: string, b: string) =>
  a.trim().replace(/\s+/g, " ").toLowerCase() === b.trim().replace(/\s+/g, " ").toLowerCase();

/** Turns the saved versions behind the current artwork into an ordered list of authorship steps. */
export function authorshipSteps(p: Project): AuthorshipStep[] {
  const steps: AuthorshipStep[] = [];
  const approved = p.proposals.filter((q) => q.status === "approved");
  const used = new Set<string>();
  const proposalFor = (intent: string, anyStatus = false) => {
    const found = (anyStatus ? p.proposals : approved).find(
      (q) => q.intent === intent && !used.has(q.id),
    );
    if (found) used.add(found.id);
    return found;
  };
  const path = versionPath(p);
  path.forEach((v, i) => {
    const note = v.note.trim();
    if (i === 0 || isNavigation(note)) return;
    const before = path[i - 1]?.art;
    const decision = p.decisions.find((d) => d.version === v.number);
    const unreviewed = /^AI applied:/i.test(note);
    const intent = unreviewed ? note.replace(/^AI applied:\s*/i, "") : note;
    const proposal = decision
      ? (approved.find(
          (q) =>
            !used.has(q.id) &&
            q.intent === decision.title &&
            q.rationale === decision.reason,
        ) ?? proposalFor(decision.title))
      : proposalFor(intent, unreviewed);
    if (proposal) used.add(proposal.id);
    const viaProposal = Boolean(decision) || Boolean(proposal) || unreviewed;
    if (!viaProposal) {
      steps.push({
        step: steps.length + 1,
        origin: "hand",
        summary: /^adjusted motion$/i.test(note)
          ? "Adjusted the motion"
          : describeChange(before, v.art),
        version: v.number,
        basis: "No AI proposal is linked to this saved version",
      });
      return;
    }
    const addsLayers = proposal ? addedLayers(proposal, before) > 0 : false;
    const origin: Origin =
      unreviewed || addsLayers ? "ai-generated" : "ai-assisted";
    steps.push({
      step: steps.length + 1,
      origin,
      tool: toolFromProvenance(proposal?.provenance),
      // The brief is already the post's description: say what changed instead of repeating it.
      summary: p.brief && sameText(intent, p.brief) ? describeChange(before, v.art) : intent,
      version: v.number,
      basis: unreviewed
        ? "Applied without a review step"
        : addsLayers
          ? "The proposal added layers; the artist approved it"
          : "The artist reviewed and approved an AI proposal",
    });
  });
  return steps;
}

export type AuthorshipSummary = {
  total: number;
  hand: number;
  aiAssisted: number;
  aiGenerated: number;
  /** One plain sentence. It is an estimate and always carries its basis. */
  sentence: string;
  /** The formula, in words, so no number appears without it. */
  basis: string;
};

export const authorshipBasis =
  "Counted from saved steps: each step the artist saved counts once, as hand, AI-assisted or AI-generated. Undo, redo and restore are not counted. It does not measure effort, time or pixels.";

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/** Counts and a one-sentence summary, labelled an estimate, with no percentages. */
export function authorshipSummary(steps: AuthorshipStep[]): AuthorshipSummary {
  const hand = steps.filter((s) => s.origin === "hand").length,
    aiAssisted = steps.filter((s) => s.origin === "ai-assisted").length,
    aiGenerated = steps.filter((s) => s.origin === "ai-generated").length;
  const total = steps.length;
  if (!total)
    return {
      total,
      hand,
      aiAssisted,
      aiGenerated,
      sentence:
        "Estimate: no changes were saved after the starting point, so there is nothing to attribute.",
      basis: authorshipBasis,
    };
  const ai = aiAssisted + aiGenerated;
  const parts = [`${hand} by hand`];
  if (aiAssisted) parts.push(`${aiAssisted} AI-assisted (approved by the artist)`);
  if (aiGenerated) parts.push(`${aiGenerated} AI-generated`);
  const lead = !ai
    ? "no AI was used"
    : !hand
      ? "every saved step used AI"
      : "the artist worked by hand and with AI";
  return {
    total,
    hand,
    aiAssisted,
    aiGenerated,
    sentence: `Estimate from ${plural(total, "saved step", "saved steps")}: ${parts.join(", ")}; ${lead}.`,
    basis: authorshipBasis,
  };
}

import { works } from "./catalog";
import type { AssetKey, Project, Reference } from "./contracts";

/**
 * "Where this came from": the references behind a published work (issue #35).
 *
 * Built only from stored records (the project's references and the decisions
 * that cite them), never from image similarity. Credit is not optional: a
 * reference keeps its title and creator even when the designer hides its
 * reason. Imported files (`mediaId`) are private and are never listed.
 */
export type LineageEntry = {
  title: string;
  creator: string;
  /** A catalog thumbnail key, safe to publish. */
  asset: AssetKey;
  /** Set only when the source is a known work Kresilo can link to. */
  workId?: string;
  /** The link to the source work (an internal path), when there is one. */
  source: string;
  /** True when the designer shows their saved reason; false shows credit only. */
  disclosed: boolean;
  /** The saved reason; present only when `disclosed` is true. */
  reason?: string;
  /** True for a reference taken off the board that an approved decision relied on. */
  removed: boolean;
};

export type LineageOptions = {
  /** Show saved reasons at all. Default true. */
  showReasons?: boolean;
  /** Reference ids (from this project) whose reason stays private. */
  hideReasonFor?: string[];
};

const knownWork = (workId: string) => works.some((w) => w.id === workId);

/**
 * Builds the lineage list: kept references first, then archived references
 * that an approved decision cites. An archived reference nothing relied on is
 * not listed here (the older credit list still names it).
 */
export function buildLineage(
  p: Project,
  options: LineageOptions = {},
): LineageEntry[] {
  const showReasons = options.showReasons ?? true,
    hidden = new Set(options.hideReasonFor ?? []);
  const cited = new Set(p.decisions.flatMap((d) => d.cites));
  const seen = new Set<string>();
  const out: LineageEntry[] = [];
  const add = (r: Reference, removed: boolean) => {
    if (r.mediaId || seen.has(r.workId)) return;
    seen.add(r.workId);
    const disclosed = showReasons && !hidden.has(r.id) && Boolean(r.reason);
    out.push({
      title: r.title,
      creator: r.creator,
      asset: r.asset,
      ...(knownWork(r.workId) ? { workId: r.workId } : {}),
      source: r.source,
      disclosed,
      ...(disclosed ? { reason: r.reason } : {}),
      removed,
    });
  };
  for (const r of p.references) add(r, false);
  for (const r of p.referenceArchive ?? []) if (cited.has(r.id)) add(r, true);
  return out;
}

/** Reasons the designer chose not to show, for redacting text that quotes them. */
export function hiddenReasons(
  p: Project,
  options: LineageOptions = {},
): string[] {
  const showReasons = options.showReasons ?? true,
    hidden = new Set(options.hideReasonFor ?? []);
  return [...p.references, ...(p.referenceArchive ?? [])]
    .filter((r) => !showReasons || hidden.has(r.id))
    .map((r) => r.reason.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

/** Removes any hidden reason that a piece of public text quotes. */
export function redactReasons(text: string, reasons: string[]): string {
  return reasons.reduce(
    (out, reason) => out.split(reason).join("a reason the designer kept private"),
    text,
  );
}

export type UsedInEntry = { id: string; title: string; creator: string };

/**
 * "Used in" on a source work: the community posts that credit it. READ from the
 * stored lineage (or, for older posts, the credit link). Private link posts
 * never reach this list because the community list holds community posts only.
 * Never from image similarity.
 */
export function usedIn(
  publications: readonly {
    id?: string;
    audience?: string;
    creator: string;
    art: { title: string };
    lineage?: { workId?: string; source: string }[];
    credits?: { source: string }[];
  }[],
  workId: string,
): UsedInEntry[] {
  const link = `/work/${workId}`;
  return publications
    .filter(
      (p) =>
        p.id &&
        p.audience !== "private" &&
        ((p.lineage ?? []).some((l) => l.workId === workId || l.source === link) ||
          (p.credits ?? []).some((c) => c.source === link)),
    )
    .map((p) => ({
      id: p.id as string,
      title: p.art.title.split("\n").join(" ").trim() || "Untitled",
      creator: p.creator,
    }));
}

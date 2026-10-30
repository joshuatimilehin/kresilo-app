import { caseStudies } from "./projects";
import type { CaseStudy } from "./types";

/** A small stable hash, so the same project always lands in the same place. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Home's feed: every case study, makers interleaved. Each maker's projects are
 * spread evenly along the feed (a maker with five sits at 10%, 30%, 50%...),
 * projects at the same point are mixed by a stable hash, and a last pass moves
 * a project forward when it would sit next to one by the same maker. The order
 * is the same on every visit. Pass maker ids to keep only those makers.
 */
export function homeProjects(makerIds?: readonly string[]): CaseStudy[] {
  const pool = makerIds ? caseStudies.filter((c) => makerIds.includes(c.makerId)) : caseStudies.slice();
  const byMaker = new Map<string, CaseStudy[]>();
  for (const c of pool) byMaker.set(c.makerId, [...(byMaker.get(c.makerId) ?? []), c]);
  const placed = [...byMaker.values()].flatMap((list) =>
    list.map((project, k) => ({ project, at: (k + 0.5) / list.length, mix: hash(project.id) })),
  );
  placed.sort((a, b) => a.at - b.at || a.mix - b.mix || a.project.id.localeCompare(b.project.id));
  const out = placed.map((p) => p.project);
  for (let i = 1; i < out.length; i++) {
    if (out[i].makerId !== out[i - 1].makerId) continue;
    const j = out.findIndex((c, n) => n > i && c.makerId !== out[i - 1].makerId);
    if (j > i) out.splice(i, 0, ...out.splice(j, 1));
  }
  return out;
}

/** A deterministic shuffle, so each new stretch of an endless feed is ordered differently but the same on every visit. */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  let x = seed * 9301 + 49297;
  for (let i = out.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The projects of the project reel: the one you opened first, then the rest in
 * Home's order, then further stretches in a different order each time, so
 * swiping never runs out. A stretch never starts with the project the last one
 * ended on.
 */
export function reelProjects(startId: string, stretches: number, makerIds?: readonly string[]): CaseStudy[] {
  const home = homeProjects(makerIds);
  const at = Math.max(0, home.findIndex((c) => c.id === startId));
  return endless([...home.slice(at), ...home.slice(0, at)], home, stretches);
}

/** Home's endless feed: Home's own order, then further stretches in a different order each time. */
export const endlessHome = (stretches: number, makerIds?: readonly string[]): CaseStudy[] => {
  const home = homeProjects(makerIds);
  return endless(home, home, stretches);
};

function endless(first: CaseStudy[], home: CaseStudy[], stretches: number): CaseStudy[] {
  const out = first.slice();
  for (let n = 1; n < Math.max(1, stretches); n++) {
    const next = shuffled(home, n);
    if (next[0]?.id === out[out.length - 1]?.id && next.length > 1) next.push(next.shift() as CaseStudy);
    out.push(...next);
  }
  return out;
}

/**
 * Whether the item at `index` is near enough to the one in view to be drawn in
 * full. A phone holds a handful of slides in memory, not every project it has
 * scrolled past; the rest are empty frames of the same height.
 */
export const inWindow = (index: number, current: number, radius = 1): boolean => Math.abs(index - current) <= radius;

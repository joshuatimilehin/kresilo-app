import { makerById, type Discipline, type Maker } from "../makers";
import { homeProjects } from "./feed";
import { caseKindLabel, themeLabel } from "./index";
import type { CaseKind, CaseStudy } from "./types";

/**
 * Discover's project search. Pure: a query, the Discover filters and the case
 * studies go in, the matching case studies come out in a stable ranked order.
 *
 * Text is folded before it is compared (accents, case, punctuation), so "ines"
 * finds Inês and "vu" finds Vũ. Every word of the query has to match something
 * (AND). A word matches a whole word in a field, or the start of a word of four
 * letters or more ("ferr" finds ferry), plus a plain trailing "s" ("apps").
 */

/** Lower case, accents removed, anything that is not a letter or digit becomes a space. */
export function normalise(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/ł/g, "l")
    .replace(/đ/g, "d")
    .replace(/ı/g, "i")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const wordsOf = (text: string): string[] => normalise(text).split(" ").filter(Boolean);

/** Does one query word match one word of a field? */
function wordMatches(query: string, word: string): boolean {
  const forms = query.length > 3 && query.endsWith("s") ? [query, query.slice(0, -1)] : [query];
  return forms.some((q) => word === q || (q.length >= 4 && word.startsWith(q)));
}

/** Plain text match for lists that are not projects: every query word is somewhere in the text. */
export function textMatches(query: string, text: string): boolean {
  const q = wordsOf(query);
  if (!q.length) return true;
  const hay = normalise(text);
  return q.every((w) => hay.includes(w));
}

/** Other words people use for a kind of project. Small on purpose. */
export const kindSynonyms: Record<CaseKind, readonly string[]> = {
  "brand-identity": ["logo", "logos", "identity", "branding", "brand"],
  packaging: ["pack", "box", "label", "bottle"],
  campaign: ["advert", "advertising", "ad", "ads"],
  "ui-ux": ["app", "apps", "interface", "website", "web", "screen", "digital"],
  presentation: ["deck", "slides", "pitch"],
  motion: ["film", "video", "animation", "animated"],
  editorial: ["magazine", "book", "publication", "layout"],
  spatial: ["space", "interior", "exhibition", "signage"],
  photography: ["photo", "photos", "photograph"],
  lettering: ["type", "typography", "calligraphy", "hand lettering"],
};

/** Other words for a maker's discipline. */
export const disciplineSynonyms: Partial<Record<Discipline, readonly string[]>> = {
  "video editing": ["film", "video", "edit"],
  motion: ["film", "video", "animation"],
  "graphic identity": ["logo", "identity", "brand", "branding"],
  "ui and ux design": ["app", "apps", "interface", "ux", "ui"],
  "photo editing": ["photo", "photos"],
  "type design": ["font", "fonts", "typeface", "type"],
  "paper and print": ["print", "paper"],
  "editorial design": ["magazine", "book", "layout"],
  textile: ["fabric", "weaving"],
  packaging: ["pack", "box"],
  "spatial design": ["space", "interior"],
  "creative technology": ["code", "interactive"],
};

/** Field weights: a match in the title outranks one in the story. */
const WEIGHT = { title: 100, client: 80, maker: 80, kind: 50, tagline: 40, discipline: 40, place: 30, theme: 25, role: 20, what: 15, story: 10 } as const;
type Field = keyof typeof WEIGHT;

type Entry = { project: CaseStudy; order: number; fields: { field: Field; words: Set<string> }[] };

function entryFor(project: CaseStudy, order: number): Entry {
  const maker = makerById(project.makerId);
  const add = (field: Field, ...texts: (string | undefined)[]) => ({ field, words: new Set(texts.flatMap((t) => (t ? wordsOf(t) : []))) });
  return {
    project,
    order,
    fields: [
      add("title", project.title),
      add("client", project.client.name),
      add("maker", maker?.name),
      add("kind", caseKindLabel[project.kind], project.kind, ...kindSynonyms[project.kind]),
      add("tagline", project.tagline),
      add("discipline", maker?.discipline, ...(maker ? (disciplineSynonyms[maker.discipline] ?? []) : [])),
      add("place", maker?.place, maker?.region, maker?.area),
      add("theme", ...project.themes.map((t) => themeLabel[t])),
      add("role", project.role),
      add("what", project.client.what),
      add("story", project.story.brief, project.story.idea, project.story.outcome),
    ],
  };
}

/** The best weight at which a query word matches this project, or 0. */
function bestWeight(entry: Entry, word: string): number {
  let best = 0;
  for (const { field, words } of entry.fields) {
    if (WEIGHT[field] <= best) continue;
    for (const w of words) if (wordMatches(word, w)) { best = WEIGHT[field]; break; }
  }
  return best;
}

let homeOrder: readonly CaseStudy[] | undefined;
/** Home's order, worked out once. */
const defaultSource = () => (homeOrder ??= homeProjects());

let cached: { source: readonly CaseStudy[]; entries: Entry[] } | undefined;
function indexOf(source: readonly CaseStudy[]): Entry[] {
  if (cached?.source !== source) cached = { source, entries: source.map(entryFor) };
  return cached.entries;
}

export type DiscoverFilters = {
  query?: string;
  /** One maker's id. */
  makerId?: string;
  /** A discipline, or a tag from the works list ("motion", "photography", "ui and ux design"). */
  discipline?: string;
  /** A city, country or region, as in "Explore by place". */
  place?: string;
  /** "motion" keeps motion projects, "still" the rest. */
  kind?: string;
  /** Keep only these makers (the people you follow). */
  makerIds?: readonly string[];
};

/** True when anything narrows Discover, so it should list matching projects. */
export function isFiltering(f: DiscoverFilters): boolean {
  return Boolean(f.query?.trim() || f.makerId || f.discipline || f.place || f.kind || f.makerIds);
}

export function placeMatches(maker: Maker | undefined, place: string): boolean {
  if (!maker) return false;
  const p = normalise(place);
  if (!p) return true;
  return [maker.place.split(",")[0], maker.place, maker.place.split(",").slice(1).join(","), maker.region, maker.area].some((v) => normalise(v) === p);
}

export function disciplineMatches(project: CaseStudy, discipline: string): boolean {
  const d = normalise(discipline);
  if (!d) return true;
  const maker = makerById(project.makerId);
  return (
    normalise(maker?.discipline ?? "") === d ||
    normalise(project.kind) === d ||
    normalise(caseKindLabel[project.kind]) === d ||
    project.themes.some((t) => normalise(themeLabel[t]) === d)
  );
}

/**
 * The projects that match, best first. With no query they keep the order of
 * `source` (Home's order by default: makers interleaved). Equal scores keep that
 * order too, so the same search always lists the same projects the same way.
 */
export function searchProjects(f: DiscoverFilters, source: readonly CaseStudy[] = defaultSource()): CaseStudy[] {
  const words = wordsOf(f.query ?? "");
  const scored: { project: CaseStudy; order: number; score: number }[] = [];
  for (const entry of indexOf(source)) {
    const { project } = entry;
    if (f.makerId && project.makerId !== f.makerId) continue;
    if (f.makerIds && !f.makerIds.includes(project.makerId)) continue;
    if (f.place && !placeMatches(makerById(project.makerId), f.place)) continue;
    if (f.discipline && !disciplineMatches(project, f.discipline)) continue;
    if (f.kind && (project.kind === "motion") !== (f.kind === "motion")) continue;
    let score = 0;
    let all = true;
    for (const w of words) {
      const best = bestWeight(entry, w);
      if (!best) { all = false; break; }
      score += best;
    }
    if (all) scored.push({ project, order: entry.order, score });
  }
  return scored.sort((a, b) => b.score - a.score || a.order - b.order).map((s) => s.project);
}

/** A few projects to offer when nothing matches: one per maker, in Home's order. */
export function suggestedProjects(count = 6, source: readonly CaseStudy[] = defaultSource()): CaseStudy[] {
  const seen = new Set<string>();
  const out: CaseStudy[] = [];
  for (const p of source) {
    if (seen.has(p.makerId)) continue;
    seen.add(p.makerId);
    out.push(p);
    if (out.length === count) break;
  }
  return out;
}

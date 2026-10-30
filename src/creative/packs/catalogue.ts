import { normalise } from "../portfolio/searchIndex";
import { packs } from "./data";
import type { Pack } from "./types";

/** The most packs listed to the assistant at once; the rest are narrowed away (see `packCatalogue`). */
export const MAX_LISTED_PACKS = 6;
const CONCEPTS_LISTED = 5;

/**
 * One compact line per pack the assistant may start from:
 *   id: trade [ui|brand] | five meanings | layouts: 0 welcome, 1 list, …
 * About 55 tokens a line.
 */
export function packLine(p: Pack): string {
  const layouts = p.layouts.map((l, i) => `${i} ${l.kind}`).join(", ");
  return `${p.id}: ${p.industry} [${p.subtype === "ui-ux" ? "ui" : "brand"}] | ${p.concepts.slice(0, CONCEPTS_LISTED).join(", ")} | layouts: ${layouts}`;
}

/**
 * The packs as the model sees them: those sharing words with the request, the
 * brief and the title first (a stopgap until matching is by meaning), then the
 * rest in order, up to `max`.
 */
export function packCatalogue(
  p: { brief?: string; art: { title: string } },
  intent: string,
  list: readonly Pack[] = packs,
  max = MAX_LISTED_PACKS,
): string[] {
  const words = new Set(
    normalise(`${intent} ${p.brief ?? ""} ${p.art.title}`)
      .split(" ")
      .filter((w) => w.length > 3),
  );
  const score = (x: Pack) => normalise(`${x.title} ${x.industry} ${x.about} ${x.concepts.join(" ")} ${x.items.join(" ")}`).split(" ").filter((w) => words.has(w)).length;
  return list
    .map((x, i) => ({ x, i, score: score(x) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, max)
    .map((r) => packLine(r.x));
}

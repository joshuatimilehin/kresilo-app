import { normalise } from "../portfolio/searchIndex";
import type { Visual, VisualCategory } from "./types";

/**
 * Finding visuals by hand: six icon groups over the 17 categories, and a text
 * search over title, what is in the picture and its meanings. Words are
 * folded like Discover's search (accents, case, punctuation), every word of
 * the query has to match, and a word matches a whole word or the start of a
 * longer one.
 */
export const visualGroups = [
  { id: "food", label: "Food and market", categories: ["food and drink", "market and shop"] },
  { id: "life", label: "Music, events and play", categories: ["music and nightlife", "events and gatherings", "sport and play"] },
  { id: "nature", label: "Nature, sky and animals", categories: ["nature and plants", "sky, sea and weather", "animals"] },
  { id: "places", label: "Places and travel", categories: ["places and buildings", "transport and travel"] },
  { id: "things", label: "Things, making and people", categories: ["objects and tools", "craft and making", "people and hands", "tech and screens"] },
  { id: "marks", label: "Badges, shapes and textures", categories: ["badges, frames and ornaments", "shapes, lines and scribbles", "textures and grounds"] },
] as const satisfies readonly { id: string; label: string; categories: readonly VisualCategory[] }[];
export type VisualGroupId = (typeof visualGroups)[number]["id"];

/** Every category belongs to exactly one group. */
export const groupOfCategory = (c: VisualCategory): VisualGroupId => visualGroups.find((g) => (g.categories as readonly string[]).includes(c))!.id;

const textOf = (v: Visual) => `${v.title} ${v.about} ${v.concepts.join(" ")} ${v.category}`;

function wordMatches(q: string, word: string): boolean {
  const forms = q.length > 3 && q.endsWith("s") ? [q, q.slice(0, -1)] : [q];
  return forms.some((f) => word === f || (f.length >= 3 && word.startsWith(f)));
}

/** The visuals matching a query and, when given, a group; titles rank above meanings. Library order breaks ties. */
export function findVisuals(list: readonly Visual[], opts: { query?: string; group?: VisualGroupId | null } = {}): Visual[] {
  const words = normalise(opts.query ?? "")
    .split(" ")
    .filter(Boolean);
  const group = opts.group ? visualGroups.find((g) => g.id === opts.group) : undefined;
  const pool = group ? list.filter((v) => (group.categories as readonly string[]).includes(v.category)) : [...list];
  if (!words.length) return pool;
  const scored: { v: Visual; score: number; i: number }[] = [];
  pool.forEach((v, i) => {
    const title = normalise(v.title).split(" ");
    const rest = normalise(textOf(v)).split(" ");
    let score = 0;
    for (const w of words) {
      if (title.some((t) => wordMatches(w, t))) score += 3;
      else if (rest.some((t) => wordMatches(w, t))) score += 1;
      else return;
    }
    scored.push({ v, score, i });
  });
  return scored.sort((a, b) => b.score - a.score || a.i - b.i).map((s) => s.v);
}

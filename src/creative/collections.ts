import { works as catalogue } from "./catalog";
import { makerById } from "./makers";

/**
 * Curated collections (issue #48): small groups of works chosen by the
 * Kresilo team around something you can see in them. Every collection here is
 * a sample collection and says so. Grouping is by visible theme, never by
 * claims about where a work comes from, and every work keeps its maker's
 * credit. Counts are taken from the works themselves.
 */
export type Collection = {
  id: string;
  title: string;
  /** What the works have in common, in plain words about what is visible. */
  theme: string;
  workIds: readonly string[];
};

export const collections: readonly Collection[] = [
  {
    id: "long-evening-light",
    title: "Light and the long evening",
    theme: "Low, warm or blue light: works where the hour is the subject.",
    workIds: ["after-light", "dusk-study", "blue-hour", "tidal-lines"],
  },
  {
    id: "texture-you-can-feel",
    title: "Texture you can feel",
    theme: "Paper, stone and soft surfaces drawn so closely you can almost touch them.",
    workIds: ["mineral-notes", "paper-weather", "soft-structures", "paper-orbit"],
  },
  {
    id: "colour-in-small-spaces",
    title: "Colour in small spaces",
    theme: "A few strong colours held inside a tight frame.",
    workIds: ["soft-structures", "tidal-lines", "garden-grid", "mineral-notes"],
  },
];

export const COLLECTION_LABEL = "Collection";
export const COLLECTION_NOTE =
  "Chosen by the Kresilo team. Grouped by what you can see in the work, not by claims about where it comes from. Every work keeps its maker’s credit.";

export const collectionById = (id: string) => collections.find((c) => c.id === id);

export const collectionWorks = (c: Collection) =>
  c.workIds
    .map((id) => catalogue.find((w) => w.id === id))
    .filter((w): w is (typeof catalogue)[number] => Boolean(w));

export type CollectionFacts = { works: number; makers: string[]; regions: string[] };

/** Counted from the works and the roster: how many works, which makers, which regions. */
export function collectionFacts(c: Collection): CollectionFacts {
  const ws = collectionWorks(c);
  const makers = [...new Set(ws.map((w) => w.creator))];
  const regions = [
    ...new Set(
      ws
        .map((w) => makerById(w.creatorId)?.region)
        .filter((r): r is NonNullable<typeof r> => Boolean(r)),
    ),
  ].sort();
  return { works: ws.length, makers, regions };
}

/** Collections that include a work, so a work page can point back to them. */
export const collectionsFor = (workId: string) => collections.filter((c) => c.workIds.includes(workId));

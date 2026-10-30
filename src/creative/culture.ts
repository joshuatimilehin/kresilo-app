import { z } from "zod";
import { makers } from "./makers";
import type { Publication } from "./contracts";

/**
 * Cultural context and honest impact (issue #48).
 *
 * HARD RULE: cultural context is written by the maker. No AI path writes it:
 * it is not part of an artwork patch, a proposal or a model reply (a test
 * checks this), and a field stays blank until a person fills it. Claiming a
 * tradition needs a source the maker names. Impact is counted from stored
 * records only, never from engagement or image similarity.
 */
export const cultureFields = ["place", "materials", "practice", "language", "tradition"] as const;
export type CultureField = (typeof cultureFields)[number];

export const cultureLabel: Record<CultureField, string> = {
  place: "Place",
  materials: "Materials",
  practice: "Practice",
  language: "Language",
  tradition: "Tradition",
};

const text = z.string().trim().min(1).max(300);

export const culturalContextSchema = z
  .object({
    place: text.optional(),
    materials: text.optional(),
    practice: text.optional(),
    language: text.optional(),
    tradition: text.optional(),
    /** Where the maker learned of the tradition, in their own words. Needed to name one. */
    source: z.string().trim().min(1).max(200).optional(),
  })
  .strict()
  .refine((c) => !c.tradition || Boolean(c.source), {
    message: "Name a source when you name a tradition.",
    path: ["source"],
  });
export type CulturalContext = z.infer<typeof culturalContextSchema>;

/** The rows to show, each "in the maker's words". Blank fields are simply absent. */
export function cultureRows(c: CulturalContext | undefined): { field: CultureField; label: string; value: string }[] {
  if (!c) return [];
  return cultureFields
    .filter((f) => c[f])
    .map((f) => ({ field: f, label: cultureLabel[f], value: c[f] as string }));
}

export const hasCulture = (c: CulturalContext | undefined) => cultureRows(c).length > 0;

/** Drops blank entries so an emptied form stores nothing at all. */
export function cleanCulture(input: Partial<Record<CultureField | "source", string>>): CulturalContext | undefined {
  const out: Record<string, string> = {};
  for (const key of [...cultureFields, "source"] as const) {
    const v = (input[key] ?? "").trim();
    if (v) out[key] = v;
  }
  return Object.keys(out).length ? (out as CulturalContext) : undefined;
}

export const IN_THEIR_WORDS = "In the maker’s words";
export const SENSITIVE_NOTE =
  "The maker marked this work as culturally sensitive and says they have the right to share it.";

export type ImpactSignals = {
  /** Published community works that credit this maker. */
  worksReferencing: number;
  /** Regions of sample makers credited in those works, this maker's own included. */
  regions: string[];
  /** Other makers credited alongside, counted once each. */
  makersAlongside: number;
  /** Always states what the numbers are and are not. */
  basis: string;
};

export const impactBasis =
  "Counted from published works that credit this maker. It is not a measure of reach, popularity or cultural value.";

const regionOf = new Map(makers.map((m) => [m.name, m.region]));

/** Honest signals for one maker, from stored publications. A zero stays a zero. */
export function impactSignals(publications: readonly Publication[], makerName: string): ImpactSignals {
  const crediting = publications.filter(
    (p) =>
      // The community list holds community posts only and does not repeat the audience.
      p.audience !== "private" &&
      [...(p.lineage ?? []).map((l) => l.creator), ...p.credits.map((c) => c.creator)].includes(makerName),
  );
  const creators = new Set<string>();
  for (const p of crediting)
    for (const name of [...(p.lineage ?? []).map((l) => l.creator), ...p.credits.map((c) => c.creator)])
      creators.add(name);
  const regions = new Set<string>();
  for (const name of creators) {
    const region = regionOf.get(name);
    if (region) regions.add(region);
  }
  creators.delete(makerName);
  return {
    worksReferencing: crediting.length,
    regions: [...regions].sort(),
    makersAlongside: creators.size,
    basis: impactBasis,
  };
}

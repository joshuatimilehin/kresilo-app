import { z } from "zod";
import {
  defineModel,
  isoTime,
  label,
  languageCode,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  slug,
  text,
  uuid,
} from "./common";
import { localeStringSchema } from "./locale-string";

export const version = "0.1.0";

export const makerRegions = [
  "east-asia",
  "south-asia",
  "southeast-asia",
  "central-asia",
  "west-asia",
  "africa",
  "europe",
  "north-america",
  "latin-america-caribbean",
  "oceania",
] as const;
export const respectDecisions = ["pending", "approved", "rejected"] as const;

/**
 * A maker whose work can be referenced. Observed: six fictional sample makers
 * are static data in src/creative/catalog.ts (Lagos, Accra, Sao Paulo, Kyoto,
 * Beirut, Lisbon); only three bios say they are fictional. Proposal: 18, each
 * with a required `sample: true`, a Sample practice badge, and a recorded
 * respect check (docs/cultural-context-and-respect-rules.md). A sample maker
 * can never be claimed by a real account, so `personId` must be absent.
 */
export const makerSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: uuid,
    slug,
    displayName: label,
    sample: z.boolean(),
    /** Set only for a real account's public maker profile; never for a sample. */
    personId: uuid.optional(),
    disciplines: z.array(text(40)).min(1).max(6),
    bio: localeStringSchema,
    places: z
      .array(
        z.object({ name: label, region: z.enum(makerRegions) }).strict(),
      )
      .min(1)
      .max(4),
    languages: z.array(languageCode).min(1).max(6),
    portrait: z
      .object({
        assetId: uuid,
        cutoutAssetId: uuid.optional(),
        altText: text(200),
      })
      .strict()
      .optional(),
    collective: z.object({ memberCount: z.number().int().min(2).max(12) }).strict().optional(),
    respectCheck: z
      .object({
        nameChecked: z.boolean(),
        likenessChecked: z.boolean(),
        decision: z.enum(respectDecisions),
        reviewerNote: text(300).optional(),
        reviewedAt: isoTime.optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((m, ctx) => {
    const bad = (message: string) => ctx.addIssue({ code: "custom", message });
    if (m.sample && m.personId) bad("A sample maker cannot be claimed by an account");
    if (!m.sample && !m.personId) bad("A real maker belongs to an account");
    if (m.sample) {
      if (!m.respectCheck) bad("A sample maker carries a respect check");
      else if (
        m.respectCheck.decision === "approved" &&
        !(m.respectCheck.nameChecked && m.respectCheck.likenessChecked)
      )
        bad("Approval needs the name and likeness checks");
    }
  });
export type Maker = z.infer<typeof makerSchema>;

export const model = defineModel({
  name: "Maker",
  version,
  status: "planned",
  issue: 38,
  storage: { kind: "new-table", location: "kresilo_demo.makers" },
  file: "src/models/maker.ts",
  schema: makerSchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    slug: "sample-maker",
    displayName: "Sample Maker",
    sample: true,
    disciplines: ["lettering"],
    bio: {
      schemaVersion: "0.1.0",
      language: "en",
      direction: "ltr",
      text: "A fictional sample practice.",
      source: "original",
    },
    places: [{ name: "Lisbon", region: "europe" }],
    languages: ["pt", "en"],
    respectCheck: {
      nameChecked: true,
      likenessChecked: true,
      decision: "approved",
      reviewedAt: sampleTime,
    },
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    slug: "Not A Slug",
    displayName: "Sample Maker",
    sample: true,
    personId: sampleIds.b,
    disciplines: [],
    bio: { language: "en", text: "x", source: "original" },
    places: [],
    languages: ["en"],
  },
});

import { z } from "zod";
import {
  defineModel,
  hexColor,
  isoTime,
  label,
  paragraph,
  schemaVersionFor,
  sentence,
  visibility,
} from "./common";

export const version = "0.1.0";

export const caseStudyKinds = [
  "brand-identity",
  "packaging",
  "campaign",
  "ui-ux",
  "presentation",
  "motion",
  "editorial",
  "spatial",
  "photography",
  "lettering",
] as const;

/** What the work is about. Generic themes only: no claim about a real community or tradition. */
export const caseStudyThemes = [
  "company",
  "brand",
  "culture",
  "identity",
  "empowerment",
  "education",
  "product",
  "place",
  "technology",
  "story",
] as const;

/** One visual section of the case study, in reading order. Each has a scene the page draws. */
export const panelKinds = [
  "hero",
  "wordmark-pattern",
  "logo",
  "palette",
  "type",
  "mockup",
  "series",
  "device",
  "slides",
  "motion",
  "quote",
  "process",
] as const;

export const aiHelpLevels = ["none", "assisted", "generated"] as const;

/**
 * A project told as a story, the way a portfolio page tells it: a brief, the
 * idea, the outcome, and visual panels in order. Not an asset library (see
 * LibraryAsset) and not a Kresilo working project. Bundled sample case studies
 * use readable slug ids; stored ones use uuids. The client is always invented
 * for sample makers.
 */
export const caseStudySchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: z.string().min(1).max(60),
    makerId: z.string().min(1).max(60),
    title: label,
    client: z.object({ name: label, what: sentence }).strict(),
    kind: z.enum(caseStudyKinds),
    themes: z.array(z.enum(caseStudyThemes)).min(1).max(3),
    tagline: sentence,
    role: label,
    year: z.number().int().min(2018).max(2030),
    palette: z.array(hexColor).min(3).max(6),
    story: z.object({ brief: paragraph, idea: paragraph, outcome: paragraph }).strict(),
    panels: z
      .array(
        z
          .object({
            kind: z.enum(panelKinds),
            caption: sentence.optional(),
            /** A mockup scene id when the panel shows the work on a product. */
            scene: z.string().min(1).max(40).optional(),
          })
          .strict(),
      )
      .min(3)
      .max(10),
    /** Library assets this project used, so a project can say what it is made from. */
    assetsUsed: z.array(z.string().min(1).max(60)).max(12),
    /** A premade template the project started from, if any. */
    templateId: z.string().min(1).max(60).optional(),
    /** Where AI helped, never hidden: none, assisted or generated. */
    aiHelp: z.enum(aiHelpLevels),
    process: sentence,
    sample: z.boolean(),
    visibility,
    updatedAt: isoTime,
  })
  .strict();
export type CaseStudyRecord = z.infer<typeof caseStudySchema>;

export const model = defineModel({
  name: "CaseStudy",
  version,
  status: "planned",
  issue: 37,
  storage: { kind: "new-table", location: "kresilo_demo.case_studies" },
  file: "src/models/case-study.ts",
  schema: caseStudySchema,
  example: {
    schemaVersion: "0.1.0",
    id: "tidewater-identity",
    makerId: "ren-sato",
    title: "Tidewater identity",
    client: { name: "Tidewater Co-op", what: "An invented harbour co-operative" },
    kind: "brand-identity",
    themes: ["company", "identity"],
    tagline: "A small mark that moves like water.",
    role: "Identity design",
    year: 2026,
    palette: ["#1d3a5f", "#e8d3b0", "#f4efe6"],
    story: {
      brief: "A new co-operative needed a mark that suits a stamp and a sign.",
      idea: "One circle, drawn many times, until the waterline appears.",
      outcome: "A mark, a palette and four applications.",
    },
    panels: [{ kind: "hero" }, { kind: "logo" }, { kind: "palette" }],
    assetsUsed: [],
    aiHelp: "none",
    process: "Drawn by hand, then cleaned up in vector.",
    sample: true,
    visibility: "community",
    updatedAt: "2026-10-22T09:00:00.000Z",
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: "x",
    makerId: "ren-sato",
    title: "",
    kind: "tattoo",
    palette: ["red"],
    panels: [],
    aiHelp: "maybe",
  },
});

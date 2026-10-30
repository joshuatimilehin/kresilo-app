import { z } from "zod";
import {
  defineModel,
  hexColor,
  isoTime,
  label,
  schemaVersionFor,
  sentence,
} from "./common";

export const version = "0.2.0";

export const brandTemplateKinds = [
  "brand-board",
  "logo-presentation",
  "packaging-set",
  "stationery",
  "social-kit",
  "deck",
  "motion-sting",
  "ui-kit",
  "cover-art",
  "poster",
] as const;

/** What a person puts into a template slot. */
export const slotKinds = ["logo", "wordmark", "colour", "image", "text"] as const;

/** Where a template came from. Anything not original needs a licence check before it ships. */
export const templateSources = ["kresilo-original", "open-design"] as const;

/**
 * A premade starting point for branding work: a brand board, a logo shown on
 * products, a packaging set, a deck or a short logo animation. The person
 * fills the slots (logo, colours, words) and the template draws the rest, so
 * the result keeps its authorship record. Original templates are drawn by
 * Kresilo; templates from Open Design are listed only after a per-package
 * licence and trademark check (docs/open-design-spike.md).
 */
export const brandTemplateSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: z.string().min(1).max(60),
    name: label,
    kind: z.enum(brandTemplateKinds),
    description: sentence,
    slots: z
      .array(z.object({ id: z.string().min(1).max(30), label, kind: z.enum(slotKinds) }).strict())
      .min(1)
      .max(10),
    /** Mockup scenes the template draws the logo on. */
    scenes: z.array(z.string().min(1).max(40)).max(12),
    palette: z.array(hexColor).min(3).max(6),
    outputs: z.array(z.enum(["png", "pdf", "mp4", "html"])).min(1).max(4),
    howToUse: z.array(sentence).min(2).max(6),
    source: z.enum(templateSources),
    /** True only after a person checked the licence and any real-brand naming. */
    licenceChecked: z.boolean(),
    updatedAt: isoTime,
  })
  .strict()
  .refine((t) => t.source === "kresilo-original" || t.licenceChecked, "A template that is not original needs its licence checked");
export type BrandTemplateRecord = z.infer<typeof brandTemplateSchema>;

export const model = defineModel({
  name: "BrandTemplate",
  version,
  status: "planned",
  issue: 47,
  storage: { kind: "new-table", location: "kresilo_demo.brand_templates" },
  file: "src/models/brand-template.ts",
  schema: brandTemplateSchema,
  example: {
    schemaVersion: "0.2.0",
    id: "logo-on-products",
    name: "Logo on products",
    kind: "logo-presentation",
    description: "Shows a logo on a tote, a cup, a card and a sign.",
    slots: [{ id: "logo", label: "Your logo", kind: "logo" }],
    scenes: ["tote", "cup", "card", "sign"],
    palette: ["#1d3a5f", "#e8d3b0", "#f4efe6"],
    outputs: ["png", "pdf"],
    howToUse: ["Add your logo.", "Choose the products to show."],
    source: "kresilo-original",
    licenceChecked: true,
    updatedAt: "2026-10-22T09:00:00.000Z",
  },
  invalidExample: {
    schemaVersion: "0.2.0",
    id: "x",
    name: "",
    kind: "poster",
    slots: [],
    source: "open-design",
    licenceChecked: false,
  },
});

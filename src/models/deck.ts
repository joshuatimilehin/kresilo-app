import { z } from "zod";
import {
  defineModel,
  isoTime,
  label,
  origin,
  recordRef,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  text,
  uuid,
} from "./common";

export const version = "0.1.0";

export const slideLayouts = [
  "title",
  "image",
  "quote",
  "reference",
  "decision",
  "before-after",
  "credits",
] as const;
export const animationPresets = ["none", "fade", "rise", "slide", "cut"] as const;
export const deckStatuses = ["draft", "proposed", "approved"] as const;
/** Untested as of October 22, 2026 (docs/open-design-spike.md); listed so the shape is ready. */
export const deckExports = ["html", "pptx", "pdf", "mp4"] as const;

export const deckSlideSchema = z
  .object({
    id: uuid,
    order: z.number().int().min(0).max(29),
    layout: z.enum(slideLayouts),
    headline: text(120),
    body: text(600).optional(),
    assetId: uuid.optional(),
    record: recordRef.optional(),
    animation: z
      .object({
        preset: z.enum(animationPresets),
        seconds: z.number().min(0.2).max(3),
      })
      .strict(),
    /** Who made this slide; AI-made slides must point at an authorship event. */
    origin,
    authorshipEventId: uuid.optional(),
  })
  .strict()
  .refine(
    (s) => s.origin === "hand" || Boolean(s.authorshipEventId),
    "AI-made slides point at an authorship event",
  );

/**
 * A branded slide deck with animation (#47). Slides follow the project's
 * StyleGuide; the Copilot may draft them as a proposal, never write them
 * directly. `styleCheck` records the result of the guide's checks.
 */
export const deckSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: uuid,
    projectId: uuid,
    styleGuideId: uuid.optional(),
    title: label,
    status: z.enum(deckStatuses),
    slides: z.array(deckSlideSchema).min(1).max(30),
    styleCheck: z
      .object({
        passed: z.boolean(),
        flags: z.array(text(160)).max(10),
        checkedAt: isoTime,
      })
      .strict()
      .optional(),
    exports: z.array(z.enum(deckExports)).max(4),
    updatedAt: isoTime,
  })
  .strict()
  .superRefine((d, ctx) => {
    const orders = d.slides.map((s) => s.order);
    if (new Set(orders).size !== orders.length)
      ctx.addIssue({ code: "custom", message: "Slide order must be unique" });
    if (d.status === "approved" && d.styleGuideId && !d.styleCheck)
      ctx.addIssue({ code: "custom", message: "Approval needs a style check" });
  });
export type Deck = z.infer<typeof deckSchema>;

export const model = defineModel({
  name: "Deck",
  version,
  status: "planned",
  issue: 47,
  storage: { kind: "new-table", location: "kresilo_demo.decks (slides as jsonb)" },
  file: "src/models/deck.ts",
  schema: deckSchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    projectId: sampleIds.b,
    styleGuideId: sampleIds.c,
    title: "Evening study, in six slides",
    status: "draft",
    slides: [
      {
        id: sampleIds.d,
        order: 0,
        layout: "title",
        headline: "Evening study",
        animation: { preset: "fade", seconds: 0.6 },
        origin: "hand",
      },
    ],
    exports: ["html"],
    updatedAt: sampleTime,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    projectId: sampleIds.b,
    title: "x",
    status: "approved",
    slides: [
      {
        id: sampleIds.d,
        order: 0,
        layout: "title",
        headline: "Evening study",
        animation: { preset: "spin", seconds: 30 },
        origin: "ai-generated",
      },
    ],
    exports: ["keynote"],
    updatedAt: sampleTime,
  },
});

import { z } from "zod";
import {
  defineModel,
  isoTime,
  recordRef,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  uuid,
  visibility,
} from "./common";
import { localeStringSchema } from "./locale-string";

export const version = "0.1.0";

export const storyKinds = ["process", "daily"] as const;
export const slideKinds = [
  "cover",
  "person",
  "goal",
  "reference",
  "decision",
  "before-after",
  "authorship",
  "credits",
  "custom",
] as const;

/**
 * One slide. A slide shows a stored record (`record`) or text the maker wrote
 * and the page labels as theirs (`text`); with neither it is not shown.
 */
export const storySlideSchema = z
  .object({
    id: uuid,
    order: z.number().int().min(0).max(11),
    kind: z.enum(slideKinds),
    record: recordRef.optional(),
    text: localeStringSchema.optional(),
  })
  .strict()
  .refine((s) => Boolean(s.record) || Boolean(s.text), "A slide needs a record or text");

/**
 * A maker's or project's story, built as a view over stored records rather
 * than written separately (docs/designer-story-spec.md). Observed: the live
 * /stories/ayo-bello is a hard-coded three-slide sample, not generated from a
 * project. `kind` keeps the open owner decision visible: permanent process
 * story, a short daily layer, or both.
 */
export const storySchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: uuid,
    kind: z.enum(storyKinds),
    makerId: uuid.optional(),
    projectId: uuid.optional(),
    title: localeStringSchema,
    slides: z.array(storySlideSchema).min(1).max(12),
    sample: z.boolean(),
    visibility,
    createdAt: isoTime,
  })
  .strict()
  .superRefine((s, ctx) => {
    const bad = (message: string) => ctx.addIssue({ code: "custom", message });
    if (!s.makerId && !s.projectId) bad("A story belongs to a maker or a project");
    const orders = s.slides.map((x) => x.order);
    if (new Set(orders).size !== orders.length) bad("Slide order must be unique");
    // The authorship strip cannot be left out of a published story.
    if (s.visibility === "community" && !s.slides.some((x) => x.kind === "authorship"))
      bad("A published story includes the authorship slide");
  });
export type Story = z.infer<typeof storySchema>;

export const model = defineModel({
  name: "Story",
  version,
  status: "planned",
  issue: 37,
  storage: { kind: "new-table", location: "kresilo_demo.stories (slides as jsonb)" },
  file: "src/models/story.ts",
  schema: storySchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    kind: "process",
    makerId: sampleIds.b,
    title: {
      schemaVersion: "0.1.0",
      language: "en",
      direction: "ltr",
      text: "Behind the reference",
      source: "original",
    },
    slides: [
      { id: sampleIds.c, order: 0, kind: "goal", record: { kind: "decision", id: sampleIds.d } },
    ],
    sample: true,
    visibility: "private",
    createdAt: sampleTime,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    kind: "weekly",
    title: { language: "en", text: "x", source: "original" },
    slides: [],
    sample: true,
    visibility: "community",
    createdAt: sampleTime,
  },
});

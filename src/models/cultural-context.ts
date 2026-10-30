import { z } from "zod";
import {
  defineModel,
  httpsUrl,
  isoTime,
  label,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  uuid,
  visibility,
} from "./common";
import { localeStringSchema } from "./locale-string";

export const version = "0.1.0";

export const contextTopics = [
  "place",
  "materials",
  "practice",
  "language",
  "tradition",
] as const;
export const contextSubjects = ["work", "story", "maker"] as const;

/**
 * Optional context a maker writes about their own work. The rules
 * (docs/cultural-context-and-respect-rules.md) are in the shape:
 *  - `authoredBy` is the literal "maker" and `aiDrafted` the literal false, so
 *    the Copilot cannot be recorded as the author of a cultural claim;
 *  - a machine translation is never published until a person has reviewed it;
 *  - a named tradition is credited by linking the maker's own description, not
 *    an AI summary.
 * Observed today: the Culture layer is wording only; no such record exists.
 */
export const culturalContextSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: uuid,
    subject: z
      .object({ kind: z.enum(contextSubjects), id: z.string().min(1).max(60) })
      .strict(),
    authoredBy: z.literal("maker"),
    makerId: uuid.optional(),
    personId: uuid.optional(),
    aiDrafted: z.literal(false),
    entries: z
      .array(
        z
          .object({
            topic: z.enum(contextTopics),
            text: localeStringSchema,
            tradition: z
              .object({ name: label, ownDescriptionUrl: httpsUrl.optional() })
              .strict()
              .optional(),
          })
          .strict(),
      )
      .min(1)
      .max(5),
    sample: z.boolean(),
    visibility,
    updatedAt: isoTime,
  })
  .strict()
  .superRefine((c, ctx) => {
    const bad = (message: string) => ctx.addIssue({ code: "custom", message });
    if (Boolean(c.makerId) === Boolean(c.personId)) bad("Choose one author");
    if (c.visibility === "community") {
      for (const e of c.entries) {
        if (e.text.source === "machine-translation" && !e.text.reviewedBy)
          bad("A machine translation needs a person's review before it is public");
      }
    }
  });
export type CulturalContext = z.infer<typeof culturalContextSchema>;

export const model = defineModel({
  name: "CulturalContext",
  version,
  status: "planned",
  issue: 48,
  storage: { kind: "new-table", location: "kresilo_demo.cultural_contexts" },
  file: "src/models/cultural-context.ts",
  schema: culturalContextSchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    subject: { kind: "work", id: sampleIds.b },
    authoredBy: "maker",
    makerId: sampleIds.c,
    aiDrafted: false,
    entries: [
      {
        topic: "materials",
        text: {
          schemaVersion: "0.1.0",
          language: "en",
          direction: "ltr",
          text: "Printed with soy ink on recycled card.",
          source: "original",
        },
      },
    ],
    sample: true,
    visibility: "private",
    updatedAt: sampleTime,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    subject: { kind: "work", id: sampleIds.b },
    authoredBy: "copilot",
    makerId: sampleIds.c,
    aiDrafted: true,
    entries: [],
    sample: true,
    visibility: "community",
    updatedAt: sampleTime,
  },
});

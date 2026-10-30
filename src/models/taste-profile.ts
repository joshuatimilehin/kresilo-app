import { z } from "zod";
import {
  defineModel,
  isoTime,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  text,
  uuid,
} from "./common";

export const version = "0.1.0";

export const tasteSignalKinds = [
  "liked-reference",
  "kept-direction",
  "declined-direction",
  "style-word",
] as const;

/**
 * What the Copilot has learned about one artist's taste, from declined and
 * kept directions. Always private, visible to its owner, editable and
 * erasable (principle 2 in docs/people-first-plan.md). It never leaves the
 * server, is never shown on a published page and is never used across people.
 * Observed today: Person.taste is a plain list of words (<= 12) the artist
 * types in; nothing learns from declines.
 */
export const tasteProfileSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    personId: uuid,
    /** The artist can switch learning off; signals are then neither read nor added. */
    learning: z.boolean(),
    signals: z
      .array(
        z
          .object({
            id: uuid,
            kind: z.enum(tasteSignalKinds),
            label: text(60),
            weight: z.number().int().min(-3).max(3),
            /** The authorship event or proposal this came from, so the artist can see why. */
            sourceEventId: uuid.optional(),
            at: isoTime,
          })
          .strict(),
      )
      .max(200),
    visibility: z.literal("private"),
    updatedAt: isoTime,
  })
  .strict()
  .refine(
    (p) => new Set(p.signals.map((s) => s.id)).size === p.signals.length,
    "Signal ids must be unique",
  );
export type TasteProfile = z.infer<typeof tasteProfileSchema>;

export const model = defineModel({
  name: "TasteProfile",
  version,
  status: "planned",
  issue: 51,
  storage: { kind: "new-table", location: "kresilo_demo.taste_profiles" },
  file: "src/models/taste-profile.ts",
  schema: tasteProfileSchema,
  example: {
    schemaVersion: "0.1.0",
    personId: sampleIds.a,
    learning: true,
    signals: [
      {
        id: sampleIds.b,
        kind: "declined-direction",
        label: "glossy gradients",
        weight: -2,
        at: sampleTime,
      },
    ],
    visibility: "private",
    updatedAt: sampleTime,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    personId: sampleIds.a,
    learning: true,
    signals: [],
    visibility: "community",
    updatedAt: sampleTime,
  },
});

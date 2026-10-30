import { z } from "zod";
import {
  defineModel,
  httpsUrl,
  isoTime,
  label,
  paragraph,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  sentence,
  uuid,
  visibility,
} from "./common";

export const version = "0.1.0";

/**
 * A curated set of works with sources, for example "Salt and light". No score
 * and no ranking: only things that can be counted from stored records
 * (docs/cultural-context-and-respect-rules.md, honest impact signals).
 */
export const collectionSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: uuid,
    curatorId: uuid,
    title: label,
    description: paragraph.optional(),
    items: z
      .array(
        z
          .object({
            workId: z.string().min(1).max(60),
            note: sentence.optional(),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    /** A curated collection cites where its choices came from. */
    sources: z
      .array(z.object({ title: label, url: httpsUrl.optional() }).strict())
      .min(1)
      .max(10),
    sample: z.boolean(),
    visibility,
    updatedAt: isoTime,
  })
  .strict()
  .refine(
    (c) => new Set(c.items.map((i) => i.workId)).size === c.items.length,
    "A work appears once",
  );
export type Collection = z.infer<typeof collectionSchema>;

export const model = defineModel({
  name: "Collection",
  version,
  status: "planned",
  issue: 48,
  storage: { kind: "new-table", location: "kresilo_demo.collections" },
  file: "src/models/collection.ts",
  schema: collectionSchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    curatorId: sampleIds.b,
    title: "Salt and light",
    items: [{ workId: "after-light" }, { workId: "mineral" }],
    sources: [{ title: "Curator notes" }],
    sample: true,
    visibility: "private",
    updatedAt: sampleTime,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    curatorId: sampleIds.b,
    title: "Salt and light",
    items: [{ workId: "mineral" }, { workId: "mineral" }],
    sources: [],
    sample: true,
    visibility: "private",
    updatedAt: sampleTime,
  },
});

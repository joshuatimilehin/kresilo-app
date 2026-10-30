import { z } from "zod";
import {
  defineModel,
  isoTime,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  text,
  uuid,
  visibility,
} from "./common";

export const version = "0.1.0";

/**
 * A vertical motion loop on a maker's profile, not tied to a daily rule. It is
 * an exported render of a project's motion (observed: motion jobs produce an
 * mp4 media row, kresilo_demo.creative_motion_jobs.media_id). Seconds follow
 * the live motion.configure bounds (2 to 12).
 */
export const shortSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: uuid,
    makerId: uuid.optional(),
    personId: uuid.optional(),
    projectId: uuid.optional(),
    assetId: uuid,
    posterAssetId: uuid.optional(),
    seconds: z.number().int().min(2).max(12),
    loop: z.boolean(),
    caption: text(140).optional(),
    sample: z.boolean(),
    visibility,
    createdAt: isoTime,
  })
  .strict()
  .refine((s) => Boolean(s.makerId) !== Boolean(s.personId), "Choose one owner");
export type Short = z.infer<typeof shortSchema>;

export const model = defineModel({
  name: "Short",
  version,
  status: "planned",
  issue: 37,
  storage: { kind: "new-table", location: "kresilo_demo.shorts" },
  file: "src/models/short.ts",
  schema: shortSchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    makerId: sampleIds.b,
    assetId: sampleIds.c,
    seconds: 6,
    loop: true,
    sample: true,
    visibility: "private",
    createdAt: sampleTime,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    makerId: sampleIds.b,
    personId: sampleIds.c,
    assetId: sampleIds.d,
    seconds: 90,
    loop: true,
    sample: false,
    visibility: "private",
    createdAt: sampleTime,
  },
});

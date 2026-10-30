import { z } from "zod";
import {
  defineModel,
  isoTime,
  paragraph,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  uuid,
  visibility,
} from "./common";

export const version = "0.1.0";

export const lineageKinds = [
  "kept-reference",
  "carried-reference",
  "used-asset",
] as const;

/**
 * "This work was made from that work." Built only from stored records (a kept
 * reference with its reason), never from image similarity. A private project
 * never appears in another work's "Used in".
 */
export const lineageEdgeSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: uuid,
    /** The source work: a catalog work id (observed: Reference.workId) or a publication id. */
    fromWorkId: z.string().min(1).max(60),
    fromSample: z.boolean(),
    toProjectId: uuid,
    toSample: z.boolean(),
    referenceId: uuid.optional(),
    assetId: uuid.optional(),
    kind: z.enum(lineageKinds),
    /** The designer's own reason, as already stored on the reference. */
    reason: paragraph,
    /** Follows the target project's publication; private by default. */
    visibility,
    createdAt: isoTime,
  })
  .strict()
  .superRefine((e, ctx) => {
    if (e.fromSample !== e.toSample)
      ctx.addIssue({
        code: "custom",
        message: "Sample lineage links sample works only",
      });
    if (e.kind === "used-asset" && !e.assetId)
      ctx.addIssue({ code: "custom", message: "used-asset needs assetId" });
    if (e.kind !== "used-asset" && !e.referenceId)
      ctx.addIssue({ code: "custom", message: "A reference edge needs referenceId" });
  });
export type LineageEdge = z.infer<typeof lineageEdgeSchema>;

export const model = defineModel({
  name: "LineageEdge",
  version,
  status: "planned",
  issue: 39,
  storage: { kind: "new-table", location: "kresilo_demo.lineage_edges" },
  file: "src/models/lineage-edge.ts",
  schema: lineageEdgeSchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    fromWorkId: "after-light",
    fromSample: true,
    toProjectId: sampleIds.b,
    toSample: true,
    referenceId: sampleIds.c,
    kind: "kept-reference",
    reason: "The low sun on salt is the colour I want.",
    visibility: "private",
    createdAt: sampleTime,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    fromWorkId: "after-light",
    fromSample: true,
    toProjectId: sampleIds.b,
    toSample: false,
    kind: "kept-reference",
    reason: "x",
    visibility: "private",
    createdAt: sampleTime,
  },
});

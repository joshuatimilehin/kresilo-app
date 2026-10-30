import { z } from "zod";
import {
  defineModel,
  hex64,
  httpsUrl,
  isoTime,
  label,
  sampleHash,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  uuid,
  visibility,
} from "./common";

export const version = "0.1.0";

/** Same closed list as the live media.import command (src/creative/contracts.ts). */
export const assetContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
] as const;
export const assetRights = [
  "own-work",
  "licensed",
  "permission-given",
  "public-domain",
  "unknown",
] as const;
export const assetSourceKinds = [
  "upload",
  "import",
  "generated",
  "sample",
  "export",
] as const;
export const assetStorageKinds = [
  "database-base64",
  "object-storage",
  "bundled",
] as const;

/**
 * An image or video stored once, identified by the SHA-256 of its bytes. The
 * same bytes uploaded twice, or reused in two projects, is one Asset with many
 * references. Today (observed) media is a base64 row per project in
 * kresilo_demo.creative_media with no hash.
 */
export const assetSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: uuid,
    contentHash: hex64,
    contentType: z.enum(assetContentTypes),
    byteLength: z.number().int().min(1).max(25_000_000),
    width: z.number().int().min(1).max(20000).optional(),
    height: z.number().int().min(1).max(20000).optional(),
    name: label,
    ownerId: uuid,
    source: z
      .object({
        kind: z.enum(assetSourceKinds),
        creator: label.optional(),
        sourceUrl: httpsUrl.optional(),
        right: z.enum(assetRights),
        /** Required for generated media: the tool or model that made it. */
        tool: label.optional(),
        model: label.optional(),
      })
      .strict(),
    storage: z
      .object({ kind: z.enum(assetStorageKinds), key: z.string().max(200).optional() })
      .strict(),
    /** Set when this asset was made by editing another (crop export, render). */
    derivedFrom: uuid.optional(),
    visibility,
    /** False when the right is unknown: fail closed, never published. */
    publishable: z.boolean(),
    firstSeenAt: isoTime,
  })
  .strict()
  .superRefine((a, ctx) => {
    if (a.source.right === "unknown" && a.publishable)
      ctx.addIssue({ code: "custom", message: "Unknown right means not publishable" });
    if (a.source.kind === "generated" && !a.source.tool)
      ctx.addIssue({ code: "custom", message: "Generated media names its tool" });
    if (a.storage.kind === "object-storage" && !a.storage.key)
      ctx.addIssue({ code: "custom", message: "Object storage needs a key" });
  });
export type Asset = z.infer<typeof assetSchema>;

export const model = defineModel({
  name: "Asset",
  version,
  status: "planned",
  issue: 39,
  storage: { kind: "new-table", location: "kresilo_demo.assets" },
  file: "src/models/asset.ts",
  schema: assetSchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    contentHash: sampleHash,
    contentType: "image/png",
    byteLength: 520000,
    name: "salt-flats.png",
    ownerId: sampleIds.b,
    source: { kind: "upload", right: "own-work" },
    storage: { kind: "database-base64" },
    visibility: "private",
    publishable: true,
    firstSeenAt: sampleTime,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    contentHash: "not-a-hash",
    contentType: "image/gif",
    byteLength: 0,
    name: "x",
    ownerId: sampleIds.b,
    source: { kind: "import", right: "unknown" },
    storage: { kind: "object-storage" },
    visibility: "private",
    publishable: true,
    firstSeenAt: sampleTime,
  },
});

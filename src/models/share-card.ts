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

export const shareFields = [
  "title",
  "art",
  "creator",
  "credits",
  "authorship-strip",
] as const;
export const shareKinds = ["link", "preview-image", "embed"] as const;

/**
 * What leaves Kresilo when someone shares a published page: a link, a preview
 * image and an embed. Observed: the preview offers Copy link only (PublishedPage
 * in src/creative/Editor.tsx). `includes` is a closed list of fields, so a
 * private reason, prompt or comment cannot ride along in a card. The
 * authorship strip cannot be left out (docs/designer-story-spec.md).
 */
export const shareCardSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: uuid,
    publicationId: uuid,
    kind: z.enum(shareKinds),
    title: text(70),
    description: text(200).optional(),
    imageAssetId: uuid.optional(),
    altText: text(200).optional(),
    includes: z.array(z.enum(shareFields)).min(1).max(5),
    audience: visibility,
    createdAt: isoTime,
  })
  .strict()
  .superRefine((c, ctx) => {
    const bad = (message: string) => ctx.addIssue({ code: "custom", message });
    if (!c.includes.includes("authorship-strip"))
      bad("A share card always includes the authorship strip");
    if (new Set(c.includes).size !== c.includes.length) bad("Fields are listed once");
    if (c.kind === "preview-image" && !(c.imageAssetId && c.altText))
      bad("A preview image has an asset and alt text");
    if (c.kind !== "link" && c.audience === "private")
      bad("Only a link can be shared from a private publication");
  });
export type ShareCard = z.infer<typeof shareCardSchema>;

export const model = defineModel({
  name: "ShareCard",
  version,
  status: "planned",
  issue: 43,
  storage: { kind: "publication-document", location: "Publication.shareCards[]" },
  file: "src/models/share-card.ts",
  schema: shareCardSchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    publicationId: sampleIds.b,
    kind: "link",
    title: "Evening study",
    includes: ["title", "art", "authorship-strip"],
    audience: "private",
    createdAt: sampleTime,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    publicationId: sampleIds.b,
    kind: "embed",
    title: "Evening study",
    includes: ["title", "art"],
    audience: "private",
    createdAt: sampleTime,
  },
});

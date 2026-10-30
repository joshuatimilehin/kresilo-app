import { z } from "zod";
import {
  defineModel,
  hexColor,
  isoTime,
  label,
  paragraph,
  schemaVersionFor,
  sentence,
  visibility,
} from "./common";

export const version = "0.1.0";

export const libraryAssetTypes = [
  "texture",
  "pattern",
  "icon-set",
  "type-specimen",
  "palette",
  "template-pack",
  "photo-pack",
  "motion-pack",
  "mockup-pack",
  "sticker-pack",
] as const;

export const libraryFormats = ["svg", "png", "jpg", "webp", "mp4", "pdf", "otf", "html"] as const;

/** Who may use an asset, said plainly. A person always chooses; nothing is shared by default. */
export const sharingModes = ["free", "free-with-credit", "on-request", "not-shared"] as const;

/**
 * A reusable set a maker has made, such as textures, icons or a type specimen.
 * It is different from a case study (a project told as a story) and from a
 * single work: people use library assets inside their own projects. It states
 * how it is shared and how to use it, and which case studies it appears in.
 */
export const libraryAssetSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: z.string().min(1).max(60),
    makerId: z.string().min(1).max(60),
    name: label,
    type: z.enum(libraryAssetTypes),
    description: paragraph,
    count: z.number().int().min(1).max(2000),
    formats: z.array(z.enum(libraryFormats)).min(1).max(6),
    tags: z.array(z.string().min(1).max(30)).max(8),
    /** The recipe the page uses to draw the cover: a colour set and a motif. */
    preview: z.object({ palette: z.array(hexColor).min(2).max(5), motif: z.string().min(1).max(30) }).strict(),
    sharing: z
      .object({
        mode: z.enum(sharingModes),
        terms: sentence,
        requiresCredit: z.boolean(),
        commercialUse: z.boolean(),
      })
      .strict(),
    /** Plain steps for using it in a project. */
    howToUse: z.array(sentence).min(2).max(6),
    /** Case studies that use it. */
    usedIn: z.array(z.string().min(1).max(60)).max(20),
    sample: z.boolean(),
    visibility,
    updatedAt: isoTime,
  })
  .strict()
  .refine(
    (a) => a.sharing.mode !== "not-shared" || (!a.sharing.commercialUse && !a.sharing.requiresCredit),
    "An asset that is not shared cannot grant use or ask for credit",
  );
export type LibraryAssetRecord = z.infer<typeof libraryAssetSchema>;

export const model = defineModel({
  name: "LibraryAsset",
  version,
  status: "planned",
  issue: 37,
  storage: { kind: "new-table", location: "kresilo_demo.library_assets" },
  file: "src/models/library-asset.ts",
  schema: libraryAssetSchema,
  example: {
    schemaVersion: "0.1.0",
    id: "salt-grain-textures",
    makerId: "hana-zerrouki",
    name: "Salt grain textures",
    type: "texture",
    description: "Twenty-four soft grain textures for backgrounds and overlays.",
    count: 24,
    formats: ["png", "webp"],
    tags: ["grain", "background"],
    preview: { palette: ["#e8e1d4", "#c9bfae"], motif: "grain" },
    sharing: {
      mode: "free-with-credit",
      terms: "Free to use, including in client work, with a credit line.",
      requiresCredit: true,
      commercialUse: true,
    },
    howToUse: ["Place the texture on its own layer.", "Set the blend to multiply or overlay."],
    usedIn: ["tidewater-identity"],
    sample: true,
    visibility: "community",
    updatedAt: "2026-10-22T09:00:00.000Z",
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: "x",
    makerId: "y",
    name: "",
    type: "sound",
    count: 0,
    sharing: { mode: "not-shared", terms: "x", requiresCredit: true, commercialUse: true },
  },
});

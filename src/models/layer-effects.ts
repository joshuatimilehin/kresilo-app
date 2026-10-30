import { z } from "zod";
import {
  defineModel,
  sampleIds,
  schemaVersionFor,
  uuid,
} from "./common";

export const version = "1.0.0";

export const effectBlendModes = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "soft-light",
  "hard-light",
  "difference",
] as const;
export const effectShadows = ["none", "soft", "hard"] as const;
export const effectMaskShapes = ["none", "ellipse", "rounded", "brush"] as const;

const edge = z.number().min(0).max(80);

/**
 * Non-destructive layer effects, LIVE on origin/main (commit 8bba7d9, #54):
 * the same bounds as `layerEffects` in src/creative/contracts.ts, which stays
 * the source of truth. This copy exists so the registry documents the shape
 * and a test (tests/models-registry.test.ts) fails if the two drift apart.
 * Not imported by the app.
 */
export const layerEffectsSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    layerId: uuid,
    crop: z
      .object({ top: edge, right: edge, bottom: edge, left: edge })
      .strict()
      .refine(
        (c) => c.top + c.bottom <= 90 && c.left + c.right <= 90,
        "Crop must leave part of the image visible",
      )
      .optional(),
    mask: z
      .object({
        shape: z.enum(effectMaskShapes),
        feather: z.number().min(0).max(40),
        invert: z.boolean(),
        /** Brush strokes, in percent of the layer; painted areas show (or hide, when inverted). */
        strokes: z
          .array(
            z
              .object({
                size: z.number().min(1).max(40),
                points: z.array(z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)])).min(1).max(200),
              })
              .strict(),
          )
          .max(40)
          .optional(),
      })
      .strict()
      .optional(),
    shadow: z.enum(effectShadows).optional(),
    blend: z.enum(effectBlendModes).optional(),
    flipX: z.boolean().optional(),
    flipY: z.boolean().optional(),
    adjust: z
      .object({
        brightness: z.number().min(0).max(2),
        contrast: z.number().min(0).max(2),
        saturation: z.number().min(0).max(2),
        blur: z.number().min(0).max(20),
      })
      .strict()
      .optional(),
  })
  .strict();
export type LayerEffects = z.infer<typeof layerEffectsSchema>;

export const model = defineModel({
  name: "LayerEffects",
  version,
  status: "live",
  issue: 53,
  storage: {
    kind: "project-document",
    location: "Project.art.layers[] (crop, mask, shadow, blend, flipX, flipY, adjust)",
  },
  file: "src/models/layer-effects.ts",
  schema: layerEffectsSchema,
  example: {
    schemaVersion: "1.0.0",
    layerId: sampleIds.a,
    crop: { top: 5, right: 5, bottom: 5, left: 5 },
    mask: { shape: "ellipse", feather: 8, invert: false },
    shadow: "soft",
    blend: "multiply",
    flipX: true,
  },
  invalidExample: {
    schemaVersion: "1.0.0",
    layerId: sampleIds.a,
    crop: { top: 60, right: 0, bottom: 60, left: 0 },
    blend: "burn",
  },
});

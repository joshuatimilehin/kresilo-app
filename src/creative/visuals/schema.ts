import { z } from "zod";

/**
 * What a layer stores about a visual: which picture and the colours it was
 * given. A ground colour makes it a duotone; without one it is one-colour ink.
 * Only hex and a short id, so nothing stored can become markup or CSS.
 */
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
export const visualIdPattern = /^[a-z0-9-]{1,60}$/;

export const visualRefSchema = z
  .object({
    id: z.string().regex(visualIdPattern),
    ink: hex,
    ground: hex.optional(),
  })
  .strict();
export type VisualRef = z.infer<typeof visualRefSchema>;

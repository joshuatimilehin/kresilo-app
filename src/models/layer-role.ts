import { z } from "zod";
import {
  defineModel,
  sampleIds,
  schemaVersionFor,
  uuid,
} from "./common";

export const version = "0.1.0";

/** Same closed list as `layerRoles` on branch claude/smart-layer-names. */
export const layerRoleNames = [
  "background",
  "subject",
  "texture",
  "type",
  "ornament",
  "overlay",
  "shape",
  "other",
] as const;

/**
 * What a layer is for, and whether AI may touch it. Both fields are optional
 * additions to a layer, so layers saved before they existed still parse.
 *
 * Observed: `role` (commit c23dfbe) and `aiLock` (commit e3869ef) exist on
 * branch claude/smart-layer-names, and `aiLock` also on claude/ai-auto-apply;
 * they are NOT on origin/main (8bba7d9) at the time of writing. `aiLock` is deliberately absent
 * from the layer-adjustment command a proposal can use, so only a person's own
 * edit can set or clear it. Flip this model to "live" and bump to 1.0.0 when
 * the branch merges.
 */
export const layerRoleSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    layerId: uuid,
    role: z.enum(layerRoleNames).optional(),
    aiLock: z.boolean().optional(),
  })
  .strict();
export type LayerRole = z.infer<typeof layerRoleSchema>;

export const model = defineModel({
  name: "LayerRole",
  version,
  status: "planned",
  issue: 53,
  storage: { kind: "project-document", location: "Project.art.layers[].role and .aiLock" },
  file: "src/models/layer-role.ts",
  schema: layerRoleSchema,
  example: {
    schemaVersion: "0.1.0",
    layerId: sampleIds.a,
    role: "subject",
    aiLock: true,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    layerId: "not-a-uuid",
    role: "logo-stamp",
    aiLock: "yes",
  },
});

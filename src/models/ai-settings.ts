import { z } from "zod";
import { authorshipSteps } from "./authorship-event";
import {
  defineModel,
  isoTime,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  uuid,
} from "./common";

export const version = "0.1.0";

export const aiLevels = ["off", "suggest", "assist", "generate"] as const;
export const aiApplyModes = ["ask", "auto"] as const;
export const slopChecks = [
  "generic-gradient",
  "over-smooth",
  "stock-composition",
  "mismatched-type",
  "no-point-of-view",
] as const;

/**
 * How much AI may do on one project, set by the artist. Layer locks are a
 * separate, per-layer field (`aiLock`, see LayerRole) and cannot be set by AI.
 *
 * Live pieces (observed on branch claude/ai-auto-apply, not on origin/main
 * 8bba7d9): `Project.aiApply` = "ask" | "auto" and the `project.ai` command.
 * The level and per-step settings are proposed (#51).
 */
export const aiSettingsSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    projectId: uuid,
    /** Live field name on the branch: aiApply. "auto" applies a proposal at once, with undo. */
    apply: z.enum(aiApplyModes),
    level: z.enum(aiLevels),
    /** Overrides for single steps, for example { motion: "off" }. */
    perStep: z.record(z.enum(authorshipSteps), z.enum(aiLevels)),
    /** Screens proposals before the artist sees them. Not claimed slop-free until measured. */
    rubric: z
      .object({
        enabled: z.boolean(),
        checks: z.array(z.enum(slopChecks)).max(5),
      })
      .strict(),
    updatedBy: uuid,
    updatedAt: isoTime,
  })
  .strict()
  .superRefine((s, ctx) => {
    const bad = (message: string) => ctx.addIssue({ code: "custom", message });
    if (s.apply === "auto" && (s.level === "off" || s.level === "suggest"))
      bad("Auto-apply needs at least the assist level");
    if (s.level === "off" && Object.values(s.perStep).some((l) => l !== "off"))
      bad("With AI off, no step can switch it on");
  });
export type AiSettings = z.infer<typeof aiSettingsSchema>;

export const model = defineModel({
  name: "AiSettings",
  version,
  status: "planned",
  issue: 51,
  storage: { kind: "project-document", location: "Project.ai (today: Project.aiApply on a branch)" },
  file: "src/models/ai-settings.ts",
  schema: aiSettingsSchema,
  example: {
    schemaVersion: "0.1.0",
    projectId: sampleIds.a,
    apply: "ask",
    level: "suggest",
    perStep: { motion: "off" },
    rubric: { enabled: true, checks: ["generic-gradient", "no-point-of-view"] },
    updatedBy: sampleIds.b,
    updatedAt: sampleTime,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    projectId: sampleIds.a,
    apply: "auto",
    level: "off",
    perStep: { motion: "generate" },
    rubric: { enabled: true, checks: ["sparkle"] },
    updatedBy: sampleIds.b,
    updatedAt: sampleTime,
  },
});

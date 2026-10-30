import { z } from "zod";
import {
  defineModel,
  isoTime,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  uuid,
} from "./common";

export const version = "0.1.0";

export const helpLevels = ["beginner", "casual", "expert"] as const;
/** Observed: the live Project.mode values in src/creative/contracts.ts. */
export const legacyModes = ["guided", "explorer", "advanced"] as const;
export const flowStages = [
  "goal",
  "references",
  "canvas",
  "decisions",
  "story",
  "publish",
] as const;

/** Inference: the owner's words (beginner, casual, expert) map one to one onto the code's modes. */
export const modeFor = {
  beginner: "guided",
  casual: "explorer",
  expert: "advanced",
} as const;

/**
 * Where a project is in the beginner, casual or expert flow from goal to
 * published story. `mode` keeps the live field so existing documents still
 * parse; `helpLevel` is the owner's vocabulary and must agree with it.
 */
export const flowStateSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    projectId: uuid,
    helpLevel: z.enum(helpLevels),
    mode: z.enum(legacyModes),
    stage: z.enum(flowStages),
    completed: z.array(z.enum(flowStages)).max(6),
    updatedAt: isoTime,
  })
  .strict()
  .superRefine((f, ctx) => {
    if (modeFor[f.helpLevel] !== f.mode)
      ctx.addIssue({ code: "custom", message: "mode and helpLevel disagree" });
    if (new Set(f.completed).size !== f.completed.length)
      ctx.addIssue({ code: "custom", message: "Stages are listed once" });
  });
export type FlowState = z.infer<typeof flowStateSchema>;

export const model = defineModel({
  name: "FlowState",
  version,
  status: "planned",
  issue: 40,
  storage: { kind: "project-document", location: "Project.flow (today: Project.mode)" },
  file: "src/models/flow-state.ts",
  schema: flowStateSchema,
  example: {
    schemaVersion: "0.1.0",
    projectId: sampleIds.a,
    helpLevel: "casual",
    mode: "explorer",
    stage: "canvas",
    completed: ["goal", "references"],
    updatedAt: sampleTime,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    projectId: sampleIds.a,
    helpLevel: "expert",
    mode: "guided",
    stage: "launch",
    completed: ["goal", "goal"],
    updatedAt: sampleTime,
  },
});

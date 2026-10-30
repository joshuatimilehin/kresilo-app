import { z } from "zod";
import { actorSchema } from "./actor";
import {
  defineModel,
  isoTime,
  label,
  origin,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  sentence,
  uuid,
} from "./common";

export const version = "0.1.0";

export const authorshipSteps = [
  "reference",
  "proposal",
  "layer-edit",
  "motion",
  "import",
  "decision",
  "style",
  "deck",
  "publish",
] as const;
export const authorshipOutcomes = ["accepted", "edited", "declined"] as const;
export const authorshipSubjects = [
  "layer",
  "title",
  "background",
  "motion",
  "version",
  "decision",
  "reference",
  "asset",
] as const;

/**
 * One small, append-only text record of who did what and with which tool.
 * Never a file copy. Versions and decisions point at events by id.
 * Rules from docs/designer-story-spec.md:
 *  1. AI work is never recorded as hand work.
 *  2. A mislabel is fixed only by a new event that points at the old one
 *     (`corrects`); the old event is never rewritten.
 *  3. An unknown outside tool is recorded as "unknown AI tool", not "by hand".
 */
export const authorshipEventSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: uuid,
    projectId: uuid,
    versionId: uuid.optional(),
    at: isoTime,
    actor: actorSchema,
    origin,
    /** "by hand", "Copilot (prototype guidance)", "Claude through MCP", "unknown AI tool", ... */
    tool: label,
    model: label.optional(),
    step: z.enum(authorshipSteps),
    outcome: z.enum(authorshipOutcomes),
    subject: z
      .object({ kind: z.enum(authorshipSubjects), id: z.string().max(60).optional() })
      .strict(),
    proposalId: uuid.optional(),
    assetId: uuid.optional(),
    corrects: uuid.optional(),
    note: sentence.optional(),
  })
  .strict()
  .superRefine((e, ctx) => {
    const bad = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    if (e.origin === "hand") {
      if (e.actor.kind !== "person") bad("Hand work is made by a person");
      if (e.proposalId) bad("A change behind an AI proposal is never hand work");
      if (e.model) bad("Hand work names no model");
      if (e.tool.toLowerCase() !== "by hand") bad('Hand work uses the tool "by hand"');
    } else if (e.tool.toLowerCase() === "by hand") {
      bad("AI work cannot use the tool \"by hand\"");
    }
    if (e.corrects && e.corrects === e.id) bad("An event cannot correct itself");
  });
export type AuthorshipEvent = z.infer<typeof authorshipEventSchema>;

export const model = defineModel({
  name: "AuthorshipEvent",
  version,
  status: "planned",
  issue: 50,
  storage: { kind: "new-table", location: "kresilo_demo.authorship_events" },
  file: "src/models/authorship-event.ts",
  schema: authorshipEventSchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    projectId: sampleIds.b,
    at: sampleTime,
    actor: { schemaVersion: "0.1.0", kind: "person", personId: sampleIds.c, label: "Ayo" },
    origin: "ai-assisted",
    tool: "Copilot (prototype guidance)",
    step: "proposal",
    outcome: "accepted",
    subject: { kind: "layer", id: sampleIds.d },
    proposalId: sampleIds.d,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    projectId: sampleIds.b,
    at: sampleTime,
    actor: { schemaVersion: "0.1.0", kind: "person", personId: sampleIds.c, label: "Ayo" },
    origin: "hand",
    tool: "by hand",
    step: "proposal",
    outcome: "accepted",
    subject: { kind: "layer" },
    proposalId: sampleIds.d,
  },
});
